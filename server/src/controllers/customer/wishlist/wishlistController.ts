import { Response } from "express";
import { AuthRequest } from "../../../middleware/authMiddleware";
import User from "../../../database/models/userModel";
import Product from "../../../database/models/productModel";
import getFullImageUrl from "../../../services/imageHandler";
import Category from "../../../database/models/categoryModel";
import Wishlist from "../../../database/models/wishlistModel";
import Review from "../../../database/models/reviewModel";

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

            const product = await Product.findByPk(productId,{
                  include:  [
        { model: User, as: "owner" },
        { model: Category, as: "category" },
      ],
            });
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

            const productData = product.toJSON();
            const wishlistWithProductImage = {
                  ...productData,
                  productImage: getFullImageUrl(productData.productImage),
            }

             res.status(200).json({ 
                  action: "added",
                  message: "Product added to wishlist",
                  data: wishlistWithProductImage,
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

           const wishlistEntries = await Wishlist.findAll({
      where: { userId },
      include: [
        {
          model: Product,
          include: [
            { 
                  model: User, 
                  as: "owner",
                  attributes: ["id", "username", "email", "avatar"]
            },
            { 
                  model: Category, 
                  as: "category",
                  attributes: ["id", "categoryName"]
            },
              {
          model: Review,
          as: "reviews",
          attributes: ["id", "rating", "message", "reviewImage", "createdAt"],
          include: [
            {
              model: User,
              as: "User",
              attributes: ["id", "username", "avatar"],
            },
          ],
        },
          ],
        },
      ],
    });

     const products = wishlistEntries.map((wishlist) => {
      const product = wishlist.product.toJSON();
      product.productImage = getFullImageUrl(product.productImage);
      return product;
    });  
                         
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

