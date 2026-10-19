import { formatOrderNumber } from "../../../services/storeSettingsService";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Banknote, Loader2, Minus, PackageX, Plus, Wallet } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../hooks/hooks";
import { editMyOrders, fetchMySingleOrder } from "../../../store/customer/checkoutSlice";
import { type FetchOrder, type OrderData, OrderStatus, PaymentMethod } from "../../../types/customer/checkoutTypes";
import Breadcrumb from "../../../global/Breadcrumb";
import { Status } from "../../../global/statuses";
import { Skeleton, SkeletonContainer } from "../../../global/Skeleton";
import { editedOrderShipping, useStoreSettings } from "../../../services/storeSettingsService";
import { APIAuthenticated } from "../../../http";
import { calculateCouponDiscount, type AppliedCoupon } from "../../../services/couponService";
import { redirectToGateway } from "../../../services/paymentService";
import { formatCurrency, hideBrokenImage, responsiveImage } from "../../../utils/helpers";
import { unitPriceOf } from "../../../utils/orderTotals";
import usePageTitle from "../../../hooks/usePageTitle";

// Promo code on the order: its terms, or a fixed amount if the coupon has since been deleted
type OrderCoupon = (AppliedCoupon & { fixedDiscount: null }) | { code: string; fixedDiscount: number };

type FieldErrors = { phoneNumber?: string; shippingAddress?: string };

const card = "rounded-xl border border-[#1A1613]/10 bg-white";
const inputClass = (hasError: boolean) =>
  `w-full rounded-lg border bg-white px-3 py-2.5 text-[#1A1613] placeholder:text-[#1A1613]/40 focus:outline-none focus:ring-2 ${
    hasError ? "border-red-400 focus:ring-red-200" : "border-[#1A1613]/15 focus:ring-[#E6540B]/30"
  }`;

const PAYMENT_OPTIONS = [
  { value: PaymentMethod.COD, label: "Cash on delivery", hint: "Pay in cash when your order arrives.", icon: Banknote, online: false },
  { value: PaymentMethod.Khalti, label: "Khalti", hint: "You'll be taken to Khalti to pay the new total.", icon: Wallet, online: true },
  { value: PaymentMethod.Esewa, label: "eSewa", hint: "You'll be taken to eSewa to pay the new total.", icon: Wallet, online: true },
];

const apiError = (error: unknown) =>
  axios.isAxiosError(error)
    ? ((error.response?.data ?? {}) as { field?: string; message?: string })
    : ({} as { field?: string; message?: string });

const EditSkeleton = () => (
  <SkeletonContainer label="Loading order" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
    <div className="space-y-6">
      <div className={`${card} space-y-4 p-5`}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-20 w-20 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-9 w-32 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
      <div className={`${card} space-y-3 p-5`}>
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    </div>
    <div className={`${card} space-y-3 p-5`}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  </SkeletonContainer>
);

