import { Status } from "../../global/statuses";

export interface ReviewProductCategory {
  id: string;
  categoryName: string;
}

export interface ReviewProduct {
  id: string;
  productName: string;
  productImage?: string;
  productPrice?: number;
  Category?: ReviewProductCategory;
}

export interface ReviewUser {
  id: string;
  username: string;
  avatar?: string | null;
}

export type ReviewModerationStatus = "APPROVED" | "PENDING" | "FLAGGED";

export interface AdminReview {
  id: string;
  userId: string;
  productId: string;
  message: string;
  rating: number;
  reviewImage?: string | null;
  status: ReviewModerationStatus;
  adminReply?: string | null;
  repliedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  Product?: ReviewProduct;
  User?: ReviewUser;
}

export interface AdminReviewState {
  reviews: AdminReview[];
  status: Status;
  actionLoading: boolean;
  error: string | null;
}
