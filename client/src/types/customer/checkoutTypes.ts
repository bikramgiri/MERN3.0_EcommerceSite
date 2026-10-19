import { Review } from "./productTypes";

export enum PaymentMethod {
  COD = "COD",
  Khalti = "Khalti",
  Esewa = "Esewa",
}

export enum PaymentStatus {
  Paid = "Paid",
  Pending = "Pending",
  Failed = "Failed",
}

export enum OrderStatus {
  Pending = "Pending",
  Cancelled = "Cancelled",
  Delivered = "Delivered",
  Preparation = "Preparation",
  InTransit = "In Transit",
}

interface Category {
  categoryName: string;
}

export interface ProductDetails {
  id?: string;
  productName: string;
  productPrice: number;
  productDescription: string;
  productImage: string;
  productStock: number;
  reviews: Review[];
  category : Category;
}

export interface ItemsDetails {
  productId: string;
  quantity: number;
}

export interface FetchOrder {
  id: string;
  phoneNumber: string;
  shippingAddress: string;
  totalAmount: number;
  // Price breakdown (null on orders placed before it was saved). Numbers may arrive as strings.
  subtotalAmount?: number | string | null;
  shippingFee?: number | string | null;
  discountAmount?: number | string | null;
  couponCode?: string | null;
  // When an unpaid online order will be cancelled automatically (null otherwise)
  paymentDueAt?: string | null;
  orderStatus: OrderStatus;
  createdAt: string;
  updatedAt: string;
  paymentId: string;
  userId: string;
  Payment: {
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    updatedAt?: string;
  };
  OrderDetails: Array<{
    productId: string;
    quantity: number;
    // Price paid per item (null on orders placed before it was saved)
    unitPrice?: number | string | null;
    Product: ProductDetails;
  }>;
}

export interface OrderData {
  phoneNumber: string;
  shippingAddress: string;
  totalAmount: number;
  paymentDetails: {
    paymentMethod: PaymentMethod;
  };
  products: ItemsDetails[];
  couponCode?: string | null;
}

export interface EsewaPaymentData {
  amount: string;
  tax_amount: string;
  product_service_charge: string;
  product_delivery_charge: string;
  total_amount: string;
  transaction_uuid: string;
  product_code: string;
  success_url: string;
  failure_url: string;
  signed_field_names: string;
  signature: string;
}

export interface OrderSummary {
  id: string;
  totalAmount: number;
  orderStatus: OrderStatus;
  phoneNumber: string;
  shippingAddress: string;
}

export interface DecodedData {
  transaction_uuid: string;
  transaction_code: string;
  total_amount: number;
  status: string;
  product_code: string;
}

export interface CheckoutState {
  checkout: OrderData[];
  status: string;
  khaltiUrl: string | null;
  esewaUrl: string | null;
  esewaPaymentData: EsewaPaymentData | null;
  myOrder: FetchOrder[];
  singleOrder: FetchOrder | null;
}
