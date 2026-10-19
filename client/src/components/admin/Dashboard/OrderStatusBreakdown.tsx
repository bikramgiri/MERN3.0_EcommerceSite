import React, { useState } from "react";
import { CheckCircle2, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import { OrderData, OrderDistributionData } from "../../../types/admin/datasTypes";
import { OrderStatus, PaymentMethod } from "../../../types/customer/checkoutTypes";
import { Skeleton } from "../../../global/Skeleton";

interface OrderStatusBreakdownProps {
  recentOrders: OrderData[];
  totalOrders: number;
  orderDistribution?: OrderDistributionData;
  loading?: boolean;
}

const OrderStatusBreakdown: React.FC<OrderStatusBreakdownProps> = ({
  recentOrders,
  totalOrders,
  orderDistribution,
  loading = false,
}) => {
  const [activeTab, setActiveTab] = useState<"status" | "payment">("status");

  const total = orderDistribution
    ? orderDistribution.totalOrders
    : recentOrders.length || totalOrders || 1;

  // Status counts (from orderDistribution across all DB orders if available, else recentOrders)
  const preparationCount = orderDistribution
    ? orderDistribution.statusBreakdown.preparation
    : recentOrders.filter((o) => o.orderStatus === OrderStatus.Preparation).length;

  const deliveredCount = orderDistribution
    ? orderDistribution.statusBreakdown.delivered
    : recentOrders.filter((o) => o.orderStatus === OrderStatus.Delivered).length;

  const pendingCount = orderDistribution
    ? orderDistribution.statusBreakdown.pending
    : recentOrders.filter((o) => o.orderStatus === OrderStatus.Pending).length;

  const transitCount = orderDistribution
    ? orderDistribution.statusBreakdown.inTransit
    : recentOrders.filter((o) => o.orderStatus === OrderStatus.InTransit).length;

  const cancelledCount = orderDistribution
    ? orderDistribution.statusBreakdown.cancelled
    : recentOrders.filter((o) => o.orderStatus === OrderStatus.Cancelled).length;

  // Payment counts and verified paid amounts
  const khaltiCount = orderDistribution
    ? orderDistribution.paymentBreakdown.khalti.count
    : recentOrders.filter((o) => o.Payment?.paymentMethod === PaymentMethod.Khalti).length;

  const khaltiAmount = orderDistribution
    ? orderDistribution.paymentBreakdown.khalti.paidAmount
    : recentOrders
        .filter(
          (o) =>
            o.Payment?.paymentMethod === PaymentMethod.Khalti &&
            (o.Payment?.paymentStatus === "Paid" || !o.Payment?.paymentStatus)
        )
        .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  const esewaCount = orderDistribution
    ? orderDistribution.paymentBreakdown.esewa.count
    : recentOrders.filter((o) => o.Payment?.paymentMethod === PaymentMethod.Esewa).length;

  const esewaAmount = orderDistribution
    ? orderDistribution.paymentBreakdown.esewa.paidAmount
    : recentOrders
        .filter(
          (o) =>
            o.Payment?.paymentMethod === PaymentMethod.Esewa &&
            (o.Payment?.paymentStatus === "Paid" || !o.Payment?.paymentStatus)
        )
        .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  const codCount = orderDistribution
    ? orderDistribution.paymentBreakdown.cod.count
    : recentOrders.filter((o) => o.Payment?.paymentMethod === PaymentMethod.COD).length;

  const codAmount = orderDistribution
    ? orderDistribution.paymentBreakdown.cod.paidAmount
    : recentOrders
        .filter(
          (o) =>
            o.Payment?.paymentMethod === PaymentMethod.COD &&
            o.Payment?.paymentStatus === "Paid"
        )
        .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  const statusItems = [
    {
      label: "Preparation",
      count: preparationCount,
      percent: Math.round((preparationCount / total) * 100),
      color: "bg-amber-500",
      textColor: "text-amber-700 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-500/15",
      icon: <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
    },
    {
      label: "Delivered",
      count: deliveredCount,
      percent: Math.round((deliveredCount / total) * 100),
      color: "bg-emerald-500",
      textColor: "text-emerald-700 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-500/15",
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      label: "Pending",
      count: pendingCount,
      percent: Math.round((pendingCount / total) * 100),
      color: "bg-[#E6540B]",
      textColor: "text-[#E6540B]",
      bgColor: "bg-[#E6540B]/10 dark:bg-[#E6540B]/15",
      icon: <AlertTriangle className="w-3.5 h-3.5 text-[#E6540B]" />,
    },
    {
      label: "In Transit",
      count: transitCount,
      percent: Math.round((transitCount / total) * 100),
      color: "bg-blue-500",
      textColor: "text-blue-700 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-500/15",
      icon: <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />,
    },
    {
      label: "Cancelled",
      count: cancelledCount,
      percent: Math.round((cancelledCount / total) * 100),
      color: "bg-rose-500",
      textColor: "text-rose-700 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-500/15",
      icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />,
    },
  ];

  const paymentItems = [
    {
      label: "Khalti Wallet",
      count: khaltiCount,
      amount: khaltiAmount,
      percent: Math.round((khaltiCount / total) * 100),
      color: "bg-purple-600",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30",
    },
    {
      label: "eSewa Payment",
      count: esewaCount,
      amount: esewaAmount,
      percent: Math.round((esewaCount / total) * 100),
      color: "bg-emerald-600",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
    },
    {
      label: "Cash on Delivery",
      count: codCount,
      amount: codAmount,
      percent: Math.round((codCount / total) * 100),
      color: "bg-slate-600",
      badgeColor: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30",
    },
  ];

  return (
    <div className="rounded-xl border border-[#1A1613]/10 bg-[#FFFDF8] p-5 shadow-[0_2px_14px_-6px_rgba(26,22,19,0.06)] md:p-6 flex flex-col justify-between dark:border-white/10 dark:bg-[#1E1A17]">
      <div>
        {/* Header & Tabs */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1A1613]/10 dark:border-white/10">
          <div>
            <h3 className="text-base font-bold text-[#1A1613] dark:text-[#F5EFE6]">
              Order Distribution
            </h3>
            <p className="text-xs text-[#1A1613]/60 dark:text-[#F5EFE6]/50 mt-0.5">
              Breakdown by status & payment method
            </p>
          </div>

          <div className="inline-flex rounded-lg bg-[#F4EEDF] p-1 text-xs dark:bg-[#2A2420]">
            <button
              onClick={() => setActiveTab("status")}
              className={`px-2.5 py-1 font-semibold rounded-md transition-all ${
                activeTab === "status"
                  ? "bg-[#E6540B] text-white shadow-xs"
                  : "text-[#1A1613]/70 hover:text-[#1A1613] dark:text-[#F5EFE6]/70 dark:hover:text-[#F5EFE6]"
              }`}
            >
              Status
            </button>
            <button
              onClick={() => setActiveTab("payment")}
              className={`px-2.5 py-1 font-semibold rounded-md transition-all ${
                activeTab === "payment"
                  ? "bg-[#E6540B] text-white shadow-xs"
                  : "text-[#1A1613]/70 hover:text-[#1A1613] dark:text-[#F5EFE6]/70 dark:hover:text-[#F5EFE6]"
              }`}
            >
              Payment
            </button>
          </div>
        </div>

        {/* Multi-segmented Progress Bar */}
        <div className="my-5">
          <div className="flex justify-between text-xs font-semibold text-[#1A1613]/70 dark:text-[#F5EFE6]/70 mb-2">
            <span>Overall Fulfillment</span>
            {loading ? (
              <Skeleton className="h-3.5 w-24" />
            ) : (
              <span>{total} total orders</span>
            )}
          </div>

          <div className="h-3 w-full rounded-full bg-[#1A1613]/5 dark:bg-[#2A2420] flex overflow-hidden p-0.5">
            {loading ? (
              <Skeleton className="h-full w-full rounded-full" />
            ) : activeTab === "status" ? (
              <>
                <div
                  style={{ width: `${(preparationCount / total) * 100}%` }}
                  className="h-full bg-amber-500 rounded-l-full"
                  title={`Preparation: ${preparationCount}`}
                />
                <div
                  style={{ width: `${(transitCount / total) * 100}%` }}
                  className="h-full bg-blue-500"
                  title={`In Transit: ${transitCount}`}
                />
                <div
                  style={{ width: `${(deliveredCount / total) * 100}%` }}
                  className="h-full bg-emerald-500"
                  title={`Delivered: ${deliveredCount}`}
                />
                <div
                  style={{ width: `${(pendingCount / total) * 100}%` }}
                  className="h-full bg-[#E6540B]"
                  title={`Pending: ${pendingCount}`}
                />
                <div
                  style={{ width: `${(cancelledCount / total) * 100}%` }}
                  className="h-full bg-rose-400 rounded-r-full"
                  title={`Cancelled: ${cancelledCount}`}
                />
              </>
            ) : (
              <>
                <div
                  style={{ width: `${(khaltiCount / total) * 100}%` }}
                  className="h-full bg-purple-600 rounded-l-full"
                  title={`Khalti: ${khaltiCount}`}
                />
                <div
                  style={{ width: `${(esewaCount / total) * 100}%` }}
                  className="h-full bg-emerald-600"
                  title={`eSewa: ${esewaCount}`}
                />
                <div
                  style={{ width: `${Math.max((codCount / total) * 100, codCount > 0 ? 5 : 0)}%` }}
                  className="h-full bg-slate-400 rounded-r-full"
                  title={`COD: ${codCount}`}
                />
              </>
            )}
          </div>
        </div>

        {/* Tab Content List */}
        {activeTab === "status" ? (
          <div className="space-y-3.5">
            {statusItems.map((item) => (
              <div key={item.label} className="group">
                <div className="flex items-center justify-between text-xs font-medium mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    <span className="text-[#1A1613] dark:text-[#F5EFE6] font-semibold">{item.label}</span>
                  </div>
                  {loading ? (
                    <Skeleton className="h-4 w-24" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[#1A1613]/55 dark:text-[#F5EFE6]/50">{item.count} orders</span>
                      <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${item.bgColor} ${item.textColor}`}>
                        {item.percent}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="h-1.5 w-full bg-[#1A1613]/5 dark:bg-[#2A2420] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: loading ? 0 : `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3.5">
            {paymentItems.map((item) => (
              <div key={item.label} className="group">
                <div className="flex items-center justify-between text-xs font-medium mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    <span className="text-[#1A1613] dark:text-[#F5EFE6] font-semibold">{item.label}</span>
                  </div>
                  {loading ? (
                    <Skeleton className="h-4 w-28" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[#1A1613] dark:text-[#F5EFE6] font-bold">
                        Rs {item.amount.toLocaleString()}
                      </span>
                      <span className="text-[#1A1613]/55 dark:text-[#F5EFE6]/50">({item.percent}%)</span>
                    </div>
                  )}
                </div>
                <div className="h-1.5 w-full bg-[#1A1613]/5 dark:bg-[#2A2420] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: loading ? 0 : `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trust & Health Badge */}
      <div className="mt-6 pt-4 border-t border-[#1A1613]/10 flex items-center justify-between bg-[#FDF8ED] p-3 rounded-lg dark:border-white/10 dark:bg-[#2A2420]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-semibold text-[#1A1613] dark:text-[#F5EFE6]">Payment Health</span>
        </div>
        {loading ? (
          <Skeleton className="h-5 w-24 rounded-full" />
        ) : (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full dark:text-emerald-400 dark:bg-emerald-500/15">
            {orderDistribution ? `${orderDistribution.verifiedPaymentPercent}% Verified` : "100% Verified"}
          </span>
        )}
      </div>
    </div>
  );
};

export default OrderStatusBreakdown;
