import { formatOrderNumber } from "../../../services/storeSettingsService";
import React, { useState, useEffect } from "react";
import {
  X,
  Edit,
  Package,
  Layers,
  Star,
  Copy,
  Check,
  ImageIcon,
  AlertCircle,
  Calendar,
  User,
  Boxes,
  ShoppingBag,
  TrendingUp,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Clock,
  CreditCard,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { useAppDispatch } from "../../../hooks/hooks";
import { fetchAdminProductOrders } from "../../../store/admin/productSlice";
import {
  AdminProduct,
  ProductOrderItem,
} from "../../../types/admin/productTypes";

interface ProductViewModalProps {
  product: AdminProduct | null;
  onClose: () => void;
  onEdit: (product: AdminProduct) => void;
  onQuickStock: (product: AdminProduct) => void;
  onCopyId: (id: string, e: React.MouseEvent) => void;
  copiedId: string | null;
  formatDate: (dateStr?: string) => string;
}

const ProductViewModal: React.FC<ProductViewModalProps> = ({
  product,
  onClose,
  onEdit,
  onQuickStock,
  onCopyId,
  copiedId,
  formatDate,
}) => {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<"overview" | "orders">("overview");

  // Orders State
  const [orders, setOrders] = useState<ProductOrderItem[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [hasFetchedOrders, setHasFetchedOrders] = useState(false);

  // Reset tab when product changes
  useEffect(() => {
    setActiveTab("overview");
    setOrders([]);
    setHasFetchedOrders(false);
    setOrdersError(null);
  }, [product?.id]);

  // Load orders for product
  const loadProductOrders = async () => {
    if (!product) return;
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const result = await dispatch(fetchAdminProductOrders(product.id));
      if (result && result.success) {
        setOrders(result.orders || []);
      } else {
        setOrdersError(result?.error || "Failed to load product orders.");
      }
    } catch (err: any) {
      setOrdersError("Error fetching product sales history.");
    } finally {
      setOrdersLoading(false);
      setHasFetchedOrders(true);
    }
  };

  useEffect(() => {
    if (activeTab === "orders" && !hasFetchedOrders && product) {
      loadProductOrders();
    }
  }, [activeTab, product?.id]);

  if (!product) return null;

  const categoryName =
    product.category?.categoryName ||
    product.Category?.categoryName ||
    "Unassigned";

  const discount = product.productDiscount || 0;
  const originalPrice = product.productPrice || 0;
  const finalPrice =
    discount > 0
      ? Math.round(originalPrice - (originalPrice * discount) / 100)
      : originalPrice;

  const stock = product.productStock || 0;
  const reviews = product.reviews || [];
  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
          reviews.length
        ).toFixed(1)
      : null;

  // Order Metrics Calculations
  const totalUnitsSold = orders.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );
  const totalEstimatedRevenue = totalUnitsSold * finalPrice;

  const getOrderStatusBadge = (status?: string) => {
    const s = (status || "").toLowerCase();
    if (s === "delivered") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-3 h-3" />
          <span>Delivered</span>
        </span>
      );
    }
    if (s === "pending") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
          <Clock className="w-3 h-3" />
          <span>Pending</span>
        </span>
      );
    }
    if (s === "cancelled") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-400">
          <AlertCircle className="w-3 h-3" />
          <span>Cancelled</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-400 capitalize">
        <span>{status || "Processing"}</span>
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl border border-[#1A1613]/15 dark:border-white/10 bg-[#FFFDF8] dark:bg-[#1E1A17] p-5 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* 1. Modal Top Bar: Title & Close */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1A1613]/10 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E6540B]/10 dark:bg-[#E6540B]/15 text-[#E6540B] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1A1613] dark:text-[#F5EFE6]">
                {product.productName}
              </h3>
              <p className="text-xs text-[#1A1613]/55 dark:text-[#F5EFE6]/50">
                Product specifications, stock levels, and sales history
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#1A1613]/40 dark:text-[#F5EFE6]/50 hover:text-[#1A1613] dark:hover:text-[#F5EFE6] hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F4EEDF]/40 dark:bg-[#2A2420] border border-[#1A1613]/10 dark:border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              activeTab === "overview"
                ? "bg-[#FFFDF8] dark:bg-[#1E1A17] text-[#E6540B] shadow-xs"
                : "text-[#1A1613]/60 dark:text-[#F5EFE6]/50 hover:text-[#1A1613] dark:hover:text-[#F5EFE6]"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Product Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              activeTab === "orders"
                ? "bg-[#FFFDF8] dark:bg-[#1E1A17] text-[#E6540B] shadow-xs"
                : "text-[#1A1613]/60 dark:text-[#F5EFE6]/50 hover:text-[#1A1613] dark:hover:text-[#F5EFE6]"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Orders &amp; Sales History</span>
            {hasFetchedOrders && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[#E6540B]/10 dark:bg-[#E6540B]/15 text-[#E6540B]">
                {orders.length}
              </span>
            )}
          </button>
        </div>

        {/* 3. TAB 1: PRODUCT OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Product Image Banner */}
            <div className="h-48 sm:h-56 w-full rounded-xl overflow-hidden border border-[#1A1613]/10 dark:border-white/10 bg-[#FDF8ED] dark:bg-[#2A2420] relative flex items-center justify-center">
              {product.productImage ? (
                <img
                  src={product.productImage}
                  alt={product.productName}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <ImageIcon className="w-12 h-12 text-[#1A1613]/25 dark:text-[#F5EFE6]/30" />
              )}

              {/* Floating Category Pill */}
              <div className="absolute top-2.5 left-2.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-semibold text-white">
                  <Layers className="w-3 h-3 text-[#E6540B]" />
                  <span>{categoryName}</span>
                </span>
              </div>

              {/* Floating Stock Pill (Clickable Quick Stock) */}
              <div className="absolute top-2.5 right-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onQuickStock(product);
                  }}
                  title="Click to quick update stock"
                  className="transition-transform active:scale-90 cursor-pointer"
                >
                  {stock === 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 hover:bg-rose-700 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>Out of Stock</span>
                    </span>
                  ) : stock < 10 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-600 hover:bg-amber-700 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                      <span>{stock} Left</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 hover:bg-emerald-700 px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-xs">
                      <span>{stock} in Stock</span>
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Price & Rating Bar */}
            <div className="p-3.5 rounded-xl bg-[#FDF8ED] dark:bg-[#1E1A17] border border-[#1A1613]/10 dark:border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-medium text-[#1A1613]/55 dark:text-[#F5EFE6]/50 block">
                  Selling Price
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-lg font-bold text-[#E6540B]">
                    Rs. {finalPrice.toLocaleString()}
                  </span>
                  {discount > 0 && (
                    <>
                      <span className="text-xs text-[#1A1613]/40 dark:text-[#F5EFE6]/50 line-through">
                        Rs. {originalPrice.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 px-1.5 rounded">
                        -{discount}% OFF
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-medium text-[#1A1613]/55 dark:text-[#F5EFE6]/50 block">
                  Customer Rating
                </span>
                <div className="flex items-center gap-1 mt-0.5 justify-end">
                  {avgRating ? (
                    <>
                      <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                      <span className="font-bold text-xs text-[#1A1613] dark:text-[#F5EFE6]">
                        {avgRating}
                      </span>
                      <span className="text-[11px] text-[#1A1613]/50 dark:text-[#F5EFE6]/50">
                        ({reviews.length}{" "}
                        {reviews.length === 1 ? "review" : "reviews"})
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-[#1A1613]/40 dark:text-[#F5EFE6]/50 italic">
                      No reviews yet
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1613]/40 dark:text-[#F5EFE6]/50">
                Description
              </span>
              <p className="text-xs text-[#1A1613]/70 dark:text-[#F5EFE6]/70 leading-relaxed mt-0.5 whitespace-pre-line">
                {product.productDescription || "No description provided."}
              </p>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#1A1613]/10 dark:border-white/10 text-xs">
              <div>
                <span className="text-[10px] text-[#1A1613]/45 dark:text-[#F5EFE6]/50 uppercase font-medium">
                  Product ID
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono text-[11px] text-[#1A1613]/80 dark:text-[#F5EFE6]/70 truncate">
                    {product.id}
                  </span>
                  <button
                    onClick={(e) => onCopyId(product.id, e)}
                    title="Copy ID"
                    className="text-[#1A1613]/40 dark:text-[#F5EFE6]/50 hover:text-[#E6540B] transition-colors"
                  >
                    {copiedId === product.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-[#1A1613]/45 dark:text-[#F5EFE6]/50 uppercase font-medium">
                  Created Date
                </span>
                <div className="flex items-center gap-1 text-[#1A1613]/80 dark:text-[#F5EFE6]/70 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-[#1A1613]/40 dark:text-[#F5EFE6]/50" />
                  <span>{formatDate(product.createdAt)}</span>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] text-[#1A1613]/45 dark:text-[#F5EFE6]/50 uppercase font-medium">
                  Quick Sales Link
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("orders")}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#E6540B] hover:underline mt-0.5"
                >
                  <ShoppingBag className="w-3 h-3" />
                  <span>View Customer Orders &rarr;</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. TAB 2: ORDERS & SALES HISTORY */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {/* Sales Summary Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-[#FDF8ED] dark:bg-[#1E1A17] border border-[#1A1613]/10 dark:border-white/10">
                <span className="text-[10px] font-medium text-[#1A1613]/55 dark:text-[#F5EFE6]/50 block">
                  Total Orders
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <ShoppingBag className="w-4 h-4 text-[#E6540B]" />
                  <span className="text-base font-bold text-[#1A1613] dark:text-[#F5EFE6]">
                    {ordersLoading ? "..." : orders.length}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#FDF8ED] dark:bg-[#1E1A17] border border-[#1A1613]/10 dark:border-white/10">
                <span className="text-[10px] font-medium text-[#1A1613]/55 dark:text-[#F5EFE6]/50 block">
                  Units Sold
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-base font-bold text-[#1A1613] dark:text-[#F5EFE6]">
                    {ordersLoading ? "..." : totalUnitsSold}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#FDF8ED] dark:bg-[#1E1A17] border border-[#1A1613]/10 dark:border-white/10">
                <span className="text-[10px] font-medium text-[#1A1613]/55 dark:text-[#F5EFE6]/50 block">
                  Est. Sales Value
                </span>
                <div className="flex items-center gap-1 mt-1 truncate">
                  <span className="text-base font-bold text-[#E6540B] truncate">
                    {ordersLoading
                      ? "..."
                      : `Rs. ${totalEstimatedRevenue.toLocaleString()}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Orders List Container */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#1A1613] dark:text-[#F5EFE6] uppercase tracking-wider">
                  Customer Purchase Records ({orders.length})
                </h4>
                <button
                  type="button"
                  onClick={loadProductOrders}
                  disabled={ordersLoading}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1A1613]/60 dark:text-[#F5EFE6]/50 hover:text-[#E6540B] transition-colors"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${ordersLoading ? "animate-spin" : ""}`}
                  />
                  <span>Refresh</span>
                </button>
              </div>

              {/* State: Loading */}
              {ordersLoading && (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={`skeleton-order-${idx}`}
                      className="p-3.5 rounded-xl border border-[#1A1613]/10 dark:border-white/10 bg-[#FFFDF8] dark:bg-[#1E1A17] animate-pulse space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <div className="h-3 w-24 rounded bg-[#1A1613]/15 dark:bg-white/10" />
                        <div className="h-4 w-16 rounded-full bg-[#1A1613]/10 dark:bg-white/10" />
                      </div>
                      <div className="h-3 w-48 rounded bg-[#1A1613]/10 dark:bg-white/10" />
                    </div>
                  ))}
                </div>
              )}

              {/* State: Error */}
              {!ordersLoading && ordersError && (
                <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/15 text-xs text-rose-700 dark:text-rose-400 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>{ordersError}</span>
                  </div>
                  <button
                    onClick={loadProductOrders}
                    className="font-bold underline text-xs"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* State: Empty */}
              {!ordersLoading && !ordersError && orders.length === 0 && (
                <div className="p-8 rounded-xl border border-dashed border-[#1A1613]/15 dark:border-white/10 text-center bg-[#FDF8ED]/40 dark:bg-white/5 space-y-2">
                  <ShoppingBag className="w-9 h-9 mx-auto text-[#1A1613]/30 dark:text-[#F5EFE6]/30" />
                  <h5 className="font-bold text-xs text-[#1A1613] dark:text-[#F5EFE6]">
                    No Orders Placed Yet
                  </h5>
                  <p className="text-[11px] text-[#1A1613]/55 dark:text-[#F5EFE6]/50 max-w-sm mx-auto">
                    This product has not been purchased by any customer yet.
                    When customers buy this item, all purchase records and
                    delivery details will appear here.
                  </p>
                </div>
              )}

              {/* State: Orders List */}
              {!ordersLoading && !ordersError && orders.length > 0 && (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {orders.map((item, idx) => {
                    const order = item.Order;
                    const customer = order?.User;
                    const payment = order?.Payment;

                    return (
                      <div
                        key={item.id || `order-${idx}`}
                        className="p-3 rounded-xl border border-[#1A1613]/10 dark:border-white/10 bg-[#FFFDF8] dark:bg-[#1E1A17] hover:border-[#E6540B]/30 transition-all space-y-2 text-xs"
                      >
                        {/* Order Header: ID, Status, Date */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-[#1A1613] dark:text-[#F5EFE6]">
                              Order {order?.id ? formatOrderNumber(order.id) : "N/A"}
                            </span>
                            {order?.id && (
                              <button
                                onClick={(e) => onCopyId(order.id, e)}
                                title="Copy Order ID"
                                className="text-[#1A1613]/40 dark:text-[#F5EFE6]/50 hover:text-[#E6540B]"
                              >
                                {copiedId === order.id ? (
                                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {getOrderStatusBadge(order?.orderStatus)}
                          </div>
                        </div>

                        {/* Customer & Quantity Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#1A1613]/70 dark:text-[#F5EFE6]/70 pt-1 border-t border-[#1A1613]/6 dark:border-white/10">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-[#1A1613] dark:text-[#F5EFE6] font-semibold">
                              <User className="w-3 h-3 text-[#E6540B]" />
                              <span>{customer?.username || "Guest Customer"}</span>
                            </div>
                            {customer?.email && (
                              <div className="flex items-center gap-1.5 text-[#1A1613]/55 dark:text-[#F5EFE6]/50">
                                <Mail className="w-3 h-3" />
                                <span className="truncate">{customer.email}</span>
                              </div>
                            )}
                            {order?.phoneNumber && (
                              <div className="flex items-center gap-1.5 text-[#1A1613]/55 dark:text-[#F5EFE6]/50">
                                <Phone className="w-3 h-3" />
                                <span>{order.phoneNumber}</span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-0.5 sm:text-right">
                            <div className="text-[#1A1613] dark:text-[#F5EFE6] font-bold">
                              Quantity:{" "}
                              <span className="text-[#E6540B] text-xs">
                                {item.quantity} {item.quantity === 1 ? "unit" : "units"}
                              </span>
                            </div>
                            <div className="text-[10px] text-[#1A1613]/50 dark:text-[#F5EFE6]/50">
                              Order Total: Rs.{" "}
                              {(order?.totalAmount || 0).toLocaleString()}
                            </div>
                            {payment && (
                              <div className="flex items-center gap-1 sm:justify-end text-[10px]">
                                <CreditCard className="w-2.5 h-2.5 text-[#1A1613]/40 dark:text-[#F5EFE6]/50" />
                                <span className="uppercase font-semibold">
                                  {payment.paymentMethod || "COD"}
                                </span>
                                <span
                                  className={`font-bold ml-1 ${
                                    payment.paymentStatus === "paid"
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-amber-600 dark:text-amber-400"
                                  }`}
                                >
                                  ({payment.paymentStatus || "unpaid"})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Address & Date Footer */}
                        <div className="flex items-center justify-between text-[10px] text-[#1A1613]/50 dark:text-[#F5EFE6]/50 pt-1 border-t border-[#1A1613]/6 dark:border-white/10">
                          <div className="flex items-center gap-1 truncate max-w-[220px]">
                            <MapPin className="w-3 h-3 shrink-0 text-[#1A1613]/40 dark:text-[#F5EFE6]/50" />
                            <span className="truncate">
                              {order?.shippingAddress || "Standard Shipping"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <Clock className="w-3 h-3 text-[#1A1613]/40 dark:text-[#F5EFE6]/50" />
                            <span>{formatDate(order?.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. Modal Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#1A1613]/10 dark:border-white/10">
          <div>
            {activeTab === "orders" ? (
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className="text-xs font-semibold text-[#1A1613]/60 dark:text-[#F5EFE6]/50 hover:text-[#E6540B] transition-colors"
              >
                &larr; Back to Product Specs
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onQuickStock(product);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E6540B]/30 bg-[#E6540B]/10 dark:bg-[#E6540B]/15 text-xs font-semibold text-[#E6540B] hover:bg-[#E6540B]/20 transition-all"
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Quick Stock</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/productdetails/${product.id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#1A1613]/15 dark:border-white/10 text-xs font-semibold text-[#1A1613] dark:text-[#F5EFE6] hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420] transition-all cursor-pointer"
              title="View on Customer Storefront"
            >
              <span>View in Store</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#E6540B]" />
            </a>
            <button
              onClick={() => {
                onClose();
                onEdit(product);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E6540B] text-xs font-semibold text-white hover:bg-[#d44c0a] transition-all shadow-xs cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Product</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#1A1613]/15 dark:border-white/10 text-xs font-semibold text-[#1A1613] dark:text-[#F5EFE6] hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420] transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductViewModal;
