import React from "react";
import { Trash2, AlertTriangle, RefreshCw, X } from "lucide-react";
import { AdminOrder } from "../../../types/admin/orderTypes";

interface OrderDeleteModalProps {
  order: AdminOrder | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
}

const OrderDeleteModal: React.FC<OrderDeleteModalProps> = ({
  order,
  onClose,
  onConfirm,
  loading,
}) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-[#FFFDF8] p-6 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1A1613]/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1A1613]">
                Delete Order Record
              </h3>
              <p className="text-xs text-[#1A1613]/55">
                This action is irreversible
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-[#1A1613]/40 hover:text-[#1A1613] hover:bg-[#F4EEDF]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Content */}
        <div className="space-y-3 text-xs text-[#1A1613]/70">
          <p>
            Are you sure you want to permanently delete order{" "}
            <strong className="text-[#1A1613] font-mono">
              #{order.id.slice(0, 8)}
            </strong>{" "}
            placed by{" "}
            <strong className="text-[#1A1613]">
              {order.User?.username || "Customer"}
            </strong>{" "}
            for{" "}
            <strong className="text-[#E6540B]">
              Rs. {Number(order.totalAmount || 0).toLocaleString()}
            </strong>
            ?
          </p>

          <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 text-rose-800 text-[11px] leading-relaxed">
            Deleting this order will remove all associated line items, delivery
            logs, and payment references. If you only wish to stop processing,
            consider changing the status to <strong>Cancelled</strong> instead.
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1A1613]/10">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-[#1A1613]/15 text-xs font-semibold text-[#1A1613] hover:bg-[#F4EEDF] transition-all disabled:opacity-50"
          >
            Keep Order
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700 shadow-xs active:scale-95 transition-all disabled:opacity-50"
          >
            {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <Trash2 className="w-3.5 h-3.5" />
            <span>{loading ? "Deleting..." : "Delete Order"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDeleteModal;
