import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Banknote, Loader2, RotateCw, ShoppingBag, Tag, Wallet, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../hooks/hooks";
import { fetchCartItems } from "../../../store/customer/cartSlice";
import { createOrder } from "../../../store/customer/checkoutSlice";
import { OrderData, PaymentMethod } from "../../../types/customer/checkoutTypes";
import type { CartItem } from "../../../types/customer/cartTypes";
import Breadcrumb from "../../../global/Breadcrumb";
import { Skeleton, SkeletonContainer } from "../../../global/Skeleton";
import { connectSocket } from "../../../services/socket";
import { calculateShipping, loadStoreSettings, useStoreSettings } from "../../../services/storeSettingsService";
import {
  applyCouponCode,
  calculateCouponDiscount,
  describeCoupon,
  fetchWelcomeOffer,
  type AppliedCoupon,
  type Promotion,
} from "../../../services/couponService";
import { formatCurrency, hideBrokenImage, responsiveImage } from "../../../utils/helpers";
import usePageTitle from "../../../hooks/usePageTitle";
import { redirectToGateway } from "../../../services/paymentService";

type FieldErrors = { phoneNumber?: string; address?: string; city?: string };

interface SavedDetails {
  phoneNumber: string;
  address: string;
  city: string;
}

const layout = "grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-8";
const card = "rounded-xl border border-[#1A1613]/10 bg-white";
const inputBase =
  "w-full rounded-lg border bg-white px-3 py-2.5 text-[#1A1613] placeholder:text-[#1A1613]/40 focus:outline-none focus:ring-2";
const inputClass = (hasError: boolean) =>
  `${inputBase} ${hasError ? "border-red-400 focus:ring-red-200" : "border-[#1A1613]/15 focus:ring-[#E6540B]/30"}`;

// Delivery details are remembered per account, on this device only, when the shopper asks
const savedDetailsKey = (userId?: string) => `truvora_checkout_details_${userId || "guest"}`;

const readSavedDetails = (userId?: string): SavedDetails | null => {
  try {
    const raw = localStorage.getItem(savedDetailsKey(userId));
    return raw ? (JSON.parse(raw) as SavedDetails) : null;
  } catch {
    return null;
  }
};

const errorInfo = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; field?: string } | undefined;
    return { status: error.response?.status, field: data?.field, message: data?.message };
  }
  return { status: undefined, field: undefined, message: undefined };
};

const hasStockProblem = (item: CartItem) =>
  item.product.productStock <= 0 || item.quantity > item.product.productStock;

const PAYMENT_OPTIONS = [
  {
    value: PaymentMethod.COD,
    label: "Cash on delivery",
    hint: "Pay in cash when your order arrives.",
    icon: Banknote,
    online: false,
  },
  {
    value: PaymentMethod.Khalti,
    label: "Khalti",
    hint: "You'll be taken to Khalti to pay securely.",
    icon: Wallet,
    online: true,
  },
  {
    value: PaymentMethod.Esewa,
    label: "eSewa",
    hint: "You'll be taken to eSewa to pay securely.",
    icon: Wallet,
    online: true,
  },
];

const submitLabel: Record<PaymentMethod, string> = {
  [PaymentMethod.COD]: "Place order",
  [PaymentMethod.Khalti]: "Continue to Khalti",
  [PaymentMethod.Esewa]: "Continue to eSewa",
};

const CheckoutSkeleton = () => (
  <SkeletonContainer label="Loading checkout" className={layout}>
    <div className="space-y-6">
      {[4, 3].map((rows, i) => (
        <div key={i} className={`${card} space-y-4 p-5`}>
          <Skeleton className="h-6 w-40" />
          {Array.from({ length: rows }).map((_, r) => (
            <Skeleton key={r} className="h-11 w-full rounded-lg" />
          ))}
        </div>
      ))}
    </div>
    <div className={`${card} space-y-4 p-5`}>
      <Skeleton className="h-6 w-36" />
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-14 w-14 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
      <Skeleton className="h-11 w-full rounded-lg" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  </SkeletonContainer>
);

