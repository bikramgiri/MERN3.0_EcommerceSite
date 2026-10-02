import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { AdminOrder, AdminOrderStatus } from "../../../types/admin/orderTypes";

interface OrderStatusModalProps {
  isOpen: boolean;
  order: AdminOrder | null;
  onClose: () => void;
  onSubmit: (id: string, newStatus: AdminOrderStatus) => Promise<boolean>;
  loading: boolean;
}

const statusOptions: {
  value: AdminOrderStatus;
  label: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  iconColor: string;
}[] = [
  {
    value: "Pending",
    label: "Pending",
    description: "Order placed by customer, awaiting store confirmation.",
    icon: Clock,
    iconColor: "text-amber-600",
  },
  {
    value: "Preparation",
    label: "Preparation",
    description: "Items are being picked, packed, and boxed in warehouse.",
    icon: Package,
    iconColor: "text-blue-600",
  },
  {
    value: "In Transit",
    label: "In Transit",
    description: "Handed over to delivery courier and on the way.",
    icon: Truck,
    iconColor: "text-indigo-600",
  },
  {
    value: "Delivered",
    label: "Delivered",
    description: "Package successfully handed to recipient.",
    icon: CheckCircle2,
    iconColor: "text-emerald-600",
  },
  {
    value: "Cancelled",
    label: "Cancelled",
    description: "Order cancelled by customer or rejected by store.",
    icon: XCircle,
    iconColor: "text-rose-600",
  },
];

const OrderStatusModal: React.FC<OrderStatusModalProps> = ({
  isOpen,
  order,
  onClose,
  onSubmit,
  loading,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<AdminOrderStatus>("Pending");

  useEffect(() => {
    if (order) {
      setSelectedStatus(order.orderStatus);
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStatus === order.orderStatus) {
      onClose();
      return;
    }
    const success = await onSubmit(order.id, selectedStatus);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-[#1A1613]/15 bg-[#FFFDF8] p-5 sm:p-6 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1A1613]/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E6540B]/10 text-[#E6540B] flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1A1613]">
                Update Order Status
              </h3>
              <p className="text-xs text-[#1A1613]/55">
                Order #{order.id.slice(0, 8)} • {order.User?.username || "Customer"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-[#1A1613]/40 hover:text-[#1A1613] hover:bg-[#F4EEDF] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Options */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            {statusOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedStatus === opt.value;
              const isCurrent = order.orderStatus === opt.value;

              return (
                <label
                  key={opt.value}
                  onClick={() => setSelectedStatus(opt.value)}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-[#E6540B] bg-[#E6540B]/5 shadow-xs"
                      : "border-[#1A1613]/10 bg-[#FFFDF8] hover:bg-[#FDF8ED]/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="orderStatus"
                    value={opt.value}
                    checked={isSelected}
                    onChange={() => setSelectedStatus(opt.value)}
                    className="mt-0.5 text-[#E6540B] focus:ring-[#E6540B]"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${opt.iconColor}`} />
                      <span className="text-xs font-bold text-[#1A1613]">
                        {opt.label}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#1A1613]/8 text-[#1A1613]/60 font-semibold">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#1A1613]/60 mt-0.5 leading-relaxed">
                      {opt.description}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1A1613]/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-[#1A1613]/15 text-xs font-semibold text-[#1A1613] hover:bg-[#F4EEDF] transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#E6540B] text-xs font-semibold text-white hover:bg-[#d44c0a] shadow-xs active:scale-95 transition-all disabled:opacity-50"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? "Updating..." : "Save Status"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderStatusModal;
