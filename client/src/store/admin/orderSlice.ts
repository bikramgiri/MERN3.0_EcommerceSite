import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  AdminOrder,
  AdminOrderState,
  AdminOrderStatus,
} from "../../types/admin/orderTypes";
import { Status } from "../../global/statuses";
import { AppDispatch } from "../store";
import { APIAuthenticated } from "../../http";
import { toast } from "react-toastify";

const initialState: AdminOrderState = {
  orders: [],
  status: Status.IDLE,
  actionLoading: false,
  error: null,
};

const adminOrderSlice = createSlice({
  name: "adminOrder",
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
    setOrders: (state, action: PayloadAction<AdminOrder[]>) => {
      state.orders = action.payload;
    },
    updateOrderInList: (state, action: PayloadAction<AdminOrder>) => {
      const index = state.orders.findIndex((o) => o.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = {
          ...state.orders[index],
          ...action.payload,
          OrderDetails:
            action.payload.OrderDetails || state.orders[index].OrderDetails,
          Payment: action.payload.Payment || state.orders[index].Payment,
          User: action.payload.User || state.orders[index].User,
        };
      }
    },
    removeOrderFromList: (state, action: PayloadAction<string>) => {
      state.orders = state.orders.filter((o) => o.id !== action.payload);
    },
  },
});

export const {
  setStatus,
  setActionLoading,
  setError,
  setOrders,
  updateOrderInList,
  removeOrderFromList,
} = adminOrderSlice.actions;

export default adminOrderSlice.reducer;

// Thunks
export function fetchAdminOrders() {
  return async function fetchAdminOrdersThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    dispatch(setError(null));
    try {
      const response = await APIAuthenticated.get("/admin/order");
      if (response.status === 200 && response.data.data) {
        dispatch(setOrders(response.data.data));
        dispatch(setStatus(Status.SUCCESS));
      } else {
        dispatch(setOrders([]));
        dispatch(setStatus(Status.SUCCESS));
      }
    } catch (error: any) {
      console.error("Fetch orders error:", error);
      // 404 means no orders exist yet
      if (error.response?.status === 404) {
        dispatch(setOrders([]));
        dispatch(setStatus(Status.SUCCESS));
      } else {
        const errorMsg =
          error.response?.data?.message || "Failed to fetch orders.";
        dispatch(setError(errorMsg));
        dispatch(setStatus(Status.ERROR));
        toast.error(errorMsg);
      }
    }
  };
}

export function fetchSingleAdminOrder(id: string) {
  return async function fetchSingleAdminOrderThunk() {
    try {
      const response = await APIAuthenticated.get(`/admin/order/${id}`);
      if (response.status === 200 && response.data.data) {
        return { success: true, data: response.data.data };
      }
      return { success: false };
    } catch (error: any) {
      console.error("Fetch single order error:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to fetch order details.";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };
}

export function updateAdminOrderStatus(
  id: string,
  orderStatus: AdminOrderStatus
) {
  return async function updateAdminOrderStatusThunk(dispatch: AppDispatch) {
    dispatch(setActionLoading(true));
    try {
      const response = await APIAuthenticated.patch(`/admin/order/${id}`, {
        orderStatus,
      });
      if (response.status === 200 && response.data.data) {
        dispatch(updateOrderInList(response.data.data));
        toast.success(
          response.data.message || `Order status updated to ${orderStatus}!`
        );
        dispatch(setActionLoading(false));
        return { success: true, data: response.data.data };
      }
      dispatch(setActionLoading(false));
      return { success: false };
    } catch (error: any) {
      console.error("Update order status error:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to update order status.";
      toast.error(errorMsg);
      dispatch(setActionLoading(false));
      return { success: false, error: errorMsg };
    }
  };
}

export function deleteAdminOrder(id: string) {
  return async function deleteAdminOrderThunk(dispatch: AppDispatch) {
    dispatch(setActionLoading(true));
    try {
      const response = await APIAuthenticated.delete(`/admin/order/${id}`);
      if (response.status === 200) {
        dispatch(removeOrderFromList(id));
        toast.success(response.data.message || "Order deleted successfully!");
        dispatch(setActionLoading(false));
        return { success: true };
      }
      dispatch(setActionLoading(false));
      return { success: false };
    } catch (error: any) {
      console.error("Delete order error:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to delete order.";
      toast.error(errorMsg);
      dispatch(setActionLoading(false));
      return { success: false, error: errorMsg };
    }
  };
}
