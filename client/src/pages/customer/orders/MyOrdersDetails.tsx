import { formatOrderNumber } from "../../../services/storeSettingsService";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Check, Loader2, PackageX, RotateCcw } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../hooks/hooks";
import { cancelMyOrders, fetchMySingleOrder } from "../../../store/customer/checkoutSlice";
import { addToCart } from "../../../store/customer/cartSlice";
import { OrderStatus, PaymentMethod, PaymentStatus } from "../../../types/customer/checkoutTypes";
import Breadcrumb from "../../../global/Breadcrumb";
import { Status } from "../../../global/statuses";
import { Skeleton, SkeletonContainer } from "../../../global/Skeleton";
import { formatCurrency, hideBrokenImage, responsiveImage } from "../../../utils/helpers";
import { itemsSubtotal, orderBreakdown, unitPriceOf } from "../../../utils/orderTotals";
import { useStoreSettings } from "../../../services/storeSettingsService";
import PayAgainBox from "../../../components/customer/PayAgainBox";
import usePageTitle from "../../../hooks/usePageTitle";

const STEPS = [
  { status: OrderStatus.Pending, label: "Order placed" },
  { status: OrderStatus.Preparation, label: "Preparing" },
  { status: OrderStatus.InTransit, label: "On the way" },
  { status: OrderStatus.Delivered, label: "Delivered" },
];

const statusBadge: Record<OrderStatus, string> = {
  [OrderStatus.Pending]: "bg-amber-50 text-amber-800",
  [OrderStatus.Preparation]: "bg-sky-50 text-sky-800",
  [OrderStatus.InTransit]: "bg-indigo-50 text-indigo-800",
  [OrderStatus.Delivered]: "bg-emerald-50 text-emerald-800",
  [OrderStatus.Cancelled]: "bg-red-50 text-red-800",
};

const statusText: Record<OrderStatus, string> = {
  [OrderStatus.Pending]: "Placed",
  [OrderStatus.Preparation]: "Preparing",
  [OrderStatus.InTransit]: "On the way",
  [OrderStatus.Delivered]: "Delivered",
  [OrderStatus.Cancelled]: "Cancelled",
};

const paymentMethodText: Record<PaymentMethod, string> = {
  [PaymentMethod.COD]: "Cash on delivery",
  [PaymentMethod.Khalti]: "Khalti",
  [PaymentMethod.Esewa]: "eSewa",
};

const card = "rounded-xl border border-[#1A1613]/10 bg-white";
const outlineButton =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#1A1613]/20 bg-white px-4 py-2 text-sm font-semibold hover:border-[#E6540B] hover:text-[#E6540B] disabled:cursor-not-allowed disabled:opacity-50";

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const errorMessage = (error: unknown, fallback: string) =>
  axios.isAxiosError(error) ? (error.response?.data as { message?: string } | undefined)?.message || fallback : fallback;

