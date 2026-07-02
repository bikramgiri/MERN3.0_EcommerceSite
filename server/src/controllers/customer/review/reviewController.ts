import { Request, Response } from "express";
import { AuthRequest } from "../../../middleware/authMiddleware";
import Review from "../../../database/models/reviewModel";
import Product from "../../../database/models/productModel";
import User from "../../../database/models/userModel";
import deleteImageFromDisk from "../../../services/helper";

class ReviewController {
  // *Add Review
  public static async addReview(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          message: "User not authenticated",
          field: "user",
        });
        return;
      }

      const productId = req.params.id;
      if (!productId || typeof productId !== "string") {
        res.status(400).json({
          message: "Valid Product ID is required",
          field: "productId",
        });
        return;
      }

      const file = req.file;

      const reviewImage = file?.filename;
      const reviewImageUrl =  reviewImage ? `${process.env.BACKEND_URL}/storage/${reviewImage}` : null;

      const { rating, message } = req.body;

      if (
        rating === undefined ||
        typeof rating !== "string" ||
        isNaN(Number(rating)) ||
        parseInt(rating) < 1 ||
        parseInt(rating) > 5
      ) {
        res.status(400).json({
          message: "Rating must be a number between 1 and 5",
          field: "rating",
        });
        return;
      }

      if (
        message === undefined ||
        typeof message !== "string" ||
        message.length < 5 ||
        message.length > 100 ||
        message.trim() === ""
      ) {
        res.status(400).json({
          message: "Message must be a string between 5 and 100 characters",
          field: "message",
        });
        return;
      }

      const user = await User.findByPk(userId);
      if (!user) {
        res.status(404).json({
          message: "User not found",
          field: "user",
        });
        return;
      }

      const product = await Product.findByPk(productId);
      if (!product) {
        res.status(404).json({
          message: "Product not found",
          field: "product",
        });
        return;
      }

      // check user already reviewed the product or not
      const existingReview = await Review.findOne({
        where: {
          userId,
          productId,
        },
      });
      if (existingReview) {
        res.status(400).json({
          message: "You have already reviewed this product",
          field: "review",
        });
        return;
      }

      const review = await Review.create({
        userId,
        productId,
        rating: parseInt(rating),
        message,
        reviewImage: reviewImage,
      });

      const reviewResponse = {
        ...review.toJSON(),
        reviewImageUrl: reviewImageUrl,
      };

      res.status(200).json({
        message: "Review added successfully.",
        data: reviewResponse,
      });
    } catch (error: any) {
      console.error("AddReview error:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // *Get Product Reviews
  public static async getProductReviews(req: Request, res: Response) {
    try {
      const productId = req.params.id;

      if (!productId || typeof productId !== "string") {
        res.status(400).json({
          message: "Valid Product ID is required",
          field: "productId",
        });
        return;
      }

      const product = await Product.findByPk(productId);
      if (!product) {
        res.status(404).json({
          message: "Product not found",
          field: "product",
        });
        return;
      }

      const reviews = await Review.findAll({
        where: {
          productId,
        },
        include: [
          {
            model: Product,
            attributes: ["id", "productName", "productImage"],
          },
          {
            model: User,
            attributes: ["id", "username", "avatar"],
          },
        ],
      });

      if (reviews.length === 0) {
        res.status(404).json({
          message: "No reviews found for this product.",
          field: "reviews",
        });
        return;
      }

      const reviewsWithImageUrl = reviews.map((review) => {
        const reviewData = review.toJSON();
        if (reviewData.reviewImage) {
          reviewData.reviewImageUrl = `${process.env.BACKEND_URL}/storage/${reviewData.reviewImage}`;
        }
        return reviewData;
      });
      // get latest reviews first
      reviewsWithImageUrl.sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      res.status(200).json({
        message: "Product reviews fetched successfully.",
        totalReviews: reviewsWithImageUrl.length,
        data: reviewsWithImageUrl,
      });
    } catch (error: any) {
      console.error("GetReviews error:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // *Get User Reviews
  public static async getMyReviews(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          message: "User not authenticated",
          field: "user",
        });
        return;
      }

      const user = await User.findByPk(userId);
      if (!user) {
        res.status(404).json({
          message: "User not found",
          field: "user",
        });
        return;
      }

      const reviews = await Review.findAll({
        where: {
          userId,
        },
        include: [
          {
            model: Product,
            attributes: ["id", "productName", "productImage"],
          },
        ],
      });

      if (reviews.length === 0) {
        res.status(404).json({
          message: "No reviews found for this user.",
          field: "reviews",
        });
        return;
      }

      const reviewsWithImageUrl = reviews.map((review) => {
        const reviewData = review.toJSON();
        if (reviewData.reviewImage) {
          reviewData.reviewImageUrl = `${process.env.BACKEND_URL}/storage/${reviewData.reviewImage}`;
        }
        return reviewData;
      });
      reviewsWithImageUrl.sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      res.status(200).json({
        message: "User reviews fetched successfully.",
        totalReviews: reviewsWithImageUrl.length,
        data: reviewsWithImageUrl,
      });
    } catch (error: any) {
      console.error("GetUserReviews error:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // *Edit Review
  public static async editReview(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          message: "User not authenticated",
          field: "user",
        });
        return;
      }

      const reviewId = req.params.id;
      if (!reviewId || typeof reviewId !== "string") {
        res.status(400).json({
          message: "Valid Review ID is required",
          field: "reviewId",
        });
        return;
      }

      const review = await Review.findByPk(reviewId);
      if (!review) {
        res.status(404).json({
          message: "Review not found",
          field: "review",
        });
        return;
      }

      if (review.userId !== userId) {
        res.status(403).json({
          message: "You are not the owner of this review",
          field: "review",
        });
        return;
      }

      const { rating, message } = req.body;

      if (
        rating !== undefined &&
        (typeof rating !== "string" ||
          isNaN(Number(rating)) ||
          parseInt(rating) < 1 ||
          parseInt(rating) > 5)
      ) {
        res.status(400).json({
          message: "Rating must be a number between 1 and 5",
          field: "rating",
        });
        return;
      }

      if (
        message !== undefined &&
        (typeof message !== "string" ||
          message.length < 5 ||
          message.length > 100 ||
          message.trim() === "")
      ) {
        res.status(400).json({
          message: "Message must be a string between 5 and 100 characters",
          field: "message",
        });
        return;
      }

      const file = req.file;
      let newReviewImage: string | null = review.reviewImage;
      let newReviewImageUrl: string | null = review.reviewImage
        ? `${process.env.BACKEND_URL}/storage/${review.reviewImage}`
        : null;

      if (req.body.reviewImageToRemove === "true") {
        // user explicitly wants to remove the existing image
        if (review.reviewImage) {
          deleteImageFromDisk(review.reviewImage);
        }
        newReviewImage = null;
        newReviewImageUrl = null;
      } else if (file) {
        // user uploaded a new image — replace the old one
        if (review.reviewImage) {
          deleteImageFromDisk(review.reviewImage);
        }
        newReviewImage = file.filename;
        newReviewImageUrl = `${process.env.BACKEND_URL}/storage/${newReviewImage}`;
      }
      // else: no file, no remove flag → keep existing image untouched (defaults set above)

      const updatedReview = await review.update({
        rating: rating !== undefined ? parseInt(rating) : review.rating,
        message: message !== undefined ? message : review.message,
        reviewImage: newReviewImage,
      });

      const reviewResponse = {
        ...updatedReview.toJSON(),
        reviewImageUrl: newReviewImageUrl,
      };

      res.status(200).json({
        message: "Review updated successfully.",
        data: reviewResponse,
      });
    } catch (error: any) {
      console.error("EditReview error:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // *Delete Review
  public static async deleteReview(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          message: "User not authenticated",
          field: "user",
        });
        return;
      }

      const reviewId = req.params.id;
      if (!reviewId || typeof reviewId !== "string") {
        res.status(400).json({
          message: "Valid Review ID is required",
          field: "reviewId",
        });
        return;
      }

      const user = await User.findByPk(userId);
      if (!user) {
        res.status(404).json({
          message: "User not found",
          field: "user",
        });
        return;
      }

      const review = await Review.findByPk(reviewId);
      if (!review) {
        res.status(404).json({
          message: "Review not found",
          field: "review",
        });
        return;
      }

      if (review.userId !== userId) {
        res.status(403).json({
          message: "You are not the owner of this review",
          field: "review",
        });
        return;
      }

      await review.destroy();

      if (review.reviewImage) {
        deleteImageFromDisk(review.reviewImage);
      }

      res.status(200).json({
        message: "Review deleted successfully.",
      });
    } catch (error: any) {
      console.error("DeleteReview error:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }
}

export default ReviewController;
