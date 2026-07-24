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

export interface ProductDetails {
  productName: string;
  productPrice: number;
  productDescription: string;
  productImage: string;
  productStock: number;
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
  orderStatus: OrderStatus;
  createdAt: string;
  updatedAt: string;
  paymentId: string;
  userId: string;
  Payment: {
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
  };
  OrderDetails: Array<{
    productId: string;
    quantity: number;
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
  username?: string;
  email?: string;
  city?: string;
  state?: string;
  postalCode?: number;
  country?: string;
  saveData?: false;
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
