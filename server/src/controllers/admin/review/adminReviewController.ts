import { Request, Response } from "express";
import Review from "../../../database/models/reviewModel";
import Product from "../../../database/models/productModel";
import Category from "../../../database/models/categoryModel";
import User from "../../../database/models/userModel";
import getFullImageUrl from "../../../services/imageHandler";
import { cloudinary } from "../../../cloudinary";
import { getPublicIdFromAvatar } from "../../../services/cloudinaryHelper";

class AdminReviewController {
  // *Fetch all reviews
  public static async fetchAllReviews(
    req: Request,
    res: Response,
  ): Promise<void> {
    const reviews = await Review.findAll({
      include: [
        {
          model: Product,
          attributes: ["id", "productName"],
          include: [
            {
              model: Category,
              attributes: ["id", "categoryName"],
            },
          ],
        },
        {
          model: User,
          attributes: ["id", "username", "avatar"],
        },
      ],
    });
    if (reviews.length === 0) {
      res.status(404).json({
        success: false,
        message: "No reviews found",
      });
      return;
    }

    const reviewsWithFullImageUrl = reviews.map((review) => {
      const plainReview = review.toJSON();
      return {
        ...plainReview,
        reviewImage: getFullImageUrl(plainReview.reviewImage),
      };
    });
    reviewsWithFullImageUrl.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    res.status(200).json({
      success: true,
      message: "All reviews fetched successfully",
      totalReviews: reviewsWithFullImageUrl.length,
      data: reviewsWithFullImageUrl,
    });
  }

  // *Delete Review
  public static async deleteReview(req: Request, res: Response): Promise<void> {
    const reviewId = req.params.id;
    if (!reviewId) {
      res.status(400).json({
        success: false,
        message: "Review ID is required",
      });
      return;
    }

    const review = await Review.findByPk(reviewId as string);
    if (!review) {
      res.status(404).json({
        success: false,
        message: "Review not found",
      });
      return;
    }

    if (review.reviewImage) {
      const fileName = getPublicIdFromAvatar(review.reviewImage);
      if (fileName) {
        cloudinary.uploader.destroy(fileName, (error: any, result: any) => {
          if (error)
            console.error("Error deleting image from Cloudinary:", error);
          else
            console.log("Image deleted from Cloudinary successfully:", result);
        });
      }
    }

    await review.destroy();

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  }
}

export default AdminReviewController;
