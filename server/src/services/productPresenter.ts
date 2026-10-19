import { Op, type WhereOptions } from "sequelize";
import getFullImageUrl from "./imageHandler";

// Only show reviews that are visible to shoppers (same rule as the public review endpoint)
export const approvedReviewsOnly: WhereOptions = {
  [Op.or]: [{ status: "APPROVED" }, { status: null }],
};

// Converts stored review image and reviewer avatar paths into full URLs
export const formatReviewImages = (review: any) => ({
  ...review,
  reviewImage: review.reviewImage ? getFullImageUrl(review.reviewImage) : null,
  User: review.User
    ? {
        ...review.User,
        avatar: review.User.avatar ? getFullImageUrl(review.User.avatar) : null,
      }
    : review.User,
});
