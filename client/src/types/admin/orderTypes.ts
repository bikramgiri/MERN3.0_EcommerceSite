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
  productPrice: number;
  productImage: string;
  productDescription?: string;
  productStock?: number;
  categoryId?: string;
}

export interface AdminOrderDetailItem {
  id: string;
  quantity: number;
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
  orderStatus: AdminOrderStatus;
  userId?: string;
  paymentId?: string;
  createdAt: string;
  updatedAt?: string;
  OrderDetails?: AdminOrderDetailItem[];
  Payment?: AdminOrderPayment;
  User?: AdminOrderUser;
}

export interface AdminOrderState {
  orders: AdminOrder[];
  status: Status;
  actionLoading: boolean;
  error: string | null;
}
