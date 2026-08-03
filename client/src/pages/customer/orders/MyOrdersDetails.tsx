import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../hooks/hooks";
import {
  cancelMyOrders,
  deleteMyOrders,
  fetchMySingleOrder,
} from "../../../store/customer/checkoutSlice";
import { Loader2, PenBoxIcon, Trash, X } from "lucide-react";
import QRCode from "react-qr-code";
import { OrderStatus } from "../../../types/customer/checkoutTypes";
import Breadcrumb from "../../../global/Breadcrumb";
import { getAverageRatingNumber } from "../../../utils/helpers";
import { toast } from "react-toastify";
import axios from "axios";

interface ApiErrorPayload {
  field?: string;
  message?: string;
}

const MyOrdersDetails = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>();
  const { singleOrder } = useAppSelector((state) => state.checkout);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [cancelingIds, setCancelingIds] = useState<Set<string>>(new Set());

  const [, setErrors] = useState({
    userId: "",
    orderId: "",
    order: "",
    orderStatus: "",
    general: "",
  });

  useEffect(() => {
    if (id) {
      dispatch(fetchMySingleOrder(id));
    }
  }, [dispatch, id]);

  const items = singleOrder?.OrderDetails ?? [];

  const totalProductAmount = items.reduce((sum, item) => {
    return sum + (item.Product?.productPrice || 0) * item.quantity;
  }, 0);

  const shipping = 50;
  const grandTotal = totalProductAmount + shipping;

  const adminOrderPageUrl = `http://localhost:5174/admin/orders/${id}`;

  const handleCancelOrder = async (id: string) => {
    if (cancelingIds.has(id)) return;

    setCancelingIds((prev) => new Set(prev).add(id));
    try {
      await dispatch(cancelMyOrders(id));
      toast.success("Order cancelled successfully!");
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
      setCancelingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

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

  const isDeleting = deletingIds.has(singleOrder?.id as string);
  const isCanceling = cancelingIds.has(singleOrder?.id as string);

  // if (status !== Status.SUCCESS) {
  //   return (
  //     <section className="min-h-screen bg-gradient-to-br from-[#FDF8ED] to-[#FAF3E4] flex items-center justify-center">
  //       <div className="text-center">
  //         <Loader2 className="w-16 h-16 animate-spin text-[#E6540B] mx-auto mb-4" />
  //         <p className="text-xl text-[#1A1613]/70">Loading order details...</p>
  //       </div>
  //     </section>
  //   );
  // }

  if (!singleOrder) {
    return (
      <section className="min-h-screen bg-gradient-to-br from-[#FDF8ED] to-[#FAF3E4] py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-['Fraunces',serif] font-bold text-[#1A1613] mb-6">
            Order Not Found
          </h1>
          <p className="text-lg text-[#1A1613]/70 mb-10">
            We couldn't find the order you're looking for.
          </p>
          <button
            onClick={() => navigate("/my-orders")}
            className="inline-block px-10 py-4 bg-[#E6540B] text-[#FDF8ED] text-lg font-semibold rounded-xl hover:bg-[#c94806] transition shadow-lg"
          >
            Back to My Orders
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gradient-to-br from-[#FDF8ED] to-[#FAF3E4] min-h-screen py-12 antialiased">
      <div className="mt-6 max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-10">
          <Breadcrumb
            items={[
              { label: "My Orders", href: "/my-orders" },
              { label: "Order Details" },
            ]}
          />
        </div>

        <div className="bg-[#FDF8ED] rounded-xl shadow-md overflow-hidden border border-[#1A1613]/10">
          <div className="bg-gradient-to-r from-[#E6540B] to-[#9B3A2E] p-4 md:p-4">
            <h2 className="text-3xl md:text-4xl font-['Fraunces',serif] font-bold text-[#FDF8ED] text-center">
              Order Details
            </h2>
            <p className="text-center text-[#FDF8ED]/90 mt-2 text-lg">
              Order ID: <span className="font-semibold">{id}</span>
            </p>
            <p className="text-center text-[#FDF8ED]/80 mt-1">
              Placed on{" "}
              {new Date(singleOrder?.createdAt).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-8">
            <div className="bg-[#FDF8ED] rounded-xl p-6 md:p-8 border border-[#1A1613]/10 shadow-sm hover:shadow-lg hover:border-[#E6540B]/40 transition-all duration-500">
              <h3 className="text-2xl font-['Fraunces',serif] font-bold text-[#1A1613] mb-6">
                Ordered Products
              </h3>
              <div className="rounded-xl">
                {items.map((item) => {
                  const avgRating = getAverageRatingNumber(
                    item.Product?.reviews,
                  );
                  const reviewCount = item.Product?.reviews?.length || 0;

                  return (
                    <div
                      key={item.productId}
                      className="flex flex-col sm:flex-row items-start gap-6 bg-[#F4EEDF] rounded-lg p-6 shadow-sm border border-[#1A1613]/10 mb-4"
                    >
                      <img
                        src={item.Product.productImage}
                        alt={item.Product.productName}
                        className="w-full sm:w-32 sm:h-32 object-cover rounded-lg shadow-md"
                      />

                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/productdetails/${item.productId}`}
                          className="block text-lg sm:text-2xl font-['Fraunces',serif] font-bold text-[#1A1613] hover:text-[#E6540B] transition truncate"
                        >
                          {item.Product.productName}
                        </Link>

                        <div className="flex items-center gap-1 mt-1 justify-between">
                          <div className="flex items-center gap-1">
                            {reviewCount > 0 ? (
                              <>
                                {[...Array(5)].map((_, i) => (
                                  <svg
                                    key={i}
                                    className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                      i < Math.round(Number(avgRating))
                                        ? "text-[#E6540B]"
                                        : "text-[#1A1613]/15"
                                    }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                                <span className="ml-1 text-sm font-medium text-[#1A1613]/80">
                                  {avgRating}
                                </span>
                                <span className="text-sm text-[#1A1613]/50">
                                  ({reviewCount})
                                </span>
                              </>
                            ) : (
                              <>
                                <svg
                                  className="w-4 h-4 sm:w-5 sm:h-5 text-[#1A1613]/15"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="ml-1 text-sm font-medium text-[#1A1613]/80">
                                  0.0
                                </span>
                                <span className="text-sm text-[#1A1613]/50">
                                  (0)
                                </span>
                              </>
                            )}
                          </div>
                          <p className="font-md text-[#1A1613]/80">
                            Quantity:{" "}
                            <span className="font-md">{item.quantity}</span>
                          </p>
                        </div>

                        <p className="text-base sm:text-lg font-['IBM_Plex_Mono',monospace] font-bold text-[#8A3B12] mt-1">
                          Rs. {item.Product.productPrice}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#FDF8ED] rounded-xl p-6 md:p-8 border border-[#1A1613]/10 shadow-sm hover:shadow-lg hover:border-[#E6540B]/40 transition-all duration-500">
              <h3 className="text-2xl font-['Fraunces',serif] font-bold text-[#1A1613] mb-6">
                Order Summary
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between text-lg">
                  <span className="text-[#1A1613]/60">Subtotal</span>
                  <span className="font-semibold font-['IBM_Plex_Mono',monospace]">
                    NPR {totalProductAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-[#1A1613]/60">Shipping</span>
                  <span className="font-semibold text-[#9B3A2E] font-['IBM_Plex_Mono',monospace]">
                    NPR {shipping}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-medium pt-4 border-t border-[#1A1613]/10">
                  <span>Total Amount</span>
                  <span className="text-[#8A3B12] font-['IBM_Plex_Mono',monospace]">
                    NPR {grandTotal.toFixed(2)}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#1A1613]/60">Order Status</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        singleOrder?.orderStatus === "Pending"
                          ? "bg-[#E6540B]/10 text-[#E6540B]"
                          : singleOrder?.orderStatus === "Delivered"
                            ? "bg-green-100 text-green-800"
                            : singleOrder?.orderStatus === "Cancelled"
                              ? "bg-red-100 text-red-800"
                              : singleOrder?.orderStatus === "Preparation"
                                ? "bg-[#9B3A2E]/10 text-[#9B3A2E]"
                                : "bg-[#1A1613]/10 text-[#1A1613]"
                      }`}
                    >
                      {singleOrder?.orderStatus}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[#1A1613]/60">Payment Method</span>
                    <span className="font-medium">
                      {singleOrder?.Payment?.paymentMethod || "N/A"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[#1A1613]/60">Payment Status</span>
                    <span
                      className={`font-medium ${
                        singleOrder?.Payment?.paymentStatus === "Paid"
                          ? "text-green-600"
                          : "text-[#E6540B]"
                      }`}
                    >
                      {singleOrder?.Payment?.paymentStatus || "Pending"}
                    </span>
                  </div>

                  <h4 className="border-t border-[#1A1613]/10 pt-4 text-xl font-['Fraunces',serif] font-bold text-[#1A1613]">
                    Customer Details
                  </h4>

                  <div className="flex justify-between">
                    <span className="text-[#1A1613]/60">Phone</span>
                    <span className="font-medium">
                      {singleOrder.phoneNumber}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[#1A1613]/60">Shipping Address</span>
                    <span className="font-medium text-right max-w-xs">
                      {singleOrder?.shippingAddress}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="mb-4 rounded-xl p-4 md:p-4 text-center bg-[#F4EEDF] border border-[#1A1613]/10 shadow-sm hover:shadow-lg transition-all duration-500 mx-6 lg:mx-8">
            <h3 className="text-xl font-['Fraunces',serif] font-semibold text-[#1A1613]">
              Scan QR for Admin View
            </h3>
            <div className="inline-block p-4 bg-[#FDF8ED] rounded-xl shadow-lg mt-3 border border-[#1A1613]/10">
              <QRCode value={adminOrderPageUrl} size={180} />
            </div>
          </div>

          {/* Actions Section */}
          <div className="mb-4 rounded-xl p-4 md:p-4 bg-[#FDF8ED] border-t border-[#1A1613]/10 mx-6 lg:mx-8">
            <div className="max-w-xl mx-auto flex flex-col sm:flex-row gap-4 justify-center">
              {singleOrder?.orderStatus === OrderStatus.Pending && (
                <>
                  <button
                    onClick={() => handleCancelOrder(singleOrder.id)}
                    disabled={isCanceling}
                    className="cursor-pointer px-8 py-3 bg-[#E6540B] text-[#FDF8ED] rounded-xl hover:bg-[#c94806] transition font-semibold"
                  >
                    {isCanceling ? (
                      <>
                        <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <X className="inline-block w-5 h-5 mr-2" />
                        Cancel Order
                      </>
                    )}
                  </button>

                  <button
                    onClick={() =>
                      navigate(`/my-orders/orderdetails/editorders/${id}`)
                    }
                    className="cursor-pointer px-8 py-3 bg-transparent border-2 border-[#9B3A2E] text-[#9B3A2E] rounded-xl hover:bg-[#9B3A2E]/10 transition font-semibold"
                  >
                    <PenBoxIcon className="inline-block w-5 h-5 mr-2" />
                    Edit Order
                  </button>
                </>
              )}

              <button
                onClick={() => handleDeleteOrder(singleOrder.id)}
                disabled={isDeleting}
                className="cursor-pointer px-8 py-3 bg-red-700 text-[#FDF8ED] rounded-xl hover:bg-red-800 transition font-semibold"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash className="inline-block w-5 h-5 mr-2" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MyOrdersDetails;
