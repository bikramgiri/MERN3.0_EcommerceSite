import { UserData, Review } from "../customer/productTypes";
import { FetchOrder } from "../customer/checkoutTypes";

export interface OrderData extends FetchOrder {
  User: UserData;
}

export interface DatasState {
  totalUsers: number;
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  totalReviews: number;
  totalRevenue: number;
  recentUsers: UserData[];
  recentOrders: OrderData[];
  recentReviews: Review[];
  status: string;
}