import React, { useState, useMemo } from "react";
import {
  Search,
  Eye,
  Copy,
  Check,
  X,
  ShoppingBag,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react";
import { OrderData } from "../../../types/admin/datasTypes";
import { OrderStatus, PaymentMethod } from "../../../types/customer/checkoutTypes";
import { useStoreSettings } from "../../../services/storeSettingsService";

interface InteractiveOrdersTableProps {
  recentOrders: OrderData[];
  status: string;
}

const orderStatusStyles: Record<string, string> = {
  [OrderStatus.Delivered]: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  [OrderStatus.Cancelled]: "bg-red-50 text-red-700 border border-red-200",
  [OrderStatus.Pending]: "bg-[#E6540B]/10 text-[#E6540B] border border-[#E6540B]/20",
  [OrderStatus.Preparation]: "bg-amber-50 text-amber-700 border border-amber-200",
  [OrderStatus.InTransit]: "bg-blue-50 text-blue-700 border border-blue-200",
};

const paymentMethodStyles: Record<string, string> = {
  [PaymentMethod.Khalti]: "bg-purple-50 text-purple-700 border border-purple-200",
  [PaymentMethod.Esewa]: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  [PaymentMethod.COD]: "bg-slate-100 text-slate-700 border border-slate-200",
};

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function initials(name?: string) {
  return name?.trim()?.[0]?.toUpperCase() || "?";
}

const InteractiveOrdersTable: React.FC<InteractiveOrdersTableProps> = ({
  recentOrders,
  status,
}) => {
  const { orderPrefix = "TRV-" } = useStoreSettings();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Status counts for tabs
  const prepCount = recentOrders.filter((o) => o.orderStatus === OrderStatus.Preparation).length;
  const pendingCount = recentOrders.filter((o) => o.orderStatus === OrderStatus.Pending).length;
  const deliveredCount = recentOrders.filter((o) => o.orderStatus === OrderStatus.Delivered).length;

  const handleCopy = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered and sorted orders
  const filteredOrders = useMemo(() => {
    return recentOrders
      .filter((order) => {
        // Status tab filter
        if (statusFilter !== "ALL" && order.orderStatus !== statusFilter) {
          return false;
        }

        // Payment method filter
        if (paymentFilter !== "ALL" && order.Payment?.paymentMethod !== paymentFilter) {
          return false;
        }

        // Search term filter
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase();
          const matchId = order.id?.toLowerCase().includes(query);
          const matchUser = order.User?.username?.toLowerCase().includes(query);
          const matchEmail = order.User?.email?.toLowerCase().includes(query);
          const matchAmount = order.totalAmount?.toString().includes(query);
          if (!matchId && !matchUser && !matchEmail && !matchAmount) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortOrder === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortOrder === "highest") {
          return (b.totalAmount || 0) - (a.totalAmount || 0);
        }
        if (sortOrder === "lowest") {
          return (a.totalAmount || 0) - (b.totalAmount || 0);
        }
        return 0;
      });
  }, [recentOrders, statusFilter, paymentFilter, searchTerm, sortOrder]);

  return (
    <>
      <div className="rounded-xl border border-[#1A1613]/10 bg-[#FFFDF8] shadow-[0_2px_14px_-6px_rgba(26,22,19,0.06)] overflow-hidden">
        {/* Table Top Controls */}
        <div className="p-5 border-b border-[#1A1613]/10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#1A1613]">Recent Orders</h3>
                <span className="rounded-full bg-[#E6540B]/10 px-2.5 py-0.5 text-xs font-bold text-[#E6540B]">
                  {filteredOrders.length} of {recentOrders.length}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[#1A1613]/60">
                Manage, inspect, and fulfill live store customer purchases
              </p>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1613]/40 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search order ID, customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-9 pl-9 pr-8 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] text-xs text-[#1A1613] placeholder:text-[#1A1613]/40 focus:outline-none focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B]"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#1A1613]/40 hover:text-[#1A1613]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sort Order Dropdown */}
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="h-9 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] px-2.5 text-xs font-medium text-[#1A1613] focus:outline-none focus:border-[#E6540B]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
              </select>
            </div>
          </div>

          {/* Interactive Filter Tabs & Quick Payment Pills */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#1A1613]/10">
            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === "ALL"
                    ? "bg-[#E6540B] text-white shadow-xs"
                    : "bg-[#F4EEDF] text-[#1A1613]/70 hover:bg-[#EDE5D0]"
                }`}
              >
                All ({recentOrders.length})
              </button>
              <button
                onClick={() => setStatusFilter(OrderStatus.Preparation)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === OrderStatus.Preparation
                    ? "bg-[#E6540B] text-white shadow-xs"
                    : "bg-[#F4EEDF] text-[#1A1613]/70 hover:bg-[#EDE5D0]"
                }`}
              >
                Preparation ({prepCount})
              </button>
              <button
                onClick={() => setStatusFilter(OrderStatus.Pending)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === OrderStatus.Pending
                    ? "bg-[#E6540B] text-white shadow-xs"
                    : "bg-[#F4EEDF] text-[#1A1613]/70 hover:bg-[#EDE5D0]"
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setStatusFilter(OrderStatus.Delivered)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === OrderStatus.Delivered
                    ? "bg-[#E6540B] text-white shadow-xs"
                    : "bg-[#F4EEDF] text-[#1A1613]/70 hover:bg-[#EDE5D0]"
                }`}
              >
                Delivered ({deliveredCount})
              </button>
            </div>

            {/* Payment Method Filter */}
            <div className="flex items-center gap-1.5 text-xs text-[#1A1613]/60">
              <span className="hidden sm:inline font-medium">Payment:</span>
              {(["ALL", PaymentMethod.Khalti, PaymentMethod.Esewa] as const).map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentFilter(method)}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                    paymentFilter === method
                      ? "bg-[#E6540B]/15 text-[#E6540B] border border-[#E6540B]/30"
                      : "hover:bg-[#1A1613]/5 text-[#1A1613]/60"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile scroll hint */}
        <div className="sm:hidden px-4 py-2 bg-[#FDF8ED] border-b border-[#1A1613]/10 text-[11px] text-[#1A1613]/60 flex items-center justify-between">
          <span>↔ Scroll horizontally to view orders &amp; actions</span>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm text-[#1A1613]">
            <thead className="bg-[#F4EEDF]/80 text-[11px] uppercase tracking-wider text-[#1A1613]/65 font-bold border-b border-[#1A1613]/10">
              <tr>
                <th className="py-3 px-4 sm:px-6">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right sm:pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1613]/10">
              {status === "loading" && recentOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#1A1613]/50">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#E6540B] border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs">Loading orders...</p>
                    </div>
                  </td>
                </tr>
              )}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#1A1613]/50">
                    <p className="font-semibold text-sm">No matching orders found</p>
                    <p className="text-xs mt-1">Try adjusting your search query or filter tags.</p>
                  </td>
                </tr>
              )}

              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="group cursor-pointer hover:bg-[#F4EEDF]/50 transition-colors"
                >
                  {/* Order ID & Date */}
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#1A1613]">
                        {orderPrefix || "#"}{order.id.slice(0, 8)}
                      </span>
                      <button
                        onClick={(e) => handleCopy(order.id, e)}
                        className="text-[#1A1613]/30 hover:text-[#E6540B] p-0.5 rounded transition-colors"
                        title="Copy full Order ID"
                      >
                        {copiedId === order.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-[#1A1613]/50 mt-0.5">
                      {formatDate(order.createdAt)}
                    </p>
                  </td>

                  {/* Customer Info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#E6540B] text-xs font-bold text-[#FDF8ED]">
                        {initials(order.User?.username)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-[#1A1613] truncate max-w-[140px] sm:max-w-[180px]">
                          {order.User?.username || "Guest Customer"}
                        </p>
                        <p className="text-[11px] text-[#1A1613]/55 truncate max-w-[140px] sm:max-w-[180px]">
                          {order.User?.email || "—"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="py-3.5 px-4 font-bold text-xs text-[#1A1613]">
                    Rs {order.totalAmount?.toLocaleString()}
                  </td>

                  {/* Payment */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
                        paymentMethodStyles[order.Payment?.paymentMethod] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {order.Payment?.paymentMethod || "COD"}
                    </span>
                  </td>

                  {/* Order Status */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                        orderStatusStyles[order.orderStatus] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {order.orderStatus}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right sm:pr-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                      }}
                      className="inline-flex items-center gap-1 rounded-md bg-[#F4EEDF] px-2.5 py-1 text-xs font-semibold text-[#1A1613] hover:bg-[#E6540B] hover:text-white transition-all shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-xl rounded-2xl border border-[#1A1613]/10 bg-[#FFFDF8] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#1A1613]/10">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[#1A1613]">Order Overview</h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      orderStatusStyles[selectedOrder.orderStatus]
                    }`}
                  >
                    {selectedOrder.orderStatus}
                  </span>
                </div>
                <p className="font-mono text-xs text-[#1A1613]/60 mt-0.5">
                  ID: {orderPrefix || "#"}{selectedOrder.id}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-full hover:bg-[#F4EEDF] text-[#1A1613]/60 hover:text-[#1A1613] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-4 space-y-4 text-xs">
              {/* Customer & Shipping Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FDF8ED] p-3.5 rounded-xl border border-[#1A1613]/10">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1613]/50">
                    Customer Info
                  </span>
                  <p className="font-bold text-[#1A1613] mt-1">
                    {selectedOrder.User?.username || "Guest"}
                  </p>
                  <p className="text-[#1A1613]/70">{selectedOrder.User?.email || "—"}</p>
                  {selectedOrder.phoneNumber && (
                    <p className="flex items-center gap-1 text-[#1A1613]/70 mt-1">
                      <Phone className="w-3 h-3 text-[#E6540B]" />
                      {selectedOrder.phoneNumber}
                    </p>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1613]/50">
                    Delivery Address
                  </span>
                  <p className="flex items-start gap-1 font-medium text-[#1A1613] mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#E6540B] flex-shrink-0 mt-0.5" />
                    <span>{selectedOrder.shippingAddress || "Kathmandu, Nepal"}</span>
                  </p>
                  <p className="flex items-center gap-1 text-[#1A1613]/60 mt-2">
                    <Calendar className="w-3 h-3" />
                    Ordered on {formatDate(selectedOrder.createdAt)}
                  </p>
                </div>
              </div>

              {/* Payment Details */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FDF8ED] border border-[#1A1613]/10">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A1613]/60">
                    Payment Method:
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold uppercase text-[11px] ${
                      paymentMethodStyles[selectedOrder.Payment?.paymentMethod]
                    }`}
                  >
                    {selectedOrder.Payment?.paymentMethod || "COD"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#1A1613]/60">Status:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                    {selectedOrder.Payment?.paymentStatus || "Paid"}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div>
                <p className="font-bold text-[#1A1613] mb-2 uppercase text-[11px] tracking-wider">
                  Purchased Items ({selectedOrder.OrderDetails?.length || 1})
                </p>
                <div className="divide-y divide-[#1A1613]/10 border border-[#1A1613]/10 rounded-xl overflow-hidden bg-white">
                  {selectedOrder.OrderDetails && selectedOrder.OrderDetails.length > 0 ? (
                    selectedOrder.OrderDetails.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                          {item.Product?.productImage ? (
                            <img
                              src={item.Product.productImage}
                              alt={item.Product?.productName || ""}
                              className="w-10 h-10 object-cover rounded-lg border border-[#1A1613]/10 shrink-0"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = "none";
                                const fallback = target.nextElementSibling;
                                if (fallback) (fallback as HTMLElement).style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="w-10 h-10 rounded-lg bg-[#E6540B]/10 flex items-center justify-center text-[#E6540B] shrink-0"
                            style={{ display: item.Product?.productImage ? "none" : "flex" }}
                          >
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-[#1A1613]">
                              {item.Product?.productName || `Item #${idx + 1}`}
                            </p>
                            <p className="text-[11px] text-[#1A1613]/60">
                              Qty: {item.quantity} × Rs {item.Product?.productPrice || "—"}
                            </p>
                          </div>
                        </div>
                        <p className="font-bold text-[#1A1613]">
                          Rs {((item.quantity || 1) * (item.Product?.productPrice || selectedOrder.totalAmount)).toLocaleString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#E6540B]/10 flex items-center justify-center text-[#E6540B]">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-[#1A1613]">Truvora Cart Order</p>
                          <p className="text-[11px] text-[#1A1613]/60">Direct Order Fulfillment</p>
                        </div>
                      </div>
                      <p className="font-bold text-[#1A1613]">
                        Rs {selectedOrder.totalAmount?.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Total Summary */}
              <div className="flex items-center justify-between pt-3 border-t border-[#1A1613]/10 text-sm">
                <span className="font-bold text-[#1A1613]">Total Order Amount:</span>
                <span className="text-base font-extrabold text-[#E6540B]">
                  Rs {selectedOrder.totalAmount?.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-[#1A1613]/10">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-lg bg-[#F4EEDF] text-xs font-semibold text-[#1A1613] hover:bg-[#EDE5D0] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InteractiveOrdersTable;
