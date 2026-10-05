import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  ShoppingCart,
  Users as UsersIcon,
  Package,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import CardDataStats from "../../components/admin/CardDataStats";
import { fetchDatas } from "../../store/admin/datasSlice";
import { DollarSign } from "../../icons/icons";
import AdminWelcomeBanner from "../../components/admin/Dashboard/AdminWelcomeBanner";
import SalesAnalyticsChart from "../../components/admin/Dashboard/SalesAnalyticsChart";
import OrderStatusBreakdown from "../../components/admin/Dashboard/OrderStatusBreakdown";
import InteractiveOrdersTable from "../../components/admin/Dashboard/InteractiveOrdersTable";
import CustomerAndReviewsSection from "../../components/admin/Dashboard/CustomerAndReviewsSection";
import TopSellingProducts from "../../components/admin/Dashboard/TopSellingProducts";
import { toast } from "react-toastify";
import { OrderStatus } from "../../types/customer/checkoutTypes";
import { connectSocket } from "../../services/socket";
import {
  getStoreSettings,
  playNotificationChime,
} from "../../services/storeSettingsService";
import LiveActivityFeedDrawer, {
  ActivityEvent,
} from "../../components/admin/Dashboard/LiveActivityFeedDrawer";

const AdminDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
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
    salesAnalytics,
    status,
  } = useAppSelector((state) => state.datas);

  const { user } = useAppSelector((state) => state.auth);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [onlineVisitorsCount, setOnlineVisitorsCount] = useState<number>(0);
  const [adminOnlineCount, setAdminOnlineCount] = useState<number>(1);
  const [activeCheckoutsCount, setActiveCheckoutsCount] = useState<number>(0);
  const [revenueFlash, setRevenueFlash] = useState<boolean>(false);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState<boolean>(false);

  const triggerRevenueFlash = () => {
    setRevenueFlash(true);
    setTimeout(() => setRevenueFlash(false), 2000);
  };

  const addActivity = (event: Omit<ActivityEvent, "id" | "timestamp">) => {
    const newEvent: ActivityEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    setActivities((prev) => [newEvent, ...prev.slice(0, 49)]); // keep latest 50
  };

  useEffect(() => {
    // Initial fetch on mount
    dispatch(fetchDatas());

    // Connect to real-time socket and authenticate
    const socket = connectSocket();

    const handleConnect = () => {
      setIsSocketConnected(true);
    };

    const handleDisconnect = () => {
      setIsSocketConnected(false);
    };

    if (socket.connected) {
      setIsSocketConnected(true);
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // 1. Order Created
    const handleOrderCreated = (data: any) => {
      const settings = getStoreSettings();
      const orderRef = data?.orderId ? `${settings.orderPrefix || "#"}${String(data.orderId).slice(-6)}` : "New Order";
      const amount = data?.totalAmount ? ` (Rs. ${Number(data.totalAmount).toLocaleString()})` : "";
      const isHighValue = data?.isHighValue || Number(data?.totalAmount) >= 15000;

      if (settings.dashboardSoundAlerts) {
        playNotificationChime();
      }

      if (isHighValue) {
        toast.info(`💎 VIP High-Value Order ${orderRef} placed${amount}! Priority fulfillment recommended.`, {
          toastId: `order-high-${data?.orderId || Date.now()}`,
          autoClose: 7000,
        });
      } else {
        toast.success(`🛒 ${orderRef} placed by customer${amount}! Refreshing dashboard...`, {
          toastId: `order-created-${data?.orderId || Date.now()}`,
          autoClose: 5000,
        });
      }

      addActivity({
        type: isHighValue ? "high-value" : "order",
        title: isHighValue ? `VIP Order Placed (${amount.trim()})` : `Order ${orderRef} Placed`,
        description: `Customer placed order via ${data?.paymentMethod || "COD"}. Total: Rs. ${Number(data?.totalAmount || 0).toLocaleString()}`,
        link: "/admin-dashboard/orders",
        data,
      });

      triggerRevenueFlash();
      dispatch(fetchDatas());
    };

    // 2. Customer Reviews
    const handleReviewCreated = (data: any) => {
      const settings = getStoreSettings();
      const customer = data?.userName || "Customer";
      const product = data?.productName ? ` on "${data.productName}"` : "";
      const rating = data?.rating ? ` (${data.rating}★)` : "";

      if (settings.dashboardSoundAlerts) {
        playNotificationChime();
      }

      if (settings.customerReviewAlerts) {
        toast.info(`⭐ New review from ${customer}${product}${rating}!`, {
          toastId: `review-created-${data?.reviewId || Date.now()}`,
          autoClose: 5000,
        });
      }

      addActivity({
        type: "review",
        title: `New ${data?.rating || 5}★ Review Submitted`,
        description: `"${data?.message || 'Review'}" by ${customer}${product}.`,
        link: "/admin-dashboard/reviews",
        data,
      });

      dispatch(fetchDatas());
    };

    // 3. Stock Safety Alerts
    const handleLowStock = (data: any) => {
      const settings = getStoreSettings();

      if (settings.dashboardSoundAlerts) {
        playNotificationChime();
      }

      if (settings.lowStockAlertsEmail) {
        toast.warn(`⚠️ Low Stock Warning: "${data?.productName}" has only ${data?.remainingStock} units left!`, {
          toastId: `low-stock-${data?.productId || Date.now()}`,
          autoClose: 8000,
        });
      }

      addActivity({
        type: "low-stock",
        title: `Low Stock Warning (${data?.remainingStock} left)`,
        description: `Inventory for "${data?.productName}" is below threshold. Restock recommended.`,
        link: "/admin-dashboard/products",
        data,
      });

      dispatch(fetchDatas());
    };

    const handleOutOfStock = (data: any) => {
      const settings = getStoreSettings();
      if (settings.dashboardSoundAlerts) {
        playNotificationChime();
      }
      toast.error(`🚨 Out of Stock: "${data?.productName}" is now completely out of stock!`, {
        toastId: `out-of-stock-${data?.productId || Date.now()}`,
        autoClose: 10000,
      });

      addActivity({
        type: "out-of-stock",
        title: `Product Out of Stock (0 units)`,
        description: `"${data?.productName}" inventory reached zero. Customers can no longer purchase this item.`,
        link: "/admin-dashboard/products",
        data,
      });

      dispatch(fetchDatas());
    };

    // 4. Live Traffic Updates (Role-filtered: customers vs admin)
    const handleTrafficUpdate = (data: any) => {
      if (data?.storefrontVisitorsCount !== undefined) {
        setOnlineVisitorsCount(data.storefrontVisitorsCount);
      } else if (data?.onlineVisitorsCount !== undefined) {
        setOnlineVisitorsCount(data.onlineVisitorsCount);
      }
      if (data?.activeCheckoutsCount !== undefined) {
        setActiveCheckoutsCount(data.activeCheckoutsCount);
      }
      if (data?.adminOnlineCount !== undefined) {
        setAdminOnlineCount(data.adminOnlineCount);
      }
    };

    // 5. New Customer Registration
    const handleUserRegistered = (data: any) => {
      toast.info(`🎉 New Customer Joined: ${data?.username} (${data?.email})`, {
        toastId: `user-reg-${data?.userId || Date.now()}`,
        autoClose: 5000,
      });

      addActivity({
        type: "user",
        title: "New Customer Account Created",
        description: `${data?.username} registered with email ${data?.email}.`,
        link: "/admin-dashboard/users",
        data,
      });

      dispatch(fetchDatas());
    };

    // 6. Payment Notifications
    const handlePaymentVerified = (data: any) => {
      toast.success(`💰 Payment of Rs. ${Number(data?.amount || 0).toLocaleString()} verified via ${data?.paymentMethod}!`, {
        toastId: `pay-verified-${data?.orderId || Date.now()}`,
        autoClose: 5000,
      });

      addActivity({
        type: "payment-verified",
        title: `Payment Verified (Rs. ${Number(data?.amount || 0).toLocaleString()})`,
        description: `Transaction confirmed successfully via ${data?.paymentMethod}.`,
        link: "/admin-dashboard/orders",
        data,
      });

      triggerRevenueFlash();
      dispatch(fetchDatas());
    };

    const handlePaymentFailed = (data: any) => {
      toast.warn(`⚠️ Payment Failed (${data?.gateway}): ${data?.reason || "Transaction could not be completed"}`, {
        toastId: `pay-failed-${data?.orderId || Date.now()}`,
        autoClose: 7000,
      });

      addActivity({
        type: "payment-failed",
        title: `Payment Failed (${data?.gateway})`,
        description: `Order #${String(data?.orderId || "").slice(-6)}: ${data?.reason || "Payment failure."}`,
        link: "/admin-dashboard/orders",
        data,
      });

      dispatch(fetchDatas());
    };

    // 7. Order Cancelled
    const handleOrderCancelled = (data: any) => {
      const settings = getStoreSettings();
      const orderRef = data?.orderId ? `${settings.orderPrefix || "#"}${String(data.orderId).slice(-6)}` : "Order";
      toast.error(`❌ ${orderRef} was cancelled by customer.`, {
        toastId: `order-cancel-${data?.orderId || Date.now()}`,
        autoClose: 6000,
      });

      addActivity({
        type: "cancelled",
        title: `${orderRef} Cancelled by Customer`,
        description: `Order cancelled. Stock has been automatically restored to inventory.`,
        link: "/admin-dashboard/orders",
        data,
      });

      dispatch(fetchDatas());
    };

    // 8. General Refresh
    const handleDashboardRefresh = (payload?: any) => {
      console.log("⚡ [Socket] Real-time dashboard refresh triggered:", payload);
      dispatch(fetchDatas());
    };

    socket.on("admin:order-created", handleOrderCreated);
    socket.on("admin:review-created", handleReviewCreated);
    socket.on("admin:low-stock", handleLowStock);
    socket.on("admin:out-of-stock", handleOutOfStock);
    socket.on("admin:traffic-update", handleTrafficUpdate);
    socket.on("admin:user-registered", handleUserRegistered);
    socket.on("admin:payment-verified", handlePaymentVerified);
    socket.on("admin:payment-failed", handlePaymentFailed);
    socket.on("admin:order-cancelled", handleOrderCancelled);
    socket.on("admin:dashboard-refresh", handleDashboardRefresh);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("admin:order-created", handleOrderCreated);
      socket.off("admin:review-created", handleReviewCreated);
      socket.off("admin:low-stock", handleLowStock);
      socket.off("admin:out-of-stock", handleOutOfStock);
      socket.off("admin:traffic-update", handleTrafficUpdate);
      socket.off("admin:user-registered", handleUserRegistered);
      socket.off("admin:payment-verified", handlePaymentVerified);
      socket.off("admin:payment-failed", handlePaymentFailed);
      socket.off("admin:order-cancelled", handleOrderCancelled);
      socket.off("admin:dashboard-refresh", handleDashboardRefresh);
    };
  }, [dispatch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchDatas());
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Preparation & Delivered counts for stats (using orderDistribution for all DB orders if available)
  const prepCount = orderDistribution
    ? orderDistribution.statusBreakdown.preparation
    : recentOrders.filter(
        (o) => o.orderStatus === OrderStatus.Preparation
      ).length;
  const deliveredCount = orderDistribution
    ? orderDistribution.statusBreakdown.delivered
    : recentOrders.filter(
        (o) => o.orderStatus === OrderStatus.Delivered
      ).length;

  return (
    <div className="space-y-6">
      {/* 1. Welcome & Action Header Banner */}
      <AdminWelcomeBanner
        adminName={user?.username || "Admin"}
        pendingOrdersCount={prepCount}
        totalRevenue={totalRevenue}
        totalOrders={totalOrders}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        isLiveConnected={isSocketConnected}
        onlineVisitorsCount={onlineVisitorsCount}
        adminOnlineCount={adminOnlineCount}
        activeCheckoutsCount={activeCheckoutsCount}
        activityCount={activities.length}
        onOpenActivityDrawer={() => setIsActivityDrawerOpen(true)}
      />

      {/* 2. Key Metrics Grid (5 Responsive Stat Cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-5">
        {/* Total Products */}
        <CardDataStats
          title="Total Products"
          total={totalProducts.toString() || "0"}
          subtitle={`${totalCategories} active categories`}
          badge="In Stock"
          badgeBg="bg-amber-500/10"
          badgeColor="text-amber-700"
          iconBg="bg-amber-500/10"
          iconColor="text-amber-600"
          onClick={() => navigate("/admin-dashboard/products")}
        >
          <Package className="w-5 h-5" />
        </CardDataStats>

        {/* Total Orders */}
        <CardDataStats
          title="Total Orders"
          total={totalOrders.toString() || "0"}
          subtitle={`${prepCount} in prep · ${deliveredCount} delivered`}
          badge={prepCount > 0 ? `${prepCount} Active` : "Fulfilled"}
          badgeBg="bg-orange-500/10"
          badgeColor="text-[#E6540B]"
          iconBg="bg-orange-500/10"
          iconColor="text-[#E6540B]"
          onClick={() => navigate("/admin-dashboard/orders")}
        >
          <ShoppingCart className="w-5 h-5" />
        </CardDataStats>

        {/* Total Categories */}
        <CardDataStats
          title="Total Categories"
          total={totalCategories.toString() || "0"}
          subtitle="Catalog collections"
          badge="Active"
          badgeBg="bg-blue-500/10"
          badgeColor="text-blue-700"
          iconBg="bg-blue-500/10"
          iconColor="text-blue-600"
          onClick={() => navigate("/admin-dashboard/categories")}
        >
          <Layers className="w-5 h-5" />
        </CardDataStats>

        {/* Registered Users */}
        <CardDataStats
          title="Registered Users"
          total={totalUsers.toString() || "0"}
          subtitle="Verified customer accounts"
          badge="Active"
          badgeBg="bg-emerald-500/10"
          badgeColor="text-emerald-700"
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-600"
          onClick={() => navigate("/admin-dashboard/users")}
        >
          <UsersIcon className="w-5 h-5" />
        </CardDataStats>

        {/* Total Revenue */}
        <div
          className={`transition-all duration-500 rounded-2xl ${
            revenueFlash
              ? "ring-3 ring-emerald-500 shadow-xl shadow-emerald-500/25 scale-[1.03]"
              : ""
          }`}
        >
          <CardDataStats
            title="Total Revenue"
            total={`Rs ${totalRevenue.toLocaleString()}`}
            subtitle="100% verified sales"
            badge={revenueFlash ? "Updated Live!" : "Verified"}
            badgeBg={revenueFlash ? "bg-emerald-500/20" : "bg-[#E6540B]/10"}
            badgeColor={revenueFlash ? "text-emerald-700" : "text-[#E6540B]"}
            iconBg="bg-[#E6540B]/10"
            iconColor="text-[#E6540B]"
            onClick={() => navigate("/admin-dashboard/orders")}
          >
            {DollarSign}
          </CardDataStats>
        </div>
      </div>

      {/* 3. Analytics & Distribution Section (2/3 Chart + 1/3 Status Breakdown) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <SalesAnalyticsChart
            recentOrders={recentOrders}
            totalRevenue={totalRevenue}
            totalOrders={totalOrders}
            salesAnalytics={salesAnalytics}
          />
        </div>
        <div className="lg:col-span-4">
          <OrderStatusBreakdown
            recentOrders={recentOrders}
            totalOrders={totalOrders}
            orderDistribution={orderDistribution}
          />
        </div>
      </div>

      {/* 4. Top Selling Products Leaderboard */}
      <TopSellingProducts
        topSellingProducts={topSellingProducts || []}
        status={status}
      />

      {/* 5. Interactive Orders Table with Search, Filter Tabs & Detail Modal */}
      <InteractiveOrdersTable
        recentOrders={recentOrders}
        status={status}
      />

      {/* 6. Split Bottom Section: Recent Customers & Recent Reviews */}
      <CustomerAndReviewsSection
        recentUsers={recentUsers}
        recentReviews={recentReviews}
        totalReviews={totalReviews}
        recentOrders={recentOrders}
      />

      {/* 7. Real-Time Live Activity Feed Drawer */}
      <LiveActivityFeedDrawer
        isOpen={isActivityDrawerOpen}
        onClose={() => setIsActivityDrawerOpen(false)}
        activities={activities}
        onClearActivities={() => setActivities([])}
      />
    </div>
  );
};

export default AdminDashboard;