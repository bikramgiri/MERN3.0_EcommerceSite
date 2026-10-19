import { formatOrderNumber, orderNumberMatches } from "../../../services/storeSettingsService";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, RotateCw, Search } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../hooks/hooks";
import { fetchMyOrder } from "../../../store/customer/checkoutSlice";
import { type FetchOrder, OrderStatus, PaymentMethod, PaymentStatus } from "../../../types/customer/checkoutTypes";
import Breadcrumb from "../../../global/Breadcrumb";
import { Skeleton, SkeletonContainer } from "../../../global/Skeleton";
import { useStoreSettings } from "../../../services/storeSettingsService";
import { formatCurrency, hideBrokenImage, responsiveImage } from "../../../utils/helpers";
import usePageTitle from "../../../hooks/usePageTitle";

const PER_PAGE = 10;

type Tab = "all" | "active" | "delivered" | "cancelled";

const TABS: { key: Tab; label: string; matches: (order: FetchOrder) => boolean }[] = [
  { key: "all", label: "All", matches: () => true },
  {
    key: "active",
    label: "In progress",
    matches: (o) => [OrderStatus.Pending, OrderStatus.Preparation, OrderStatus.InTransit].includes(o.orderStatus),
  },
  { key: "delivered", label: "Delivered", matches: (o) => o.orderStatus === OrderStatus.Delivered },
  { key: "cancelled", label: "Cancelled", matches: (o) => o.orderStatus === OrderStatus.Cancelled },
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

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** An unpaid Khalti/eSewa order the shopper still needs to pay for */
const needsPayment = (order: FetchOrder) =>
  order.orderStatus === OrderStatus.Pending &&
  order.Payment?.paymentMethod !== PaymentMethod.COD &&
  order.Payment?.paymentStatus !== PaymentStatus.Paid;

const card = "rounded-xl border border-[#1A1613]/10 bg-white";

const ListSkeleton = () => (
  <SkeletonContainer label="Loading your orders" className="space-y-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className={`${card} p-5`}>
        <div className="flex justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="mt-4 flex gap-2">
          {Array.from({ length: 3 }).map((_, j) => (
            <Skeleton key={j} className="h-14 w-14 rounded-lg" />
          ))}
        </div>
      </div>
    ))}
  </SkeletonContainer>
);

