import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  AdminOrder,
  AdminOrderQuery,
  AdminOrderState,
  AdminOrderStats,
  AdminOrderStatus,
} from "../../types/admin/orderTypes";
import { Status } from "../../global/statuses";
import { AppDispatch } from "../store";
import { APIAuthenticated } from "../../http";
import { toast } from "react-toastify";

const initialState: AdminOrderState = {
  orders: [],
  total: 0,
  totalPages: 1,
  currentPage: 1,
  counts: {},
  stats: null,
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
    setPage: (
      state,
      action: PayloadAction<{ total: number; totalPages: number; currentPage: number; counts: Record<string, number>; stats: AdminOrderStats | null }>,
    ) => {
      state.total = action.payload.total;
      state.totalPages = action.payload.totalPages;
      state.currentPage = action.payload.currentPage;
      state.counts = action.payload.counts;
      state.stats = action.payload.stats;
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
  setPage,
  updateOrderInList,
  removeOrderFromList,
} = adminOrderSlice.actions;

export default adminOrderSlice.reducer;

/** Status and message from a failed request */
const apiError = (error: unknown) => {
  const response = (error as { response?: { status?: number; data?: { message?: string } } })?.response;
  return { status: response?.status, message: response?.data?.message };
};

// Thunks
// The last filters used, so a refresh or a live update reloads the same page
let lastQuery: AdminOrderQuery = {};

/** Loads one page of orders for the given filters (or the last ones used) */
export function fetchAdminOrders(query?: AdminOrderQuery) {
  return async function fetchAdminOrdersThunk(dispatch: AppDispatch) {
    if (query) lastQuery = query;
    dispatch(setStatus(Status.LOADING));
    dispatch(setError(null));
    try {
      const params = new URLSearchParams();
      Object.entries(lastQuery).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== "ALL") params.set(key, String(value));
      });
      const response = await APIAuthenticated.get(`/admin/order?${params.toString()}`);
      if (response.status === 200 && response.data.data) {
        dispatch(setOrders(response.data.data));
        dispatch(
          setPage({
            total: response.data.total ?? response.data.data.length,
            totalPages: response.data.totalPages ?? 1,
            currentPage: response.data.currentPage ?? 1,
            counts: response.data.counts ?? {},
            stats: response.data.stats ?? null,
          }),
        );
        dispatch(setStatus(Status.SUCCESS));
      } else {
        dispatch(setOrders([]));
        dispatch(setStatus(Status.SUCCESS));
      }
    } catch (error) {
      console.error("Fetch orders error:", error);
      // 404 means no orders exist yet
      if (apiError(error).status === 404) {
        dispatch(setOrders([]));
        dispatch(setStatus(Status.SUCCESS));
      } else {
        const errorMsg =
          apiError(error).message || "Failed to fetch orders.";
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
    } catch (error) {
      console.error("Fetch single order error:", error);
      const errorMsg =
        apiError(error).message || "Failed to fetch order details.";
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
        toast.success(response.data.message || `Order status updated to ${orderStatus}`);
        if (response.data.refundNeeded) {
          toast.warn("This order was paid online. Remember to refund the customer.", { autoClose: 10000 });
        }
        dispatch(setActionLoading(false));
        return { success: true, data: response.data.data };
      }
      dispatch(setActionLoading(false));
      return { success: false };
    } catch (error) {
      console.error("Update order status error:", error);
      const errorMsg =
        apiError(error).message || "Failed to update order status.";
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
        dispatch(fetchAdminOrders());
        toast.success(response.data.message || "Order deleted successfully!");
        dispatch(setActionLoading(false));
        return { success: true };
      }
      dispatch(setActionLoading(false));
      return { success: false };
    } catch (error) {
      console.error("Delete order error:", error);
      const errorMsg =
        apiError(error).message || "Failed to delete order.";
      toast.error(errorMsg);
      dispatch(setActionLoading(false));
      return { success: false, error: errorMsg };
    }
  };
}
