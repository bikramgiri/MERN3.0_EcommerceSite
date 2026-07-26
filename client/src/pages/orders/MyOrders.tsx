import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import {
  deleteMyOrders,
  fetchMyOrder,
} from "../../store/customer/checkoutSlice";
import { Loader2, Search, Trash } from "lucide-react";
import { OrderStatus } from "../../types/checkoutTypes";
import { toast } from "react-toastify";
import axios from "axios";
import { Status } from "../../global/statuses";

interface ApiErrorPayload {
  field?: string;
  message?: string;
}

const MyOrders = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { myOrder: orders, status } = useAppSelector((state) => state.checkout);
  const [selectedItem, setSelectedItem] = useState("all-orders");
  const [selectedTime, setSelectedTime] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [date, setDate] = useState("");
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    dispatch(fetchMyOrder());
  }, [dispatch]);

  const [, setErrors] = useState({
    userId: "",
    orderId: "",
    order: "",
    orderStatus: "",
    general: "",
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil((orders ? orders.length : 0) / itemsPerPage);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = orders
    ? orders.slice(indexOfFirstItem, indexOfLastItem)
    : [];

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const filteredOrders =
    selectedItem === "all-orders"
      ? currentOrders
      : currentOrders.filter((order) => order.orderStatus === selectedItem);

  const timeFilteredOrders = filteredOrders.filter((order) => {
    const orderDate = new Date(order.createdAt);
    const now = new Date();

    switch (selectedTime) {
      case "today":
        return orderDate >= new Date(now.setHours(0, 0, 0, 0));
      case "this-week":
        return orderDate >= new Date(now.setDate(now.getDate() - now.getDay()));
      case "this-month":
        return orderDate >= new Date(now.getFullYear(), now.getMonth(), 1);
      case "last-3-months":
        return orderDate >= new Date(now.setMonth(now.getMonth() - 3));
      case "last-6-months":
        return orderDate >= new Date(now.setMonth(now.getMonth() - 6));
      case "this-year":
        return orderDate >= new Date(now.getFullYear(), 0, 1);
      default:
        return true;
    }
  });

  const searchedOrders = timeFilteredOrders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.Payment?.paymentMethod
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ??
        false) ||
      (order.Payment?.paymentStatus
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ??
        false) ||
      order.orderStatus.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.totalAmount.toString().includes(searchTerm) ||
      formatDate(order.createdAt)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  const dateFilteredOrders = searchedOrders.filter((order) => {
    const orderDate = new Date(order.createdAt);
    const selectedDate = new Date(date);
    return date
      ? orderDate.toDateString() === selectedDate.toDateString()
      : true;
  });

  const handleDeleteOrder = async (id: string) => {
    if (deletingIds.has(id)) return;

    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await dispatch(deleteMyOrders(id));
      toast.success("Order deleted successfully!");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errData = error.response?.data as ApiErrorPayload | undefined;
        const httpStatus = error.response?.status;

        if (
          errData &&
          httpStatus !== undefined &&
          httpStatus >= 400 &&
          httpStatus < 500
        ) {
          const field = errData.field;
          const msg = errData.message || "Validation error";

          if (
            field &&
            ["userId", "orderId", "order", "orderStatus", "general"].includes(
              field,
            )
          ) {
            setErrors((prev) => ({ ...prev, [field]: msg }));
            toast.error(msg);
          } else {
            setErrors((prev) => ({ ...prev, general: msg }));
            toast.error(msg);
          }
        }
      }
      setErrors((prev) => ({
        ...prev,
        general: "Something went wrong. Please try again.",
      }));
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (!orders || status === Status.LOADING) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FDF8ED] to-[#FAF3E4]">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-[#E6540B] mx-auto mb-4" />
          <p className="text-xl text-[#1A1613]/70">Loading my orders.....</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!orders || orders.length === 0 ? (
        <section className="py-30 bg-[#FDF8ED]">
          <div className="max-w-[1500px] mx-auto px-4 text-center">
            <h1 className="font-['Fraunces',serif] text-4xl font-semibold text-[#1A1613] mb-6">
              Your Orders are Empty
            </h1>
            <p className="text-lg text-[#1A1613]/60 mb-10">
              Looks like you haven't placed any orders yet.
            </p>
          </div>
        </section>
      ) : (
        <section className="bg-gradient-to-br from-[#FDF8ED] to-[#FAF3E4] min-h-screen py-12 antialiased font-['Inter',sans-serif]">
          <div className="mt-8 max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[#FDF8ED] rounded-xl shadow-md border border-[#1A1613]/10 p-6 overflow-hidden">
              <div className="border-b border-[#1A1613]/10 bg-[#F4EEDF] p-6 md:p-8">
                <h2 className="font-['Fraunces',serif] text-3xl md:text-4xl font-semibold text-[#1A1613] justify-center flex items-center">
                  My Orders
                </h2>
              </div>

              <div className="p-6 border-b border-[#1A1613]/10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <select
                    value={selectedItem}
                    onChange={(e) => setSelectedItem(e.target.value)}
                    className="cursor-pointer px-4 py-3 border border-[#1A1613]/15 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E6540B] bg-[#FDF8ED] text-[#1A1613]"
                  >
                    <option value="all-orders">All Orders</option>
                    <option value="Pending">Pending</option>
                    <option value="Delivered">Delivered</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Preparation">Preparation</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>

                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="cursor-pointer px-4 py-3 border border-[#1A1613]/15 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E6540B] bg-[#FDF8ED] text-[#1A1613]"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="this-week">This Week</option>
                    <option value="this-month">This Month</option>
                    <option value="last-3-months">Last 3 Months</option>
                    <option value="last-6-months">Last 6 Months</option>
                    <option value="this-year">This Year</option>
                  </select>

                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="cursor-pointer px-4 py-3 border border-[#1A1613]/15 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E6540B] bg-[#FDF8ED] text-[#1A1613]"
                  />

                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search orders..."
                      className="w-full pl-12 pr-4 py-3 border border-[#1A1613]/15 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E6540B] bg-[#FDF8ED] text-[#1A1613] placeholder:text-[#1A1613]/40"
                    />
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1613]/40" />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#F4EEDF] border-b border-[#1A1613]/10">
                    <tr className="text-[#1A1613]/60 uppercase tracking-wider text-xs font-['IBM_Plex_Mono',monospace] font-semibold">
                      <th className="py-4 px-4 text-center">Order ID</th>
                      <th className="py-4 px-4 text-center">Date</th>
                      <th className="py-4 px-4 text-center">Total Amount</th>
                      <th className="py-4 px-4 text-center">Order Status</th>
                      <th className="py-4 px-4 text-center">Payment Method</th>
                      <th className="py-4 px-4 text-center">Payment Status</th>
                      <th className="py-4 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dateFilteredOrders.map((order) => {
                      const isDeleting = deletingIds.has(order.id);

                      return (
                        <tr
                          key={order.id}
                          className="bg-[#FDF8ED] border-b border-[#1A1613]/10 hover:bg-[#F4EEDF] transition-colors"
                        >
                          <td className="py-4 px-4 text-center font-medium text-[#1A1613]/80">
                            {order.id}
                          </td>
                          <td className="py-4 px-4 font-medium text-center text-[#1A1613]/80">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="py-4 px-4 font-['IBM_Plex_Mono',monospace] font-bold text-center text-[#8A3B12]">
                            NPR {order.totalAmount}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                order.orderStatus === OrderStatus.Pending
                                  ? "bg-[#F4EEDF] text-[#8A3B12] border border-[#8A3B12]/20"
                                  : order.orderStatus ===
                                      OrderStatus.Preparation
                                    ? "bg-[#E6540B]/10 text-[#E6540B] border border-[#E6540B]/20"
                                    : order.orderStatus ===
                                        OrderStatus.Cancelled
                                      ? "bg-[#9B3A2E]/10 text-[#9B3A2E] border border-[#9B3A2E]/20"
                                      : order.orderStatus ===
                                          OrderStatus.InTransit
                                        ? "bg-[#1A1613]/10 text-[#1A1613]/70 border border-[#1A1613]/20"
                                        : order.orderStatus ===
                                            OrderStatus.Delivered
                                          ? "bg-[#9B3A2E]/15 text-[#9B3A2E] border border-[#9B3A2E]/30"
                                          : "bg-[#1A1613]/10 text-[#1A1613]/70"
                              }`}
                            >
                              {order.orderStatus}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center font-medium text-[#1A1613]/80">
                            {order.Payment?.paymentMethod || "N/A"}
                          </td>
                          <td className="py-4 px-4 text-center font-medium text-[#1A1613]/80">
                            {order.Payment?.paymentStatus || "Pending"}
                          </td>
                          <td className="py-4 px-4 flex justify-center space-x-2">
                            <button
                              onClick={() => {
                                navigate(`/my-orders/orderdetails/${order.id}`);
                              }}
                              className="cursor-pointer px-4 py-2 bg-[#E6540B] text-[#FDF8ED] rounded-md hover:bg-[#c94806] transition-colors font-semibold"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              disabled={isDeleting}
                              className="cursor-pointer px-4 py-2 bg-[#9B3A2E] text-[#FDF8ED] rounded-md hover:bg-[#7a2e24] disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-semibold min-w-[110px] flex items-center justify-center"
                            >
                              {isDeleting ? (
                                <>
                                  <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash className="inline-block w-4 h-4 mr-1 mb-0.5" />
                                  Delete
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="px-6 py-4 bg-[#F4EEDF] border-t border-[#1A1613]/10">
                  <div className="flex justify-center">
                    <nav className="flex items-center gap-2">
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="cursor-pointer p-2 rounded-lg bg-[#FDF8ED] border border-[#1A1613]/15 hover:bg-[#F4EEDF] disabled:opacity-50 disabled:cursor-not-allowed transition text-[#1A1613]"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            onClick={() => paginate(page)}
                            className={`cursor-pointer w-10 h-10 rounded-lg font-medium transition ${
                              currentPage === page
                                ? "bg-[#E6540B] text-[#FDF8ED]"
                                : "bg-[#FDF8ED] border border-[#1A1613]/15 hover:bg-[#F4EEDF] text-[#1A1613]"
                            }`}
                          >
                            {page}
                          </button>
                        ),
                      )}

                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="cursor-pointer p-2 rounded-lg bg-[#FDF8ED] border border-[#1A1613]/15 hover:bg-[#F4EEDF] disabled:opacity-50 disabled:cursor-not-allowed transition text-[#1A1613]"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default MyOrders;