const CheckOut = () => {
  usePageTitle("Checkout");
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const cart = useAppSelector((state) => state.cart.cart) || [];
  const user = useAppSelector((state) => state.auth.user);
  const settings = useStoreSettings();

  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const [details, setDetails] = useState<SavedDetails>(
    () => readSavedDetails(user?.id) ?? { phoneNumber: "", address: "", city: "" },
  );
  const [remember, setRemember] = useState(() => readSavedDetails(user?.id) !== null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.COD);
  const [submitting, setSubmitting] = useState(false);
  const [redirectingTo, setRedirectingTo] = useState<string | null>(null);

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [welcomeOffer, setWelcomeOffer] = useState<Promotion | null>(null);

  // First-time shoppers see the store's new-customer code (the server decides who qualifies)
  useEffect(() => {
    fetchWelcomeOffer()
      .then(setWelcomeOffer)
      .catch(() => setWelcomeOffer(null));
  }, []);

  // Lets the admin dashboard show how many shoppers are checking out right now
  useEffect(() => {
    const socket = connectSocket();
    socket.emit("customer:checkout-start");
    return () => {
      socket.emit("customer:checkout-end");
    };
  }, []);

  // Fresh prices and stock before anyone pays
  const loadCart = () => {
    setLoadFailed(false);
    dispatch(fetchCartItems())
      .then(() => setLoaded(true))
      .catch(() => setLoadFailed(true));
  };

  useEffect(() => {
    dispatch(fetchCartItems())
      .then(() => setLoaded(true))
      .catch(() => setLoadFailed(true));
  }, [dispatch]);

  const paymentOptions = PAYMENT_OPTIONS.filter((option) =>
    option.online ? settings.enableOnlinePayment : settings.enableCod,
  );
  // If the selected method gets switched off in settings, fall back to the first one still available
  const paymentMethod = paymentOptions.some((o) => o.value === selectedMethod)
    ? selectedMethod
    : paymentOptions[0]?.value ?? null;

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.productPrice * item.quantity, 0);
  const { fee: shipping } = calculateShipping(subtotal, settings);
  const discount = coupon ? calculateCouponDiscount(coupon, subtotal) : 0;
  const total = subtotal - discount + shipping;
  const couponBelowMinimum = !!coupon && discount === 0;
  const stockProblems = cart.filter(hasStockProblem);

  const updateDetail = (name: keyof SavedDetails, value: string) => {
    setDetails((prev) => ({ ...prev, [name]: name === "phoneNumber" ? value.replace(/\D/g, "").slice(0, 10) : value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply ?? couponInput).trim();
    if (!code || applyingCoupon) return;
    setApplyingCoupon(true);
    setCouponError("");
    try {
      const applied = await applyCouponCode(code);
      setCoupon(applied);
      setCouponInput("");
      toast.success(`${applied.code} applied`);
    } catch (error) {
      setCouponError(errorInfo(error).message || "We couldn't check that code. Please try again.");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    const address = details.address.trim();
    const city = details.city.trim();
    if (!/^9[678]\d{8}$/.test(details.phoneNumber)) {
      errors.phoneNumber = "Enter a 10-digit mobile number starting with 96, 97 or 98.";
    }
    if (address.length < 4) errors.address = "Enter your street, area or a nearby landmark.";
    if (!city) errors.city = "Enter your city or town.";
    if (`${address}, ${city}`.length > 200) errors.address = "Address is too long (200 characters max).";
    return errors;
  };

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || !paymentMethod) return;
    setFormError("");

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      document.getElementById(`checkout-${Object.keys(errors)[0]}`)?.focus();
      return;
    }

    try {
      if (remember) {
        localStorage.setItem(
          savedDetailsKey(user?.id),
          JSON.stringify({ ...details, address: details.address.trim(), city: details.city.trim() }),
        );
      } else {
        localStorage.removeItem(savedDetailsKey(user?.id));
      }
    } catch {
      // Storage can be blocked (private mode); remembering details is only a convenience
    }

    const orderData: OrderData = {
      phoneNumber: details.phoneNumber,
      shippingAddress: `${details.address.trim()}, ${details.city.trim()}`,
      totalAmount: total,
      paymentDetails: { paymentMethod },
      products: cart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      couponCode: coupon && discount > 0 ? coupon.code : null,
    };

    setSubmitting(true);
    try {
      const response = await dispatch(createOrder(orderData));
      const orderId: string | undefined = response?.data?.id;

      const gateway = paymentMethod === PaymentMethod.COD ? null : redirectToGateway(response);
      if (gateway) {
        setRedirectingTo(gateway);
        return;
      }

      toast.success("Order placed. You'll pay when it arrives.");
      setRedirectingTo("your order");
      navigate(orderId ? `/my-orders/orderdetails/${orderId}` : "/my-orders", { replace: true });
    } catch (error) {
      setSubmitting(false);
      const { status, field, message } = errorInfo(error);
      const text = message || "Something went wrong. Please try again.";

      if (field === "couponCode") {
        setCoupon(null);
        setCouponError(text);
        toast.error(text);
        return;
      }
      if (field === "phoneNumber") {
        setFieldErrors({ phoneNumber: text });
        return;
      }
      if (field === "shippingAddress") {
        setFieldErrors({ address: text });
        return;
      }

      // Prices, stock, delivery fee or payment options may have changed: reload them
      if (status && status >= 400 && status < 500) {
        loadStoreSettings().catch(() => {});
        dispatch(fetchCartItems()).catch(() => {});
      }
      if (field === "totalAmount") {
        setFormError("Prices or the delivery fee just changed. Please check the new total and try again.");
      } else {
        setFormError(text);
      }
      toast.error(text);
    }
  };

  const isInitialLoad = !loaded && !loadFailed && cart.length === 0;

  // The cart empties as soon as the order is created, so keep this screen up until we leave the page
  if (redirectingTo || (submitting && cart.length === 0)) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#FDF8ED] px-4 pt-16 text-center text-[#1A1613]">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6540B]" />
        <p className="mt-4 font-semibold">{redirectingTo ? `Taking you to ${redirectingTo}...` : "Placing your order..."}</p>
        <p className="mt-1 text-sm text-[#1A1613]/60">Please don't close this page.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#FDF8ED] pt-16 text-[#1A1613]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Cart", href: "/cart" }, { label: "Checkout" }]} />
        <h1 className="mb-6 text-2xl font-bold sm:text-3xl">Checkout</h1>

        {isInitialLoad ? (
          <CheckoutSkeleton />
        ) : loadFailed && cart.length === 0 ? (
          <div className={`${card} px-4 py-16 text-center`}>
            <p className="text-[#1A1613]/70">We couldn't load your cart right now.</p>
            <button
              type="button"
              onClick={loadCart}
              className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#1A1613]/20 px-4 py-2 text-sm font-semibold hover:border-[#E6540B] hover:text-[#E6540B]"
            >
              <RotateCw className="h-4 w-4" /> Try again
            </button>
          </div>
        ) : cart.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#1A1613]/15 bg-white px-4 py-16 text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E6540B]/10">
              <ShoppingBag className="h-7 w-7 text-[#E6540B]" />
            </span>
            <h2 className="text-xl font-semibold">Your cart is empty</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-[#1A1613]/60">Add something to your cart to check out.</p>
            <Link
              to="/products"
              className="mt-6 inline-flex rounded-lg bg-[#E6540B] px-6 py-3 font-semibold text-white hover:bg-[#c94806]"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handlePlaceOrder}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target instanceof HTMLInputElement && e.target.type !== "checkbox" && e.target.type !== "radio") {
                e.preventDefault();
              }
            }}
            noValidate
            className={layout}
          >
            <div className="space-y-6">
              <section className={`${card} p-5`}>
                <h2 className="text-lg font-semibold">Delivery details</h2>
                {user?.email && (
                  <p className="mt-1 text-sm text-[#1A1613]/60">
                    Ordering as <span className="font-medium text-[#1A1613]">{user.username}</span> ({user.email})
                  </p>
                )}

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="checkout-phoneNumber" className="mb-1 block text-sm font-medium">
                      Phone number
                    </label>
                    <input
                      id="checkout-phoneNumber"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      value={details.phoneNumber}
                      onChange={(e) => updateDetail("phoneNumber", e.target.value)}
                      placeholder="98XXXXXXXX"
                      aria-invalid={!!fieldErrors.phoneNumber}
                      className={inputClass(!!fieldErrors.phoneNumber)}
                    />
                    {fieldErrors.phoneNumber ? (
                      <p className="mt-1 text-xs text-red-700">{fieldErrors.phoneNumber}</p>
                    ) : (
                      <p className="mt-1 text-xs text-[#1A1613]/50">Our delivery partner will call this number.</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="checkout-city" className="mb-1 block text-sm font-medium">
                      City / town
                    </label>
                    <input
                      id="checkout-city"
                      type="text"
                      autoComplete="address-level2"
                      value={details.city}
                      onChange={(e) => updateDetail("city", e.target.value)}
                      placeholder="e.g. Lalitpur"
                      maxLength={60}
                      aria-invalid={!!fieldErrors.city}
                      className={inputClass(!!fieldErrors.city)}
                    />
                    {fieldErrors.city && <p className="mt-1 text-xs text-red-700">{fieldErrors.city}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="checkout-address" className="mb-1 block text-sm font-medium">
                      Address
                    </label>
                    <input
                      id="checkout-address"
                      type="text"
                      autoComplete="street-address"
                      value={details.address}
                      onChange={(e) => updateDetail("address", e.target.value)}
                      placeholder="Street, area and a nearby landmark"
                      maxLength={180}
                      aria-invalid={!!fieldErrors.address}
                      className={inputClass(!!fieldErrors.address)}
                    />
                    {fieldErrors.address && <p className="mt-1 text-xs text-red-700">{fieldErrors.address}</p>}
                  </div>
                </div>

                <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-[#1A1613]/70">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 cursor-pointer accent-[#E6540B]"
                  />
                  Remember these details on this device
                </label>
              </section>

              <section className={`${card} p-5`}>
                <h2 className="text-lg font-semibold">Payment</h2>
                {paymentOptions.length === 0 ? (
                  <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                    Ordering is unavailable right now because no payment method is turned on. Please contact us at{" "}
                    {settings.supportEmail || "our support email"}.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2" role="radiogroup" aria-label="Payment method">
                    {paymentOptions.map((option) => {
                      const selected = paymentMethod === option.value;
                      const Icon = option.icon;
                      return (
                        <label
                          key={option.value}
                          className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                            selected ? "border-[#E6540B] bg-[#E6540B]/5" : "border-[#1A1613]/15 hover:bg-[#FDF8ED]"
                          } ${submitting ? "pointer-events-none opacity-60" : ""}`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={option.value}
                            checked={selected}
                            onChange={() => setSelectedMethod(option.value)}
                            className="mt-1 h-4 w-4 accent-[#E6540B]"
                          />
                          <Icon size={20} className="mt-0.5 shrink-0 text-[#1A1613]/60" />
                          <span>
                            <span className="block font-medium">{option.label}</span>
                            <span className="block text-sm text-[#1A1613]/60">{option.hint}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            <aside className={`${card} p-5 lg:sticky lg:top-24`}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Your order <span className="font-normal text-[#1A1613]/50">({itemCount})</span>
                </h2>
                <Link to="/cart" className="text-sm font-semibold text-[#E6540B] hover:underline">
                  Edit cart
                </Link>
              </div>

              <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    <img
                      {...responsiveImage(item.product.productImage, [120], "56px")}
                      alt=""
                      loading="lazy"
                      onError={hideBrokenImage}
                      className="h-14 w-14 shrink-0 rounded-lg bg-[#F4EEDF] object-cover"
                    />
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="line-clamp-2 font-medium">{item.product.productName}</p>
                      <p className="text-[#1A1613]/60">
                        {item.quantity} × {formatCurrency(item.product.productPrice)}
                      </p>
                      {hasStockProblem(item) && (
                        <p className="text-xs font-medium text-red-700">
                          {item.product.productStock <= 0 ? "Out of stock" : `Only ${item.product.productStock} left`}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 text-sm font-semibold">
                      {formatCurrency(item.product.productPrice * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-4 border-t border-[#1A1613]/10 pt-4">
                {coupon ? (
                  <div className="flex items-start justify-between gap-3 rounded-lg bg-emerald-50 p-3 text-sm">
                    <div className="flex min-w-0 gap-2">
                      <Tag size={16} className="mt-0.5 shrink-0 text-emerald-700" />
                      <div className="min-w-0">
                        <p className="font-semibold text-emerald-800">{coupon.code}</p>
                        <p className="text-emerald-800/80">{coupon.description || describeCoupon(coupon)}</p>
                        {couponBelowMinimum && (
                          <p className="mt-1 text-xs text-red-700">
                            Needs items worth at least {formatCurrency(coupon.minOrderAmount)}.
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCoupon(null)}
                      disabled={submitting}
                      aria-label={`Remove promo code ${coupon.code}`}
                      className="cursor-pointer rounded p-1 text-emerald-800 hover:bg-emerald-100"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div>
                    {welcomeOffer && (
                      <div className="mb-3 flex items-start justify-between gap-3 rounded-lg border border-dashed border-[#E6540B]/50 bg-[#E6540B]/5 p-3 text-sm">
                        <p>
                          <span className="font-semibold">New here?</span> Use{" "}
                          <span className="font-mono font-semibold">{welcomeOffer.code}</span> for {welcomeOffer.discountLabel}
                          {welcomeOffer.firstOrderOnly ? " on your first order" : ""}.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleApplyCoupon(welcomeOffer.code)}
                          disabled={applyingCoupon}
                          className="shrink-0 cursor-pointer font-semibold text-[#E6540B] hover:underline disabled:opacity-50"
                        >
                          Apply
                        </button>
                      </div>
                    )}
                    <label htmlFor="checkout-coupon" className="mb-1 block text-sm font-medium">
                      Promo code
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="checkout-coupon"
                        type="text"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          setCouponError("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleApplyCoupon();
                          }
                        }}
                        placeholder="Enter code"
                        maxLength={40}
                        autoComplete="off"
                        aria-invalid={!!couponError}
                        className={`${inputClass(!!couponError)} min-w-0 uppercase placeholder:normal-case`}
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        disabled={!couponInput.trim() || applyingCoupon}
                        className="shrink-0 cursor-pointer rounded-lg border border-[#1A1613]/20 px-4 text-sm font-semibold hover:border-[#E6540B] hover:text-[#E6540B] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {applyingCoupon ? <Loader2 size={16} className="animate-spin" /> : "Apply"}
                      </button>
                    </div>
                    {couponError && <p className="mt-1 text-xs text-red-700">{couponError}</p>}
                  </div>
                )}
              </div>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[#1A1613]/70">Subtotal</dt>
                  <dd className="font-medium">{formatCurrency(subtotal)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-[#1A1613]/70">Discount ({coupon?.code})</dt>
                    <dd className="font-medium text-emerald-700">−{formatCurrency(discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-[#1A1613]/70">Delivery</dt>
                  <dd className={shipping === 0 ? "font-medium text-emerald-700" : "font-medium"}>
                    {shipping === 0 ? "Free" : formatCurrency(shipping)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-[#1A1613]/10 pt-3 text-base font-bold">
                  <dt>Total</dt>
                  <dd>{formatCurrency(total)}</dd>
                </div>
              </dl>

              {settings.maintenanceMode ? (
                <p className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                  {settings.maintenanceMessage || "We're doing some quick maintenance. Ordering is paused for a little while."}
                </p>
              ) : stockProblems.length > 0 ? (
                <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                  Some items are out of stock or low on stock.{" "}
                  <Link to="/cart" className="font-semibold underline">
                    Update your cart
                  </Link>{" "}
                  to continue.
                </p>
              ) : null}

              {formError && (
                <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={
                  submitting || !paymentMethod || settings.maintenanceMode || stockProblems.length > 0
                }
                className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#E6540B] px-4 py-3 font-semibold text-white transition hover:bg-[#c94806] disabled:cursor-not-allowed disabled:bg-[#1A1613]/20"
              >
                {submitting && <Loader2 size={18} className="animate-spin" />}
                {submitting ? "Placing order..." : paymentMethod ? `${submitLabel[paymentMethod]} · ${formatCurrency(total)}` : "Place order"}
              </button>
              <p className="mt-2 text-center text-xs text-[#1A1613]/50">
                By placing your order you agree to our{" "}
                <Link to="/terms" className="underline hover:text-[#E6540B]">
                  terms
                </Link>
                .
              </p>
            </aside>
          </form>
        )}
      </div>
    </div>
  );
};

export default CheckOut;
