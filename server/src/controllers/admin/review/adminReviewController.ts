import { Request, Response } from "express";
import Review from "../../../database/models/reviewModel";
import Product from "../../../database/models/productModel";
import Category from "../../../database/models/categoryModel";
import User from "../../../database/models/userModel";
import getFullImageUrl from "../../../services/imageHandler";
import { cloudinary } from "../../../cloudinary";
import { getPublicIdFromAvatar } from "../../../services/cloudinaryHelper";
import fs from "fs";
import path from "path";
import { emitToAdmin } from "../../../services/socketService";

class AdminReviewController {
  // *Fetch all reviews
  public static async fetchAllReviews(
    req: Request,
    res: Response,
  ): Promise<void> {
    const reviews = await Review.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Product,
          attributes: ["id", "productName", "productImage", "productPrice"],
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

    if (!reviews || reviews.length === 0) {
      res.status(200).json({
        success: true,
        message: "No reviews found",
        totalReviews: 0,
        data: [],
      });
      return;
    }

    const reviewsWithFullImageUrl = reviews.map((review) => {
      const plainReview = review.toJSON();
      if (plainReview.reviewImage) {
        plainReview.reviewImage = getFullImageUrl(plainReview.reviewImage);
      }
      if (plainReview.Product && plainReview.Product.productImage) {
        plainReview.Product.productImage = getFullImageUrl(plainReview.Product.productImage);
      }
      if (plainReview.User && plainReview.User.avatar) {
        plainReview.User.avatar = getFullImageUrl(plainReview.User.avatar);
      }
      return plainReview;
    });

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
      if (fileName && fileName.includes("Mern3_Ecommerce_Images")) {
        cloudinary.uploader.destroy(fileName, (error: any, result: any) => {
          if (error)
            console.error("Error deleting image from Cloudinary:", error);
          else
            console.log("Image deleted from Cloudinary successfully:", result);
        });
      }

      const localFilePath = path.join(process.cwd(), "src", "storage", review.reviewImage);
      if (fs.existsSync(localFilePath)) {
        try {
          fs.unlinkSync(localFilePath);
        } catch (e) {
          console.error("Error deleting local review image:", e);
        }
      }
    }

    await review.destroy();

    emitToAdmin("admin:dashboard-refresh", {
      type: "review-deleted",
      reviewId,
    });

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  }

  // *Update Review Status (APPROVED, PENDING, FLAGGED)
  public static async updateReviewStatus(
    req: Request,
    res: Response,
  ): Promise<void> {
    const reviewId = req.params.id;
    const { status } = req.body;

    const validStatuses = ["APPROVED", "PENDING", "FLAGGED"];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: "Valid status ('APPROVED', 'PENDING', 'FLAGGED') is required",
      });
      return;
    }

    const review = await Review.findByPk(reviewId as string, {
      include: [
        {
          model: Product,
          attributes: ["id", "productName", "productImage", "productPrice"],
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

    if (!review) {
      res.status(404).json({
        success: false,
        message: "Review not found",
      });
      return;
    }

    review.status = status;
    await review.save();

    const plainReview = review.toJSON();
    if (plainReview.reviewImage) {
      plainReview.reviewImage = getFullImageUrl(plainReview.reviewImage);
    }
    if (plainReview.Product && plainReview.Product.productImage) {
      plainReview.Product.productImage = getFullImageUrl(plainReview.Product.productImage);
    }
    if (plainReview.User && plainReview.User.avatar) {
      plainReview.User.avatar = getFullImageUrl(plainReview.User.avatar);
    }

    emitToAdmin("admin:dashboard-refresh", {
      type: "review-status-updated",
      reviewId,
      status,
    });

    res.status(200).json({
      success: true,
      message: `Review marked as ${status}`,
      data: plainReview,
    });
  }

  // *Add or Update Admin Reply
  public static async replyToReview(
    req: Request,
    res: Response,
  ): Promise<void> {
    const reviewId = req.params.id;
    const { adminReply } = req.body;

    const review = await Review.findByPk(reviewId as string, {
      include: [
        {
          model: Product,
          attributes: ["id", "productName", "productImage", "productPrice"],
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

    if (!review) {
      res.status(404).json({
        success: false,
        message: "Review not found",
      });
      return;
    }

    if (!adminReply || typeof adminReply !== "string" || adminReply.trim() === "") {
      review.adminReply = null;
      review.repliedAt = null;
    } else {
      review.adminReply = adminReply.trim();
      review.repliedAt = new Date();
    }

    await review.save();

    const plainReview = review.toJSON();
    if (plainReview.reviewImage) {
      plainReview.reviewImage = getFullImageUrl(plainReview.reviewImage);
    }
    if (plainReview.Product && plainReview.Product.productImage) {
      plainReview.Product.productImage = getFullImageUrl(plainReview.Product.productImage);
    }
    if (plainReview.User && plainReview.User.avatar) {
      plainReview.User.avatar = getFullImageUrl(plainReview.User.avatar);
    }

    res.status(200).json({
      success: true,
      message: review.adminReply
        ? "Official response posted successfully"
        : "Response cleared successfully",
      data: plainReview,
    });
  }

  // *Bulk Update Status
  public static async bulkUpdateReviewStatus(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { reviewIds, status } = req.body;

    const validStatuses = ["APPROVED", "PENDING", "FLAGGED"];
    if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
      res.status(400).json({
        success: false,
        message: "reviewIds must be a non-empty array of IDs",
      });
      return;
    }

    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: "Valid status ('APPROVED', 'PENDING', 'FLAGGED') is required",
      });
      return;
    }

    await Review.update(
      { status },
      {
        where: {
          id: reviewIds,
        },
      },
    );

    emitToAdmin("admin:dashboard-refresh", {
      type: "review-bulk-updated",
      reviewIds,
      status,
    });

    res.status(200).json({
      success: true,
      message: `${reviewIds.length} review(s) successfully marked as ${status}`,
    });
  }

  // *Bulk Delete Reviews
  public static async bulkDeleteReviews(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { reviewIds } = req.body;

    if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
      res.status(400).json({
        success: false,
        message: "reviewIds must be a non-empty array of IDs",
      });
      return;
    }

    const reviews = await Review.findAll({
      where: {
        id: reviewIds,
      },
    });

    for (const r of reviews) {
      if (r.reviewImage) {
        const fileName = getPublicIdFromAvatar(r.reviewImage);
        if (fileName && fileName.includes("Mern3_Ecommerce_Images")) {
          cloudinary.uploader.destroy(fileName, (error: any) => {
            if (error) console.error("Error deleting image from Cloudinary:", error);
          });
        }

        const localFilePath = path.join(process.cwd(), "src", "storage", r.reviewImage);
        if (fs.existsSync(localFilePath)) {
          try {
            fs.unlinkSync(localFilePath);
          } catch (e) {
            console.error("Error deleting local review image:", e);
          }
        }
      }
    }

    const deletedCount = await Review.destroy({
      where: {
        id: reviewIds,
      },
    });

    emitToAdmin("admin:dashboard-refresh", {
      type: "review-bulk-deleted",
      reviewIds,
    });

    res.status(200).json({
      success: true,
      message: `${deletedCount} review(s) deleted successfully`,
    });
  }
}

export default AdminReviewController;
