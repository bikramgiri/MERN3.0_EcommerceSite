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
    COD = "Cash on Delivery",
    Khalti = "Khalti",
    Esewa = "Esewa",
}

export enum PaymentStatus {
    Pending = "Pending",
    Paid = "Paid",
    Failed = "Failed",
}