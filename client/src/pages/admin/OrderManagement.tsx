import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarDays, Check, Clock, Copy, Eye, Loader2, RefreshCw, Search, ShoppingBag, SlidersHorizontal, Trash2, TrendingUp, Truck } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { deleteAdminOrder, fetchAdminOrders, updateAdminOrderStatus } from "../../store/admin/orderSlice";
import { fetchDatas as syncDashboard } from "../../store/admin/datasSlice";
import type { AdminOrder, AdminOrderStatus } from "../../types/admin/orderTypes";
import { Status } from "../../global/statuses";
import { Skeleton } from "../../global/Skeleton";
import OrderViewModal from "../../components/admin/Orders/OrderViewModal";
import OrderStatusModal from "../../components/admin/Orders/OrderStatusModal";
import { connectSocket } from "../../services/socket";
import { formatOrderNumber } from "../../services/storeSettingsService";
import { hideBrokenImage, optimizeImageUrl } from "../../utils/helpers";

const PAGE_SIZE = 10;

type Tab = "ALL" | "TO_CONFIRM" | "AWAITING_PAYMENT" | "TO_DELIVER" | "Preparation" | "In Transit" | "Delivered" | "Cancelled";
type DateRange = "ALL" | "TODAY" | "WEEK" | "MONTH";
type Sort = "newest" | "oldest" | "amount_desc" | "amount_asc";

const card = "rounded-2xl border border-[#1A1613]/10 bg-[#FFFDF8] dark:border-white/10 dark:bg-[#1E1A17]";
const muted = "text-[#1A1613]/60 dark:text-[#F5EFE6]/55";
const strong = "text-[#1A1613] dark:text-[#F5EFE6]";
const control =
  "rounded-lg border border-[#1A1613]/15 bg-white px-3 py-2 text-sm text-[#1A1613] focus:outline-none focus:ring-2 focus:ring-[#E6540B]/30 dark:border-white/10 dark:bg-[#14110F] dark:text-[#F5EFE6] dark:scheme-dark";
const secondaryButton =
  "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#1A1613]/15 bg-[#FFFDF8] px-3 py-1.5 text-sm font-medium text-[#1A1613] hover:bg-[#F4EEDF] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#1E1A17] dark:text-[#F5EFE6] dark:hover:bg-[#2A2420]";
const iconButton =
  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#1A1613]/60 hover:bg-[#F4EEDF] hover:text-[#1A1613] disabled:cursor-not-allowed disabled:opacity-30 dark:text-[#F5EFE6]/60 dark:hover:bg-[#2A2420] dark:hover:text-[#F5EFE6]";

const rs = (n: number) => `Rs ${Math.round(n).toLocaleString()}`;
const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
const formatTime = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "");

const isOnline = (o: AdminOrder) => !!o.Payment && o.Payment.paymentMethod !== "COD";

// The server decides which orders belong to each tab (and counts them)
const TABS: { key: Tab; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "TO_CONFIRM", label: "To confirm" },
  { key: "AWAITING_PAYMENT", label: "Awaiting payment" },
  { key: "TO_DELIVER", label: "To deliver" },
  { key: "Preparation", label: "Preparing" },
  { key: "In Transit", label: "In transit" },
  { key: "Delivered", label: "Delivered" },
  { key: "Cancelled", label: "Cancelled" },
];

const statusStyle: Record<AdminOrderStatus, string> = {
  Pending: "bg-amber-500/10 text-amber-800 dark:text-amber-400",
  Preparation: "bg-sky-500/10 text-sky-800 dark:text-sky-400",
  "In Transit": "bg-indigo-500/10 text-indigo-800 dark:text-indigo-300",
  Delivered: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-400",
  Cancelled: "bg-red-500/10 text-red-800 dark:text-red-400",
};

const paymentText = (o: AdminOrder) => {
  const status = o.Payment?.paymentStatus;
  if (status === "Paid") return { text: "Paid", tone: "text-emerald-700 dark:text-emerald-400" };
  if (status === "Failed") return { text: "Payment failed", tone: "text-red-700 dark:text-red-400" };
  if (!isOnline(o)) return { text: o.orderStatus === "Cancelled" ? "Not collected" : "Pay on delivery", tone: muted };
  return { text: o.orderStatus === "Cancelled" ? "Not paid" : "Awaiting payment", tone: "text-amber-700 dark:text-amber-400" };
};

