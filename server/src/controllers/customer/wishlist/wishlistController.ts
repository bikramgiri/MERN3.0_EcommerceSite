import { Response } from "express";
import { AuthRequest } from "../../../middleware/authMiddleware";
import User from "../../../database/models/userModel";
import Product from "../../../database/models/productModel";
import getFullImageUrl from "../../../services/imageHandler";
import Category from "../../../database/models/categoryModel";
import Wishlist from "../../../database/models/wishlistModel";
import Review from "../../../database/models/reviewModel";
import { approvedReviewsOnly, formatReviewImages } from "../../../services/productPresenter";

// Product details a shopper needs on a wishlist card (never the owner's account data)
const wishlistProductIncludes = [
  { model: Category, as: "category", attributes: ["id", "categoryName"] },
  {
    model: Review,
    as: "reviews",
    where: approvedReviewsOnly,
    required: false,
    attributes: ["id", "rating", "createdAt"],
  },
];

const presentProduct = (product: Product) => {
  const data = product.toJSON();
  return {
    ...data,
    productImage: getFullImageUrl(data.productImage),
    reviews: (data.reviews || []).map(formatReviewImages),
  };
};

class WishlistController {
      // Add a product to the wishlist
      public static async addToWishlist(req: AuthRequest, res: Response): Promise<void> {
            const userId = req.user?.id;
            if (!userId) {
             res.status(401).json({ 
                        message: "Unauthorized", 
                        field: "userId" 
                  });
            return;
            }

            const { productId } = req.body;
            if (!productId) {
             res.status(400).json({ 
                        message: "Product ID is required", 
                        field: "productId" 
                  });
            return;
            }

            const user = await User.findByPk(userId);
            if (!user) {
             res.status(404).json({ 
                        message: "User not found", 
                        field: "userId" 
                  });
            return;
            }

            // (Previously this included the owner's full user record, password hash included)
            const product = await Product.findByPk(productId, { include: wishlistProductIncludes });
            if (!product) {
                   res.status(404).json({ 
                        message: "Product not found", 
                        field: "productId" 
                  });
            return;
            }

            // check if the product is already in the wishlist
            const isWishlisted = await Wishlist.findOne({
                  where: {
                        userId, productId
                  }
            });
            if (isWishlisted) {
                  await isWishlisted.destroy();
                   res.status(200).json({ 
                        action: "removed",
                        message: "Product removed from wishlist",
                        data: {id: productId}
                  });
                  return;
            }

            // add the product to the wishlist
            await Wishlist.create({
                  userId,
                  productId
            });

             res.status(200).json({
                  action: "added",
                  message: "Product added to wishlist",
                  data: presentProduct(product),
            });
      }

      // Fetch the wishlist for a user
      public static async fetchWishlist(req: AuthRequest, res: Response): Promise<void> {
            const userId = req.user?.id;
            if (!userId) {
                   res.status(401).json({ 
                        message: "Unauthorized", 
                        field: "userId" 
                  });
            return;
            }

    // Most recently saved first; entries whose product was deleted are skipped
    const wishlistEntries = await Wishlist.findAll({
      where: { userId },
      include: [{ model: Product, include: wishlistProductIncludes }],
      order: [["createdAt", "DESC"]],
    });

    const products = wishlistEntries
      .filter((entry) => entry.product)
      .map((entry) => presentProduct(entry.product));
                         
             res.status(200).json({ 
                  message: "Wishlist fetched successfully",
                  totalItems: products.length,
                  data: products
            });
      }

      // * Remove a product from the wishlist
      public static async removeFromWishlist(req: AuthRequest, res: Response): Promise<void> {
            const userId = req.user?.id;
            if (!userId) {
             res.status(401).json({ 
                        message: "Unauthorized", 
                        field: "userId" 
                  });
            return;
            }

            const { productId } = req.params;
            if (!productId) {
                  res.status(400).json({ 
                        message: "Product ID is required", 
                        field: "productId" 
                  });
                  return;
            }

            const user = await User.findByPk(userId);
            if (!user) {
             res.status(404).json({ 
                        message: "User not found", 
                        field: "userId" 
                  });
            return;
            }

            const product = await Product.findByPk(productId as string);
            if (!product) {
                  res.status(404).json({ 
                        message: "Product not found", 
                        field: "productId" 
                  });
                  return;
            }


    const existing = await Wishlist.findOne({ where: { userId, productId } });

    if (!existing) {
      res.status(404).json({ success: false, message: "Item not in wishlist" });
      return;
    }

    await existing.destroy();

             res.status(200).json({ 
                  message: "Product removed from wishlist"
            });
      }
}

export default WishlistController;

