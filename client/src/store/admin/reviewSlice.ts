import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  AdminReview,
  AdminReviewQuery,
  AdminReviewState,
  AdminReviewStats,
  AdminReviewTab,
  ReviewModerationStatus,
} from "../../types/admin/reviewTypes";
import { Status } from "../../global/statuses";
import { AppDispatch } from "../store";
import { APIAuthenticated } from "../../http";
import { toast } from "react-toastify";
import axios from "axios";

/** The server's message for a failed request, if it sent one */
const apiMessage = (err: unknown): string | undefined =>
  axios.isAxiosError(err) ? (err.response?.data as { message?: string } | undefined)?.message : undefined;

const initialState: AdminReviewState = {
  reviews: [],
  total: 0,
  totalPages: 1,
  currentPage: 1,
  counts: null,
  stats: null,
  status: Status.IDLE,
  actionLoading: false,
  error: null,
};

const adminReviewSlice = createSlice({
  name: "adminReview",
  initialState,
  reducers: {
    setStatus: (state, action: PayloadAction<Status>) => {
      state.status = action.payload;
    },
    setActionLoading: (state, action: PayloadAction<boolean>) => {
      state.actionLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setReviews: (state, action: PayloadAction<AdminReview[]>) => {
      state.reviews = action.payload;
    },
    setReviewPage: (
      state,
      action: PayloadAction<{
        reviews: AdminReview[];
        total: number;
        totalPages: number;
        currentPage: number;
        counts: Record<AdminReviewTab, number>;
        stats: AdminReviewStats;
      }>,
    ) => {
      Object.assign(state, action.payload);
    },
    updateReviewInList: (state, action: PayloadAction<AdminReview>) => {
      const index = state.reviews.findIndex((r) => r.id === action.payload.id);
      if (index !== -1) {
        state.reviews[index] = { ...state.reviews[index], ...action.payload };
      }
    },
    removeReviewFromList: (state, action: PayloadAction<string>) => {
      state.reviews = state.reviews.filter((r) => r.id !== action.payload);
    },
    bulkUpdateStatusInList: (
      state,
      action: PayloadAction<{ reviewIds: string[]; status: ReviewModerationStatus }>
    ) => {
      const idSet = new Set(action.payload.reviewIds);
      state.reviews = state.reviews.map((r) =>
        idSet.has(r.id) ? { ...r, status: action.payload.status } : r
      );
    },
    bulkRemoveReviewsFromList: (state, action: PayloadAction<string[]>) => {
      const idSet = new Set(action.payload);
      state.reviews = state.reviews.filter((r) => !idSet.has(r.id));
    },
  },
});

export const {
  setStatus,
  setActionLoading,
  setError,
  setReviews,
  setReviewPage,
  updateReviewInList,
  removeReviewFromList,
  bulkUpdateStatusInList,
  bulkRemoveReviewsFromList,
} = adminReviewSlice.actions;

export default adminReviewSlice.reducer;

// Thunks
// The filters of the page on screen, so live updates and actions can reload it as it is
let lastQuery: Partial<AdminReviewQuery> = {};

/** Loads one page of reviews; without a query it reloads the page on screen with the same filters */
export function fetchAdminReviews(query?: Partial<AdminReviewQuery>) {
  if (query) lastQuery = query;
  const q = lastQuery;
  return async function fetchAdminReviewsThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    dispatch(setError(null));
    try {
      const response = await APIAuthenticated.get("/admin/review", {
        params: {
          tab: q.tab && q.tab !== "ALL" ? q.tab : undefined,
          search: q.search || undefined,
          rating: q.rating && q.rating !== "ALL" ? q.rating : undefined,
          photo: q.photo && q.photo !== "ALL" ? q.photo : undefined,
          sort: q.sort,
          page: q.page,
          limit: q.limit,
        },
      });
      // A newer request was made while this one was in flight: its result wins
      if (q !== lastQuery) return;
      const d = response.data;
      dispatch(
        setReviewPage({
          reviews: d.data ?? [],
          total: d.total ?? 0,
          totalPages: d.totalPages ?? 1,
          currentPage: d.currentPage ?? 1,
          counts: d.counts,
          stats: d.stats,
        }),
      );
      dispatch(setStatus(Status.SUCCESS));
    } catch (err) {
      if (q !== lastQuery) return;
      dispatch(setError(apiMessage(err) || "Failed to fetch customer reviews"));
      dispatch(setStatus(Status.ERROR));
    }
  };
}

