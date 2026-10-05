import { UserData, Review } from "../customer/productTypes";
import { FetchOrder } from "../customer/checkoutTypes";

export interface OrderData extends FetchOrder {
  User: UserData;
}

export interface SalesRecord {
  id: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
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
  salesAnalytics?: SalesRecord[];
  status: string;
}