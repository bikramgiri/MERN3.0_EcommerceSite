import { useEffect, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { removeFromCart, updateCartItems } from "../../store/customer/cartSlice";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { createOrder } from "../../store/customer/checkoutSlice";
import { ItemsDetails, OrderData, PaymentMethod } from "../../types/checkoutTypes";
import { Status } from "../../global/statuses";
import Breadcrumb from "../../global/components/Breadcrumb";
import { getAverageRatingNumber } from "../../utils/helpers";
import { toast } from "react-toastify";
import axios from "axios";

interface ApiErrorPayload {
  field?: string;
  message?: string;
}

interface CheckoutFormErrors {
  username: string;
  email: string;
  phoneNumber: string;
  shippingAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  general: string;
}

const emptyErrors: CheckoutFormErrors = {
  username: "",
  email: "",
  phoneNumber: "",
  shippingAddress: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  general: "",
};

const CheckOut = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { cart } = useAppSelector((state) => state.cart);
  const { khaltiUrl, esewaUrl, esewaPaymentData, status } = useAppSelector((state) => state.checkout);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.COD);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [data, setData] = useState<OrderData>({
    phoneNumber: "",
    shippingAddress: "",
    totalAmount: 0,
    paymentDetails: {
      paymentMethod: PaymentMethod.COD,
    },
    products: [],
    username: "",
    email: "",
    city: "",
    state: "",
    postalCode: 0,
    country: "Nepal",
    saveData: false,
  });

  const [errors, setErrors] = useState<CheckoutFormErrors>(emptyErrors);

  const handleDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    setData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phoneNumber: string) => {
    const phoneRegex = /^\d{10}$/; 
    return phoneRegex.test(phoneNumber);
  };

  const handleDeleteItem = async (cartId: string) => {
    setRemovingId(cartId);
    try {
      await dispatch(removeFromCart(cartId));
      toast.success("Item removed from cart");
    } finally {
      setRemovingId(null);
    }
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    const quantity = Math.max(1, newQuantity);
    const item = cart.find((i) => i.productId === productId);
    if (!item) return;
    if (quantity > item.product.productStock) return;
    dispatch(updateCartItems({ ...item, quantity }));
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.productPrice * item.quantity,
    0
  );
  const shipping = 50;
  const total = subtotal + shipping;

  const paymentMethods = [
    {
      id: "cod",
      name: "COD",
      value: PaymentMethod.COD,
      icon: (
        <svg className="w-7 h-7 text-[#1A1613]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: "khalti",
      name: "Khalti",
      value: PaymentMethod.Khalti,
      icon: (
        <svg className="w-7 h-7 text-[#5C2D91]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
      ),
    },
    {
      id: "esewa",
      name: "eSewa",
      value: PaymentMethod.Esewa,
      icon: (
        <svg className="w-7 h-7 text-[#3A7D44]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      ),
    },
  ];

  const handlePaymentMethod = (e: ChangeEvent<HTMLInputElement>) => {
    const method = e.target.value as PaymentMethod;
    setPaymentMethod(method);
    setData((prev) => ({
      ...prev,
      paymentDetails: {
        paymentMethod: method,
      },
    }));
  };

  const handlePlaceOrder = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrors(emptyErrors);

    let hasError = false;
    const newError: CheckoutFormErrors = { ...emptyErrors };
    
    const username = data.username ?? "";
    const email = data.email ?? "";
    const phoneNumber = data.phoneNumber ?? "";
    const shippingAddress = data.shippingAddress ?? "";

    if (!username) {
      newError.username = "Name is required";
      hasError = true;
      toast.error(newError.username);
    }

    if (!email) {
      newError.email = "Email is required";
      hasError = true;
      toast.error(newError.email);
    }

    if (!phoneNumber) {
      newError.phoneNumber = "Phone number is required";
      hasError = true;
      toast.error(newError.phoneNumber);
    }

    if (!shippingAddress) {
      newError.shippingAddress = "Shipping address is required";
      hasError = true;
      toast.error(newError.shippingAddress);
    }

    if (hasError) {
      setErrors(newError);
      return;
    }

    if (!validateEmail(email)) {
      newError.email = "Invalid email format";
      hasError = true;
      toast.error(newError.email);
    }

    if (!validatePhoneNumber(phoneNumber)) {
      newError.phoneNumber = "Phone number must be 10 digits";
      hasError = true;
      toast.error(newError.phoneNumber);
    }

    if (hasError) {
      setErrors(newError);
      return;
    }

    const itemsDetails: ItemsDetails[] = cart.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));
    const orderData: OrderData = {
      phoneNumber,
      shippingAddress,
      totalAmount: total,
      paymentDetails: {
        paymentMethod: paymentMethod,
      },
      products: itemsDetails,
    };

    setIsSubmitting(true);

    try {
     const response = await dispatch(createOrder(orderData));
    if (paymentMethod === PaymentMethod.COD) {
      toast.success("Order placed successfully! You will pay on delivery.");
      navigate("/my-orders");
    } else if (paymentMethod === PaymentMethod.Khalti) {
      if (response?.data?.id) localStorage.setItem("orderId", response.data.id);
      if (response?.pidx) localStorage.setItem("khaltiPidx", response.pidx);
      toast.info("Redirecting to Khalti...");
    } else {
      if (response?.data?.id) localStorage.setItem("orderId", response.data.id);
      toast.info("Redirecting to eSewa...");
    }
    } catch (error) {
      setIsSubmitting(false);
      if (axios.isAxiosError(error)) {
        const errData = error.response?.data as ApiErrorPayload | undefined;
        const httpStatus = error.response?.status;

        if (errData && httpStatus !== undefined && httpStatus >= 400 && httpStatus < 500) {
          const field = errData.field as keyof CheckoutFormErrors | undefined;
          const msg = errData.message || "Validation error";

          if (field && field in emptyErrors) {
            setErrors((prev) => ({ ...prev, [field]: msg }));
          } else {
            setErrors((prev) => ({ ...prev, general: msg }));
          }
          toast.error(msg);
          return;
        }
      }
      setErrors((prev) => ({
        ...prev,
        general: "Something went wrong. Please try again.",
      }));
      toast.error("Something went wrong. Please try again.");
    }
  };

  useEffect(() => {
    if (status === Status.ERROR) {
      toast.error("Failed to place the order");
      setTimeout(() => setIsSubmitting(false), 1000);
    }
  }, [status]);

  useEffect(() => {
    if (paymentMethod === PaymentMethod.Khalti && khaltiUrl) {
      const timer = setTimeout(() => {
        window.location.href = khaltiUrl;
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [khaltiUrl, paymentMethod]);

useEffect(() => {
  if (paymentMethod === PaymentMethod.Esewa && esewaUrl && esewaPaymentData) {
    const timer = setTimeout(() => {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = esewaUrl;

      Object.entries(esewaPaymentData).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    }, 1000);
    return () => clearTimeout(timer);
  }
}, [esewaUrl, esewaPaymentData, paymentMethod]);

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-3 border rounded-xl bg-[#FDF8ED] text-[#1A1613] placeholder:text-[#1A1613]/40 focus:outline-none focus:ring-1 transition ${
      hasError
        ? "border-[#9B3A2E]/60 focus:ring-[#9B3A2E]/40"
        : "border-[#1A1613]/15 focus:ring-[#E6540B]/40"
    }`;

  const errorText = (msg: string) =>
    msg ? <p className="text-xs text-[#9B3A2E] mt-1">{msg}</p> : null;

  const cardClass =
    "bg-[#FDF8ED] border border-[#1A1613]/10 rounded-2xl p-6 md:p-8 " +
    "shadow-[0_-4px_25px_-8px_rgba(0,0,0,0.06),0_3px_20px_-8px_rgba(0,0,0,0.04)] " +
    "hover:shadow-[0_-6px_26px_-6px_rgba(0,0,0,0.08),0_8px_16px_-6px_rgba(0,0,0,0.06)] " +
    "transition-shadow duration-500";

  if (cart.length === 0) {
    return (
      <section className="py-16 sm:py-20 bg-[#FDF8ED] font-['Inter',sans-serif]">
        <div className="max-w-[1500px] mx-auto px-4 text-center">
          <Breadcrumb items={[{ label: "Cart", href: "/cart" }, { label: "Checkout" }]} />
          <h1 className="text-3xl sm:text-4xl font-['Fraunces',serif] font-bold text-[#1A1613] mb-4 sm:mb-6">
            Your Cart is Empty
          </h1>
          <p className="text-base sm:text-lg text-[#1A1613]/60 mb-8 sm:mb-10">
            Looks like you haven't added anything yet.
          </p>
          <Link
            to="/"
            className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-[#E6540B] text-[#FDF8ED] font-semibold rounded-xl hover:bg-[#c94806] transition"
          >
            Continue Shopping
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 sm:py-8 md:py-12 bg-[#FDF8ED] pb-16 mt-10 md:pt-18 font-['Inter',sans-serif] text-[#1A1613] antialiased">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-1 mb-4">
          <Breadcrumb items={[{ label: "Cart", href: "/cart" }, { label: "Checkout" }]} />
          <h1 className="text-xl sm:text-2xl md:text-3xl font-['Fraunces',serif] font-bold text-[#1A1613]">
            Checkout
          </h1>
        </div>

        {errors.general && (
          <div className="mb-4 p-3 rounded-xl bg-[#9B3A2E]/10 text-[#9B3A2E] text-sm">
            {errors.general}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <div className="space-y-6">

            <div className={cardClass}>
              <h2 className="text-xl sm:text-2xl font-['Fraunces',serif] font-bold text-[#1A1613] mb-4 sm:mb-6">
                Billing Details
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1A1613] mb-1">Name</label>
                    <input type="text" name="username" value={data.username} onChange={handleDataChange}
                      placeholder="Enter your name" className={inputClass(!!errors.username)} />
                    {errorText(errors.username)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A1613] mb-1">Email Address</label>
                    <input type="email" name="email" value={data.email} onChange={handleDataChange}
                      placeholder="Enter your email" className={inputClass(!!errors.email)} />
                    {errorText(errors.email)}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1A1613] mb-1">Phone Number</label>
                    <input type="text" name="phoneNumber" required value={data.phoneNumber}
                    maxLength={10}
                    onChange={handleDataChange} placeholder="Enter your phone number" className={inputClass(!!errors.phoneNumber)} />
                    {errorText(errors.phoneNumber)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A1613] mb-1">Shipping Address</label>
                    <input type="text" name="shippingAddress" required value={data.shippingAddress}
                      onChange={handleDataChange} placeholder="Enter your shipping address" className={inputClass(!!errors.shippingAddress)} />
                    {errorText(errors.shippingAddress)}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1A1613] mb-1">City</label>
                    <input type="text" name="city" value={data.city} onChange={handleDataChange}
                      placeholder="Enter your city" className={inputClass(!!errors.city)} />
                    {errorText(errors.city)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A1613] mb-1">State/Province</label>
                    <input type="text" name="state" value={data.state} onChange={handleDataChange}
                      placeholder="Enter your state/province" className={inputClass(!!errors.state)} />
                    {errorText(errors.state)}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1A1613] mb-1">Country</label>
                    <select name="country" value={data.country} onChange={handleDataChange} className={inputClass(!!errors.country)}>
                      <option value="">Select your country</option>
                      <option value="Nepal">Nepal</option>
                      <option value="India">India</option>
                      <option value="United States">United States</option>
                      <option value="Australia">Australia</option>
                      <option value="Canada">Canada</option>
                    </select>
                    {errorText(errors.country)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A1613] mb-1">Postal Code</label>
                    <input type="text" name="postalCode" value={data.postalCode} onChange={handleDataChange}
                      placeholder="Enter your postal code" className={inputClass(!!errors.postalCode)} />
                    {errorText(errors.postalCode)}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input type="checkbox" name="saveData" checked={data.saveData} onChange={handleDataChange}
                    className="cursor-pointer w-4 h-4 rounded accent-[#E6540B]" />
                  <label className="text-sm text-[#1A1613]/70">Save this information for next time</label>
                </div>
              </div>
            </div>

            <div className={cardClass}>
              <h2 className="text-xl sm:text-2xl font-['Fraunces',serif] font-bold text-[#1A1613] mb-4 sm:mb-6">
                Payment Method
              </h2>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center p-3 sm:p-4 border rounded-2xl cursor-pointer transition-all duration-200
                      ${paymentMethod === method.value
                        ? "border-[#E6540B]/60 bg-[#E6540B]/5"
                        : "border-[#1A1613]/10 hover:border-[#1A1613]/20 hover:bg-[#F4EEDF]"
                      }
                      ${isSubmitting ? "opacity-60 pointer-events-none" : ""}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      onChange={handlePaymentMethod}
                      checked={paymentMethod === method.value}
                      disabled={isSubmitting}
                      className="w-4 h-4 accent-[#E6540B]"
                    />
                    <div className="ml-4 flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        {method.icon}
                        <span className="text-base sm:text-lg font-medium text-[#1A1613]">
                          {method.name}
                        </span>
                      </div>
                      {paymentMethod === method.value && (
                        <span className="text-sm font-semibold text-[#E6540B]">Selected</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">

            <div className="space-y-3 sm:space-y-4">
              {cart.map((item) => {
                const averageRating = getAverageRatingNumber(item.product.reviews);
                const reviewCount = item.product.reviews?.length || 0;
                const isRemoving = removingId === item.id;

                return (
                  <div
                    key={item.productId}
                    className={`bg-[#FDF8ED] border border-[#1A1613]/10 rounded-2xl px-4 py-3 sm:px-6 sm:py-5 flex items-center gap-4
                      shadow-[0_-4px_25px_-8px_rgba(0,0,0,0.06),0_3px_20px_-8px_rgba(0,0,0,0.04)]
                      hover:shadow-[0_-6px_26px_-6px_rgba(0,0,0,0.08),0_8px_16px_-6px_rgba(0,0,0,0.06)]
                      hover:border-[#E6540B]/40
                      transition-all duration-500
                      ${isRemoving ? "opacity-50 pointer-events-none" : ""}
                    `}
                  >
                    <Link
                      to={`/productdetails/${item.product.id}`}
                      className="flex-shrink-0 overflow-hidden rounded-xl"
                    >
                      <img
                        src={item.product.productImage || "/placeholder.jpg"}
                        alt={item.product.productName}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl bg-[#F4EEDF]"
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/productdetails/${item.product.id}`}
                        className="block text-lg sm:text-xl font-['Fraunces',serif] font-bold text-[#1A1613] hover:text-[#E6540B] transition truncate"
                      >
                        {item.product.productName}
                      </Link>

                      <div className="flex items-center gap-1 mt-1">
                        {reviewCount > 0 ? (
                          <>
                            {[...Array(5)].map((_, i) => (
                              <svg key={i}
                                className={`w-4 h-4 ${i < Math.round(Number(averageRating)) ? "text-[#E6540B]" : "text-[#1A1613]/15"}`}
                                fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            <span className="ml-1 text-sm font-medium text-[#1A1613]/80">{averageRating}</span>
                            <span className="text-sm text-[#1A1613]/50">({reviewCount})</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 text-[#1A1613]/15" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="ml-1 text-sm font-medium text-[#1A1613]/80">0.0</span>
                            <span className="text-sm text-[#1A1613]/50">(0)</span>
                          </>
                        )}
                      </div>

                      <p className="text-base sm:text-lg font-['IBM_Plex_Mono',monospace] font-bold text-[#8A3B12] mt-1">
                        Rs. {item.product.productPrice}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <div className="flex items-center gap-1 sm:gap-2 bg-[#F4EEDF] rounded-full p-1">
                        <button
                          onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                          disabled={item.quantity === 1 || isRemoving}
                          className="cursor-pointer w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FDF8ED] border border-[#1A1613]/10 flex items-center justify-center hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1A1613]" />
                        </button>
                        <span className="w-5 text-center text-sm sm:text-base font-['IBM_Plex_Mono',monospace] font-semibold text-[#1A1613]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.product.productStock || isRemoving}
                          className="cursor-pointer w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FDF8ED] border border-[#1A1613]/10 flex items-center justify-center hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1A1613]" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={isRemoving}
                        aria-label="Remove item"
                        className="cursor-pointer w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#9B3A2E]/10 text-[#9B3A2E] hover:bg-[#9B3A2E]/20 flex items-center justify-center transition disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isRemoving
                          ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                          : <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        }
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={`${cardClass} lg:sticky lg:top-20`}>
              <h2 className="text-xl sm:text-2xl font-['Fraunces',serif] font-bold text-[#1A1613] mb-4 sm:mb-6">
                Order Summary
              </h2>

              <div className="space-y-3 sm:space-y-4 text-[#1A1613] text-sm sm:text-base">
                <div className="flex justify-between">
                  <span>Total Items</span>
                  <span className="font-['IBM_Plex_Mono',monospace] font-semibold">{totalItems}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-['IBM_Plex_Mono',monospace] font-semibold">Rs. {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-['IBM_Plex_Mono',monospace] font-semibold text-green-700">Rs. {shipping}</span>
                </div>
                <div className="border-t border-[#1A1613]/10 pt-4 flex justify-between text-lg sm:text-xl font-bold">
                  <span className="font-['Fraunces',serif]">Total</span>
                  <span className="font-['IBM_Plex_Mono',monospace] text-[#8A3B12]">Rs. {total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 sm:mt-8">
                <label className="block text-sm font-medium text-[#1A1613] mb-2">
                  Promo Code or Gift Card
                </label>
                <div className="flex flex-col xs:flex-row sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Enter code"
                    className="flex-1 min-w-0 px-3 py-3 border border-[#1A1613]/15 rounded-xl bg-[#FDF8ED] text-[#1A1613] placeholder:text-[#1A1613]/40 focus:outline-none focus:ring-2 focus:ring-[#E6540B]/40"
                  />
                  <button className="cursor-pointer px-4 py-3 bg-[#E6540B] text-[#FDF8ED] font-medium rounded-xl hover:bg-[#c94806] transition shadow-md whitespace-nowrap">
                    Apply
                  </button>
                </div>
              </div>

              {paymentMethod === PaymentMethod.COD ? (
                <button type="button" onClick={handlePlaceOrder} disabled={isSubmitting}
                  className="cursor-pointer w-full mt-6 sm:mt-8 py-3.5 sm:py-4 bg-[#E6540B] text-[#FDF8ED] text-base sm:text-lg font-semibold rounded-xl hover:bg-[#c94806] transition shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isSubmitting ? "Placing order...." : "Place Order"}
                </button>
              ) : paymentMethod === PaymentMethod.Khalti ? (
                <button type="button" onClick={handlePlaceOrder} disabled={isSubmitting}
                  className="cursor-pointer w-full mt-6 sm:mt-8 py-3.5 sm:py-4 bg-[#5C2D91] text-[#FDF8ED] text-base sm:text-lg font-semibold rounded-xl hover:bg-[#4a2475] transition shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isSubmitting ? "Paying with Khalti...." : "Pay with Khalti"}
                </button>
              ) : (
                <button type="button" onClick={handlePlaceOrder} disabled={isSubmitting}
                  className="cursor-pointer w-full mt-6 sm:mt-8 py-3.5 sm:py-4 bg-[#3A7D44] text-[#FDF8ED] text-base sm:text-lg font-semibold rounded-xl hover:bg-[#2e6336] transition shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isSubmitting ? "Paying with eSewa...." : "Pay with eSewa"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CheckOut;