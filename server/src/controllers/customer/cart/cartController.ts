import { Response } from "express";
import { AuthRequest } from "../../../middleware/authMiddleware";
import Cart from "../../../database/models/cartModel";
import Product from "../../../database/models/productModel";
import Category from "../../../database/models/categoryModel";
import getFullImageUrl from "../../../services/imageHandler";
import Review from "../../../database/models/reviewModel";
import Wishlist from "../../../database/models/wishlistModel";
import { UniqueConstraintError } from "sequelize";
import { approvedReviewsOnly } from "../../../services/productPresenter";

// What the cart page needs about each product: price, stock, image and the
// approved ratings (no review text, reviewer details or the account's own data)
const cartProductInclude = {
  model: Product,
  attributes: ["id", "productName", "productStock", "productPrice", "productImage"],
  include: [
    { model: Category, attributes: ["id", "categoryName"] },
    {
      model: Review,
      as: "reviews",
      where: approvedReviewsOnly,
      required: false,
      attributes: ["id", "rating"],
    },
  ],
};

const presentCartItem = (cartItem: Cart) => {
  const data = cartItem.toJSON();
  return {
    ...data,
    product: { ...data.product, productImage: getFullImageUrl(data.product.productImage) },
  };
};

class CartController {
  // *Add to cart
  public static async addToCart(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res
        .status(401)
        .json({
          message: "Unauthorized! User not authenticated.",
          field: "user",
        });
      return;
    }

    const { productId } = req.body;
    if (!productId) {
      res
        .status(400)
        .json({ message: "Product ID is required.", field: "productId" });
      return;
    }

    const rawQuantity = req.body.quantity;
    const quantityToAdd =
      typeof rawQuantity === "number" &&
      Number.isInteger(rawQuantity) &&
      rawQuantity > 0
        ? rawQuantity
        : 1;

    const product = await Product.findByPk(productId);
    if (!product) {
      res
        .status(404)
        .json({ message: "Product not found.", field: "productId" });
      return;
    }

    if (product.productStock <= 0) {
      res
        .status(400)
        .json({ message: "Product is out of stock.", field: "productId" });
      return;
    }

    const sequelize = Cart.sequelize!;

    // Retry loop: handles the rare race where two concurrent requests both
    // see "no existing row" and try to create simultaneously. The DB's unique
    // constraint on (userId, productId) rejects the loser; we catch that and
    // fall through to an update instead of surfacing an error to the user.
    const maxAttempts = 3;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const t = await sequelize.transaction();
      try {
        const existingCartItem = await Cart.findOne({
          where: { userId, productId },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (existingCartItem) {
          const newQuantity = existingCartItem.quantity + quantityToAdd;

          if (newQuantity > product.productStock) {
            await t.rollback();
            res.status(400).json({
              message:
                "Cannot add more items to the cart. Product stock limit reached.",
              field: "quantity",
            });
            return;
          }

          existingCartItem.quantity = newQuantity;
          await existingCartItem.save({ transaction: t });
          await t.commit();

          res.status(200).json({
            message: "Product quantity updated in cart.",
            data: existingCartItem,
          });
          return;
        }

        if (quantityToAdd > product.productStock) {
          await t.rollback();
          res.status(400).json({
            message: "Cannot add to cart. Quantity exceeds product stock.",
            field: "quantity",
          });
          return;
        }

        const newCartItem = await Cart.create(
          { userId, productId, quantity: quantityToAdd },
          { transaction: t },
        );
        await t.commit();

        res.status(201).json({
          message: "Product added to cart.",
          data: newCartItem,
        });
        return;
      } catch (error) {
        await t.rollback();

        if (
          error instanceof UniqueConstraintError &&
          attempt < maxAttempts - 1
        ) {
          // Someone else just created the row — loop and pick it up as an update.
          continue;
        }
        throw error;
      }
    }
  }

