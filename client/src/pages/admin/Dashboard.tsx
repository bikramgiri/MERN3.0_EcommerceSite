
import { useEffect, useState } from "react";
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Search,
  Filter,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Truck,
  AlertCircle,
  Eye,
  Trash2,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { fetchMyOrder } from "../../store/customer/checkoutSlice";
import { fetchProducts } from "../../store/customer/productSlice";
import { OrderStatus, PaymentStatus } from "../../types/customer/checkoutTypes";
import { Status } from "../../global/statuses";
import { APIAuthenticated } from "../../http";
import { toast } from "react-toastify";

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  pendingOrders: number;
  completedOrders: number;
}

const AdminDashboard = () => {
  const dispatch = useAppDispatch();
  const { myOrder: orders, status } = useAppSelector((state) => state.checkout);
  const { product: products } = useAppSelector((state) => state.product);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPayment, setFilterPayment] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    dispatch(fetchMyOrder());
    dispatch(fetchProducts());
  }, [dispatch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchMyOrder());
      await dispatch(fetchProducts());
      toast.success("Data refreshed successfully!");
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate dashboard statistics
  const stats: DashboardStats = {
    totalOrders: orders?.length || 0,
    totalRevenue:
      orders?.reduce((sum, order) => sum + order.totalAmount, 0) || 0,
    totalProducts: products?.length || 0,
    totalCustomers: new Set(orders?.map((order) => order.userId)).size || 0,
    pendingOrders:
      orders?.filter((order) => order.orderStatus === OrderStatus.Pending)
        .length || 0,
    completedOrders:
      orders?.filter((order) => order.orderStatus === OrderStatus.Delivered)
        .length || 0,
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter orders
  const filteredOrders = orders?.filter((order) => {
    // Search filter
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phoneNumber.includes(searchTerm) ||
      order.shippingAddress.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus =
      filterStatus === "all" || order.orderStatus === filterStatus;

    // Payment filter
    const matchesPayment =
      filterPayment === "all" || order.Payment?.paymentStatus === filterPayment;

    // Date range filter
    const orderDate = new Date(order.createdAt);
    const now = new Date();
    let matchesDateRange = true;

    switch (dateRange) {
      case "today":
        matchesDateRange = orderDate >= new Date(now.setHours(0, 0, 0, 0));
        break;
      case "week":
        matchesDateRange =
          orderDate >= new Date(now.setDate(now.getDate() - 7));
        break;
      case "month":
        matchesDateRange =
          orderDate >= new Date(now.setMonth(now.getMonth() - 1));
        break;
      case "year":
        matchesDateRange =
          orderDate >= new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        matchesDateRange = true;
    }

    // Selected date filter
    const matchesSelectedDate = selectedDate
      ? orderDate.toDateString() === new Date(selectedDate).toDateString()
      : true;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPayment &&
      matchesDateRange &&
      matchesSelectedDate
    );
  });

  // Pagination
  const totalPages = Math.ceil((filteredOrders?.length || 0) / itemsPerPage);
  const paginatedOrders = filteredOrders?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Get status badge color
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.Pending:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case OrderStatus.Preparation:
        return "bg-blue-100 text-blue-800 border-blue-300";
      case OrderStatus.InTransit:
        return "bg-purple-100 text-purple-800 border-purple-300";
      case OrderStatus.Delivered:
        return "bg-green-100 text-green-800 border-green-300";
      case OrderStatus.Cancelled:
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Get payment status color
  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.Paid:
        return "bg-green-100 text-green-800 border-green-300";
      case PaymentStatus.Pending:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case PaymentStatus.Failed:
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Handle order status update
  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus,
  ) => {
    try {
      await APIAuthenticated.patch(`/customer/order/${orderId}`, {
        orderStatus: newStatus,
      });
      toast.success("Order status updated successfully!");
      dispatch(fetchMyOrder());
    } catch (error) {
      toast.error("Failed to update order status");
      console.error(error);
    }
  };

  // Handle order deletion
  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await APIAuthenticated.delete(`/customer/order/${orderId}`);
        toast.success("Order deleted successfully!");
        dispatch(fetchMyOrder());
      } catch (error) {
        toast.error("Failed to delete order");
        console.error(error);
      }
    }
  };

  if (status === Status.LOADING && !orders) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FDF8ED] to-[#FAF3E4]">
        <div className="text-center">
          <RefreshCw className="w-16 h-16 animate-spin text-[#E6540B] mx-auto mb-4" />
          <p className="text-xl text-[#1A1613]/70">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br mt-15 from-[#FDF8ED] to-[#FAF3E4] py-8 px-4 sm:px-6 lg:px-8 font-['Inter',sans-serif]">
      <div className="max-w-[1500px] mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-['Fraunces',serif] text-3xl sm:text-4xl font-bold text-[#1A1613]">
              Admin Dashboard
            </h1>
            <p className="text-[#1A1613]/60 mt-1">
              Manage your Truvora ecommerce platform
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-[#E6540B] text-[#FDF8ED] rounded-lg hover:bg-[#c94806] transition-colors disabled:opacity-50 font-semibold"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh Data
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Total Orders */}
          <div className="bg-[#FDF8ED] rounded-xl shadow-md border border-[#1A1613]/10 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#E6540B]/10 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-[#E6540B]" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-[#1A1613]/60 text-sm font-medium mb-1">
              Total Orders
            </h3>
            <p className="font-['IBM_Plex_Mono',monospace] text-2xl font-bold text-[#1A1613]">
              {stats.totalOrders}
            </p>
          </div>

          {/* Total Revenue */}
          <div className="bg-[#FDF8ED] rounded-xl shadow-md border border-[#1A1613]/10 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-[#1A1613]/60 text-sm font-medium mb-1">
              Total Revenue
            </h3>
            <p className="font-['IBM_Plex_Mono',monospace] text-2xl font-bold text-[#1A1613]">
              NPR {stats.totalRevenue.toLocaleString()}
            </p>
          </div>

          {/* Total Products */}
          <div className="bg-[#FDF8ED] rounded-xl shadow-md border border-[#1A1613]/10 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-[#1A1613]/60 text-sm font-medium mb-1">
              Total Products
            </h3>
            <p className="font-['IBM_Plex_Mono',monospace] text-2xl font-bold text-[#1A1613]">
              {stats.totalProducts}
            </p>
          </div>

          {/* Total Customers */}
          <div className="bg-[#FDF8ED] rounded-xl shadow-md border border-[#1A1613]/10 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-[#1A1613]/60 text-sm font-medium mb-1">
              Total Customers
            </h3>
            <p className="font-['IBM_Plex_Mono',monospace] text-2xl font-bold text-[#1A1613]">
              {stats.totalCustomers}
            </p>
          </div>
        </div>

        {/* Order Status Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#FDF8ED] rounded-xl shadow-md border border-[#1A1613]/10 p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-[#1A1613]/60 text-sm">Pending Orders</p>
                <p className="font-['IBM_Plex_Mono',monospace] text-xl font-bold text-[#1A1613]">
                  {stats.pendingOrders}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#FDF8ED] rounded-xl shadow-md border border-[#1A1613]/10 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-[#1A1613]/60 text-sm">Completed Orders</p>
                <p className="font-['IBM_Plex_Mono',monospace] text-xl font-bold text-[#1A1613]">
                  {stats.completedOrders}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#FDF8ED] rounded-xl shadow-md border border-[#1A1613]/10 p-4">
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-[#1A1613]/60 text-sm">In Transit</p>
                <p className="font-['IBM_Plex_Mono',monospace] text-xl font-bold text-[#1A1613]">
                  {
                    orders?.filter(
                      (order) => order.orderStatus === OrderStatus.InTransit,
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-[#FDF8ED] rounded-xl shadow-md border border-[#1A1613]/10 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-['Fraunces',serif] text-xl font-semibold text-[#1A1613]">
              Orders Management
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-[#F4EEDF] text-[#1A1613] rounded-lg hover:bg-[#E6540B]/10 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1613]/40" />
            <input
              type="text"
              placeholder="Search by Order ID, Phone, or Address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-[#1A1613]/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E6540B] bg-[#FDF8ED] text-[#1A1613]"
            />
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-[#1A1613]/10">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-[#1A1613]/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E6540B] bg-[#FDF8ED] text-[#1A1613] cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value={OrderStatus.Pending}>Pending</option>
                <option value={OrderStatus.Preparation}>Preparation</option>
                <option value={OrderStatus.InTransit}>In Transit</option>
                <option value={OrderStatus.Delivered}>Delivered</option>
                <option value={OrderStatus.Cancelled}>Cancelled</option>
              </select>

              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="px-4 py-3 border border-[#1A1613]/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E6540B] bg-[#FDF8ED] text-[#1A1613] cursor-pointer"
              >
                <option value="all">All Payment Status</option>
                <option value={PaymentStatus.Paid}>Paid</option>
                <option value={PaymentStatus.Pending}>Pending</option>
                <option value={PaymentStatus.Failed}>Failed</option>
              </select>

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-3 border border-[#1A1613]/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E6540B] bg-[#FDF8ED] text-[#1A1613] cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
              </select>

              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1613]/40 pointer-events-none" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-[#1A1613]/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E6540B] bg-[#FDF8ED] text-[#1A1613] cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Orders Table */}
        <div className="bg-[#FDF8ED] rounded-xl shadow-md border border-[#1A1613]/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F4EEDF] border-b border-[#1A1613]/10">
                <tr className="text-[#1A1613]/60 uppercase tracking-wider text-xs font-['IBM_Plex_Mono',monospace] font-semibold">
                  <th className="py-4 px-4 text-left">Order ID</th>
                  <th className="py-4 px-4 text-left">Date</th>
                  <th className="py-4 px-4 text-left">Customer</th>
                  <th className="py-4 px-4 text-right">Amount</th>
                  <th className="py-4 px-4 text-center">Order Status</th>
                  <th className="py-4 px-4 text-center">Payment Status</th>
                  <th className="py-4 px-4 text-center">Payment Method</th>
                  <th className="py-4 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders && paginatedOrders.length > 0 ? (
                  paginatedOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-[#1A1613]/10 hover:bg-[#F4EEDF] transition-colors"
                    >
                      <td className="py-4 px-4 font-['IBM_Plex_Mono',monospace] text-sm text-[#1A1613]">
                        {order.id.slice(0, 8)}...
                      </td>
                      <td className="py-4 px-4 text-sm text-[#1A1613]/80">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <div className="text-[#1A1613] font-medium">
                          {order.phoneNumber}
                        </div>
                        <div className="text-[#1A1613]/60 text-xs truncate max-w-[200px]">
                          {order.shippingAddress}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-['IBM_Plex_Mono',monospace] font-bold text-[#8A3B12]">
                        NPR {order.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <select
                          value={order.orderStatus}
                          onChange={(e) =>
                            handleUpdateOrderStatus(
                              order.id,
                              e.target.value as OrderStatus,
                            )
                          }
                          className={`px-3 py-1 text-xs font-semibold rounded-full border cursor-pointer ${getStatusColor(order.orderStatus)}`}
                        >
                          <option value={OrderStatus.Pending}>Pending</option>
                          <option value={OrderStatus.Preparation}>
                            Preparation
                          </option>
                          <option value={OrderStatus.InTransit}>
                            In Transit
                          </option>
                          <option value={OrderStatus.Delivered}>
                            Delivered
                          </option>
                          <option value={OrderStatus.Cancelled}>
                            Cancelled
                          </option>
                        </select>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getPaymentStatusColor(order.Payment?.paymentStatus)}`}
                        >
                          {order.Payment?.paymentStatus || "Pending"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center text-sm text-[#1A1613]/80 font-medium">
                        {order.Payment?.paymentMethod || "N/A"}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              window.open(
                                `/my-orders/orderdetails/${order.id}`,
                                "_blank",
                              )
                            }
                            className="p-2 hover:bg-[#E6540B]/10 rounded-lg transition-colors group"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-[#1A1613]/60 group-hover:text-[#E6540B]" />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                            title="Delete Order"
                          >
                            <Trash2 className="w-4 h-4 text-[#1A1613]/60 group-hover:text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <AlertCircle className="w-12 h-12 text-[#1A1613]/40 mx-auto mb-4" />
                      <p className="text-[#1A1613]/60 font-medium">
                        No orders found
                      </p>
                      <p className="text-[#1A1613]/40 text-sm mt-1">
                        Try adjusting your filters or search term
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-[#F4EEDF] border-t border-[#1A1613]/10">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#1A1613]/60">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredOrders?.length || 0,
                  )}{" "}
                  of {filteredOrders?.length || 0} orders
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg bg-[#FDF8ED] border border-[#1A1613]/15 hover:bg-[#F4EEDF] disabled:opacity-50 disabled:cursor-not-allowed transition text-[#1A1613] text-sm font-medium"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm font-medium text-[#1A1613]">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg bg-[#FDF8ED] border border-[#1A1613]/15 hover:bg-[#F4EEDF] disabled:opacity-50 disabled:cursor-not-allowed transition text-[#1A1613] text-sm font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