const methodText = (method?: string) => (method === "Esewa" ? "eSewa" : method === "COD" ? "Cash on delivery" : method || "—");


/** ?status=, ?payment=, ?method=, ?date=TODAY, ?search= links from the dashboard and other pages */
const tabFromLink = (status: string | null): Tab => {
  if (!status) return "ALL";
  if (status === "Pending" || status === "ACTION_REQUIRED") return "TO_CONFIRM";
  return (TABS.find((t) => t.key === status)?.key ?? "ALL") as Tab;
};

const OrderManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { orders, total, totalPages, currentPage, counts, stats: orderStats, status, actionLoading, error } = useAppSelector(
    (state) => state.adminOrder,
  );
  const [searchParams] = useSearchParams();

  const [tab, setTab] = useState<Tab>(() => {
    // An unpaid-online link (status=Pending&payment=Pending) opens the awaiting-payment list
    if (searchParams.get("status") === "Pending" && searchParams.get("payment") === "Pending") return "AWAITING_PAYMENT";
    return tabFromLink(searchParams.get("status"));
  });
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [payment, setPayment] = useState(() => {
    const p = searchParams.get("payment");
    return p && searchParams.get("status") !== "Pending" ? p : "ALL";
  });
  const [method, setMethod] = useState(searchParams.get("method") || "ALL");
  const [range, setRange] = useState<DateRange>(searchParams.get("date") === "TODAY" ? "TODAY" : "ALL");
  const [sort, setSort] = useState<Sort>("newest");
  const [page, setPage] = useState(1);

  const [viewing, setViewing] = useState<AdminOrder | null>(null);
  const [changing, setChanging] = useState<AdminOrder | null>(null);
  const [toDelete, setToDelete] = useState<AdminOrder | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Wait until typing pauses before searching
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Every filter change asks the server for the matching page
  useEffect(() => {
    dispatch(fetchAdminOrders({ tab, search, payment, method, range, sort, page, limit: PAGE_SIZE }));
  }, [dispatch, tab, search, payment, method, range, sort, page]);

  useEffect(() => {
    // New orders, payments and cancellations show up without refreshing (one reload per burst)
    const socket = connectSocket();
    const refresh = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      // Reloads the page that's on screen with the same filters
      refreshTimer.current = setTimeout(() => dispatch(fetchAdminOrders()), 800);
    };
    const events = ["admin:order-created", "admin:order-cancelled", "admin:payment-verified", "admin:payment-failed", "admin:dashboard-refresh"];
    events.forEach((event) => socket.on(event, refresh));
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      events.forEach((event) => socket.off(event, refresh));
    };
  }, [dispatch]);

  const copyNumber = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(formatOrderNumber(id)).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const changeStatus = async (id: string, next: AdminOrderStatus) => {
    const result = await dispatch(updateAdminOrderStatus(id, next));
    if (result?.success) {
      dispatch(syncDashboard()).catch(() => {});
      dispatch(fetchAdminOrders()); // tab counts and cards change
      return true;
    }
    return false;
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const result = await dispatch(deleteAdminOrder(toDelete.id));
    if (result?.success) {
      dispatch(syncDashboard()).catch(() => {});
      if (viewing?.id === toDelete.id) setViewing(null);
    }
    setToDelete(null);
  };

  const firstLoad = (status === Status.IDLE || status === Status.LOADING) && orders.length === 0 && !orderStats;
  const loading = status === Status.LOADING;
  const filtered = search !== "" || payment !== "ALL" || method !== "ALL" || range !== "ALL";
  const pageItems = orders;
  // The open order follows live updates (when it's on the current page)
  const viewingLive = viewing ? orders.find((o) => o.id === viewing.id) ?? viewing : null;

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setPayment("ALL");
    setMethod("ALL");
    setRange("ALL");
    setTab("ALL");
    setPage(1);
  };

  const stats = [
    { label: "Orders", value: (orderStats?.total ?? 0).toLocaleString(), hint: "All time", icon: ShoppingBag, tone: "bg-[#E6540B]/10 text-[#E6540B] dark:bg-[#E6540B]/15", onClick: resetFilters, active: false },
    { label: "Today", value: (orderStats?.today ?? 0).toLocaleString(), hint: orderStats?.todayValue ? `${rs(orderStats.todayValue)} ordered` : "No orders yet today", icon: CalendarDays, tone: "bg-sky-500/10 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400", onClick: () => { setRange(range === "TODAY" ? "ALL" : "TODAY"); setPage(1); }, active: range === "TODAY" },
    { label: "To confirm", value: (orderStats?.toConfirm ?? 0).toLocaleString(), hint: "Ready to start preparing", icon: Clock, tone: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400", onClick: () => { setTab(tab === "TO_CONFIRM" ? "ALL" : "TO_CONFIRM"); setPage(1); }, active: tab === "TO_CONFIRM" },
    { label: "To deliver", value: (orderStats?.toDeliver ?? 0).toLocaleString(), hint: "Preparing or in transit", icon: Truck, tone: "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300", onClick: () => { setTab(tab === "TO_DELIVER" ? "ALL" : "TO_DELIVER"); setPage(1); }, active: tab === "TO_DELIVER" },
    { label: "Revenue", value: rs(orderStats?.revenue ?? 0), hint: "Paid, not cancelled", icon: TrendingUp, tone: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400", onClick: null, active: false },
  ];

  const items = (o: AdminOrder) => {
    const lines = o.OrderDetails || [];
    const count = lines.reduce((sum, line) => sum + (line.quantity || 0), 0);
    return (
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {lines.slice(0, 3).map((line) => (
            <span key={line.id} className="relative h-8 w-8 overflow-hidden rounded-md border-2 border-[#FFFDF8] bg-[#F4EEDF] dark:border-[#1E1A17] dark:bg-white/5">
              <img src={optimizeImageUrl(line.Product?.productImage, 80)} alt="" loading="lazy" onError={hideBrokenImage} className="h-full w-full object-cover" />
            </span>
          ))}
        </div>
        <span className={`truncate text-xs ${muted}`}>
          {lines.length === 1 ? lines[0].Product?.productName ?? "1 item" : `${count} items`}
        </span>
      </div>
    );
  };

  const actions = (o: AdminOrder) => (
    <div className="flex items-center justify-end gap-0.5">
      <button type="button" onClick={() => setViewing(o)} className={iconButton} aria-label={`View ${formatOrderNumber(o.id)}`} title="View order"><Eye className="h-4 w-4" /></button>
      <button type="button" onClick={() => setChanging(o)} className={iconButton} aria-label={`Change status of ${formatOrderNumber(o.id)}`} title="Change status"><SlidersHorizontal className="h-4 w-4" /></button>
      <button
        type="button"
        onClick={() => setToDelete(o)}
        disabled={o.orderStatus !== "Cancelled"}
        className={`${iconButton} hover:text-red-700 dark:hover:text-red-400`}
        aria-label={`Delete ${formatOrderNumber(o.id)}`}
        title={o.orderStatus === "Cancelled" ? "Delete order" : "Only cancelled orders can be deleted"}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  const number = (o: AdminOrder) => (
    <span className="inline-flex items-center gap-1">
      <button type="button" onClick={() => setViewing(o)} className={`cursor-pointer font-semibold hover:text-[#E6540B] ${strong}`}>{formatOrderNumber(o.id)}</button>
      <button type="button" onClick={(e) => copyNumber(o.id, e)} className={`cursor-pointer rounded p-0.5 ${muted} hover:text-[#E6540B]`} aria-label="Copy order number" title="Copy order number">
        {copiedId === o.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </span>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-bold sm:text-3xl ${strong}`}>Orders</h1>
          <p className={`mt-1 text-sm ${muted}`}>Confirm, prepare and deliver orders, and keep customers updated.</p>
        </div>
        <button type="button" onClick={() => dispatch(fetchAdminOrders())} disabled={status === Status.LOADING} className={secondaryButton}>
          <RefreshCw className={`h-4 w-4 ${status === Status.LOADING ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const body = (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={`text-sm ${muted}`}>{stat.label}</p>
                  {firstLoad ? <Skeleton className="mt-1 h-7 w-14" /> : <p className={`mt-1 truncate text-xl font-bold sm:text-2xl ${strong}`}>{stat.value}</p>}
                </div>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.tone}`}><Icon className="h-4 w-4" /></span>
              </div>
              <p className={`mt-1 text-xs ${muted}`}>{stat.active ? "Showing these · click to show all" : stat.hint}</p>
            </>
          );
          return stat.onClick ? (
            <button
              key={stat.label}
              type="button"
              onClick={stat.onClick}
              aria-pressed={stat.active}
              className={`${card} cursor-pointer p-4 text-left transition hover:border-[#1A1613]/25 dark:hover:border-white/25 ${stat.active ? "!border-[#E6540B] ring-2 ring-[#E6540B]/15" : ""} ${stat.label === "Revenue" ? "col-span-2 lg:col-span-1" : ""}`}
            >
              {body}
            </button>
          ) : (
            <div key={stat.label} className={`${card} col-span-2 p-4 lg:col-span-1`}>{body}</div>
          );
        })}
      </div>

      <section className={card}>
        <div className="space-y-3 border-b border-[#1A1613]/10 p-4 dark:border-white/10">
          <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Order status">
            {TABS.map((t) => {
              const count = counts[t.key] ?? 0;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => { setTab(t.key); setPage(1); }}
                  className={`shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    active ? "bg-[#1A1613] text-white dark:bg-[#F5EFE6] dark:text-[#1A1613]" : "text-[#1A1613]/70 hover:bg-[#F4EEDF] dark:text-[#F5EFE6]/70 dark:hover:bg-[#2A2420]"
                  }`}
                >
                  {t.label} <span className="opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative lg:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1A1613]/40 dark:text-[#F5EFE6]/40" />
              <input type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Order number, customer, phone or product" aria-label="Search orders" className={`${control} w-full pl-9`} />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-1 sm:justify-end">
              <select value={range} onChange={(e) => { setRange(e.target.value as DateRange); setPage(1); }} aria-label="Date" className={`${control} cursor-pointer`}>
                <option value="ALL">Any date</option>
                <option value="TODAY">Today</option>
                <option value="WEEK">Last 7 days</option>
                <option value="MONTH">This month</option>
              </select>
              <select value={method} onChange={(e) => { setMethod(e.target.value); setPage(1); }} aria-label="Payment method" className={`${control} cursor-pointer`}>
                <option value="ALL">Any payment method</option>
                <option value="COD">Cash on delivery</option>
                <option value="Khalti">Khalti</option>
                <option value="Esewa">eSewa</option>
              </select>
              <select value={payment} onChange={(e) => { setPayment(e.target.value); setPage(1); }} aria-label="Payment status" className={`${control} cursor-pointer`}>
                <option value="ALL">Paid or unpaid</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Not paid yet</option>
                <option value="Failed">Payment failed</option>
              </select>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort" className={`${control} cursor-pointer`}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="amount_desc">Highest total</option>
                <option value="amount_asc">Lowest total</option>
              </select>
            </div>
          </div>
        </div>

        {firstLoad ? (
          <div className="divide-y divide-[#1A1613]/8 dark:divide-white/10">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="h-4 w-24" />
                <div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-56" /></div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : status === Status.ERROR && orders.length === 0 ? (
          <div className={`p-10 text-center text-sm ${muted}`}>
            {error || "Couldn't load orders."}{" "}
            <button type="button" onClick={() => dispatch(fetchAdminOrders())} className="cursor-pointer font-semibold text-[#E6540B] hover:underline">Try again</button>
          </div>
        ) : (orderStats?.total ?? 0) === 0 ? (
          <div className="p-10 text-center">
            <p className={`font-semibold ${strong}`}>No orders yet</p>
            <p className={`mt-1 text-sm ${muted}`}>New orders appear here straight away.</p>
          </div>
        ) : orders.length === 0 ? (
          <div className={`p-10 text-center text-sm ${muted}`}>
            No orders match.{" "}
            {(filtered || tab !== "ALL") && <button type="button" onClick={resetFilters} className="cursor-pointer font-semibold text-[#E6540B] hover:underline">Clear filters</button>}
          </div>
        ) : (
          <>
            {/* Phones */}
            <ul className={`${loading ? "opacity-60" : ""} divide-y divide-[#1A1613]/8 md:hidden dark:divide-white/10`}>
              {pageItems.map((o) => {
                const pay = paymentText(o);
                return (
                  <li key={o.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {number(o)}
                        <p className={`text-xs ${muted}`}>{formatDate(o.createdAt)} · {formatTime(o.createdAt)}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyle[o.orderStatus]}`}>{o.orderStatus}</span>
                    </div>
                    <p className={`mt-2 text-sm font-medium ${strong}`}>{o.User?.username ?? "Customer"}</p>
                    <div className="mt-2">{items(o)}</div>
                    <div className="mt-2 flex items-end justify-between gap-2">
                      <div>
                        <p className={`font-bold ${strong}`}>{rs(Number(o.totalAmount))}</p>
                        <p className={`text-xs ${pay.tone}`}>{methodText(o.Payment?.paymentMethod)} · {pay.text}</p>
                      </div>
                      {actions(o)}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Larger screens */}
            <div className={`hidden overflow-x-auto md:block ${loading ? "opacity-60" : ""}`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className={`border-b border-[#1A1613]/10 text-left text-xs font-semibold dark:border-white/10 ${muted}`}>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="hidden px-4 py-3 xl:table-cell">Items</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1613]/8 dark:divide-white/10">
                  {pageItems.map((o) => {
                    const pay = paymentText(o);
                    return (
                      <tr key={o.id} className="hover:bg-[#F4EEDF]/40 dark:hover:bg-white/5">
                        <td className="px-4 py-3">
                          {number(o)}
                          <p className={`text-xs ${muted}`}>{formatDate(o.createdAt)} · {formatTime(o.createdAt)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className={`max-w-[180px] truncate font-medium ${strong}`}>{o.User?.username ?? "Customer"}</p>
                          <p className={`max-w-[180px] truncate text-xs ${muted}`}>{o.phoneNumber}</p>
                        </td>
                        <td className="hidden max-w-[220px] px-4 py-3 xl:table-cell">{items(o)}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${strong}`}>{rs(Number(o.totalAmount))}</td>
                        <td className="px-4 py-3">
                          <p className={`text-xs ${strong}`}>{methodText(o.Payment?.paymentMethod)}</p>
                          <p className={`text-xs font-medium ${pay.tone}`}>{pay.text}</p>
                        </td>
                        <td className="px-4 py-3">
                          <button type="button" onClick={() => setChanging(o)} className={`cursor-pointer rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyle[o.orderStatus]}`} title="Change status">
                            {o.orderStatus}
                          </button>
                        </td>
                        <td className="px-4 py-3">{actions(o)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={`flex flex-wrap items-center justify-between gap-2 border-t border-[#1A1613]/10 px-4 py-3 text-sm dark:border-white/10 ${muted}`}>
              <span>{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, total)} of {total}</span>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1 || loading} className={secondaryButton}>Previous</button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage === totalPages || loading} className={secondaryButton}>Next</button>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <OrderViewModal
        order={viewingLive}
        onClose={() => setViewing(null)}
        onOpenStatusModal={(o) => setChanging(o)}
        onCopyId={copyNumber}
        copiedId={copiedId}
        formatDate={formatDate}
      />
      <OrderStatusModal
        key={changing?.id ?? "none"}
        isOpen={!!changing}
        order={changing ? orders.find((o) => o.id === changing.id) ?? changing : null}
        onClose={() => setChanging(null)}
        onSubmit={changeStatus}
        loading={actionLoading}
      />
      {toDelete && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4" role="alertdialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-[#FFFDF8] p-5 dark:bg-[#1E1A17]">
            <h2 className={`text-lg font-bold ${strong}`}>Delete order {formatOrderNumber(toDelete.id)}?</h2>
            <p className={`mt-2 text-sm ${muted}`}>The cancelled order is removed for good, and the customer is told it was removed.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setToDelete(null)} disabled={actionLoading} className={secondaryButton}>Cancel</button>
              <button type="button" onClick={confirmDelete} disabled={actionLoading} className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
