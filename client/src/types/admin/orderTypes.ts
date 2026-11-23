import { Status } from "../../global/statuses";

export type AdminOrderStatus =
  | "Pending"
  | "Preparation"
  | "In Transit"
  | "Delivered"
  | "Cancelled";

export type AdminPaymentStatus = "Pending" | "Paid" | "Failed";

export type AdminPaymentMethod = "COD" | "Khalti" | "Esewa";

export interface AdminOrderProduct {
  id?: string;
  productName: string;
  // What customers pay today (after the product discount)
  productPrice: number;
  productImage: string;
  productDescription?: string;
  productStock?: number;
  categoryId?: string;
}

export interface AdminOrderDetailItem {
  id: string;
  quantity: number;
  productId?: string;
  // Price paid per item (null on orders placed before it was saved)
  unitPrice?: number | string | null;
  Product?: AdminOrderProduct;
}

export interface AdminOrderPayment {
  paymentMethod: AdminPaymentMethod | string;
  paymentStatus: AdminPaymentStatus | string;
}

export interface AdminOrderUser {
  id?: string;
  username: string;
  email: string;
}

export interface AdminOrder {
  id: string;
  phoneNumber: string;
  shippingAddress: string;
  totalAmount: number;
  subtotalAmount?: number | string | null;
  shippingFee?: number | string | null;
  discountAmount?: number | string | null;
  couponCode?: string | null;
  orderStatus: AdminOrderStatus;
  userId?: string;
  paymentId?: string;
  createdAt: string;
  updatedAt?: string;
  OrderDetails?: AdminOrderDetailItem[];
  Payment?: AdminOrderPayment;
  User?: AdminOrderUser;
}

/** Filters for the orders list; all of them are applied by the server */
export interface AdminOrderQuery {
  tab?: string;
  search?: string;
  payment?: string;
  method?: string;
  range?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

/** Numbers for the cards at the top of the Orders page (all orders, not just the filtered ones) */
export interface AdminOrderStats {
  total: number;
  today: number;
  todayValue: number;
  toConfirm: number;
  toDeliver: number;
  revenue: number;
}

export interface AdminOrderState {
  // The current page of orders only
  orders: AdminOrder[];
  total: number;
  totalPages: number;
  currentPage: number;
  // Orders in each status tab, for the current search and filters
  counts: Record<string, number>;
  stats: AdminOrderStats | null;
  status: Status;
  actionLoading: boolean;
  error: string | null;
}
