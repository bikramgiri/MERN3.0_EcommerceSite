import React, { useEffect, useState, useMemo } from "react";
import {
  ShoppingBag,
  Search,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import {
  fetchAdminOrders,
  updateAdminOrderStatus,
  deleteAdminOrder,
} from "../../store/admin/orderSlice";
import { fetchDatas as syncDashboardStats } from "../../store/admin/datasSlice";
import { AdminOrder, AdminOrderStatus } from "../../types/admin/orderTypes";
import { Status } from "../../global/statuses";
import OrderTable from "../../components/admin/Orders/OrderTable";
import OrderViewModal from "../../components/admin/Orders/OrderViewModal";
import OrderStatusModal from "../../components/admin/Orders/OrderStatusModal";
import OrderDeleteModal from "../../components/admin/Orders/OrderDeleteModal";
import { useSearchParams } from "react-router-dom";
import { connectSocket } from "../../services/socket";

function formatDate(dateStr?: string) {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const OrderManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { orders, status, actionLoading } = useAppSelector(
    (state) => state.adminOrder
  );
  const [searchParams] = useSearchParams();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const q = searchParams.get("search");
    if (q) {
      const lower = q.trim().toLowerCase();
      if (lower === "pending") {
        setSelectedStatus("Pending");
      } else if (lower === "intransit" || lower === "in transit" || lower === "in-transit") {
        setSelectedStatus("InTransit");
      } else if (lower === "delivered") {
        setSelectedStatus("Delivered");
      } else if (lower === "cancelled" || lower === "canceled") {
        setSelectedStatus("Cancelled");
      } else if (lower === "cod" || lower === "cash on delivery") {
        setSelectedMethod("COD");
      } else {
        setSearchTerm(q);
      }
      setCurrentPage(1);
    }

    const statusParam = searchParams.get("status");
    if (statusParam) {
      setSelectedStatus(statusParam);
      setCurrentPage(1);
    }

    const paymentParam = searchParams.get("payment");
    if (paymentParam) {
      setSelectedPayment(paymentParam);
      setCurrentPage(1);
    }

    const methodParam = searchParams.get("method");
    if (methodParam) {
      setSelectedMethod(methodParam);
      setCurrentPage(1);
    }

    const dateParam = searchParams.get("date");
    if (dateParam === "TODAY") {
      setDateFilter("TODAY");
      setCurrentPage(1);
    }
  }, [searchParams]);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedPayment, setSelectedPayment] = useState<string>("ALL");
  const [selectedMethod, setSelectedMethod] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY">("ALL");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "amount_desc" | "amount_asc"
  >("newest");

  const isFiltered =
    searchTerm.trim() !== "" ||
    selectedStatus !== "ALL" ||
    selectedPayment !== "ALL" ||
    selectedMethod !== "ALL" ||
    dateFilter !== "ALL" ||
    sortBy !== "newest";

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedStatus("ALL");
    setSelectedPayment("ALL");
    setSelectedMethod("ALL");
    setDateFilter("ALL");
    setSortBy("newest");
    setCurrentPage(1);
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals State
  const [viewingOrder, setViewingOrder] = useState<AdminOrder | null>(null);
  const [statusOrder, setStatusOrder] = useState<AdminOrder | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<AdminOrder | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Initial load & real-time socket updates
  useEffect(() => {
    dispatch(fetchAdminOrders());

    const socket = connectSocket();
    const handleOrderEvent = () => {
      dispatch(fetchAdminOrders());
    };

    socket.on("admin:order-created", handleOrderEvent);
    socket.on("admin:dashboard-refresh", handleOrderEvent);

    return () => {
      socket.off("admin:order-created", handleOrderEvent);
      socket.off("admin:dashboard-refresh", handleOrderEvent);
    };
  }, [dispatch]);

  const handleRefresh = async () => {
    await dispatch(fetchAdminOrders());
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUpdateStatus = async (
    id: string,
    newStatus: AdminOrderStatus
  ): Promise<boolean> => {
    const result = await dispatch(updateAdminOrderStatus(id, newStatus));
    if (result && result.success) {
      dispatch(syncDashboardStats());
      // Update viewing order if currently open
      if (viewingOrder && viewingOrder.id === id) {
        setViewingOrder({ ...viewingOrder, orderStatus: newStatus });
      }
      return true;
    }
    return false;
  };

  const handleConfirmDelete = async () => {
    if (!deletingOrder) return;
    const result = await dispatch(deleteAdminOrder(deletingOrder.id));
    if (result && result.success) {
      dispatch(syncDashboardStats());
      setDeletingOrder(null);
      if (viewingOrder && viewingOrder.id === deletingOrder.id) {
        setViewingOrder(null);
      }
    }
  };

  // KPIs
  const totalOrdersCount = orders.length;

  // Today's Orders calculation
  const todayOrders = useMemo(() => {
    const today = new Date();
    return orders.filter((o) => {
      if (!o.createdAt) return false;
      const orderDate = new Date(o.createdAt);
      return (
        orderDate.getDate() === today.getDate() &&
        orderDate.getMonth() === today.getMonth() &&
        orderDate.getFullYear() === today.getFullYear()
      );
    });
  }, [orders]);

  const todayOrdersCount = todayOrders.length;
  const todayRevenue = todayOrders
    .filter((o) => o.orderStatus !== "Cancelled")
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  const pendingOrdersCount = orders.filter(
    (o) => o.orderStatus === "Pending" || o.orderStatus === "Preparation"
  ).length;
  const deliveredOrdersCount = orders.filter(
    (o) => o.orderStatus === "Delivered"
  ).length;
  const totalRevenue = orders
    .filter((o) => o.orderStatus !== "Cancelled")
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  // Filter & Sort
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        // Search
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchId = order.id?.toLowerCase().includes(q);
          const matchUser = order.User?.username?.toLowerCase().includes(q);
          const matchEmail = order.User?.email?.toLowerCase().includes(q);
          const matchPhone = order.phoneNumber?.toLowerCase().includes(q);
          const matchAddress = order.shippingAddress?.toLowerCase().includes(q);
          const matchProduct = order.OrderDetails?.some((item) =>
            item.Product?.productName?.toLowerCase().includes(q)
          );
          if (
            !matchId &&
            !matchUser &&
            !matchEmail &&
            !matchPhone &&
            !matchAddress &&
            !matchProduct
          ) {
            return false;
          }
        }

        // Date filter (Today's Orders)
        if (dateFilter === "TODAY") {
          if (!order.createdAt) return false;
          const orderDate = new Date(order.createdAt);
          const today = new Date();
          if (
            orderDate.getDate() !== today.getDate() ||
            orderDate.getMonth() !== today.getMonth() ||
            orderDate.getFullYear() !== today.getFullYear()
          ) {
            return false;
          }
        }

        // Status Filter
        if (selectedStatus === "ACTION_REQUIRED") {
          if (order.orderStatus !== "Pending" && order.orderStatus !== "Preparation") {
            return false;
          }
        } else if (selectedStatus !== "ALL" && order.orderStatus !== selectedStatus) {
          return false;
        }

        // Payment Status Filter
        if (selectedPayment !== "ALL") {
          const pStatus = order.Payment?.paymentStatus || "Pending";
          if (pStatus !== selectedPayment) {
            return false;
          }
        }

        // Payment Method Filter
        if (selectedMethod !== "ALL") {
          const pMethod = (order.Payment?.paymentMethod || "COD").toUpperCase();
          if (pMethod !== selectedMethod.toUpperCase()) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          );
        }
        if (sortBy === "oldest") {
          return (
            new Date(a.createdAt || 0).getTime() -
            new Date(b.createdAt || 0).getTime()
          );
        }
        if (sortBy === "amount_desc") {
          return Number(b.totalAmount || 0) - Number(a.totalAmount || 0);
        }
        if (sortBy === "amount_asc") {
          return Number(a.totalAmount || 0) - Number(b.totalAmount || 0);
        }
        return 0;
      });
  }, [orders, searchTerm, selectedStatus, selectedPayment, selectedMethod, dateFilter, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const loading = status === Status.LOADING;

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E6540B]/10 text-[#E6540B] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1A1613] sm:text-3xl">
              Order Management
            </h1>
          </div>
          <p className="mt-1 text-xs text-[#1A1613]/60 sm:text-sm">
            Track customer orders, manage fulfilment statuses, and inspect payment transactions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#1A1613]/15 bg-[#FFFDF8] px-4 py-2 text-xs font-semibold text-[#1A1613] shadow-xs hover:bg-[#F4EEDF] transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                loading ? "animate-spin text-[#E6540B]" : ""
              }`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Orders */}
        <div
          onClick={handleResetFilters}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
            !isFiltered
              ? "border-[#E6540B]/40 bg-[#FFFDF8] shadow-xs"
              : "border-[#1A1613]/10 bg-[#FFFDF8] shadow-xs hover:border-[#E6540B]/40"
          }`}
          title="Click to reset filters and view all orders"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#1A1613]/60">
              Total Orders
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#E6540B]/10 text-[#E6540B] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#1A1613]">
              {loading ? "..." : totalOrdersCount}
            </span>
            <span className="text-[11px] text-[#1A1613]/40">lifetime</span>
          </div>
        </div>

        {/* Today's Orders */}
        <div
          onClick={() => {
            if (dateFilter === "TODAY") {
              setDateFilter("ALL");
            } else {
              setDateFilter("TODAY");
              setCurrentPage(1);
            }
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
            dateFilter === "TODAY"
              ? "border-blue-500 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20"
              : "border-[#1A1613]/10 bg-[#FFFDF8] shadow-xs hover:border-blue-400 hover:shadow-xs"
          }`}
          title="Click to filter orders placed today"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#1A1613]/60">
              Today's Orders
            </span>
            <div className="flex items-center gap-1.5">
              {dateFilter === "TODAY" && (
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/90 px-1.5 py-0.5 rounded-md">
                  Filtered
                </span>
              )}
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-700">
              {loading ? "..." : todayOrdersCount}
            </span>
            <span className="text-[11px] text-[#1A1613]/40">
              {todayRevenue > 0 ? `Rs. ${todayRevenue.toLocaleString()}` : "today"}
            </span>
          </div>
        </div>

        {/* Pending & In Preparation */}
        <div
          onClick={() => {
            if (selectedStatus === "ACTION_REQUIRED") {
              setSelectedStatus("ALL");
            } else {
              setSelectedStatus("ACTION_REQUIRED");
              setCurrentPage(1);
            }
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
            selectedStatus === "ACTION_REQUIRED"
              ? "border-amber-500 bg-amber-50/50 shadow-sm ring-2 ring-amber-500/20"
              : "border-[#1A1613]/10 bg-[#FFFDF8] shadow-xs hover:border-amber-400 hover:shadow-xs"
          }`}
          title="Click to filter pending and in-preparation orders"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#1A1613]/60">
              Action Required
            </span>
            <div className="flex items-center gap-1.5">
              {selectedStatus === "ACTION_REQUIRED" && (
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/90 px-1.5 py-0.5 rounded-md">
                  Filtered
                </span>
              )}
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700">
              {loading ? "..." : pendingOrdersCount}
            </span>
            <span className="text-[11px] text-[#1A1613]/40">
              pending / prep
            </span>
          </div>
        </div>

        {/* Delivered Orders */}
        <div
          onClick={() => {
            if (selectedStatus === "Delivered") {
              setSelectedStatus("ALL");
            } else {
              setSelectedStatus("Delivered");
              setCurrentPage(1);
            }
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
            selectedStatus === "Delivered"
              ? "border-emerald-500 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/20"
              : "border-[#1A1613]/10 bg-[#FFFDF8] shadow-xs hover:border-emerald-400 hover:shadow-xs"
          }`}
          title="Click to filter delivered orders"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#1A1613]/60">
              Delivered Orders
            </span>
            <div className="flex items-center gap-1.5">
              {selectedStatus === "Delivered" && (
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded-md">
                  Filtered
                </span>
              )}
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">
              {loading ? "..." : deliveredOrdersCount}
            </span>
            <span className="text-[11px] text-[#1A1613]/40">completed</span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="p-4 rounded-2xl border border-[#1A1613]/10 bg-[#FFFDF8] shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#1A1613]/60">
              Total Order Volume
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-[#E6540B] truncate">
              {loading ? "..." : `Rs. ${totalRevenue.toLocaleString()}`}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Orders Container & Filter Bar */}
      <div className="rounded-xl border border-[#1A1613]/10 bg-[#FFFDF8] shadow-xs overflow-hidden">
        {/* Filter Controls */}
        <div className="p-4 sm:p-5 border-b border-[#1A1613]/10 space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1A1613]/40 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by ID, customer, product, email, address..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-10 pl-10 pr-9 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] text-xs text-[#1A1613] placeholder:text-[#1A1613]/40 focus:outline-none focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1A1613]/40 hover:text-[#1A1613]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 min-w-[125px] sm:flex-initial sm:min-w-0 h-9 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] px-3 text-xs font-medium text-[#1A1613] focus:outline-none focus:border-[#E6540B]"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTION_REQUIRED">Action Required (Pending/Prep)</option>
                <option value="Pending">Pending</option>
                <option value="Preparation">Preparation</option>
                <option value="In Transit">In Transit</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              {/* Payment Status Filter */}
              <select
                value={selectedPayment}
                onChange={(e) => {
                  setSelectedPayment(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 min-w-[125px] sm:flex-initial sm:min-w-0 h-9 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] px-3 text-xs font-medium text-[#1A1613] focus:outline-none focus:border-[#E6540B]"
              >
                <option value="ALL">All Payments</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Payment Pending</option>
                <option value="Failed">Payment Failed</option>
              </select>

              {/* Payment Method Filter */}
              <select
                value={selectedMethod}
                onChange={(e) => {
                  setSelectedMethod(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 min-w-[125px] sm:flex-initial sm:min-w-0 h-9 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] px-3 text-xs font-medium text-[#1A1613] focus:outline-none focus:border-[#E6540B]"
              >
                <option value="ALL">All Methods</option>
                <option value="KHALTI">Khalti</option>
                <option value="ESEWA">eSewa</option>
                <option value="COD">COD</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 min-w-[125px] sm:flex-initial sm:min-w-0 h-9 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] px-3 text-xs font-medium text-[#1A1613] focus:outline-none focus:border-[#E6540B]"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="amount_desc">Amount: High to Low</option>
                <option value="amount_asc">Amount: Low to High</option>
              </select>

              {/* Reset Filter Button */}
              {isFiltered && (
                <button
                  onClick={handleResetFilters}
                  className="h-9 px-3 rounded-lg border border-dashed border-[#1A1613]/25 text-xs font-semibold text-[#1A1613]/70 hover:text-[#E6540B] hover:border-[#E6540B] transition-colors"
                  title="Reset all search & filters"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4. Table */}
        <OrderTable
          orders={paginatedOrders}
          loading={loading}
          onView={(ord) => setViewingOrder(ord)}
          onOpenStatusModal={(ord) => setStatusOrder(ord)}
          onDelete={(ord) => setDeletingOrder(ord)}
          onCopyId={handleCopyId}
          copiedId={copiedId}
          formatDate={formatDate}
        />

        {/* 5. Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-[#1A1613]/10 text-xs text-[#1A1613]/60 bg-[#FDF8ED]/30">
          <div>
            {loading ? (
              <div className="h-3.5 w-32 rounded bg-[#1A1613]/10 animate-pulse" />
            ) : filteredOrders.length === 0 ? (
              "Showing 0 orders"
            ) : (
              `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(
                currentPage * pageSize,
                filteredOrders.length
              )} of ${filteredOrders.length} order${
                filteredOrders.length === 1 ? "" : "s"
              }`
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={loading || currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[#1A1613]/15 text-[#1A1613] hover:bg-[#F4EEDF] disabled:opacity-40 transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              if (
                totalPages > 5 &&
                pageNum !== 1 &&
                pageNum !== totalPages &&
                Math.abs(pageNum - currentPage) > 1
              ) {
                if (Math.abs(pageNum - currentPage) === 2) {
                  return (
                    <span key={`dots-${pageNum}`} className="px-1 text-[#1A1613]/40">
                      ...
                    </span>
                  );
                }
                return null;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-semibold transition-all ${
                    currentPage === pageNum
                      ? "bg-[#E6540B] text-white shadow-xs"
                      : "border border-[#1A1613]/15 text-[#1A1613] hover:bg-[#F4EEDF]"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              disabled={loading || currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-[#1A1613]/15 text-[#1A1613] hover:bg-[#F4EEDF] disabled:opacity-40 transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. Modals */}
      <OrderViewModal
        order={viewingOrder}
        onClose={() => setViewingOrder(null)}
        onOpenStatusModal={(ord) => setStatusOrder(ord)}
        onCopyId={handleCopyId}
        copiedId={copiedId}
        formatDate={formatDate}
      />

      <OrderStatusModal
        isOpen={Boolean(statusOrder)}
        order={statusOrder}
        onClose={() => setStatusOrder(null)}
        onSubmit={handleUpdateStatus}
        loading={actionLoading}
      />

      <OrderDeleteModal
        order={deletingOrder}
        onClose={() => setDeletingOrder(null)}
        onConfirm={handleConfirmDelete}
        loading={actionLoading}
      />
    </div>
  );
};

export default OrderManagement;
