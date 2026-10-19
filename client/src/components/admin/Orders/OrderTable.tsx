import { formatOrderNumber } from "../../../services/storeSettingsService";
import React from "react";
import {
  Eye,
  Trash2,
  Copy,
  Check,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  ShoppingBag,
  ImageIcon,
} from "lucide-react";
import { AdminOrder, AdminOrderStatus } from "../../../types/admin/orderTypes";
import { useStoreSettings } from "../../../services/storeSettingsService";

interface OrderTableProps {
  orders: AdminOrder[];
  loading: boolean;
  onView: (order: AdminOrder) => void;
  onOpenStatusModal: (order: AdminOrder) => void;
  onDelete: (order: AdminOrder) => void;
  onCopyId: (id: string, e: React.MouseEvent) => void;
  copiedId: string | null;
  formatDate: (dateStr?: string) => string;
}

const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  loading,
  onView,
  onOpenStatusModal,
  onDelete,
  onCopyId,
  copiedId,
  formatDate,
}) => {
  const { orderPrefix = "TRV-" } = useStoreSettings();
  const getStatusBadge = (status: AdminOrderStatus) => {
    switch (status) {
      case "Delivered":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            <span>Delivered</span>
          </span>
        );
      case "In Transit":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-400">
            <Truck className="w-3 h-3" />
            <span>In Transit</span>
          </span>
        );
      case "Preparation":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-400">
            <Package className="w-3 h-3" />
            <span>Preparation</span>
          </span>
        );
      case "Cancelled":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-400">
            <XCircle className="w-3 h-3" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
    }
  };

  const getPaymentBadge = (status?: string, method?: string) => {
    const isPaid = status === "Paid";
    const isFailed = status === "Failed";

    return (
      <div className="flex flex-col">
        <span className="text-[11px] font-bold uppercase text-[#1A1613] dark:text-[#F5EFE6]">
          {method || "COD"}
        </span>
        <span
          className={`text-[9px] font-bold ${
            isPaid
              ? "text-emerald-600 dark:text-emerald-400"
              : isFailed
              ? "text-rose-600 dark:text-rose-400"
              : "text-amber-600 dark:text-amber-400"
          }`}
        >
          {status || "Pending"}
        </span>
      </div>
    );
  };

  return (
    <div>
      {/* Mobile scroll hint */}
      <div className="sm:hidden px-4 py-2 bg-[#FDF8ED] dark:bg-[#1E1A17] border-b border-[#1A1613]/10 dark:border-white/10 text-[11px] text-[#1A1613]/60 dark:text-[#F5EFE6]/50 flex items-center justify-between">
        <span>↔ Scroll horizontally to view full order details &amp; actions</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left border-collapse">
        <thead>
          <tr className="border-b border-[#1A1613]/10 dark:border-white/10 bg-[#F4EEDF]/40 dark:bg-white/5 text-[11px] font-bold uppercase tracking-wider text-[#1A1613]/60 dark:text-[#F5EFE6]/50">
            <th className="py-3.5 px-4">Order ID</th>
            <th className="py-3.5 px-4">Customer</th>
            <th className="py-3.5 px-4">Items</th>
            <th className="py-3.5 px-4">Total Amount</th>
            <th className="py-3.5 px-4">Payment</th>
            <th className="py-3.5 px-4 text-center">Order Status</th>
            <th className="py-3.5 px-4">Date</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1A1613]/8 dark:divide-white/10 text-xs text-[#1A1613] dark:text-[#F5EFE6]">
          {loading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <tr key={`skeleton-${idx}`} className="animate-pulse">
                <td className="py-3.5 px-4">
                  <div className="h-3 w-20 rounded bg-[#1A1613]/15 dark:bg-white/10" />
                </td>
                <td className="py-3.5 px-4">
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-24 rounded bg-[#1A1613]/15 dark:bg-white/10" />
                    <div className="h-2.5 w-32 rounded bg-[#1A1613]/10 dark:bg-white/10" />
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="h-7 w-20 rounded-lg bg-[#1A1613]/10 dark:bg-white/10" />
                </td>
                <td className="py-3.5 px-4">
                  <div className="h-3.5 w-16 rounded bg-[#1A1613]/15 dark:bg-white/10" />
                </td>
                <td className="py-3.5 px-4">
                  <div className="h-3.5 w-16 rounded bg-[#1A1613]/10 dark:bg-white/10" />
                </td>
                <td className="py-3.5 px-4 text-center">
                  <div className="h-5 w-20 rounded-full bg-[#1A1613]/10 dark:bg-white/10 mx-auto" />
                </td>
                <td className="py-3.5 px-4">
                  <div className="h-3 w-16 rounded bg-[#1A1613]/10 dark:bg-white/10" />
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <div className="w-7 h-7 rounded-lg bg-[#1A1613]/10 dark:bg-white/10" />
                    <div className="w-7 h-7 rounded-lg bg-[#1A1613]/10 dark:bg-white/10" />
                    <div className="w-7 h-7 rounded-lg bg-[#1A1613]/10 dark:bg-white/10" />
                  </div>
                </td>
              </tr>
            ))
          ) : orders.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-12 text-center text-[#1A1613]/50 dark:text-[#F5EFE6]/50">
                <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-[#1A1613]/30 dark:text-[#F5EFE6]/40" />
                <p className="font-semibold text-sm">No orders found</p>
                <p className="text-xs mt-1">
                  Try adjusting your search query or filter criteria.
                </p>
              </td>
            </tr>
          ) : (
            orders.map((order) => {
              const items = order.OrderDetails || [];
              const totalItemsCount = items.reduce(
                (sum, it) => sum + (it.quantity || 1),
                0
              );
              const user = order.User;
              const payment = order.Payment;

              return (
                <tr
                  key={order.id}
                  className="group hover:bg-[#F4EEDF]/40 dark:hover:bg-white/5 transition-colors"
                >
                  {/* Order ID */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-[#1A1613] dark:text-[#F5EFE6]">
                        {formatOrderNumber(order.id, orderPrefix)}
                      </span>
                      <button
                        onClick={(e) => onCopyId(order.id, e)}
                        title="Copy Order ID"
                        className="text-[#1A1613]/35 dark:text-[#F5EFE6]/40 hover:text-[#E6540B] transition-colors"
                      >
                        {copiedId === order.id ? (
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Customer Info */}
                  <td className="py-3.5 px-4">
                    <div className="min-w-0">
                      <p className="font-bold text-[#1A1613] dark:text-[#F5EFE6] truncate max-w-[150px]">
                        {user?.username || "Guest Customer"}
                      </p>
                      <p className="text-[10px] text-[#1A1613]/50 dark:text-[#F5EFE6]/50 truncate max-w-[170px]">
                        {user?.email || order.phoneNumber}
                      </p>
                    </div>
                  </td>

                  {/* Items Preview */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-2 overflow-hidden py-0.5">
                        {items.slice(0, 3).map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="inline-block relative w-7 h-7 rounded-lg ring-2 ring-white dark:ring-[#1E1A17] overflow-hidden bg-[#FDF8ED] dark:bg-[#1E1A17] border border-[#1A1613]/10 dark:border-white/10 shrink-0 flex items-center justify-center"
                            title={item.Product?.productName || "Product"}
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-[#1A1613]/30 dark:text-[#F5EFE6]/40 shrink-0" />
                            {item.Product?.productImage && (
                              <img
                                src={item.Product.productImage}
                                alt={item.Product.productName || "Product"}
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display =
                                    "none";
                                }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                      <span className="text-[10px] font-medium text-[#1A1613]/60 dark:text-[#F5EFE6]/50 whitespace-nowrap">
                        {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"}
                      </span>
                    </div>
                  </td>

                  {/* Total Amount */}
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-xs text-[#E6540B]">
                      Rs. {Number(order.totalAmount || 0).toLocaleString()}
                    </span>
                  </td>

                  {/* Payment */}
                  <td className="py-3.5 px-4">
                    {getPaymentBadge(
                      payment?.paymentStatus,
                      payment?.paymentMethod
                    )}
                  </td>

                  {/* Order Status */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onOpenStatusModal(order)}
                      title="Click to update status"
                      className="transition-transform active:scale-95 cursor-pointer"
                    >
                      {getStatusBadge(order.orderStatus)}
                    </button>
                  </td>

                  {/* Date */}
                  <td className="py-3.5 px-4 text-xs text-[#1A1613]/60 dark:text-[#F5EFE6]/50 whitespace-nowrap">
                    {formatDate(order.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onView(order)}
                        className="p-1.5 rounded-lg text-[#1A1613]/60 dark:text-[#F5EFE6]/50 hover:text-[#1A1613] dark:hover:text-[#F5EFE6] hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420] transition-all"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onOpenStatusModal(order)}
                        className="p-1.5 rounded-lg text-[#1A1613]/60 dark:text-[#F5EFE6]/50 hover:text-[#E6540B] hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420] transition-all"
                        title="Update Status"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDelete(order)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition-all"
                        title="Delete Order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
    </div>
  );
};

export default OrderTable;