  // *Get cart items
  public static async getCartItems(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        message: "Unauthorized! User not authenticated.",
        field: "user",
      });
      return;
    }

    // Newest first; rows whose product no longer exists are skipped
    const cartItems = await Cart.findAll({
      where: { userId },
      include: [cartProductInclude],
      order: [["createdAt", "DESC"]],
    });
    const items = cartItems.filter((item) => item.product).map(presentCartItem);

    res.status(200).json({
      message: items.length ? "Cart items retrieved successfully." : "Your cart is empty.",
      totalItems: items.length,
      data: items,
    });
  }

  // *Get single cart item
  public static async getCartItem(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        message: "Unauthorized! User not authenticated.",
        field: "user",
      });
      return;
    }

    const cartId = req.params.id;
    if (!cartId) {
      res.status(400).json({
        message: "Cart item ID is required.",
        field: "cartId",
      });
      return;
    }

    const cartItem = await Cart.findOne({
      where: { id: cartId, userId },
      include: [cartProductInclude],
    });

    if (!cartItem || !cartItem.product) {
      res.status(404).json({
        message: "Cart item not found.",
        field: "cartId",
      });
      return;
    }

    res.status(200).json({
      message: "Cart item retrieved successfully.",
      data: presentCartItem(cartItem),
    });
  }

  // *Update cart item
  public static async updateCartItem(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        message: "Unauthorized! User not authenticated.",
        field: "userId",
      });
      return;
    }

    const cartId = req.params.id;
    if (!cartId) {
      res.status(400).json({
        message: "Cart item ID is required.",
        field: "cartId",
      });
      return;
    }

    const { quantity } = req.body;

    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      res.status(400).json({
        message: "Quantity must be a positive integer.",
        field: "quantity",
      });
      return;
    }

    const sequelize = Cart.sequelize!;
    const t = await sequelize.transaction();

    try {
      const cartItem = await Cart.findOne({
        where: { id: cartId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!cartItem) {
        await t.rollback();
        res.status(404).json({
          message: "Cart item not found.",
          field: "cartId",
        });
        return;
      }

      // Check if the cart item belongs to the authenticated user
      if (cartItem.userId !== userId) {
        await t.rollback();
        res.status(403).json({
          message:
            "Forbidden! You do not have permission to update this cart item.",
          field: "userId",
        });
        return;
      }

      // Check if the new quantity exceeds the product stock
      const product = await Product.findOne({
        where: { id: cartItem.productId },
        transaction: t,
      });
      if (!product) {
        await t.rollback();
        res.status(404).json({
          message: "Product associated with this cart item not found.",
          field: "product",
        });
        return;
      }

      // Lowering the quantity is always allowed, so a shopper whose item ran low
      // on stock can step back down to what's available
      if (quantity > product.productStock && quantity > cartItem.quantity) {
        await t.rollback();
        res.status(400).json({
          message:
            product.productStock > 0
              ? `Only ${product.productStock} left in stock.`
              : "This product is out of stock.",
          field: "quantity",
        });
        return;
      }

      cartItem.quantity = quantity;
      await cartItem.save({ transaction: t });
      await t.commit();

      res.status(200).json({
        message: "Cart item updated successfully.",
        data: cartItem,
      });
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  // *Save for later: move a cart item to the wishlist (kept if it's already there)
  public static async saveForLater(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        message: "Unauthorized! User not authenticated.",
        field: "userId",
      });
      return;
    }

    const cartId = String(req.params.id);
    const cartItem = /^[0-9a-f-]{36}$/i.test(cartId)
      ? await Cart.findOne({ where: { id: cartId, userId } })
      : null;
    if (!cartItem) {
      res.status(404).json({ message: "Cart item not found.", field: "cartId" });
      return;
    }

    const sequelize = Cart.sequelize!;
    await sequelize.transaction(async (t) => {
      const existing = await Wishlist.findOne({
        where: { userId, productId: cartItem.productId },
        transaction: t,
      });
      if (!existing) {
        await Wishlist.create({ userId, productId: cartItem.productId }, { transaction: t });
      }
      await cartItem.destroy({ transaction: t });
    });

    res.status(200).json({
      message: "Saved to your wishlist.",
      data: { productId: cartItem.productId },
    });
  }

  // *Delete cart item
  public static async deleteCartItem(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        message: "Unauthorized! User not authenticated.",
        field: "userId",
      });
      return;
    }

    const cartId = req.params.id;
    if (!cartId) {
      res.status(400).json({
        message: "Cart item ID is required.",
        field: "cartId",
      });
      return;
    }

    const cartItem = await Cart.findOne({ where: { id: cartId } });
    if (!cartItem) {
      res.status(404).json({
        message: "Cart item not found.",
        field: "cartId",
      });
      return;
    }

    if (cartItem.userId !== userId) {
      res.status(403).json({
        message:
          "Forbidden! You do not have permission to delete this cart item.",
        field: "user",
      });
      return;
    }

    await cartItem.destroy();

    res.status(200).json({
      message: "Cart item deleted successfully.",
    });
  }
}

export default CartController;