const DetailsSkeleton = () => (
  <SkeletonContainer label="Loading order" className="space-y-6">
    <Skeleton className="h-8 w-56" />
    <Skeleton className="h-16 w-full rounded-xl" />
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className={`${card} space-y-4 p-5`}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-20 w-20 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
      <div className={`${card} space-y-3 p-5`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  </SkeletonContainer>
);

const MyOrdersDetails = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>();
  const { singleOrder, status } = useAppSelector((state) => state.checkout);
  const settings = useStoreSettings();

  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [buyingAgain, setBuyingAgain] = useState(false);

  const label = id ? formatOrderNumber(id, settings.orderPrefix) : "";
  usePageTitle(label ? `Order ${label}` : "Order");

  useEffect(() => {
    if (id) dispatch(fetchMySingleOrder(id)).catch(() => {});
  }, [dispatch, id]);

  const order = singleOrder?.id === id ? singleOrder : null;
  const isLoading = !order && status !== Status.ERROR && !(status === Status.SUCCESS && singleOrder === null);

  const handleCancel = async () => {
    if (!order || cancelling) return;
    setCancelling(true);
    try {
      await dispatch(cancelMyOrders(order.id));
      toast.success("Order cancelled. Its items are back in stock.");
      setConfirmingCancel(false);
    } catch (error) {
      toast.error(errorMessage(error, "Couldn't cancel the order. Please try again."));
      dispatch(fetchMySingleOrder(order.id)).catch(() => {});
    } finally {
      setCancelling(false);
    }
  };

  const handleBuyAgain = async () => {
    if (!order || buyingAgain) return;
    setBuyingAgain(true);
    let added = 0;
    let skipped = 0;
    for (const item of order.OrderDetails ?? []) {
      if (!item.Product || item.Product.productStock <= 0) {
        skipped++;
        continue;
      }
      try {
        await dispatch(addToCart(item.productId, Math.min(item.quantity, item.Product.productStock)));
        added++;
      } catch {
        skipped++;
      }
    }
    setBuyingAgain(false);
    if (added === 0) {
      toast.error("These items are out of stock right now.");
      return;
    }
    toast.success(skipped ? `Added ${added} item(s) to your cart. ${skipped} couldn't be added.` : "Added to your cart");
    navigate("/cart");
  };

  if (isLoading) {
    return (
      <div className="bg-[#FDF8ED] pt-16 text-[#1A1613]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumb items={[{ label: "My orders", href: "/my-orders" }, { label: "Order" }]} />
          <DetailsSkeleton />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-[#FDF8ED] px-4 pb-16 pt-28 text-center text-[#1A1613]">
        <PackageX className="mx-auto h-12 w-12 text-[#1A1613]/40" />
        <h1 className="mt-4 text-2xl font-bold">Order not found</h1>
        <p className="mt-1 text-[#1A1613]/60">It may have been removed, or the link is wrong.</p>
        <Link
          to="/my-orders"
          className="mt-6 inline-flex rounded-lg bg-[#E6540B] px-6 py-3 font-semibold text-white hover:bg-[#c94806]"
        >
          Back to my orders
        </Link>
      </div>
    );
  }

  const items = order.OrderDetails ?? [];
  const { subtotal, discount, shipping, total, couponCode } = orderBreakdown(order, itemsSubtotal(items));
  const isCancelled = order.orderStatus === OrderStatus.Cancelled;
  const isPending = order.orderStatus === OrderStatus.Pending;
  const isPaid = order.Payment?.paymentStatus === PaymentStatus.Paid;
  const currentStep = STEPS.findIndex((step) => step.status === order.orderStatus);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const isCod = order.Payment?.paymentMethod === PaymentMethod.COD;

  // One plain sentence about what the current step means for the shopper
  const stepHint = (() => {
    switch (order.orderStatus) {
      case OrderStatus.Pending:
        if (!isCod && !isPaid) return "We'll start packing as soon as your payment is confirmed.";
        return isCod
          ? "We've got your order and will start packing it soon. You can still edit or cancel it until then."
          : "Payment received. We'll start packing your order soon.";
      case OrderStatus.Preparation:
        return "We're packing your order. It can't be changed now, so contact us if you need help with it.";
      case OrderStatus.InTransit:
        return `Your order is on its way. The delivery partner will call ${order.phoneNumber} before arriving${
          isCod && !isPaid ? `; please keep ${formatCurrency(total)} ready` : ""
        }.`;
      case OrderStatus.Delivered:
        return "Delivered. We hope you like it! You can review the items below or buy them again.";
      default:
        return "";
    }
  })();

  return (
    <div className="bg-[#FDF8ED] pt-16 text-[#1A1613]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "My orders", href: "/my-orders" }, { label: `Order ${label}` }]} />

        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold sm:text-3xl">Order {label}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${statusBadge[order.orderStatus]}`}>
                {statusText[order.orderStatus] ?? order.orderStatus}
              </span>
            </div>
            <p className="mt-1 text-sm text-[#1A1613]/60">
              Placed {formatDateTime(order.createdAt)} · {itemCount} {itemCount === 1 ? "item" : "items"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isPending && !isPaid && (
              <Link to={`/my-orders/orderdetails/editorders/${order.id}`} className={outlineButton}>
                Edit order
              </Link>
            )}
            {isPending && (
              <button type="button" onClick={() => setConfirmingCancel(true)} className={outlineButton}>
                Cancel order
              </button>
            )}
            {(isCancelled || order.orderStatus === OrderStatus.Delivered) && (
              <button type="button" onClick={handleBuyAgain} disabled={buyingAgain} className={outlineButton}>
                {buyingAgain ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                Buy again
              </button>
            )}
          </div>
        </div>

        {/* Progress */}
        {isCancelled ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            This order was cancelled. Nothing more will happen with it
            {isPaid ? ", and since it was paid online, we'll refund you." : "."}
          </div>
        ) : (
          <div className={`${card} mb-6 p-4 sm:p-5`}>
          <ol className="grid grid-cols-4 gap-2">
            {STEPS.map((step, index) => {
              const done = index <= currentStep;
              return (
                <li key={step.status} className="relative flex flex-col items-center text-center">
                  {index > 0 && (
                    <span
                      aria-hidden="true"
                      className={`absolute right-1/2 top-3.5 h-0.5 w-full -translate-y-1/2 ${index <= currentStep ? "bg-[#E6540B]" : "bg-[#1A1613]/10"}`}
                    />
                  )}
                  <span
                    className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      done ? "bg-[#E6540B] text-white" : "border-2 border-[#1A1613]/15 bg-white text-[#1A1613]/40"
                    }`}
                  >
                    {done ? <Check size={14} strokeWidth={3} /> : index + 1}
                  </span>
                  <span className={`mt-2 text-xs sm:text-sm ${index === currentStep ? "font-semibold" : "text-[#1A1613]/60"}`}>
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
          {stepHint && (
            <p className="mt-4 border-t border-[#1A1613]/10 pt-3 text-center text-sm text-[#1A1613]/70">{stepHint}</p>
          )}
          </div>
        )}

        <PayAgainBox order={order} />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <section className={card}>
            <h2 className="border-b border-[#1A1613]/10 px-5 py-4 text-lg font-semibold">Items</h2>
            <ul className="divide-y divide-[#1A1613]/10">
              {items.map((item) => {
                const price = unitPriceOf(item);
                const productUrl = `/productdetails/${item.productId}`;
                return (
                  <li key={item.productId} className="flex gap-4 p-5">
                    <Link to={productUrl} className="shrink-0" tabIndex={-1} aria-hidden="true">
                      <img
                        {...responsiveImage(item.Product?.productImage, [120, 200], "80px")}
                        alt=""
                        loading="lazy"
                        onError={hideBrokenImage}
                        className="h-20 w-20 rounded-lg bg-[#F4EEDF] object-cover"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {item.Product?.category?.categoryName && (
                            <p className="truncate text-xs text-[#1A1613]/50">{item.Product.category.categoryName}</p>
                          )}
                          <Link to={productUrl} className="line-clamp-2 font-semibold hover:text-[#E6540B]">
                            {item.Product?.productName ?? "Product no longer available"}
                          </Link>
                          <p className="mt-0.5 text-sm text-[#1A1613]/60">
                            {item.quantity} × {formatCurrency(price)}
                          </p>
                        </div>
                        <p className="shrink-0 font-semibold">{formatCurrency(price * item.quantity)}</p>
                      </div>
                      {order.orderStatus === OrderStatus.Delivered && item.Product && (
                        <Link
                          to={`${productUrl}#reviews`}
                          className="mt-2 inline-block text-sm font-semibold text-[#E6540B] hover:underline"
                        >
                          Write a review
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="space-y-6">
            <section className={`${card} p-5`}>
              <h2 className="text-lg font-semibold">Summary</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[#1A1613]/70">Subtotal</dt>
                  <dd className="font-medium">{formatCurrency(subtotal)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-[#1A1613]/70">Discount{couponCode ? ` (${couponCode})` : ""}</dt>
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
              <div className="mt-4 flex justify-between border-t border-[#1A1613]/10 pt-4 text-sm">
                <span className="text-[#1A1613]/70">
                  {order.Payment ? paymentMethodText[order.Payment.paymentMethod] ?? order.Payment.paymentMethod : "Payment"}
                </span>
                <span
                  className={`font-semibold ${
                    isPaid ? "text-emerald-700" : order.Payment?.paymentStatus === PaymentStatus.Failed ? "text-red-700" : "text-amber-700"
                  }`}
                >
                  {isPaid
                    ? "Paid"
                    : order.Payment?.paymentStatus === PaymentStatus.Failed
                      ? "Not completed"
                      : order.Payment?.paymentMethod === PaymentMethod.COD
                        ? "Pay on delivery"
                        : "Awaiting payment"}
                </span>
              </div>
            </section>

            <section className={`${card} p-5 text-sm`}>
              <h2 className="text-lg font-semibold">Delivery</h2>
              <p className="mt-3 text-[#1A1613]/80">{order.shippingAddress}</p>
              <p className="mt-1 text-[#1A1613]/60">{order.phoneNumber}</p>
            </section>

            {(settings.supportEmail || settings.supportPhone) && (
              <p className="px-1 text-sm text-[#1A1613]/60">
                Questions about this order? Contact us
                {settings.supportPhone && (
                  <>
                    {" "}at{" "}
                    <a href={`tel:${settings.supportPhone}`} className="font-medium text-[#1A1613] hover:text-[#E6540B]">
                      {settings.supportPhone}
                    </a>
                  </>
                )}
                {settings.supportEmail && (
                  <>
                    {settings.supportPhone ? " or " : " at "}
                    <a
                      href={`mailto:${settings.supportEmail}?subject=${encodeURIComponent(`Order ${label}`)}`}
                      className="font-medium text-[#1A1613] hover:text-[#E6540B]"
                    >
                      {settings.supportEmail}
                    </a>
                  </>
                )}{" "}
                and mention order {label}.
              </p>
            )}
          </div>
        </div>
      </div>

      {confirmingCancel && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" role="alertdialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-xl bg-white p-5">
            <h2 className="text-lg font-bold">Cancel order {label}?</h2>
            <p className="mt-2 text-sm text-[#1A1613]/70">
              The items go back on sale and the order can't be restored. You can always order again.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmingCancel(false)} disabled={cancelling} className={outlineButton}>
                Keep order
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {cancelling && <Loader2 size={16} className="animate-spin" />}
                Cancel order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrdersDetails;
