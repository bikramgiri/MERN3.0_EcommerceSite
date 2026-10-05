import React from "react";
import { Link } from "react-router-dom";
import {
  RefreshCw,
  Calendar,
  Users,
  Zap,
  Activity,
} from "lucide-react";

interface AdminWelcomeBannerProps {
  adminName?: string;
  pendingOrdersCount: number;
  totalRevenue?: number;
  totalOrders?: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  isLiveConnected?: boolean;
  onlineVisitorsCount?: number;
  adminOnlineCount?: number;
  activeCheckoutsCount?: number;
  activityCount?: number;
  onOpenActivityDrawer?: () => void;
}

const AdminWelcomeBanner: React.FC<AdminWelcomeBannerProps> = ({
  adminName = "Admin",
  pendingOrdersCount,
  isRefreshing,
  onRefresh,
  isLiveConnected = false,
  onlineVisitorsCount = 0,
  adminOnlineCount = 1,
  activeCheckoutsCount = 0,
  activityCount = 0,
  onOpenActivityDrawer,
}) => {
  // Get time of day greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#1A1613]/10 bg-gradient-to-r from-[#FFFDF8] via-[#FDF8ED] to-[#FFF7EE] p-5 sm:p-6 shadow-[0_2px_16px_-4px_rgba(26,22,19,0.06)]">
      {/* Subtle background decorative shapes */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-[#E6540B]/8 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/3 h-40 w-40 rounded-full bg-amber-500/8 blur-2xl" />

      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Left Side: Greeting & Status */}
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            {/* Live Gateway Sync Badge */}
            {isLiveConnected ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Real-Time Sync
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Connecting Real-Time Sync...
              </span>
            )}

            {/* Live Active Shoppers Counter (Filtered to real customers & storefront visitors) */}
            {onlineVisitorsCount > 0 ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 shadow-2xs"
                title={`${onlineVisitorsCount} active customer/storefront visitor(s) (${adminOnlineCount} admin session active)`}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {onlineVisitorsCount === 1
                    ? "1 customer online"
                    : `${onlineVisitorsCount} customers online`}
                </span>
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 rounded-full bg-[#1A1613]/5 px-3 py-1 text-xs font-medium text-[#1A1613]/70 border border-[#1A1613]/10"
                title={`No external customers browsing right now (${adminOnlineCount} admin active)`}
              >
                <Users className="w-3.5 h-3.5 text-[#1A1613]/40" />
                <span>0 customers online</span>
              </span>
            )}

            {/* Active Checkouts Indicator */}
            {activeCheckoutsCount > 0 && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[#E6540B] border border-orange-200 animate-pulse"
                title="Customers currently at checkout"
              >
                <Zap className="w-3.5 h-3.5 fill-[#E6540B]" />
                <span>{activeCheckoutsCount} in checkout</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1A1613]/55 ml-1">
              <Calendar className="w-3.5 h-3.5 text-[#1A1613]/40" />
              {todayStr}
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-[#1A1613] sm:text-3xl font-heading">
            {greeting}, {adminName}!
          </h2>

          <p className="text-sm text-[#1A1613]/70 leading-relaxed">
            Monitor real-time sales, fulfill active orders, and track customer growth.
            {pendingOrdersCount > 0 ? (
              <span className="font-semibold text-[#E6540B] ml-1">
                You have {pendingOrdersCount} orders currently in preparation.
              </span>
            ) : (
              <span className="text-[#1A1613]/70 ml-1">
                All store orders are currently up to date.
              </span>
            )}
          </p>
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* Live Activity Stream Drawer Trigger */}
          {onOpenActivityDrawer && (
            <button
              onClick={onOpenActivityDrawer}
              className="relative inline-flex items-center gap-1.5 rounded-xl border border-[#1A1613]/15 bg-[#FFFDF8] px-3.5 py-2.5 text-xs font-semibold text-[#1A1613] hover:bg-[#FDF8ED] hover:border-[#E6540B]/40 hover:text-[#E6540B] shadow-2xs transition-all active:scale-95"
              title="Open real-time activity stream"
            >
              <Activity className="w-3.5 h-3.5 text-[#E6540B]" />
              <span>Live Stream</span>
              {activityCount > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-[#E6540B] px-1.5 py-0.2 text-[10px] font-bold text-white leading-none">
                  {activityCount}
                </span>
              )}
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#1A1613]/15 bg-[#FFFDF8] px-3.5 py-2.5 text-xs font-semibold text-[#1A1613] hover:bg-[#F4EEDF] hover:text-[#E6540B] shadow-2xs transition-all active:scale-95 disabled:opacity-50"
            title="Refresh dashboard data"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#E6540B]" : "text-[#1A1613]/60"}`}
            />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          {/* New Product CTA */}
          <Link
            to="/admin-dashboard/products"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#E6540B] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#E6540B]/25 hover:bg-[#d44c0a] transition-all hover:scale-102 active:scale-95"
          >
            <span>+ Add Product</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminWelcomeBanner;
