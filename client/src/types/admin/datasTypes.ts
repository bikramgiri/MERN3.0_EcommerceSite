import { UserData, Review } from "../customer/productTypes";
import { FetchOrder } from "../customer/checkoutTypes";

export interface OrderData extends FetchOrder {
  User: UserData;
}

/** Orders and money received on one day (store timezone), for the sales chart */
export interface DailySales {
  day: string; // YYYY-MM-DD
  orders: number;
  revenue: number;
}

/** Things the store team should act on */
export interface DashboardAttention {
  ordersToConfirm: number;
  awaitingPayment: number;
  lowStock: number;
  outOfStock: number;
  reviewsToModerate: number;
  lowStockLimit: number;
}

export interface DashboardPeriod {
  revenueThisMonth: number;
  revenueLastMonth: number;
  ordersThisMonth: number;
  ordersLastMonth: number;
}

export interface TopSellingProduct {
  product: {
    id: string;
    productName: string;
    productPrice: number;
    productImage?: string;
    productStock: number;
    productDiscount?: number;
    categoryName?: string;
  };
  totalSold: number;
  totalRevenue: number;
}

export interface OrderDistributionData {
  totalOrders: number;
  paidOrdersCount: number;
  verifiedPaymentPercent: number;
  statusBreakdown: {
    preparation: number;
    delivered: number;
    pending: number;
    inTransit: number;
    cancelled: number;
  };
  paymentBreakdown: {
    khalti: {
      count: number;
      paidAmount: number;
      totalAmount: number;
    };
    esewa: {
      count: number;
      paidAmount: number;
      totalAmount: number;
    };
    cod: {
      count: number;
      paidAmount: number;
      totalAmount: number;
    };
  };
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
  topSellingProducts: TopSellingProduct[];
  orderDistribution?: OrderDistributionData;
  verifiedCustomers: number;
  newCustomers30d: number;
  attention?: DashboardAttention;
  period?: DashboardPeriod;
  dailySales: DailySales[];
  today?: string; // YYYY-MM-DD in the store's timezone
  status: string;
}