const MyOrders = () => {
  usePageTitle("My orders");
  const dispatch = useAppDispatch();
  const orders = useAppSelector((state) => state.checkout.myOrder) || [];
  const { orderPrefix } = useStoreSettings();

  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = () => {
    setLoadFailed(false);
    dispatch(fetchMyOrder())
      .then(() => setLoaded(true))
      .catch(() => setLoadFailed(true));
  };

  useEffect(() => {
    dispatch(fetchMyOrder())
      .then(() => setLoaded(true))
      .catch(() => setLoadFailed(true));
  }, [dispatch]);

  const labelOf = (order: FetchOrder) => formatOrderNumber(order.id, orderPrefix);

  // Filter the whole list first, then split it into pages
  const term = search.trim().toLowerCase();
  const tabMatches = TABS.find((t) => t.key === tab)!.matches;
  const filtered = orders.filter(
    (order) =>
      tabMatches(order) &&
      (!term ||
        orderNumberMatches(order.id, term, orderPrefix) ||
        (order.OrderDetails ?? []).some((item) => item.Product?.productName?.toLowerCase().includes(term))),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageOrders = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const goToPage = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isInitialLoad = !loaded && !loadFailed && orders.length === 0;

  return (
    <div className="bg-[#FDF8ED] pt-16 text-[#1A1613]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "My orders" }]} />
        <h1 className="mb-6 text-2xl font-bold sm:text-3xl">My orders</h1>

        {isInitialLoad ? (
          <ListSkeleton />
        ) : loadFailed && orders.length === 0 ? (
          <div className={`${card} px-4 py-16 text-center`}>
            <p className="text-[#1A1613]/70">We couldn't load your orders right now.</p>
            <button
              type="button"
              onClick={load}
              className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#1A1613]/20 px-4 py-2 text-sm font-semibold hover:border-[#E6540B] hover:text-[#E6540B]"
            >
              <RotateCw className="h-4 w-4" /> Try again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#1A1613]/15 bg-white px-4 py-16 text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E6540B]/10">
              <Package className="h-7 w-7 text-[#E6540B]" />
            </span>
            <h2 className="text-xl font-semibold">No orders yet</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-[#1A1613]/60">
              When you place an order, you'll be able to track it here.
            </p>
            <Link
              to="/products"
              className="mt-6 inline-flex rounded-lg bg-[#E6540B] px-6 py-3 font-semibold text-white hover:bg-[#c94806]"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Filter orders">
                {TABS.map((t) => {
                  const count = orders.filter(t.matches).length;
                  const active = tab === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        setTab(t.key);
                        setPage(1);
                      }}
                      className={`shrink-0 cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition ${
                        active ? "bg-[#1A1613] text-white" : "text-[#1A1613]/70 hover:bg-[#F4EEDF]"
                      }`}
                    >
                      {t.label} <span className={active ? "text-white/70" : "text-[#1A1613]/40"}>{count}</span>
                    </button>
                  );
                })}
              </div>
              <div className="relative md:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1A1613]/40" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by order number or product"
                  aria-label="Search orders"
                  className="w-full rounded-lg border border-[#1A1613]/15 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-[#1A1613]/40 focus:outline-none focus:ring-2 focus:ring-[#E6540B]/30"
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className={`${card} px-4 py-12 text-center text-sm text-[#1A1613]/60`}>
                No orders match.{" "}
                <button
                  type="button"
                  onClick={() => {
                    setTab("all");
                    setSearch("");
                  }}
                  className="cursor-pointer font-semibold text-[#E6540B] hover:underline"
                >
                  Show all orders
                </button>
              </div>
            ) : (
              <ul className="space-y-4">
                {pageOrders.map((order) => {
                  const items = order.OrderDetails ?? [];
                  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
                  const detailsUrl = `/my-orders/orderdetails/${order.id}`;
                  const unpaid = needsPayment(order);
                  return (
                    <li key={order.id} className={`${card} transition hover:border-[#1A1613]/20`}>
                      <Link to={detailsUrl} className="block p-4 sm:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold">Order {labelOf(order)}</p>
                            <p className="text-sm text-[#1A1613]/60">
                              {formatDate(order.createdAt)} · {itemCount} {itemCount === 1 ? "item" : "items"}
                            </p>
                          </div>
                          <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${statusBadge[order.orderStatus]}`}>
                            {statusText[order.orderStatus] ?? order.orderStatus}
                          </span>
                        </div>

                        <div className="mt-4 flex items-end justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-2">
                            {items.slice(0, 4).map((item) => (
                              <img
                                key={item.productId}
                                {...responsiveImage(item.Product?.productImage, [120], "56px")}
                                alt={item.Product?.productName ?? ""}
                                title={item.Product?.productName}
                                loading="lazy"
                                onError={hideBrokenImage}
                                className="h-14 w-14 shrink-0 rounded-lg bg-[#F4EEDF] object-cover"
                              />
                            ))}
                            {items.length > 4 && (
                              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#F4EEDF] text-sm font-semibold text-[#1A1613]/60">
                                +{items.length - 4}
                              </span>
                            )}
                            {items.length === 1 && (
                              <p className="ml-1 line-clamp-2 min-w-0 text-sm text-[#1A1613]/80">{items[0].Product?.productName}</p>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="font-bold">{formatCurrency(Number(order.totalAmount))}</p>
                            <p className="text-xs text-[#1A1613]/50">
                              {order.Payment?.paymentStatus === PaymentStatus.Paid
                                ? "Paid"
                                : order.Payment?.paymentMethod === PaymentMethod.COD
                                  ? "Cash on delivery"
                                  : order.orderStatus === OrderStatus.Cancelled
                                    ? "Not paid"
                                    : "Awaiting payment"}
                            </p>
                          </div>
                        </div>

                        {unpaid && (
                          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                            Payment not completed. <span className="font-semibold underline">Pay now</span>
                            {order.paymentDueAt && (
                              <> before {new Date(order.paymentDueAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</>
                            )}
                          </p>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            {totalPages > 1 && (
              <nav aria-label="Order pages" className="mt-8 flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-10 cursor-pointer rounded-lg border border-[#1A1613]/15 bg-white px-3 text-sm hover:bg-[#F4EEDF] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-3 text-sm text-[#1A1613]/60">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-10 cursor-pointer rounded-lg border border-[#1A1613]/15 bg-white px-3 text-sm hover:bg-[#F4EEDF] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
