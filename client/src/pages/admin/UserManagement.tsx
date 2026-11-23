import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Ban, Check, CheckCircle2, Copy, Eye, Loader2, Mail, RefreshCw, Search, ShieldCheck, Trash2, X } from "lucide-react";
import { APIAuthenticated } from "../../http";
import { Skeleton } from "../../global/Skeleton";
import { formatOrderNumber } from "../../services/storeSettingsService";
import { hideBrokenImage } from "../../utils/helpers";

interface ManagedUser {
  id: string;
  username: string;
  email: string;
  avatar?: string | null;
  role: "customer" | "admin";
  isVerified: boolean;
  isBlocked: boolean;
  blockedAt: string | null;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

interface UserDetails extends ManagedUser {
  reviewCount: number;
  recentOrders: {
    id: string;
    totalAmount: number | string;
    orderStatus: string;
    createdAt: string;
    Payment?: { paymentMethod: string; paymentStatus: string };
  }[];
}

type RoleTab = "ALL" | "customer" | "admin";

const PAGE_SIZE = 10;
const card = "rounded-2xl border border-[#1A1613]/10 bg-[#FFFDF8] dark:border-white/10 dark:bg-[#1E1A17]";
const muted = "text-[#1A1613]/60 dark:text-[#F5EFE6]/55";
const strong = "text-[#1A1613] dark:text-[#F5EFE6]";
const control =
  "rounded-lg border border-[#1A1613]/15 bg-white px-3 py-2 text-sm text-[#1A1613] focus:outline-none focus:ring-2 focus:ring-[#E6540B]/30 dark:border-white/10 dark:bg-[#1E1A17] dark:text-[#F5EFE6]";
const iconButton =
  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#1A1613]/60 hover:bg-[#F4EEDF] hover:text-[#1A1613] disabled:cursor-not-allowed disabled:opacity-30 dark:text-[#F5EFE6]/60 dark:hover:bg-[#2A2420] dark:hover:text-[#F5EFE6]";

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
const rs = (n: number) => `Rs ${Math.round(n).toLocaleString()}`;
const errorMessage = (error: unknown, fallback: string) =>
  axios.isAxiosError(error) ? (error.response?.data as { message?: string } | undefined)?.message || fallback : fallback;

/** Profile picture, or the first letter when there's none (or it fails to load) */
const Avatar = ({ user, size = "h-9 w-9 text-sm" }: { user: ManagedUser; size?: string }) => (
  <span
    className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white ${size} ${
      user.role === "admin" ? "bg-violet-600" : "bg-[#E6540B]"
    }`}
  >
    {user.username?.trim()?.[0]?.toUpperCase() || "U"}
    {user.avatar && (
      <img src={user.avatar} alt="" onError={hideBrokenImage} className="absolute inset-0 h-full w-full object-cover" />
    )}
  </span>
);

const Verified = ({ yes }: { yes: boolean }) =>
  yes ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
      <CheckCircle2 className="h-3.5 w-3.5" /> Verified
    </span>
  ) : (
    <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Not verified</span>
  );

const RoleBadge = ({ role }: { role: ManagedUser["role"] }) =>
  role === "admin" ? (
    <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
      Admin
    </span>
  ) : (
    <span className={`text-xs ${muted}`}>Customer</span>
  );

const BlockedBadge = () => (
  <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-500/15 dark:text-red-400">
    Blocked
  </span>
);

const UserManagement: React.FC = () => {
  const [searchParams] = useSearchParams();
  // Deep links from the header search: ?search=sita or ?role=admin
  const linkedSearch = searchParams.get("search") || "";
  const linkedRole = searchParams.get("role");

  const [role, setRole] = useState<RoleTab>(linkedRole === "customer" || linkedRole === "admin" ? linkedRole : "ALL");
  const [searchInput, setSearchInput] = useState(linkedSearch);
  const [search, setSearch] = useState(linkedSearch);
  const [status, setStatus] = useState<"ALL" | "verified" | "unverified" | "blocked">("ALL");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [counts, setCounts] = useState({ all: 0, customer: 0, admin: 0 });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  // Which request the data on screen belongs to; anything else means we're loading
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const [details, setDetails] = useState<UserDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [toDelete, setToDelete] = useState<ManagedUser | null>(null);
  const [toBlock, setToBlock] = useState<ManagedUser | null>(null);
  const [blockingId, setBlockingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Wait until typing pauses before searching
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), role, status, sort });
  if (search) params.set("search", search);
  const requestKey = `${params.toString()}#${reloadKey}`;
  const loading = loadedKey !== requestKey;
  const load = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let current = true;
    const [query] = requestKey.split("#");
    APIAuthenticated.get(`/admin/customer?${query}`)
      .then((response) => {
        if (!current) return; // a newer search replaced this one
        setUsers(response.data.data || []);
        setCounts(response.data.counts || { all: 0, customer: 0, admin: 0 });
        setTotal(response.data.total || 0);
        setTotalPages(response.data.totalPages || 1);
        setLoadFailed(false);
        setLoadedKey(requestKey);
      })
      .catch(() => {
        if (!current) return;
        setLoadFailed(true);
        setLoadedKey(requestKey);
      });
    return () => {
      current = false;
    };
  }, [requestKey]);

  const openDetails = async (user: ManagedUser) => {
    setDetails({ ...user, reviewCount: 0, recentOrders: [] });
    setDetailsLoading(true);
    try {
      const response = await APIAuthenticated.get(`/admin/customer/${user.id}`);
      setDetails(response.data.data);
    } catch (error) {
      toast.error(errorMessage(error, "Couldn't load this user's details."));
    } finally {
      setDetailsLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete || deleting) return;
    setDeleting(true);
    try {
      await APIAuthenticated.delete(`/admin/customer/${toDelete.id}`);
      toast.success(`${toDelete.username}'s account was deleted`);
      if (details?.id === toDelete.id) setDetails(null);
      setToDelete(null);
      // Step back a page if that was the last user on it
      if (users.length === 1 && page > 1) setPage(page - 1);
      else load();
    } catch (error) {
      toast.error(errorMessage(error, "Couldn't delete this account."));
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  /** Block (after confirming) or unblock a customer, updating the list and the details panel */
  const setBlocked = async (user: ManagedUser, blocked: boolean) => {
    if (blockingId) return;
    setBlockingId(user.id);
    try {
      const response = await APIAuthenticated.patch(`/admin/customer/${user.id}/block`, { blocked });
      const { isBlocked, blockedAt } = response.data.data;
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isBlocked, blockedAt } : u)));
      setDetails((prev) => (prev && prev.id === user.id ? { ...prev, isBlocked, blockedAt } : prev));
      toast.success(response.data.message);
      setToBlock(null);
      if (status === "blocked" && !blocked) load();
    } catch (error) {
      toast.error(errorMessage(error, "Couldn't update this account."));
    } finally {
      setBlockingId(null);
    }
  };

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(email);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Couldn't copy to the clipboard");
    }
  };

  const tabs: { key: RoleTab; label: string; count: number }[] = [
    { key: "ALL", label: "All", count: counts.all },
    { key: "customer", label: "Customers", count: counts.customer },
    { key: "admin", label: "Admins", count: counts.admin },
  ];

  const hasHistory = (u: { orderCount: number; reviewCount?: number }) => u.orderCount > 0 || (u.reviewCount ?? 0) > 0;
  const firstLoad = loading && users.length === 0 && !loadFailed;

  const actions = (user: ManagedUser) => (
    <div className="flex items-center justify-end gap-0.5">
      <button type="button" onClick={() => openDetails(user)} className={iconButton} aria-label={`View ${user.username}`} title="View details">
        <Eye className="h-4 w-4" />
      </button>
      <a href={`mailto:${user.email}`} className={iconButton} aria-label={`Email ${user.username}`} title="Send email">
        <Mail className="h-4 w-4" />
      </a>
      {user.role === "customer" && (
        <button
          type="button"
          onClick={() => (user.isBlocked ? setBlocked(user, false) : setToBlock(user))}
          disabled={blockingId === user.id}
          className={iconButton}
          aria-label={user.isBlocked ? `Unblock ${user.username}` : `Block ${user.username}`}
          title={user.isBlocked ? "Unblock account" : "Block account"}
        >
          {user.isBlocked ? <ShieldCheck className="h-4 w-4 text-emerald-600" /> : <Ban className="h-4 w-4" />}
        </button>
      )}
      {user.role === "customer" && (
        <button
          type="button"
          onClick={() => setToDelete(user)}
          disabled={user.orderCount > 0}
          className={`${iconButton} hover:text-red-700 dark:hover:text-red-400`}
          aria-label={`Delete ${user.username}`}
          title={user.orderCount > 0 ? "Customers with orders can't be deleted" : "Delete account"}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-bold sm:text-3xl ${strong}`}>Users</h1>
          <p className={`mt-1 text-sm ${muted}`}>
            {counts.customer} {counts.customer === 1 ? "customer" : "customers"} · {counts.admin} {counts.admin === 1 ? "admin" : "admins"}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#1A1613]/15 bg-[#FFFDF8] px-3 py-1.5 text-sm font-medium text-[#1A1613] hover:bg-[#F4EEDF] disabled:opacity-60 dark:border-white/10 dark:bg-[#1E1A17] dark:text-[#F5EFE6] dark:hover:bg-[#2A2420]"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <section className={card}>
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-[#1A1613]/10 p-4 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Filter by role">
            {tabs.map((tab) => {
              const active = role === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setRole(tab.key);
                    setPage(1);
                  }}
                  className={`shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "bg-[#1A1613] text-white dark:bg-[#F5EFE6] dark:text-[#1A1613]"
                      : "text-[#1A1613]/70 hover:bg-[#F4EEDF] dark:text-[#F5EFE6]/70 dark:hover:bg-[#2A2420]"
                  }`}
                >
                  {tab.label} <span className="opacity-60">{tab.count}</span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1A1613]/40 dark:text-[#F5EFE6]/40" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search name or email"
                aria-label="Search users"
                className={`${control} w-full pl-9`}
              />
            </div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as typeof status);
                setPage(1);
              }}
              aria-label="Account status"
              className={`${control} cursor-pointer`}
            >
              <option value="ALL">Any status</option>
              <option value="verified">Verified email</option>
              <option value="unverified">Not verified</option>
              <option value="blocked">Blocked</option>
            </select>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              aria-label="Sort users"
              className={`${control} cursor-pointer`}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name_asc">Name A–Z</option>
              <option value="name_desc">Name Z–A</option>
            </select>
          </div>
        </div>

        {firstLoad ? (
          <div className="divide-y divide-[#1A1613]/8 dark:divide-white/10">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
            ))}
          </div>
        ) : loadFailed && users.length === 0 ? (
          <div className={`p-10 text-center text-sm ${muted}`}>
            Couldn't load users.{" "}
            <button type="button" onClick={load} className="cursor-pointer font-semibold text-[#E6540B] hover:underline">
              Try again
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className={`p-10 text-center text-sm ${muted}`}>
            No users match.{" "}
            {(search || status !== "ALL" || role !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setStatus("ALL");
                  setRole("ALL");
                  setPage(1);
                }}
                className="cursor-pointer font-semibold text-[#E6540B] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className={loading ? "opacity-60 transition-opacity" : ""}>
            {/* Phones: one card per user */}
            <ul className="divide-y divide-[#1A1613]/8 md:hidden dark:divide-white/10">
              {users.map((user) => (
                <li key={user.id} className="flex items-start gap-3 p-4">
                  <Avatar user={user} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`truncate font-semibold ${strong}`}>{user.username}</p>
                      {user.role === "admin" && <RoleBadge role="admin" />}
                      {user.isBlocked && <BlockedBadge />}
                    </div>
                    <p className={`truncate text-sm ${muted}`}>{user.email}</p>
                    <p className={`mt-1 text-xs ${muted}`}>
                      {user.orderCount} {user.orderCount === 1 ? "order" : "orders"} · {rs(user.totalSpent)} · joined {formatDate(user.createdAt)}
                    </p>
                    <div className="mt-1">
                      <Verified yes={user.isVerified} />
                    </div>
                  </div>
                  {actions(user)}
                </li>
              ))}
            </ul>

            {/* Larger screens: table */}
            <table className="hidden w-full text-sm md:table">
              <thead>
                <tr className={`border-b border-[#1A1613]/10 text-left text-xs font-semibold dark:border-white/10 ${muted}`}>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-right">Orders</th>
                  <th className="px-4 py-3 text-right">Spent</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1613]/8 dark:divide-white/10">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-[#F4EEDF]/40 dark:hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar user={user} />
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => openDetails(user)}
                            className={`block max-w-[220px] cursor-pointer truncate text-left font-semibold hover:text-[#E6540B] ${strong}`}
                          >
                            {user.username}
                          </button>
                          <span className={`flex items-center gap-1 ${muted}`}>
                            <span className="max-w-[220px] truncate">{user.email}</span>
                            <button
                              type="button"
                              onClick={() => copyEmail(user.email)}
                              className="cursor-pointer rounded p-0.5 hover:text-[#E6540B]"
                              aria-label={`Copy ${user.email}`}
                              title="Copy email"
                            >
                              {copied === user.email ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <RoleBadge role={user.role} />
                        {user.isBlocked && <BlockedBadge />}
                      </div>
                    </td>
                    <td className="px-4 py-3"><Verified yes={user.isVerified} /></td>
                    <td className={`px-4 py-3 text-right ${strong}`}>{user.orderCount}</td>
                    <td className={`px-4 py-3 text-right ${strong}`}>{user.totalSpent > 0 ? rs(user.totalSpent) : "—"}</td>
                    <td className={`px-4 py-3 ${muted}`}>{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3">{actions(user)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={`flex flex-wrap items-center justify-between gap-2 border-t border-[#1A1613]/10 px-4 py-3 text-sm dark:border-white/10 ${muted}`}>
              <span>
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setPage(page - 1)} disabled={page === 1 || loading} className={`${control} cursor-pointer disabled:cursor-not-allowed disabled:opacity-40`}>
                    Previous
                  </button>
                  <span>
                    Page {page} of {totalPages}
                  </span>
                  <button type="button" onClick={() => setPage(page + 1)} disabled={page >= totalPages || loading} className={`${control} cursor-pointer disabled:cursor-not-allowed disabled:opacity-40`}>
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Details panel */}
      {details && (
        <div className="fixed inset-0 z-[9999] flex justify-end bg-black/40" role="dialog" aria-modal="true" onClick={() => setDetails(null)}>
          <aside
            onClick={(e) => e.stopPropagation()}
            className="h-full w-full max-w-md overflow-y-auto bg-[#FFFDF8] p-5 shadow-xl dark:bg-[#1E1A17]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar user={details} size="h-12 w-12 text-lg" />
                <div className="min-w-0">
                  <p className={`truncate text-lg font-bold ${strong}`}>{details.username}</p>
                  <p className={`truncate text-sm ${muted}`}>{details.email}</p>
                </div>
              </div>
              <button type="button" onClick={() => setDetails(null)} className={iconButton} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <RoleBadge role={details.role} />
              {details.isBlocked && <BlockedBadge />}
              <Verified yes={details.isVerified} />
              <span className={`text-xs ${muted}`}>Joined {formatDate(details.createdAt)}</span>
            </div>

            <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Orders", value: String(details.orderCount) },
                { label: "Spent", value: rs(details.totalSpent) },
                { label: "Reviews", value: detailsLoading ? "…" : String(details.reviewCount) },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-[#1A1613]/10 p-3 dark:border-white/10">
                  <dt className={`text-xs ${muted}`}>{item.label}</dt>
                  <dd className={`mt-0.5 font-bold ${strong}`}>{item.value}</dd>
                </div>
              ))}
            </dl>

            <h3 className={`mt-6 text-sm font-semibold ${strong}`}>Latest orders</h3>
            {detailsLoading ? (
              <div className="mt-2 space-y-2">
                <Skeleton className="h-12 rounded-lg" />
                <Skeleton className="h-12 rounded-lg" />
              </div>
            ) : details.recentOrders.length === 0 ? (
              <p className={`mt-2 text-sm ${muted}`}>No orders yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-[#1A1613]/8 rounded-xl border border-[#1A1613]/10 dark:divide-white/10 dark:border-white/10">
                {details.recentOrders.map((order) => {
                  const label = formatOrderNumber(order.id);
                  return (
                    <li key={order.id}>
                      <Link
                        to={`/admin-dashboard/orders?search=${encodeURIComponent(label)}`}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm hover:bg-[#F4EEDF]/60 dark:hover:bg-white/5"
                      >
                        <span className="min-w-0">
                          <span className={`block font-medium ${strong}`}>{label}</span>
                          <span className={`block text-xs ${muted}`}>
                            {formatDate(order.createdAt)} · {order.orderStatus} · {order.Payment?.paymentMethod ?? "—"}
                          </span>
                        </span>
                        <span className={`shrink-0 font-semibold ${strong}`}>{rs(Number(order.totalAmount))}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {details.orderCount > details.recentOrders.length && !detailsLoading && (
              <Link
                to={`/admin-dashboard/orders?search=${encodeURIComponent(details.email)}`}
                className="mt-2 inline-block text-sm font-semibold text-[#E6540B] hover:underline"
              >
                See all {details.orderCount} orders
              </Link>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              <a
                href={`mailto:${details.email}`}
                className="inline-flex items-center gap-2 rounded-lg bg-[#E6540B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c94806]"
              >
                <Mail className="h-4 w-4" /> Email
              </a>
              <button
                type="button"
                onClick={() => copyEmail(details.email)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#1A1613]/15 px-4 py-2 text-sm font-semibold text-[#1A1613] hover:bg-[#F4EEDF] dark:border-white/10 dark:text-[#F5EFE6] dark:hover:bg-[#2A2420]"
              >
                {copied === details.email ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />} Copy email
              </button>
            </div>

            {details.role === "customer" && (
              <div className="mt-6 rounded-xl border border-[#1A1613]/10 p-4 dark:border-white/10">
                {details.isBlocked ? (
                  <>
                    <p className={`text-sm font-semibold ${strong}`}>Blocked since {formatDate(details.blockedAt)}</p>
                    <p className={`mt-1 text-xs ${muted}`}>They can't sign in or place orders. Their orders and reviews are kept.</p>
                    <button
                      type="button"
                      onClick={() => setBlocked(details, false)}
                      disabled={blockingId === details.id}
                      className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#1A1613]/15 px-3 py-1.5 text-sm font-semibold text-[#1A1613] hover:bg-[#F4EEDF] disabled:opacity-60 dark:border-white/10 dark:text-[#F5EFE6] dark:hover:bg-[#2A2420]"
                    >
                      {blockingId === details.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Unblock
                    </button>
                  </>
                ) : (
                  <>
                    <p className={`text-sm font-semibold ${strong}`}>Block this account</p>
                    <p className={`mt-1 text-xs ${muted}`}>
                      Stops them signing in and signs them out right away. Nothing is deleted, and you can unblock them later.
                    </p>
                    <button
                      type="button"
                      onClick={() => setToBlock(details)}
                      className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <Ban className="h-4 w-4" /> Block
                    </button>
                  </>
                )}
              </div>
            )}

            {details.role === "customer" && !detailsLoading && (
              <div className="mt-6 border-t border-[#1A1613]/10 pt-4 dark:border-white/10">
                {hasHistory(details) ? (
                  <p className={`text-xs ${muted}`}>
                    This account can't be deleted because it has orders or reviews, which are part of the store's records.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setToDelete(details)}
                    className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-red-700 hover:underline dark:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" /> Delete this account
                  </button>
                )}
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Block confirmation */}
      {toBlock && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4" role="alertdialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-[#FFFDF8] p-5 dark:bg-[#1E1A17]">
            <h2 className={`text-lg font-bold ${strong}`}>Block {toBlock.username}?</h2>
            <p className={`mt-2 text-sm ${muted}`}>
              They're signed out straight away and can't sign in or place orders until you unblock them. Their orders, reviews
              and details stay as they are. Orders already placed aren't cancelled automatically.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setToBlock(null)}
                disabled={!!blockingId}
                className="cursor-pointer rounded-lg border border-[#1A1613]/15 px-4 py-2 text-sm font-semibold text-[#1A1613] hover:bg-[#F4EEDF] dark:border-white/10 dark:text-[#F5EFE6] dark:hover:bg-[#2A2420]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setBlocked(toBlock, true)}
                disabled={!!blockingId}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {blockingId && <Loader2 className="h-4 w-4 animate-spin" />} Block account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {toDelete && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4" role="alertdialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-[#FFFDF8] p-5 dark:bg-[#1E1A17]">
            <h2 className={`text-lg font-bold ${strong}`}>Delete {toDelete.username}?</h2>
            <p className={`mt-2 text-sm ${muted}`}>
              Their account, cart, wishlist and notifications are removed for good. They can sign up again with the same email.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setToDelete(null)}
                disabled={deleting}
                className="cursor-pointer rounded-lg border border-[#1A1613]/15 px-4 py-2 text-sm font-semibold text-[#1A1613] hover:bg-[#F4EEDF] dark:border-white/10 dark:text-[#F5EFE6] dark:hover:bg-[#2A2420]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
