import { Status } from "../../global/statuses";

export interface AdminProductCategory {
  id: string;
  categoryName: string;
}

export interface AdminProductOwner {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
}

export interface AdminProductReview {
  id: string;
  rating: number;
  message?: string;
  reviewImage?: string | null;
  createdAt: string;
  User?: {
    id: string;
    username: string;
    avatar?: string;
  };
}

export interface AdminProduct {
  id: string;
  productName: string;
  productDescription: string;
  productPrice: number;
  productStock: number;
  productDiscount: number;
  productImage: string;
  userId?: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  Category?: AdminProductCategory;
  category?: AdminProductCategory;
  owner?: AdminProductOwner;
  reviews?: AdminProductReview[];
}

export interface ProductFormData {
  productName: string;
  productDescription: string;
  productPrice: number | string;
  productStock: number | string;
  productDiscount: number | string;
  categoryId: string;
  productImage?: File | null;
}

export interface ProductOrderRecord {
  id: string;
  orderStatus: string;
  totalAmount: number;
  shippingAddress: string;
  phoneNumber: string;
  createdAt: string;
  User?: {
    id: string;
    username: string;
    email?: string;
  };
  Payment?: {
    id: string;
    paymentMethod: string;
    paymentStatus: string;
  };
}

export interface ProductOrderItem {
  id: string;
  quantity: number;
  Order?: ProductOrderRecord;
}

export interface ProductOrdersData {
  id: string;
  productName: string;
  productStock: number;
  OrderDetails?: ProductOrderItem[];
}

export interface AdminProductState {
  products: AdminProduct[];
  status: Status;
  actionLoading: boolean;
  error: string | null;
}

