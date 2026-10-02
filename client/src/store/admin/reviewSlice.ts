import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  AdminReview,
  AdminReviewState,
  ReviewModerationStatus,
} from "../../types/admin/reviewTypes";
import { Status } from "../../global/statuses";
import { AppDispatch } from "../store";
import { APIAuthenticated } from "../../http";
import { toast } from "react-toastify";

const initialState: AdminReviewState = {
  reviews: [],
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
  updateReviewInList,
  removeReviewFromList,
  bulkUpdateStatusInList,
  bulkRemoveReviewsFromList,
} = adminReviewSlice.actions;

export default adminReviewSlice.reducer;

// Thunks
export function fetchAdminReviews() {
  return async function fetchAdminReviewsThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    dispatch(setError(null));
    try {
      const response = await APIAuthenticated.get("/admin/review");
      if (response.status === 200 && response.data.data) {
        dispatch(setReviews(response.data.data));
        dispatch(setStatus(Status.SUCCESS));
      } else {
        dispatch(setReviews([]));
        dispatch(setStatus(Status.SUCCESS));
      }
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        dispatch(setReviews([]));
        dispatch(setStatus(Status.SUCCESS));
        return;
      }
      const message =
        err.response?.data?.message || "Failed to fetch customer reviews";
      dispatch(setError(message));
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
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Error deleting customer review";
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
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Error updating review status";
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
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Error saving response to review";
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
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Error updating reviews in bulk";
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
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Error deleting reviews in bulk";
      toast.error(message);
      dispatch(setActionLoading(false));
      return { success: false, error: message };
    }
  };
}
