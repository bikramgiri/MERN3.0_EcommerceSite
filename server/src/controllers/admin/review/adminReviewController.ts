import { Request, Response } from "express";
import Review from "../../../database/models/reviewModel";
import Product from "../../../database/models/productModel";
import Category from "../../../database/models/categoryModel";
import User from "../../../database/models/userModel";

class AdminReviewController {
      // *Fetch all reviews
      public static async fetchAllReviews(req: Request, res: Response) : Promise<void> {
            const reviews = await Review.findAll({
                  include : [
                        {
                              model : Product,
                              attributes: ["id", "productName"],
                              include : [
                                    {
                                          model : Category,
                                          attributes: ["id", "categoryName"]
                                    }
                              ]
                        },
                        {
                              model : User,
                              attributes: ["id", "username", "avatar"]
                        }
                  ]
            })

            const reviewsWithFullImageUrl = reviews.map(review => {
                  const reviewData = review.toJSON() as any;
                  reviewData.reviewImageUrl = `${process.env.BACKEND_URL}/storage/${reviewData.reviewImage}`;
                  return reviewData;
            });
            reviewsWithFullImageUrl.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            res.status(200).json({
                  success : true,
                  message : "All reviews fetched successfully",
                  totalReviews: reviewsWithFullImageUrl.length,
                  data : reviewsWithFullImageUrl
            })
      }
}

export default AdminReviewController;