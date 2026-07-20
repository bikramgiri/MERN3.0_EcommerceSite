import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Review, ReviewState } from "../../types/reviewTypes";
import { Status } from "../../global/statuses";
import { API, APIAuthenticated } from "../../http";
import type { AppDispatch } from "../store";

const initialState: ReviewState = {
  review: [],
  status: Status.LOADING,
};

const reviewSlice = createSlice({
  name: "review",
  initialState,
  reducers: {
      setReviews: (state: ReviewState, action: PayloadAction<Review[]>) => {
          state.review = action.payload;
      },
      setStatus: (state: ReviewState, action: PayloadAction<Status>) => {
          state.status = action.payload;
      },
      editReview: (state: ReviewState, action: PayloadAction<Review>) => {
            const index = state.review.findIndex(review => review.id === action.payload.id);
            if (index !== -1) {
                  state.review[index] = action.payload;
            }
      },
      deleteReviewById: (state: ReviewState, action: PayloadAction<string>) => {
            state.review = state.review.filter(r => r.id !== action.payload);
      }
  },
    },
);

export const { setReviews, setStatus, editReview, deleteReviewById } = reviewSlice.actions
export default reviewSlice.reducer

export function fetchProductReviews(productId: string){
      return async function fetchProductReviewsThunk(dispatch: AppDispatch) {
        dispatch(setStatus(Status.LOADING));
            try {
                  const response = await API.get(`/customer/review/product/${productId}`);
                  dispatch(setReviews(response.data.data));
                  dispatch(setStatus(Status.SUCCESS));
            } catch (error) {
                  dispatch(setReviews([]));
                  dispatch(setStatus(Status.ERROR));
                  throw error;
            }
      }
}

export function fetchAllReviews(){
      return async function fetchAllReviewsThunk(dispatch: AppDispatch) {
        dispatch(setStatus(Status.LOADING));
            try {
                  const response = await API.get('/admin/review');
                  dispatch(setReviews(response.data.data));
                  dispatch(setStatus(Status.SUCCESS));
            } catch (error) {
                  dispatch(setStatus(Status.ERROR));
                  throw error;
            }
      }
}

export function addReview(payload: { productId: string, data: FormData }){
      return async function addReviewThunk(dispatch: AppDispatch) {
            dispatch(setStatus(Status.LOADING));
            try { 
                  await APIAuthenticated.post(`/customer/review/product/${payload.productId}`, payload.data);
                  dispatch(fetchProductReviews(payload.productId));
                  dispatch(setStatus(Status.SUCCESS));
            }
            catch (error) {
                  dispatch(setStatus(Status.ERROR));
                  throw error;
            }     
      }
}

export function updateReview(payload: { reviewId: string, data: FormData }) { 
      return async function updateReviewThunk(dispatch: AppDispatch) {
            dispatch(setStatus(Status.LOADING));
            try {
              const response = await APIAuthenticated.patch(
                `/customer/review/${payload.reviewId}`,
                payload.data,
              );
              if (response.status === 200) {
                dispatch(editReview(response.data.data));
                dispatch(setStatus(Status.SUCCESS));
              }
            }
            catch (error) {
                  dispatch(setStatus(Status.ERROR));
                  throw error;
            }
      }
}

export function deleteReview(reviewId: string){
      return async function deleteReviewThunk(dispatch: AppDispatch) {
            dispatch(setStatus(Status.LOADING));
            try {
                  const response = await APIAuthenticated.delete(`/customer/review/${reviewId}`);
                  if(response.status === 200){
                        dispatch(deleteReviewById(reviewId));
                        dispatch(setStatus(Status.SUCCESS));
                  }
            }
            catch (error) {
                  dispatch(setStatus(Status.ERROR));
                  throw error;
            }
      }
}
