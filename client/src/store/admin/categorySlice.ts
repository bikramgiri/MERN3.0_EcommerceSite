import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  AdminCategory,
  AdminCategoryState,
} from "../../types/admin/categoryTypes";
import { Status } from "../../global/statuses";
import { AppDispatch } from "../store";
import { APIAuthenticated } from "../../http";
import { toast } from "react-toastify";

const initialState: AdminCategoryState = {
  categories: [],
  status: Status.IDLE,
  actionLoading: false,
  error: null,
};

const categorySlice = createSlice({
  name: "adminCategory",
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
    setCategories: (state, action: PayloadAction<AdminCategory[]>) => {
      state.categories = action.payload;
    },
    addCategoryToList: (state, action: PayloadAction<AdminCategory>) => {
      state.categories.unshift(action.payload);
    },
    updateCategoryInList: (state, action: PayloadAction<AdminCategory>) => {
      const index = state.categories.findIndex(
        (c) => c.id === action.payload.id
      );
      if (index !== -1) {
        state.categories[index] = action.payload;
      }
    },
    removeCategoryFromList: (state, action: PayloadAction<string>) => {
      state.categories = state.categories.filter((c) => c.id !== action.payload);
    },
  },
});

export const {
  setStatus,
  setActionLoading,
  setError,
  setCategories,
  addCategoryToList,
  updateCategoryInList,
  removeCategoryFromList,
} = categorySlice.actions;

export default categorySlice.reducer;

// 1. Fetch All Categories for Admin
export function fetchAdminCategories() {
  return async function fetchAdminCategoriesThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    dispatch(setError(null));
    try {
      const response = await APIAuthenticated.get("/admin/category");
      if (response.status === 200 && response.data?.data) {
        dispatch(setCategories(response.data.data));
        dispatch(setStatus(Status.SUCCESS));
      } else {
        dispatch(setCategories([]));
        dispatch(setStatus(Status.SUCCESS));
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        dispatch(setCategories([]));
        dispatch(setStatus(Status.SUCCESS));
      } else {
        const errorMsg =
          error?.response?.data?.message || "Failed to fetch categories";
        dispatch(setError(errorMsg));
        dispatch(setStatus(Status.ERROR));
        console.error("fetchAdminCategories error:", error);
      }
    }
  };
}

// 2. Add New Category
export function addAdminCategory(formData: FormData) {
  return async function addAdminCategoryThunk(dispatch: AppDispatch) {
    dispatch(setActionLoading(true));
    try {
      const response = await APIAuthenticated.post("/admin/category", formData);
      if (response.status === 201 && response.data?.data) {
        dispatch(addCategoryToList(response.data.data));
        toast.success(response.data.message || "Category created successfully!");
        return { success: true, data: response.data.data };
      }
      return { success: false };
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message || "Failed to create category";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      dispatch(setActionLoading(false));
    }
  };
}

// 3. Update Category
export function updateAdminCategory(id: string, formData: FormData) {
  return async function updateAdminCategoryThunk(dispatch: AppDispatch) {
    dispatch(setActionLoading(true));
    try {
      const response = await APIAuthenticated.patch(
        `/admin/category/${id}`,
        formData
      );
      if (response.status === 200 && response.data?.data) {
        dispatch(updateCategoryInList(response.data.data));
        toast.success(response.data.message || "Category updated successfully!");
        return { success: true, data: response.data.data };
      }
      return { success: false };
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message || "Failed to update category";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      dispatch(setActionLoading(false));
    }
  };
}

// 4. Delete Category
export function deleteAdminCategory(id: string) {
  return async function deleteAdminCategoryThunk(dispatch: AppDispatch) {
    dispatch(setActionLoading(true));
    try {
      const response = await APIAuthenticated.delete(`/admin/category/${id}`);
      if (response.status === 200) {
        dispatch(removeCategoryFromList(id));
        toast.success(response.data.message || "Category deleted successfully!");
        return { success: true };
      }
      return { success: false };
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message || "Failed to delete category";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      dispatch(setActionLoading(false));
    }
  };
}
