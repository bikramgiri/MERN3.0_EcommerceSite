import { Response } from "express";
import { AuthRequest } from "../../../middleware/authMiddleware";
import User from "../../../database/models/userModel";
import Product from "../../../database/models/productModel";
import getFullImageUrl from "../../../services/imageHandler";
import Category from "../../../database/models/categoryModel";

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

            const product = await Product.findByPk(productId);
            if (!product) {
                   res.status(404).json({ 
                        message: "Product not found", 
                        field: "productId" 
                  });
            return;
            }

            // check if the product is already in the wishlist
            const isWishlisted = await user.hasWishlistProduct(productId)
            if (isWishlisted) {
                  await user.removeWishlistProduct(productId)
                   res.status(200).json({ 
                        message: "Product removed from wishlist"
                  });
                  return;
            }

            // add the product to the wishlist
            await user.addWishlistProduct(productId);

            const productData = product.toJSON();
            const wishlistWithProductImage = {
                  ...productData,
                  productImage: getFullImageUrl(productData.productImage),
            }

             res.status(200).json({ 
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

            const user = await User.findByPk(userId, {
                  include: [{
                        model: Product,
                        as: 'WishlistProducts',
                        through: { attributes: [] }, // Exclude the join table attributes
                        include: [{
                              model: Category,
                              attributes: ['id', 'categoryName']
                        }]
                  }]
            });

            if (!user) {
                   res.status(404).json({ 
                        message: "User not found", 
                        field: "userId" 
                  });
            return;
            }

            const wishlist = ((user as any).WishlistProducts || []) as Product[];
            const wishlistWithFullImageUrls = wishlist.map((product: any) => {
                  const productData = product.toJSON();
                  return {
                        ...productData,
                        productImage: getFullImageUrl(productData.productImage),
                  };
            });  
                         
             res.status(200).json({ 
                  message: "Wishlist fetched successfully",
                  totalItems: wishlistWithFullImageUrls.length,
                  data: wishlistWithFullImageUrls
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

            const product = await Product.findByPk(productId);
            if (!product) {
                  res.status(404).json({ 
                        message: "Product not found", 
                        field: "productId" 
                  });
                  return;
            }

            // Remove the product from the wishlist
            await user.removeWishlistProduct(productId as string);

             res.status(200).json({ 
                  message: "Product removed from wishlist"
            });
      }
}

export default WishlistController;

