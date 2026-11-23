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

export type AdminReviewTab = "ALL" | "TO_CHECK" | "APPROVED" | "PENDING" | "FLAGGED";

/** Filters for one page of the admin list (all done by the server) */
export interface AdminReviewQuery {
  tab: AdminReviewTab;
  search: string;
  rating: "ALL" | "1" | "2" | "3" | "4" | "5" | "LOW";
  photo: "ALL" | "WITH" | "WITHOUT";
  sort: "newest" | "oldest" | "rating_desc" | "rating_asc";
  page: number;
  limit: number;
}

/** Numbers for the cards, over every review in the store */
export interface AdminReviewStats {
  total: number;
  visible: number;
  toCheck: number;
  lowRated: number;
  averageRating: number;
}

export interface AdminReviewState {
  reviews: AdminReview[]; // the page on screen
  total: number; // reviews matching the filters
  totalPages: number;
  currentPage: number;
  counts: Record<AdminReviewTab, number> | null; // per tab, following search/rating/photo
  stats: AdminReviewStats | null;
  status: Status;
  actionLoading: boolean;
  error: string | null;
}
