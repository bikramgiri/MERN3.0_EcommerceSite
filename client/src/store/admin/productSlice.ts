import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  AdminProduct,
  AdminProductState,
} from "../../types/admin/productTypes";
import { Status } from "../../global/statuses";
import { AppDispatch } from "../store";
import { APIAuthenticated } from "../../http";
import { toast } from "react-toastify";

const initialState: AdminProductState = {
  products: [],
  status: Status.IDLE,
  actionLoading: false,
  error: null,
};

const adminProductSlice = createSlice({
  name: "adminProduct",
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
    setProducts: (state, action: PayloadAction<AdminProduct[]>) => {
      state.products = action.payload;
    },
    addProductToList: (state, action: PayloadAction<AdminProduct>) => {
      state.products.unshift(action.payload);
    },
    updateProductInList: (state, action: PayloadAction<AdminProduct>) => {
      const index = state.products.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.products[index] = {
          ...state.products[index],
          ...action.payload,
          Category:
            action.payload.Category ||
            action.payload.category ||
            state.products[index].Category,
          category:
            action.payload.category ||
            action.payload.Category ||
            state.products[index].category,
          reviews:
            action.payload.reviews !== undefined
              ? action.payload.reviews
              : state.products[index].reviews,
        };
      }
    },
    removeProductFromList: (state, action: PayloadAction<string>) => {
      state.products = state.products.filter((p) => p.id !== action.payload);
    },
  },
});

export const {
  setStatus,
  setActionLoading,
  setError,
  setProducts,
  addProductToList,
  updateProductInList,
  removeProductFromList,
} = adminProductSlice.actions;

export default adminProductSlice.reducer;

// Thunks
export function fetchAdminProducts() {
  return async function fetchAdminProductsThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    dispatch(setError(null));
    try {
      const response = await APIAuthenticated.get("/admin/product");
      if (response.status === 200 && response.data.data) {
        dispatch(setProducts(response.data.data));
        dispatch(setStatus(Status.SUCCESS));
      } else {
        dispatch(setProducts([]));
        dispatch(setStatus(Status.SUCCESS));
      }
    } catch (error: any) {
      console.error("Fetch products error:", error);
      // 404 from backend means no products created yet, not a fatal failure
      if (error.response?.status === 404) {
        dispatch(setProducts([]));
        dispatch(setStatus(Status.SUCCESS));
      } else {
        const errorMsg =
          error.response?.data?.message || "Failed to fetch products.";
        dispatch(setError(errorMsg));
        dispatch(setStatus(Status.ERROR));
        toast.error(errorMsg);
      }
    }
  };
}

export function addAdminProduct(formData: FormData) {
  return async function addAdminProductThunk(dispatch: AppDispatch) {
    dispatch(setActionLoading(true));
    try {
      const response = await APIAuthenticated.post("/admin/product", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 201 && response.data.data) {
        dispatch(addProductToList(response.data.data));
        toast.success(response.data.message || "Product created successfully!");
        dispatch(setActionLoading(false));
        return { success: true, data: response.data.data };
      }
      dispatch(setActionLoading(false));
      return { success: false };
    } catch (error: any) {
      console.error("Add product error:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to create product.";
      toast.error(errorMsg);
      dispatch(setActionLoading(false));
      return { success: false, error: errorMsg };
    }
  };
}

export function updateAdminProduct(id: string, formData: FormData) {
  return async function updateAdminProductThunk(dispatch: AppDispatch) {
    dispatch(setActionLoading(true));
    try {
      const response = await APIAuthenticated.patch(
        `/admin/product/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200 && response.data.data) {
        dispatch(updateProductInList(response.data.data));
        toast.success(response.data.message || "Product updated successfully!");
        dispatch(setActionLoading(false));
        return { success: true, data: response.data.data };
      }
      dispatch(setActionLoading(false));
      return { success: false };
    } catch (error: any) {
      console.error("Update product error:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to update product.";
      toast.error(errorMsg);
      dispatch(setActionLoading(false));
      return { success: false, error: errorMsg };
    }
  };
}

export function deleteAdminProduct(id: string) {
  return async function deleteAdminProductThunk(dispatch: AppDispatch) {
    dispatch(setActionLoading(true));
    try {
      const response = await APIAuthenticated.delete(`/admin/product/${id}`);
      if (response.status === 200) {
        dispatch(removeProductFromList(id));
        toast.success(response.data.message || "Product deleted successfully!");
        dispatch(setActionLoading(false));
        return { success: true };
      }
      dispatch(setActionLoading(false));
      return { success: false };
    } catch (error: any) {
      console.error("Delete product error:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to delete product.";
      toast.error(errorMsg);
      dispatch(setActionLoading(false));
      return { success: false, error: errorMsg };
    }
  };
}

export function updateAdminProductStock(id: string, productStock: number) {
  return async function updateAdminProductStockThunk(dispatch: AppDispatch) {
    try {
      const response = await APIAuthenticated.patch(
        `/admin/product/productstock/${id}`,
        { productStock }
      );
      if (response.status === 200 && response.data.data) {
        dispatch(updateProductInList(response.data.data));
        toast.success("Stock updated successfully!");
        return { success: true, data: response.data.data };
      }
      return { success: false };
    } catch (error: any) {
      console.error("Update stock error:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to update stock.";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };
}

export function fetchAdminProductOrders(productId: string) {
  return async function fetchAdminProductOrdersThunk() {
    try {
      const response = await APIAuthenticated.get(
        `/admin/product/orders/${productId}`
      );
      if (response.status === 200 && response.data.data) {
        const productData = response.data.data[0];
        const orderDetails = productData?.OrderDetails || [];
        return {
          success: true,
          orders: orderDetails,
          totalOrders: response.data.totalOrders ?? orderDetails.length,
          product: productData,
        };
      }
      return { success: true, orders: [], totalOrders: 0 };
    } catch (error: any) {
      console.error("Fetch product orders error:", error);
      // 404 means no orders exist yet for this product
      if (error.response?.status === 404) {
        return { success: true, orders: [], totalOrders: 0 };
      }
      return {
        success: false,
        error: error.response?.data?.message || "Failed to fetch product orders",
        orders: [],
        totalOrders: 0,
      };
    }
  };
}

