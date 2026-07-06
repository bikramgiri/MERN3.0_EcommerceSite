import { Response } from "express";
import { AuthRequest } from "../../../middleware/authMiddleware";
import Cart from "../../../database/models/cartModel";
import Product from "../../../database/models/productModel";
import User from "../../../database/models/userModel";
import Category from "../../../database/models/categoryModel";

class CartController {
      // *Add to cart
      public static async addToCart(req: AuthRequest, res: Response): Promise<void> {
            const userId = req.user?.id; 
            if (!userId) {
                  res.status(401).json({ 
                        message: "Unauthorized! User not authenticated.",
                        field: "user"
                  });
                  return;
            }

            const { productId } = req.body;
            if (!productId) {
                  res.status(400).json({ 
                        message: "Product ID is required.",
                        field: "productId"
                  });
                  return;
            }

             const product = await Product.findByPk(productId);
  if (!product) {
    res.status(404).json({ message: "Product not found.", field: "productId" });
    return;
  }

   if (product.productStock <= 0) {
    res.status(400).json({ message: "Product is out of stock.", field: "productId" });
    return;
  }

            // check if the product is already in the cart or not
            const existingCartItem = await Cart.findOne({ where: { userId, productId },
                  include:[
                  {
                        model: Product,
                        attributes: ["id", "productName", "productStock", "productPrice", "productImage"]
                  },
                  {
                        model: User,
                        attributes: ["id", "username"]
                  }
                  ]
             });

            if (existingCartItem) {
              // If the product is already in the cart, increment the quantity if the product stock allows it
              const stock = existingCartItem.product?.productStock ?? 0;
              if (existingCartItem.quantity >= stock) {
                res.status(400).json({
                    message:"Cannot add more items to the cart. Product stock limit reached.",
                    field: "quantity",
                  });
                return;
              }
              existingCartItem.quantity += 1;
              await existingCartItem.save();

              res.status(200).json({
                message: "Product quantity updated in cart.",
                data: existingCartItem,
              });
              return;
            } 

              // If the product is not in the cart, create a new cart item
              const newCartItem = await Cart.create({
                userId,
                productId,
                quantity: 1,
              });

              res.status(201).json({
                message: "Product added to cart.",
                data: newCartItem,
              });
      }

//       public static async addToCart(req: AuthRequest, res: Response): Promise<void> {
//       const userId = req.user?.id;
//       if (!userId) {
//             res.status(401).json({
//                   message: "Unauthorized! User not authenticated.",
//                   field: "user"
//             });
//             return;
//       }

//       const items = Array.isArray(req.body) ? req.body : [req.body];

//       if (items.length === 0) {
//             res.status(400).json({
//                   message: "At least one product is required.",
//                   field: "productId"
//             });
//             return;
//       }

//       const results = [];

//       for (const item of items) {
//             const { productId, quantity: requestedQty } = item;

//             if (!productId) {
//                   results.push({ productId: null, success: false, message: "Product ID is required." });
//                   continue;
//             }

//             const product = await Product.findByPk(productId);
//             if (!product) {
//                   results.push({ productId, success: false, message: "Product not found." });
//                   continue;
//             }

//             const existingCartItem = await Cart.findOne({
//                   where: { userId, productId },
//                   include: [
//                         { model: Product, attributes: ["id", "productName", "productStock", "productPrice", "productImage"] },
//                         { model: User, attributes: ["id", "username"] }
//                   ]
//             });

//             const addQty = typeof requestedQty === "number" && requestedQty > 0 ? requestedQty : 1;

//             if (existingCartItem) {
//                   const stock = existingCartItem.product?.productStock ?? 0;
//                   const newQty = existingCartItem.quantity + addQty;

//                   if (newQty > stock) {
//                         results.push({ productId, success: false, message: "Cannot add more items. Product stock limit reached." });
//                         continue;
//                   }

//                   existingCartItem.quantity = newQty;
//                   await existingCartItem.save();
//                   results.push({ productId, success: true, message: "Product quantity updated in cart.", data: existingCartItem });
//             } else {
//                   if (addQty > product.productStock) {
//                         results.push({ productId, success: false, message: "Cannot add to cart. Quantity exceeds product stock." });
//                         continue;
//                   }

//                   const newCartItem = await Cart.create({ userId, productId, quantity: addQty });
//                   results.push({ productId, success: true, message: "Product added to cart.", data: newCartItem });
//             }
//       }

//       res.status(200).json({
//             message: "Cart operation completed successfully.",
//             data: results
//       });
// }

      // *Get cart items
      
