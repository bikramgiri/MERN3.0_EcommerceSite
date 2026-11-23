import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  MessageSquare,
  Package,
  PackageX,
  RefreshCw,
  ShoppingCart,
  Users,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { fetchDatas } from "../../store/admin/datasSlice";
import { Status } from "../../global/statuses";
import { Skeleton } from "../../global/Skeleton";
import { connectSocket } from "../../services/socket";
import SalesAnalyticsChart from "../../components/admin/Dashboard/SalesAnalyticsChart";
import OrderStatusBreakdown from "../../components/admin/Dashboard/OrderStatusBreakdown";
import InteractiveOrdersTable from "../../components/admin/Dashboard/InteractiveOrdersTable";
import CustomerAndReviewsSection from "../../components/admin/Dashboard/CustomerAndReviewsSection";
import TopSellingProducts from "../../components/admin/Dashboard/TopSellingProducts";

// Events after which the numbers on this page may have changed
const REFRESH_EVENTS = [
  "admin:order-created",
  "admin:order-cancelled",
  "admin:payment-verified",
  "admin:payment-failed",
  "admin:review-created",
  "admin:low-stock",
  "admin:out-of-stock",
  "admin:user-registered",
  "admin:dashboard-refresh",
];

const card = "rounded-2xl border border-[#1A1613]/10 bg-[#FFFDF8] dark:border-white/10 dark:bg-[#1E1A17]";
const muted = "text-[#1A1613]/60 dark:text-[#F5EFE6]/55";

const rs = (n: number) => `Rs ${Math.round(n).toLocaleString()}`;

/** "▲ 12% vs last month" (or nothing to compare with yet) */
const Change = ({ now, before }: { now: number; before: number }) => {
  if (before <= 0) return <span className={muted}>{now > 0 ? "First month with sales" : "No sales yet"}</span>;
  const pct = Math.round(((now - before) / before) * 100);
  return (
    <span className={pct >= 0 ? "font-medium text-emerald-700 dark:text-emerald-400" : "font-medium text-red-700 dark:text-red-400"}>
      {pct >= 0 ? "▲" : "▼"} {Math.abs(pct)}% <span className={`font-normal ${muted}`}>vs last month</span>
    </span>
  );
};

const AdminDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    totalProducts,
    totalUsers,
    totalOrders,
    totalCategories,
    totalRevenue,
    totalReviews,
    recentOrders,
    recentUsers,
    recentReviews,
    topSellingProducts,
    orderDistribution,
    dailySales,
    today: storeToday,
    newCustomers30d,
    attention,
    period,
    status,
  } = useAppSelector((state) => state.datas);
  const { user } = useAppSelector((state) => state.auth);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(() => connectSocket().connected);
  const [visitors, setVisitors] = useState(0);
  const [checkouts, setCheckouts] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const load = () =>
      dispatch(fetchDatas())
        .then(() => setLastUpdated(new Date()))
        .catch(() => {});
    load();

    // One placed order fires several events; collapse them into a single reload
    const scheduleRefresh = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(load, 800);
    };

    const socket = connectSocket();
    const onConnect = () => setIsLive(true);
    const onDisconnect = () => setIsLive(false);
    const onTraffic = (data: { storefrontVisitorsCount?: number; onlineVisitorsCount?: number; activeCheckoutsCount?: number }) => {
      const count = data?.storefrontVisitorsCount ?? data?.onlineVisitorsCount;
      if (count !== undefined) setVisitors(count);
      if (data?.activeCheckoutsCount !== undefined) setCheckouts(data.activeCheckoutsCount);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("admin:traffic-update", onTraffic);
    // Pop-up alerts for these come from the notification bell; here we only refresh the numbers
    REFRESH_EVENTS.forEach((event) => socket.on(event, scheduleRefresh));

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("admin:traffic-update", onTraffic);
      REFRESH_EVENTS.forEach((event) => socket.off(event, scheduleRefresh));
    };
  }, [dispatch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchDatas());
      setLastUpdated(new Date());
    } catch {
      // the error banner below explains it
    } finally {
      setIsRefreshing(false);
    }
  };

  const hasData = totalOrders > 0 || totalProducts > 0 || totalUsers > 0 || recentOrders.length > 0;
  const isInitialLoading = (status === Status.IDLE || status === Status.LOADING) && !hasData;
  const loadFailed = status === Status.ERROR;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const tasks = attention
    ? [
        {
          count: attention.ordersToConfirm,
          label: attention.ordersToConfirm === 1 ? "order to confirm" : "orders to confirm",
          hint: "Placed and waiting for you to start preparing",
          to: "/admin-dashboard/orders?status=Pending",
          icon: Clock,
          tone: "text-amber-700 bg-amber-500/10 dark:text-amber-400",
        },
        {
          count: attention.awaitingPayment,
          label: attention.awaitingPayment === 1 ? "online order unpaid" : "online orders unpaid",
          hint: "Khalti/eSewa not paid yet; cancelled automatically if never paid",
          to: "/admin-dashboard/orders?status=Pending&payment=Pending",
          icon: CreditCard,
          tone: "text-sky-700 bg-sky-500/10 dark:text-sky-400",
        },
        {
          count: attention.lowStock,
          label: attention.lowStock === 1 ? "product low on stock" : "products low on stock",
          hint: `${attention.lowStockLimit} or fewer left`,
          to: "/admin-dashboard/products?stock=LOW_STOCK",
          icon: AlertTriangle,
          tone: "text-orange-700 bg-orange-500/10 dark:text-orange-400",
        },
        {
          count: attention.outOfStock,
          label: attention.outOfStock === 1 ? "product out of stock" : "products out of stock",
          hint: "Customers can't buy these",
          to: "/admin-dashboard/products?stock=OUT_OF_STOCK",
          icon: PackageX,
          tone: "text-red-700 bg-red-500/10 dark:text-red-400",
        },
        {
          count: attention.reviewsToModerate,
          label: attention.reviewsToModerate === 1 ? "review to check" : "reviews to check",
          hint: "Pending or flagged, hidden from shoppers",
          to: "/admin-dashboard/reviews?status=TO_CHECK",
          icon: MessageSquare,
          tone: "text-violet-700 bg-violet-500/10 dark:text-violet-400",
        },
      ].filter((task) => task.count > 0)
    : [];

  const stats = [
    {
      label: "Revenue",
      icon: Banknote,
      tone: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
      value: rs(totalRevenue),
      foot: period ? <Change now={period.revenueThisMonth} before={period.revenueLastMonth} /> : null,
      sub: period ? `${rs(period.revenueThisMonth)} this month` : "",
      to: "/admin-dashboard/orders?payment=Paid",
    },
    {
      label: "Orders",
      icon: ShoppingCart,
      tone: "bg-[#E6540B]/10 text-[#E6540B] dark:bg-[#E6540B]/15",
      value: totalOrders.toLocaleString(),
      sub: period ? `${period.ordersThisMonth} this month · ${period.ordersLastMonth} last month` : "",
      to: "/admin-dashboard/orders",
    },
    {
      label: "Customers",
      icon: Users,
      tone: "bg-sky-500/10 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
      value: totalUsers.toLocaleString(),
      sub: `${newCustomers30d} new in the last 30 days`,
      to: "/admin-dashboard/users",
    },
    {
      label: "Products",
      icon: Package,
      tone: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
      value: totalProducts.toLocaleString(),
      sub: `in ${totalCategories} ${totalCategories === 1 ? "category" : "categories"}${
        attention && attention.outOfStock > 0 ? ` · ${attention.outOfStock} out of stock` : ""
      }`,
      to: "/admin-dashboard/products",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={`text-sm ${muted}`}>{today}</p>
          <h1 className="text-2xl font-bold text-[#1A1613] dark:text-[#F5EFE6] sm:text-3xl">
            {greeting}, {user?.username || "Admin"}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className={`inline-flex items-center gap-1.5 ${muted}`} title={isLive ? "Updates appear automatically" : "Reconnecting…"}>
            <span className={`h-2 w-2 rounded-full ${isLive ? "bg-emerald-500" : "bg-[#1A1613]/30 dark:bg-white/30"}`} />
            {isLive ? (
              <>
                {visitors} {visitors === 1 ? "shopper" : "shoppers"} online
                {checkouts > 0 && ` · ${checkouts} at checkout`}
              </>
            ) : (
              "Offline"
            )}
          </span>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title={lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : undefined}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#1A1613]/15 bg-[#FFFDF8] px-3 py-1.5 font-medium text-[#1A1613] hover:bg-[#F4EEDF] disabled:opacity-60 dark:border-white/10 dark:bg-[#1E1A17] dark:text-[#F5EFE6] dark:hover:bg-[#2A2420]"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {loadFailed && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          Couldn't load the latest numbers{hasData ? "; showing the last ones loaded" : ""}.{" "}
          <button type="button" onClick={handleRefresh} className="cursor-pointer font-semibold underline">
            Try again
          </button>
        </p>
      )}

      {/* Needs attention */}
      <section className={`${card} p-5`}>
        <h2 className="text-base font-semibold text-[#1A1613] dark:text-[#F5EFE6]">Needs your attention</h2>
        {isInitialLoading ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <p className={`mt-2 inline-flex items-center gap-2 text-sm ${muted}`}>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> You're all caught up. No orders, stock or reviews waiting.
          </p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {tasks.map((task) => {
              const Icon = task.icon;
              return (
                <li key={task.label}>
                  <Link
                    to={task.to}
                    className="flex h-full items-start gap-3 rounded-xl border border-[#1A1613]/10 p-3 transition hover:border-[#E6540B]/50 hover:bg-[#F4EEDF]/60 dark:border-white/10 dark:hover:bg-[#2A2420]"
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${task.tone}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-[#1A1613] dark:text-[#F5EFE6]">
                        {task.count} {task.label}
                      </span>
                      <span className={`block text-xs ${muted}`}>{task.hint}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Key numbers */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map((stat) =>
          isInitialLoading ? (
            <div key={stat.label} className={`${card} space-y-2 p-4 sm:p-5`}>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-3 w-32" />
            </div>
          ) : (
            <Link key={stat.label} to={stat.to} className={`${card} block p-4 transition hover:border-[#1A1613]/25 sm:p-5 dark:hover:border-white/25`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={`text-sm ${muted}`}>{stat.label}</p>
                  <p className="mt-1 text-xl font-bold text-[#1A1613] dark:text-[#F5EFE6] sm:text-2xl">{stat.value}</p>
                </div>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 ${stat.tone}`}>
                  <stat.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
              </div>
              {stat.sub && <p className={`mt-1 text-xs ${muted}`}>{stat.sub}</p>}
              {stat.foot && <p className="mt-0.5 text-xs">{stat.foot}</p>}
            </Link>
          ),
        )}
      </div>

      {/* Sales + order status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <SalesAnalyticsChart dailySales={dailySales} today={storeToday} loading={isInitialLoading} />
        </div>
        <div className="lg:col-span-4">
          <OrderStatusBreakdown
            recentOrders={recentOrders}
            totalOrders={totalOrders}
            orderDistribution={orderDistribution}
            loading={isInitialLoading}
          />
        </div>
      </div>

      <InteractiveOrdersTable recentOrders={recentOrders} loading={isInitialLoading} />

      <TopSellingProducts topSellingProducts={topSellingProducts || []} loading={isInitialLoading} />

      <CustomerAndReviewsSection
        recentUsers={recentUsers}
        recentReviews={recentReviews}
        totalReviews={totalReviews}
        recentOrders={recentOrders}
        loading={isInitialLoading}
      />
    </div>
  );
};

export default AdminDashboard;
