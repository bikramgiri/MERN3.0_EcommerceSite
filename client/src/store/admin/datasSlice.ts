import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  DatasState,
  OrderData,
  TopSellingProduct,
  OrderDistributionData,
  DashboardAttention,
  DashboardPeriod,
  DailySales,
} from "../../types/admin/datasTypes";
import { Status } from "../../global/statuses";
import { UserData, Review } from "../../types/customer/productTypes";
import { AppDispatch } from "../store";
import { APIAuthenticated } from "../../http";

const initialState: DatasState = {
  totalUsers: 0,
  totalProducts: 0,
  totalCategories: 0,
  totalOrders: 0,
  totalReviews: 0,
  totalRevenue: 0,
  recentUsers: [],
  recentOrders: [],
  recentReviews: [],
  topSellingProducts: [],
  orderDistribution: undefined,
  verifiedCustomers: 0,
  newCustomers30d: 0,
  attention: undefined,
  period: undefined,
  dailySales: [],
  today: undefined,
  status: Status.IDLE,
};

interface DatasPayload {
  totalUsers: number;
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  totalReviews: number;
  totalRevenue: number;
  recentUsers: UserData[];
  recentOrders: OrderData[];
  recentReviews: Review[];
  topSellingProducts?: TopSellingProduct[];
  orderDistribution?: OrderDistributionData;
  verifiedCustomers?: number;
  newCustomers30d?: number;
  attention?: DashboardAttention;
  period?: DashboardPeriod;
  dailySales?: DailySales[];
  today?: string;
}

const datasSlice = createSlice({
  name: "datas",
  initialState,
  reducers: {
    setStatus: (state: DatasState, action: PayloadAction<Status>) => {
      state.status = action.payload;
    },
    setDatas: (state: DatasState, action: PayloadAction<DatasPayload>) => {
      state.totalUsers = action.payload.totalUsers;
      state.totalProducts = action.payload.totalProducts;
      state.totalCategories = action.payload.totalCategories;
      state.totalOrders = action.payload.totalOrders;
      state.totalReviews = action.payload.totalReviews;
      state.totalRevenue = action.payload.totalRevenue;
      state.recentUsers = action.payload.recentUsers;
      state.recentOrders = action.payload.recentOrders;
      state.recentReviews = action.payload.recentReviews;
      state.topSellingProducts = action.payload.topSellingProducts || [];
      state.orderDistribution = action.payload.orderDistribution;
      state.verifiedCustomers = action.payload.verifiedCustomers || 0;
      state.newCustomers30d = action.payload.newCustomers30d || 0;
      state.attention = action.payload.attention;
      state.period = action.payload.period;
      state.dailySales = action.payload.dailySales || [];
      state.today = action.payload.today;
    },
  },
});

export const { setStatus, setDatas } = datasSlice.actions;
export default datasSlice.reducer;

export function fetchDatas() {
  return async function fetchDatasThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    try {
      const response = await APIAuthenticated.get("/admin/dashboard");
      if (response.status === 200) {
        const backendData = response.data.data;

        dispatch(
          setDatas({
            totalUsers: backendData.totalUsers || 0,
            totalProducts: backendData.totalProducts || 0,
            totalCategories: backendData.totalCategories || 0,
            totalOrders: backendData.totalOrders || 0,
            totalReviews: backendData.totalReviews || 0,
            totalRevenue: backendData.totalRevenue || 0,
            recentUsers: backendData.recentUsers || [],
            recentOrders: backendData.recentOrders || [],
            recentReviews: backendData.recentReviews || [],
            topSellingProducts: backendData.topSellingProducts || [],
            orderDistribution: backendData.orderDistribution,
            // Daily totals worked out by the database, for the sales chart
            dailySales: backendData.dailySales || [],
            today: backendData.today,
            verifiedCustomers: backendData.verifiedCustomers || 0,
            newCustomers30d: backendData.newCustomers30d || 0,
            attention: backendData.attention,
            period: backendData.period,
          })
        );
        dispatch(setStatus(Status.SUCCESS));
      }
    } catch (error) {
      dispatch(setStatus(Status.ERROR));
      throw error;
    }
  };
}