export function deleteAdminReview(id: string) {
  return async function deleteAdminReviewThunk(dispatch: AppDispatch) {
    dispatch(setActionLoading(true));
    try {
      const response = await APIAuthenticated.delete(`/admin/review/${id}`);
      if (response.status === 200) {
        dispatch(removeReviewFromList(id));
        toast.success(response.data.message || "Review deleted successfully");
        dispatch(setActionLoading(false));
        return { success: true };
      } else {
        toast.error(response.data.message || "Failed to delete review");
        dispatch(setActionLoading(false));
        return { success: false };
      }
    } catch (err) {
      const message =
        apiMessage(err) || "Error deleting customer review";
      toast.error(message);
      dispatch(setActionLoading(false));
      return { success: false, error: message };
    }
  };
}

export function updateReviewStatus(id: string, status: ReviewModerationStatus) {
  return async function updateReviewStatusThunk(dispatch: AppDispatch) {
    dispatch(setActionLoading(true));
    try {
      const response = await APIAuthenticated.patch(
        `/admin/review/${id}/status`,
        { status }
      );
      if (response.status === 200 && response.data.data) {
        dispatch(updateReviewInList(response.data.data));
        toast.success(response.data.message || `Review marked as ${status}`);
        dispatch(setActionLoading(false));
        return { success: true, data: response.data.data };
      } else {
        toast.error(response.data.message || "Failed to update review status");
        dispatch(setActionLoading(false));
        return { success: false };
      }
    } catch (err) {
      const message =
        apiMessage(err) || "Error updating review status";
      toast.error(message);
      dispatch(setActionLoading(false));
      return { success: false, error: message };
    }
  };
}

export function replyToReview(id: string, adminReply: string) {
  return async function replyToReviewThunk(dispatch: AppDispatch) {
    dispatch(setActionLoading(true));
    try {
      const response = await APIAuthenticated.patch(
        `/admin/review/${id}/reply`,
        { adminReply }
      );
      if (response.status === 200 && response.data.data) {
        dispatch(updateReviewInList(response.data.data));
        toast.success(
          response.data.message || "Official response updated successfully"
        );
        dispatch(setActionLoading(false));
        return { success: true, data: response.data.data };
      } else {
        toast.error(response.data.message || "Failed to save reply");
        dispatch(setActionLoading(false));
        return { success: false };
      }
    } catch (err) {
      const message =
        apiMessage(err) || "Error saving response to review";
      toast.error(message);
      dispatch(setActionLoading(false));
      return { success: false, error: message };
    }
  };
}

export function bulkUpdateReviewStatus(
  reviewIds: string[],
  status: ReviewModerationStatus
) {
  return async function bulkUpdateReviewStatusThunk(dispatch: AppDispatch) {
    if (reviewIds.length === 0) return { success: true };
    dispatch(setActionLoading(true));
    try {
      const response = await APIAuthenticated.patch(
        "/admin/review/bulk-status",
        { reviewIds, status }
      );
      if (response.status === 200) {
        dispatch(bulkUpdateStatusInList({ reviewIds, status }));
        toast.success(
          response.data.message ||
            `${reviewIds.length} review(s) marked as ${status}`
        );
        dispatch(setActionLoading(false));
        return { success: true };
      } else {
        toast.error(response.data.message || "Failed to update reviews");
        dispatch(setActionLoading(false));
        return { success: false };
      }
    } catch (err) {
      const message =
        apiMessage(err) || "Error updating reviews in bulk";
      toast.error(message);
      dispatch(setActionLoading(false));
      return { success: false, error: message };
    }
  };
}

export function bulkDeleteReviews(reviewIds: string[]) {
  return async function bulkDeleteReviewsThunk(dispatch: AppDispatch) {
    if (reviewIds.length === 0) return { success: true };
    dispatch(setActionLoading(true));
    try {
      const response = await APIAuthenticated.post(
        "/admin/review/bulk-delete",
        { reviewIds }
      );
      if (response.status === 200) {
        dispatch(bulkRemoveReviewsFromList(reviewIds));
        toast.success(
          response.data.message ||
            `${reviewIds.length} review(s) deleted successfully`
        );
        dispatch(setActionLoading(false));
        return { success: true };
      } else {
        toast.error(response.data.message || "Failed to delete reviews");
        dispatch(setActionLoading(false));
        return { success: false };
      }
    } catch (err) {
      const message =
        apiMessage(err) || "Error deleting reviews in bulk";
      toast.error(message);
      dispatch(setActionLoading(false));
      return { success: false, error: message };
    }
  };
}
