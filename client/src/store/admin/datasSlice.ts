import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DatasState, OrderData } from "../../types/admin/datasTypes";
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