/** The form itself; mounted once per order so live order updates never wipe what the shopper typed */
const EditOrderForm = ({ order, label }: { order: FetchOrder; label: string }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const settings = useStoreSettings();
  const originalItems = order.OrderDetails ?? [];

  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(originalItems.map((item) => [item.productId, item.quantity])),
  );
  const [phoneNumber, setPhoneNumber] = useState(order.phoneNumber);
  const [shippingAddress, setShippingAddress] = useState(order.shippingAddress);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(order.Payment?.paymentMethod ?? PaymentMethod.COD);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [orderCoupon, setOrderCoupon] = useState<OrderCoupon | null>(null);

  useEffect(() => {
    if (!order.couponCode) return;
    APIAuthenticated.get(`/customer/coupon/order/${order.id}`)
      .then((response) => setOrderCoupon(response.data.data))
      .catch(() => setOrderCoupon(null));
  }, [order.id, order.couponCode]);

  // The store may start preparing the order while it's open here
  const stillEditable = order.orderStatus === OrderStatus.Pending;

  const paymentOptions = PAYMENT_OPTIONS.filter((o) => (o.online ? settings.enableOnlinePayment : settings.enableCod));
  const paymentMethod = paymentOptions.some((o) => o.value === selectedMethod)
    ? selectedMethod
    : paymentOptions[0]?.value ?? null;

  const keptItems = originalItems.filter((item) => quantities[item.productId] > 0);
  const subtotal = keptItems.reduce((sum, item) => sum + unitPriceOf(item) * quantities[item.productId], 0);
  // The delivery fee the order was placed with is kept (see editedOrderShipping)
  const shipping = editedOrderShipping(order.shippingFee, subtotal, settings);
  const savedDiscount = Number(order.discountAmount) || 0;
  const discount = !order.couponCode
    ? 0
    : !orderCoupon
      ? Math.min(savedDiscount, subtotal)
      : orderCoupon.fixedDiscount !== null
        ? Math.min(orderCoupon.fixedDiscount, subtotal)
        : calculateCouponDiscount(orderCoupon, subtotal);
  const couponMinimum = orderCoupon && orderCoupon.fixedDiscount === null ? orderCoupon.minOrderAmount : 0;
  const belowCouponMinimum = couponMinimum > 0 && subtotal < couponMinimum;
  const total = subtotal - discount + shipping;
  const difference = total - Number(order.totalAmount);

  const changed =
    originalItems.some((item) => quantities[item.productId] !== item.quantity) ||
    phoneNumber !== order.phoneNumber ||
    shippingAddress.trim() !== order.shippingAddress ||
    paymentMethod !== order.Payment?.paymentMethod;

  const setQuantity = (productId: string, quantity: number) => {
    setQuantities((prev) => ({ ...prev, [productId]: quantity }));
    setFormError("");
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!/^9[678]\d{8}$/.test(phoneNumber)) errors.phoneNumber = "Enter a 10-digit mobile number starting with 96, 97 or 98.";
    const address = shippingAddress.trim();
    if (address.length < 4 || address.length > 200) errors.shippingAddress = "Enter your full address (4–200 characters).";
    return errors;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving || !changed || !paymentMethod || !stillEditable) return;
    setFormError("");
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    const data: OrderData = {
      phoneNumber,
      shippingAddress: shippingAddress.trim(),
      paymentDetails: { paymentMethod },
      products: keptItems.map((item) => ({ productId: item.productId, quantity: quantities[item.productId] })),
      totalAmount: total,
    };

    setSaving(true);
    try {
      const response = await dispatch(editMyOrders(order.id, data));
      const gateway = paymentMethod === PaymentMethod.COD ? null : redirectToGateway(response);
      if (gateway) {
        toast.info(`Changes saved. Taking you to ${gateway}...`);
        return; // keep the button disabled while the browser leaves
      }
      toast.success("Changes saved");
      navigate(`/my-orders/orderdetails/${order.id}`);
    } catch (error) {
      setSaving(false);
      const { field, message } = apiError(error);
      if (field === "payment") {
        // Saved, but the payment couldn't start; it can be paid from the order page
        toast.error(message || "Changes saved, but the payment couldn't start.");
        navigate(`/my-orders/orderdetails/${order.id}`);
        return;
      }
      if (field === "phoneNumber" || field === "shippingAddress") {
        setFieldErrors({ [field]: message });
        return;
      }
      if (field === "totalAmount") {
        setFormError("Prices or the delivery fee changed while you were editing. Please check the new total and save again.");
      } else {
        setFormError(message || "Couldn't save your changes. Please try again.");
      }
      dispatch(fetchMySingleOrder(order.id)).catch(() => {});
    }
  };

  if (!stillEditable) {
    return (
      <div className={`${card} p-6 text-center`}>
        <p className="font-semibold">This order can't be changed any more</p>
        <p className="mt-1 text-sm text-[#1A1613]/60">
          {order.orderStatus === OrderStatus.Cancelled ? "It was cancelled." : "We've already started preparing it."}
        </p>
        <Link
          to={`/my-orders/orderdetails/${order.id}`}
          className="mt-4 inline-flex rounded-lg bg-[#E6540B] px-5 py-2.5 font-semibold text-white hover:bg-[#c94806]"
        >
          View order
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div className="space-y-6">
        <section className={card}>
          <h2 className="border-b border-[#1A1613]/10 px-5 py-4 text-lg font-semibold">Items</h2>
          <ul className="divide-y divide-[#1A1613]/10">
            {originalItems.map((item) => {
              const quantity = quantities[item.productId] ?? 0;
              const removed = quantity === 0;
              const price = unitPriceOf(item);
              // Stock this order already holds is released on save, so it's available to it
              const maxQuantity = (item.Product?.productStock ?? 0) + item.quantity;
              const isLastItem = keptItems.length === 1 && !removed;
              return (
                <li key={item.productId} className={`flex gap-4 p-5 ${removed ? "opacity-60" : ""}`}>
                  <img
                    {...responsiveImage(item.Product?.productImage, [120, 200], "80px")}
                    alt=""
                    loading="lazy"
                    onError={hideBrokenImage}
                    className="h-20 w-20 shrink-0 rounded-lg bg-[#F4EEDF] object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {item.Product?.category?.categoryName && (
                          <p className="truncate text-xs text-[#1A1613]/50">{item.Product.category.categoryName}</p>
                        )}
                        <p className={`line-clamp-2 font-semibold ${removed ? "line-through" : ""}`}>
                          {item.Product?.productName ?? "Product"}
                        </p>
                        <p className="text-sm text-[#1A1613]/60">{formatCurrency(price)} each</p>
                      </div>
                      <p className="shrink-0 font-semibold">{removed ? "Removed" : formatCurrency(price * quantity)}</p>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      {removed ? (
                        <button
                          type="button"
                          onClick={() => setQuantity(item.productId, item.quantity)}
                          className="cursor-pointer text-sm font-semibold text-[#E6540B] hover:underline"
                        >
                          Undo remove
                        </button>
                      ) : (
                        <>
                          <div className="inline-flex items-center rounded-lg border border-[#1A1613]/15">
                            <button
                              type="button"
                              onClick={() => setQuantity(item.productId, quantity - 1)}
                              disabled={quantity <= 1}
                              aria-label={`Decrease quantity of ${item.Product?.productName}`}
                              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-l-lg hover:bg-[#F4EEDF] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Minus size={15} />
                            </button>
                            <span className="w-9 text-center text-sm font-semibold" aria-live="polite">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => setQuantity(item.productId, quantity + 1)}
                              disabled={quantity >= maxQuantity}
                              aria-label={`Increase quantity of ${item.Product?.productName}`}
                              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-r-lg hover:bg-[#F4EEDF] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Plus size={15} />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setQuantity(item.productId, 0)}
                            disabled={isLastItem}
                            title={isLastItem ? "To remove everything, cancel the order instead" : undefined}
                            className="cursor-pointer text-sm font-medium text-[#1A1613]/60 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                    {!removed && quantity >= maxQuantity && (
                      <p className="mt-1 text-xs text-amber-700">That's all we have in stock.</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {keptItems.length === 1 && (
            <p className="border-t border-[#1A1613]/10 px-5 py-3 text-xs text-[#1A1613]/50">
              To remove everything, cancel the order from the order page instead.
            </p>
          )}
        </section>

        <section className={`${card} p-5`}>
          <h2 className="text-lg font-semibold">Delivery details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-[200px_minmax(0,1fr)]">
            <div>
              <label htmlFor="edit-phone" className="mb-1 block text-sm font-medium">Phone number</label>
              <input
                id="edit-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10));
                  setFieldErrors((prev) => ({ ...prev, phoneNumber: undefined }));
                }}
                aria-invalid={!!fieldErrors.phoneNumber}
                className={inputClass(!!fieldErrors.phoneNumber)}
              />
              {fieldErrors.phoneNumber && <p className="mt-1 text-xs text-red-700">{fieldErrors.phoneNumber}</p>}
            </div>
            <div>
              <label htmlFor="edit-address" className="mb-1 block text-sm font-medium">Address</label>
              <input
                id="edit-address"
                type="text"
                autoComplete="street-address"
                value={shippingAddress}
                maxLength={200}
                onChange={(e) => {
                  setShippingAddress(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, shippingAddress: undefined }));
                }}
                placeholder="Street, area, city"
                aria-invalid={!!fieldErrors.shippingAddress}
                className={inputClass(!!fieldErrors.shippingAddress)}
              />
              {fieldErrors.shippingAddress && <p className="mt-1 text-xs text-red-700">{fieldErrors.shippingAddress}</p>}
            </div>
          </div>
        </section>

        <section className={`${card} p-5`}>
          <h2 className="text-lg font-semibold">Payment</h2>
          {paymentOptions.length === 0 ? (
            <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              No payment method is available right now, so changes can't be saved. Please contact us.
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
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
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
        <h2 className="text-lg font-semibold">New total</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-[#1A1613]/70">Subtotal</dt>
            <dd className="font-medium">{formatCurrency(subtotal)}</dd>
          </div>
          {order.couponCode && (
            <div className="flex justify-between">
              <dt className="text-[#1A1613]/70">Discount ({order.couponCode})</dt>
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
        {Math.abs(difference) >= 0.01 && (
          <p className="mt-2 text-sm text-[#1A1613]/60">
            {formatCurrency(Math.abs(difference))} {difference > 0 ? "more" : "less"} than before ({formatCurrency(Number(order.totalAmount))})
          </p>
        )}
        {belowCouponMinimum && (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            Promo code {order.couponCode} needs items worth at least {formatCurrency(couponMinimum)}.
          </p>
        )}
        {formError && (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={saving || !changed || !paymentMethod || belowCouponMinimum || settings.maintenanceMode}
          className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#E6540B] px-4 py-3 font-semibold text-white transition hover:bg-[#c94806] disabled:cursor-not-allowed disabled:bg-[#1A1613]/20"
        >
          {saving && <Loader2 size={18} className="animate-spin" />}
          {saving ? "Saving..." : paymentMethod && paymentMethod !== PaymentMethod.COD ? "Save and pay" : "Save changes"}
        </button>
        {!changed && <p className="mt-2 text-center text-xs text-[#1A1613]/50">Make a change to save.</p>}
        {settings.maintenanceMode && (
          <p className="mt-2 text-center text-xs text-amber-800">Changes are paused during maintenance.</p>
        )}
        <Link
          to={`/my-orders/orderdetails/${order.id}`}
          className="mt-3 block text-center text-sm font-medium text-[#1A1613]/60 hover:text-[#E6540B]"
        >
          {changed ? "Discard changes" : `Back to order ${label}`}
        </Link>
      </aside>
    </form>
  );
};

const EditMyOrders = () => {
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>();
  const { singleOrder, status } = useAppSelector((state) => state.checkout);
  const settings = useStoreSettings();

  const label = id ? formatOrderNumber(id, settings.orderPrefix) : "";
  usePageTitle(label ? `Edit order ${label}` : "Edit order");

  useEffect(() => {
    if (id) dispatch(fetchMySingleOrder(id)).catch(() => {});
  }, [dispatch, id]);

  const order = singleOrder?.id === id ? singleOrder : null;
  const isLoading = !order && status !== Status.ERROR && !(status === Status.SUCCESS && singleOrder === null);

  return (
    <div className="bg-[#FDF8ED] pt-16 text-[#1A1613]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "My orders", href: "/my-orders" },
            { label: `Order ${label}`, href: `/my-orders/orderdetails/${id}` },
            { label: "Edit" },
          ]}
        />
        <h1 className="text-2xl font-bold sm:text-3xl">Edit order {label}</h1>
        <p className="mb-6 mt-1 text-sm text-[#1A1613]/60">
          Change quantities, your delivery details or how you pay, until we start preparing your order.
        </p>

        {isLoading ? (
          <EditSkeleton />
        ) : !order ? (
          <div className={`${card} p-10 text-center`}>
            <PackageX className="mx-auto h-10 w-10 text-[#1A1613]/40" />
            <p className="mt-3 font-semibold">Order not found</p>
            <Link to="/my-orders" className="mt-4 inline-flex font-semibold text-[#E6540B] hover:underline">
              Back to my orders
            </Link>
          </div>
        ) : (
          <EditOrderForm key={order.id} order={order} label={label} />
        )}
      </div>
    </div>
  );
};

export default EditMyOrders;
