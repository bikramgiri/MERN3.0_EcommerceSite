import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Category, CategoryState } from "../../types/categoriesTypes";
import { Status } from "../../global/statuses";
import { API } from "../../http";
import type { AppDispatch } from "../store";

const initialState: CategoryState = {
  categories: [],
  status: Status.LOADING,
};

const categorySlice = createSlice({
  name: "category",
  initialState,
  reducers: {
    setCategories: (state: CategoryState, action: PayloadAction<Category[]>) => {
      state.categories = action.payload;
    },
    setStatus: (state: CategoryState, action: PayloadAction<Status>) => {
      state.status = action.payload;
    },
  },
});

export const { setCategories, setStatus } = categorySlice.actions
export default categorySlice.reducer

export function fetchCategories(){
      return async function fetchCategoriesThunk(dispatch: AppDispatch) {
        dispatch(setStatus(Status.LOADING));
        try {
            const response = await API.get("/admin/category");
            dispatch(setCategories(response.data.data));
            dispatch(setStatus(Status.SUCCESS));
        } catch (error) {
            dispatch(setStatus(Status.ERROR));
            throw error;
        }
      }
}

