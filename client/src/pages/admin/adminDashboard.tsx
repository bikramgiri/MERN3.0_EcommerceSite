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
    status,
  } = useAppSelector((state) => state.datas);

  const { user } = useAppSelector((state) => state.auth);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchDatas());
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
        <CardDataStats
          title="Total Revenue"
          total={`Rs ${totalRevenue.toLocaleString()}`}
          subtitle="100% verified sales"
          badge="Verified"
          badgeBg="bg-[#E6540B]/10"
          badgeColor="text-[#E6540B]"
          iconBg="bg-[#E6540B]/10"
          iconColor="text-[#E6540B]"
        >
          {DollarSign}
        </CardDataStats>
      </div>

      {/* 3. Analytics & Distribution Section (2/3 Chart + 1/3 Status Breakdown) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <SalesAnalyticsChart
            recentOrders={recentOrders}
            totalRevenue={totalRevenue}
            totalOrders={totalOrders}
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
    </div>
  );
};

export default AdminDashboard;