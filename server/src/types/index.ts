
export enum UserRole {
    Customer = "customer",
    Admin = "admin"
}

export enum OrderStatus {
    Pending = "Pending",
    Cancelled = "Cancelled",
    Delivered = "Delivered",
    Preparation = "Preparation",
    InTransit = "In Transit"
}

export enum PaymentMethod {
    COD = "COD",
    Khalti = "Khalti",
    Esewa = "Esewa",
}

export enum PaymentStatus {
    Pending = "Pending",
    Paid = "Paid",
    Failed = "Failed",
}

export interface OrderProducts {
    productId: string;
    quantity: number;
}

export interface PaymentDetails {
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    pidx?: string; // Payment ID from the gateway, optional for COD
}

export interface OrderDetail {
    phoneNumber: string;
    shippingAddress: string;
    totalAmount: number;
    paymentDetails: PaymentDetails;
    products: OrderProducts[];
}

export interface KhaltiResponse {
      pidx : string,
      payment_url : string,
      expires_at : Date | string,
      expires_in : number,
      user_fee : number
}

export interface TransactionVerificationResponse {
      pidx : string,
      total_amount : number,
      status : TransactionStatus,
      transaction_id : string,
      fee : number,
      refunded : boolean
}

export enum TransactionStatus {
  Completed = "Completed",
  Pending = "Pending",
  Initiated = "Initiated",
  Refunded = "Refunded",
  Expired = "Expired",
  UserCancelled = "User Cancelled"
}