      public static async getCartItems(req: AuthRequest, res: Response): Promise<void> {
            const userId = req.user?.id; 
            if (!userId) {
                  res.status(401).json({ 
                        message: "Unauthorized! User not authenticated.",
                        field: "user"
                  });
                  return;
            }

            const cartItems = await Cart.findAll({
                  where: { userId },
                  include: [
                        {
                              model: Product,
                              attributes: ["id", "productName", "productStock", "productPrice", "productImage"],
                              include: [
                                    {
                                          model: Category,
                                          attributes: ["id", "categoryName"]
                                    }
                              ]
                        },
                        {
                              model: User,
                              attributes: ["id", "username"]
                        }
                  ]
            });

            if (!cartItems || cartItems.length === 0) {
                  res.status(404).json({ 
                        message: "No cart items found for this user.",
                        field: "cartItems"
                  });
                  return;
            }

            cartItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            res.status(200).json({
                  message: "Cart items retrieved successfully.",
                  totalItems: cartItems.length,
                  data: cartItems
            });
      }

      // *Get single cart item
      public static async getCartItem(req: AuthRequest, res: Response): Promise<void> {
            const userId = req.user?.id; 
            if (!userId) {
                  res.status(401).json({ 
                        message: "Unauthorized! User not authenticated.",
                        field: "user"
                  });
                  return;
            }

            const cartId  = req.params.id;
            if (!cartId) {
                  res.status(400).json({ 
                        message: "Cart item ID is required.",
                        field: "cartId"
                  });
                  return;
            }

            const cartItem = await Cart.findOne({
                  where: { id: cartId, userId },
                  include: [
                        {
                              model: Product,
                              attributes: ["id", "productName", "productStock", "productPrice", "productImage"],
                              include: [
                                    {
                                          model: Category,
                                          attributes: ["id", "categoryName"]
                                    }
                              ]
                        },
                        {
                              model: User,
                              attributes: ["id", "username"]
                        }
                  ]
            });

            if (!cartItem) {
                  res.status(404).json({ 
                        message: "Cart item not found.",
                        field: "cartId"
                  });
                  return;
            }

            res.status(200).json({
                  message: "Cart item retrieved successfully.",
                  data: cartItem
            });
      }


      // *Update cart item
      public static async updateCartItem(req: AuthRequest, res: Response): Promise<void> {
            const userId = req.user?.id;
            if (!userId) {
                  res.status(401).json({ 
                        message: "Unauthorized! User not authenticated.",
                        field: "user"
                  });
                  return;
            }

            const cartId = req.params.id;
            if (!cartId) {
                  res.status(400).json({ 
                        message: "Cart item ID is required.",
                        field: "cartId"
                  });
                  return;
            }

            const { quantity } = req.body;

            if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
                  res.status(400).json({ 
                        message: "Quantity must be a positive integer.",
                        field: "quantity"
                  });
                  return;
            }

            const cartItem = await Cart.findOne({ where: { id: cartId } });
            if (!cartItem) {
                  res.status(404).json({ 
                        message: "Cart item not found.",
                        field: "cartId"
                  });
                  return;
            }

            // Check if the cart item belongs to the authenticated user
            if (cartItem.userId !== userId) {
                  res.status(403).json({
                        message: "Forbidden! You do not have permission to update this cart item.",
                        field: "user"
                  });
                  return;
            }

            // Check if the new quantity exceeds the product stock
            const product = await Product.findOne({ where: { id: cartItem.productId } });
            if (!product) {
                  res.status(404).json({
                        message: "Product associated with this cart item not found.",
                        field: "product"
                  });
                  return;
            }

            if (quantity > product.productStock) {
                  res.status(400).json({
                        message: "Cannot update cart item. Quantity exceeds product stock.",
                        field: "quantity"
                  });
                  return;
            }

            cartItem.quantity = quantity;
            await cartItem.save();

            res.status(200).json({
                  message: "Cart item updated successfully.",
                  data: cartItem
            });
      }

      // *Delete cart item
      public static async deleteCartItem(req: AuthRequest, res: Response): Promise<void> {
            const userId = req.user?.id;
            if (!userId) {
                  res.status(401).json({ 
                        message: "Unauthorized! User not authenticated.",
                        field: "user"
                  });
                  return;
            }

            const cartId = req.params.id;
            if (!cartId) {
                  res.status(400).json({ 
                        message: "Cart item ID is required.",
                        field: "cartId"
                  });
                  return;
            }

            const cartItem = await Cart.findOne({ where: { id: cartId } });
            if (!cartItem) {
                  res.status(404).json({ 
                        message: "Cart item not found.",
                        field: "cartId"
                  });
                  return;
            }

            if (cartItem.userId !== userId) {
                  res.status(403).json({
                        message: "Forbidden! You do not have permission to delete this cart item.",
                        field: "user"
                  });
                  return;
            }

            await cartItem.destroy();

            res.status(200).json({
                  message: "Cart item deleted successfully."
            });
      }
}

export default CartController;