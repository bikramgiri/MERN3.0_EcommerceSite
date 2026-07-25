import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import {
  editMyOrders,
  fetchMySingleOrder,
} from "../../store/customer/checkoutSlice";
import { fetchProducts } from "../../store/customer/productSlice";
import { Minus, PenBoxIcon, Plus, Loader2 } from "lucide-react";
import { OrderData, PaymentMethod } from "../../types/checkoutTypes";
import { toast } from "react-toastify";
import axios from "axios";
import Breadcrumb from "../../global/components/Breadcrumb";

interface ApiErrorPayload {
  field?: string;
  message?: string;
}

interface Category {
  categoryName: string;
}

interface EditableOrderItem {
  productId: string;
  productImage: string;
  productName: string;
  productPrice: number;
  quantity: number;
  category: Category;
}

interface EditFormData {
  items: EditableOrderItem[];
  totalAmount: number;
  shippingAddress: string;
  paymentDetails: { paymentMethod: PaymentMethod };
  phoneNumber: string;
}

const EditMyOrders = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>();
  const { singleOrder } = useAppSelector((state) => state.checkout);
  const { product: products } = useAppSelector((state) => state.product);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState({
    userId: "",
    orderId: "",
    phoneNumber: "",
    shippingAddress: "",
    totalAmount: "",
    order: "",
    products: "",
    paymentMethod: "",
    payment: "",
    orderStatus: "",
    general: "",
  });

  useEffect(() => {
    if (id) {
      dispatch(fetchMySingleOrder(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const orderInfo = singleOrder;

  const initialFormData: EditFormData = useMemo(() => {
    if (!orderInfo) {
      return {
        items: [],
        totalAmount: 0,
        shippingAddress: "",
        paymentDetails: { paymentMethod: PaymentMethod.COD },
        phoneNumber: "",
      };
    }

    const orderItems = orderInfo.OrderDetails ?? [];

    return {
      items: orderItems.map((item) => ({
        productId: item.productId,
        productImage: item.Product?.productImage || "",
        productName: item.Product?.productName || "",
        productPrice: item.Product?.productPrice || 0,
        quantity: item.quantity,
        category: item.Product?.category || { categoryName: "Uncategorized" },
      })),
      totalAmount: orderInfo.totalAmount,
      shippingAddress: orderInfo.shippingAddress,
      paymentDetails: {
        paymentMethod: orderInfo.Payment?.paymentMethod ?? PaymentMethod.COD,
      },
      phoneNumber: orderInfo.phoneNumber,
    };
  }, [orderInfo]);

  const [formData, setFormData] = useState<EditFormData>(initialFormData);

  useEffect(() => {
    setTimeout(() => {
      setFormData(initialFormData);
    }, 0);
  }, [initialFormData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "paymentMethod") {
      setFormData((prev) => ({
        ...prev,
        paymentDetails: { paymentMethod: value as PaymentMethod },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setErrors({
      ...errors,
      [name]: "",
      general: "",
    });
  };

  const updateTotalAmount = (updatedItems: EditableOrderItem[]) => {
    const subtotal = updatedItems.reduce(
      (acc: number, item: EditableOrderItem) =>
        acc + item.productPrice * item.quantity,
      0,
    );
    const shipping = 50;
    const total = subtotal + shipping;
    setFormData((prev) => ({
      ...prev,
      totalAmount: total,
      items: updatedItems,
    }));
  };

  const handleQuantityChange = (index: number, delta: number) => {
    const updatedItems = [...formData.items];
    const item = updatedItems[index];
    const product = products.find((p) => p.id === item.productId);
    const maxStock = product?.productStock ?? Infinity;

    const newQuantity = Math.max(1, Math.min(maxStock, item.quantity + delta));
    if (newQuantity !== item.quantity) {
      updatedItems[index] = { ...item, quantity: newQuantity };
      updateTotalAmount(updatedItems);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;
    setErrors({
      ...errors,
      general: "",
    });

    const submitData: OrderData = {
      phoneNumber: formData.phoneNumber,
      shippingAddress: formData.shippingAddress,
      paymentDetails: { paymentMethod: formData.paymentDetails.paymentMethod },
      products: formData.items.map((item: EditableOrderItem) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      totalAmount: formData.totalAmount,
    };

    setIsSubmitting(true);
    try {
      await dispatch(editMyOrders(id, submitData));
      toast.success("Order updated successfully");
      setTimeout(() => {
        navigate(`/my-orders/orderdetails/${id}`);
      }, 2000);
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
            [
              "userId",
              "orderId",
              "order",
              "orderStatus",
              "shippingAddress",
              "totalAmount",
              "products",
              "paymentMethod",
              "payment",
              "general",
            ].includes(field)
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
      setIsSubmitting(false);
    }
  };

  if (!orderInfo) {
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
    <div className="bg-gradient-to-br from-[#FDF8ED] to-[#FAF3E4] min-h-screen py-12 antialiased">
      <div className="mt-6 max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-10">
          <Breadcrumb
            items={[
              { label: "My Orders", href: "/my-orders" },
              { label: "Order Details", href: `/my-orders/orderdetails/${id}` },
              { label: "Edit Order" },
            ]}
          />
        </div>

        <div className="bg-[#FDF8ED] rounded-xl shadow-md overflow-hidden border border-[#1A1613]/10">
          <div className="bg-gradient-to-r from-[#E6540B] to-[#9B3A2E] p-4 md:p-4">
            <h2 className="text-3xl md:text-4xl font-['Fraunces',serif] font-bold text-[#FDF8ED] text-center">
              Order Details
            </h2>
            <p className="text-center text-[#FDF8ED]/90 mt-2 text-lg">
              Edit Order ID: <span className="font-semibold">{id}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
              <div className="bg-[#FDF8ED] rounded-xl p-4 md:p-4 border border-[#1A1613]/10 shadow-sm hover:shadow-lg hover:border-[#E6540B]/40 transition-all duration-500">
                <h3 className="text-2xl font-['Fraunces',serif] font-bold text-[#1A1613] mb-4">
                  Products
                </h3>
                <div className="space-y-6">
                  {formData.items.map(
                    (item: EditableOrderItem, index: number) => {
                      const product = products.find(
                        (p) => p.id === item.productId,
                      );
                      const maxStock = product?.productStock ?? Infinity;

                      return (
                        <div
                          key={index}
                          className="flex flex-col sm:flex-row items-start gap-4 bg-[#F4EEDF] rounded-lg p-4 border border-[#1A1613]/10 shadow-sm hover:shadow-lg hover:border-[#E6540B]/40 transition-all duration-500"
                        >
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-full sm:w-32 sm:h-32 object-cover rounded-lg shadow-md"
                          />

                          <div className="flex-1 w-full">
                            <h4 className="text-xl font-['Fraunces',serif] font-semibold text-[#1A1613]">
                              {item.productName}
                            </h4>
                            <p className="text-md mt-2 text-[#1A1613]/70">
                              Category: {item.category?.categoryName}
                            </p>
                            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="font-medium text-[#1A1613]">
                                  Quantity:
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleQuantityChange(index, -1)
                                  }
                                  disabled={item.quantity <= 1}
                                  className="cursor-pointer p-1.5 rounded border border-[#1A1613]/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FDF8ED]"
                                >
                                  <Minus className="w-4 h-4 text-[#1A1613]" />
                                </button>
                                <span className="w-4 text-center font-bold text-[#1A1613]">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(index, 1)}
                                  disabled={item.quantity >= maxStock}
                                  className="cursor-pointer p-1.5 rounded border border-[#1A1613]/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FDF8ED]"
                                >
                                  <Plus className="w-4 h-4 text-[#1A1613]" />
                                </button>
                              </div>

                              <div className="text-right">
                                <p className="text-lg font-bold font-['IBM_Plex_Mono',monospace] text-[#8A3B12]">
                                  NPR {item.productPrice}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-[#FDF8ED] rounded-xl p-6 md:p-8 border border-[#1A1613]/10 shadow-sm hover:shadow-lg hover:border-[#E6540B]/40 transition-all duration-500">
                <h3 className="text-2xl font-['Fraunces',serif] font-bold mb-6 text-[#1A1613]">
                  Order Summary
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-lg">
                    <span className="text-[#1A1613]/60">Subtotal</span>
                    <span className="font-semibold font-['IBM_Plex_Mono',monospace]">
                      NPR {(formData.totalAmount - 50).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="text-[#1A1613]/60">Shipping</span>
                    <span className="font-semibold text-[#9B3A2E] font-['IBM_Plex_Mono',monospace]">
                      NPR 50
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-medium pt-4 border-t border-[#1A1613]/10">
                    <span className="text-[#1A1613]">Total Amount</span>
                    <span className="text-[#8A3B12] font-['IBM_Plex_Mono',monospace]">
                      NPR {formData.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4 p-6 lg:p-4 rounded-md bg-[#FDF8ED] border border-[#1A1613]/10 shadow-sm hover:shadow-lg hover:border-[#E6540B]/40 transition-all duration-500">
              <div>
                <label className="block text-sm font-medium mb-1 text-[#1A1613]">
                  Payment Method
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentDetails.paymentMethod}
                  onChange={handleChange}
                  className="w-full p-3 border border-[#1A1613]/15 rounded-lg bg-[#F4EEDF] text-[#1A1613] focus:outline-none focus:ring-1 focus:ring-[#E6540B]"
                  required
                >
                  <option value={PaymentMethod.COD}>Cash on Delivery</option>
                  <option value={PaymentMethod.Khalti}>Khalti</option>
                  <option value={PaymentMethod.Esewa}>Esewa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-[#1A1613]">
                  Shipping Address
                </label>
                <input
                  type="text"
                  name="shippingAddress"
                  value={formData.shippingAddress}
                  onChange={handleChange}
                  className="w-full p-3 border border-[#1A1613]/15 rounded-lg bg-[#F4EEDF] text-[#1A1613] focus:outline-none focus:ring-1 focus:ring-[#E6540B]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-[#1A1613]">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full p-3 border border-[#1A1613]/15 rounded-lg bg-[#F4EEDF] text-[#1A1613] focus:outline-none focus:ring-1 focus:ring-[#E6540B]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer w-full py-4 bg-[#E6540B] text-[#FDF8ED] text-lg font-semibold rounded-xl hover:bg-[#c94806] disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 inline-block mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <PenBoxIcon className="w-5 h-5 inline-block mr-2" />
                  Update Order
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditMyOrders;
