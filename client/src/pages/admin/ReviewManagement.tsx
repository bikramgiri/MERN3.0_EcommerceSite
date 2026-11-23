import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, Camera, Check, Clock, Eye, EyeOff, Loader2, MessageSquare, MessageSquareReply, RefreshCw, Search, Star, Trash2, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import {
  bulkDeleteReviews,
  bulkUpdateReviewStatus,
  deleteAdminReview,
  fetchAdminReviews,
  updateReviewStatus,
} from "../../store/admin/reviewSlice";
import { fetchDatas as syncDashboard } from "../../store/admin/datasSlice";
import type { AdminReview, ReviewModerationStatus } from "../../types/admin/reviewTypes";
import { Status } from "../../global/statuses";
import { Skeleton } from "../../global/Skeleton";
import ReviewViewModal from "../../components/admin/Reviews/ReviewViewModal";
import { connectSocket } from "../../services/socket";
import { hideBrokenImage, optimizeImageUrl } from "../../utils/helpers";

const PAGE_SIZE = 10;

type Tab = "ALL" | "TO_CHECK" | "APPROVED" | "PENDING" | "FLAGGED";
type RatingFilter = "ALL" | "5" | "4" | "3" | "2" | "1" | "LOW";
type PhotoFilter = "ALL" | "WITH" | "WITHOUT";
type Sort = "newest" | "oldest" | "rating_desc" | "rating_asc";

const card = "rounded-2xl border border-[#1A1613]/10 bg-[#FFFDF8] dark:border-white/10 dark:bg-[#1E1A17]";
const muted = "text-[#1A1613]/60 dark:text-[#F5EFE6]/55";
const strong = "text-[#1A1613] dark:text-[#F5EFE6]";
const control =
  "rounded-lg border border-[#1A1613]/15 bg-white px-3 py-2 text-sm text-[#1A1613] focus:outline-none focus:ring-2 focus:ring-[#E6540B]/30 dark:border-white/10 dark:bg-[#14110F] dark:text-[#F5EFE6] dark:scheme-dark";
const secondaryButton =
  "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#1A1613]/15 bg-[#FFFDF8] px-3 py-1.5 text-sm font-medium text-[#1A1613] hover:bg-[#F4EEDF] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#1E1A17] dark:text-[#F5EFE6] dark:hover:bg-[#2A2420]";
const iconButton =
  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#1A1613]/60 hover:bg-[#F4EEDF] hover:text-[#1A1613] dark:text-[#F5EFE6]/60 dark:hover:bg-[#2A2420] dark:hover:text-[#F5EFE6]";

/** Reviews saved before moderation existed have no status; they count as approved */
const statusOf = (r: AdminReview): ReviewModerationStatus => r.status || "APPROVED";

const TABS: { key: Tab; label: string; matches: (r: AdminReview) => boolean }[] = [
  { key: "ALL", label: "All", matches: () => true },
  { key: "TO_CHECK", label: "To check", matches: (r) => statusOf(r) !== "APPROVED" },
  { key: "APPROVED", label: "Visible", matches: (r) => statusOf(r) === "APPROVED" },
  { key: "PENDING", label: "Pending", matches: (r) => statusOf(r) === "PENDING" },
  { key: "FLAGGED", label: "Flagged", matches: (r) => statusOf(r) === "FLAGGED" },
];

const statusTone: Record<ReviewModerationStatus, string> = {
  APPROVED: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-400",
  PENDING: "bg-amber-500/10 text-amber-800 dark:text-amber-400",
  FLAGGED: "bg-red-500/10 text-red-800 dark:text-red-400",
};

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const Stars = ({ rating }: { rating: number }) => (
  <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} className={`h-3.5 w-3.5 ${n <= rating ? "text-amber-400" : "text-[#1A1613]/15 dark:text-white/15"}`} fill="currentColor" strokeWidth={0} />
    ))}
  </span>
);

/** Links like ?status=PENDING|FLAGGED|TO_CHECK, ?rating=1, ?search= from the dashboard and header search */
const tabFromLink = (value: string | null): Tab => {
  const v = (value || "").toUpperCase();
  return (["TO_CHECK", "APPROVED", "PENDING", "FLAGGED"].includes(v) ? v : "ALL") as Tab;
};

const ReviewManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { reviews, total, totalPages, currentPage, counts, stats: reviewStats, status, actionLoading, error } = useAppSelector(
    (state) => state.adminReview,
  );
  const [searchParams] = useSearchParams();

  const [tab, setTab] = useState<Tab>(tabFromLink(searchParams.get("status")));
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [rating, setRating] = useState<RatingFilter>(() => {
    const r = searchParams.get("rating") || "";
    return (["5", "4", "3", "2", "1", "LOW"].includes(r.toUpperCase()) ? r.toUpperCase() : "ALL") as RatingFilter;
  });
  const [photos, setPhotos] = useState<PhotoFilter>("ALL");
  const [sort, setSort] = useState<Sort>("newest");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);

  const [viewing, setViewing] = useState<AdminReview | null>(null);
  const [toDelete, setToDelete] = useState<AdminReview | null>(null);
  const [bulkDelete, setBulkDelete] = useState(false);
  const [statusBusy, setStatusBusy] = useState<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Wait until typing pauses before searching
  useEffect(() => {
    const next = searchInput.trim();
    if (next === search) return;
    const timer = setTimeout(() => {
      setSearch(next);
      setPage(1);
      setSelected([]);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  // Every filter or page change asks the server for that page
  useEffect(() => {
    dispatch(fetchAdminReviews({ tab, search, rating, photo: photos, sort, page, limit: PAGE_SIZE }));
  }, [dispatch, tab, search, rating, photos, sort, page]);

  useEffect(() => {
    // New reviews and changes from other admins appear without refreshing (one reload per burst)
    const socket = connectSocket();
    const refresh = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => dispatch(fetchAdminReviews()), 800);
    };
    socket.on("admin:review-created", refresh);
    socket.on("admin:dashboard-refresh", refresh);
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      socket.off("admin:review-created", refresh);
      socket.off("admin:dashboard-refresh", refresh);
    };
  }, [dispatch]);

  /** Any filter change clears the selection, so bulk actions only touch reviews that are on screen */
  const withReset = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
    setSelected([]);
  };
  const changeTab = withReset(setTab);
  const changeRating = withReset(setRating);
  const changePhotos = withReset(setPhotos);
  const changeSort = withReset(setSort);

  // Tab counts, cards and the page itself change after an action, so reload the page on screen
  const syncAfterChange = () => {
    dispatch(fetchAdminReviews());
    dispatch(syncDashboard()).catch(() => {});
  };

  const changeStatus = async (review: AdminReview, next: ReviewModerationStatus) => {
    if (statusOf(review) === next) return;
    setStatusBusy(review.id);
    const result = await dispatch(updateReviewStatus(review.id, next));
    setStatusBusy(null);
    if (result?.success) syncAfterChange();
  };

  const bulkStatus = async (next: ReviewModerationStatus) => {
    if (!selected.length) return;
    const result = await dispatch(bulkUpdateReviewStatus(selected, next));
    if (result?.success) {
      setSelected([]);
      syncAfterChange();
    }
  };

  const confirmDelete = async () => {
    if (bulkDelete) {
      const result = await dispatch(bulkDeleteReviews(selected));
      if (result?.success) {
        setSelected([]);
        syncAfterChange();
      }
      setBulkDelete(false);
      return;
    }
    if (!toDelete) return;
    const result = await dispatch(deleteAdminReview(toDelete.id));
    if (result?.success) {
      setSelected((prev) => prev.filter((id) => id !== toDelete.id));
      if (viewing?.id === toDelete.id) setViewing(null);
      syncAfterChange();
    }
    setToDelete(null);
  };

  // Numbers for the cards come from the server (whole store); the average counts visible reviews only,
  // the same rating shoppers see
  const pageItems = reviews;
  const firstLoad = !reviewStats && status !== Status.ERROR;
  const loading = status === Status.LOADING;
  const filtered = search !== "" || rating !== "ALL" || photos !== "ALL";
  const allOnPageSelected = pageItems.length > 0 && pageItems.every((r) => selected.includes(r.id));
  const viewingLive = viewing ? reviews.find((r) => r.id === viewing.id) ?? viewing : null;

  const toggle = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const togglePage = () =>
    setSelected((prev) =>
      allOnPageSelected ? prev.filter((id) => !pageItems.some((r) => r.id === id)) : [...new Set([...prev, ...pageItems.map((r) => r.id)])],
    );

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setRating("ALL");
    setPhotos("ALL");
    setTab("ALL");
    setPage(1);
    setSelected([]);
  };

  const stats = [
    { label: "Reviews", value: (reviewStats?.total ?? 0).toLocaleString(), hint: `${(reviewStats?.visible ?? 0).toLocaleString()} visible in the store`, icon: MessageSquare, tone: "bg-[#E6540B]/10 text-[#E6540B] dark:bg-[#E6540B]/15", onClick: resetFilters, active: false },
    { label: "Average rating", value: reviewStats?.visible ? reviewStats.averageRating.toFixed(1) : "—", hint: "Of visible reviews, out of 5", icon: Star, tone: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400", onClick: null, active: false },
    { label: "To check", value: (reviewStats?.toCheck ?? 0).toLocaleString(), hint: "Pending or flagged, hidden", icon: Clock, tone: "bg-sky-500/10 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400", onClick: () => changeTab(tab === "TO_CHECK" ? "ALL" : "TO_CHECK"), active: tab === "TO_CHECK" },
    { label: "Low ratings", value: (reviewStats?.lowRated ?? 0).toLocaleString(), hint: "1 or 2 stars", icon: AlertCircle, tone: "bg-red-500/10 text-red-700 dark:bg-red-500/15 dark:text-red-400", onClick: () => changeRating(rating === "LOW" ? "ALL" : "LOW"), active: rating === "LOW" },
  ];

  const statusSelect = (r: AdminReview) => (
    <div className="relative inline-flex items-center">
      <select
        value={statusOf(r)}
        onChange={(e) => changeStatus(r, e.target.value as ReviewModerationStatus)}
        disabled={statusBusy === r.id}
        aria-label={`Moderation status of ${r.User?.username ?? "this"} review`}
        className={`cursor-pointer appearance-none rounded-full py-0.5 pl-2.5 pr-6 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#E6540B]/30 disabled:opacity-60 dark:scheme-dark ${statusTone[statusOf(r)]}`}
      >
        <option value="APPROVED">Visible</option>
        <option value="PENDING">Pending</option>
        <option value="FLAGGED">Flagged</option>
      </select>
      {statusBusy === r.id ? (
        <Loader2 className="pointer-events-none absolute right-1.5 h-3 w-3 animate-spin" />
      ) : (
        <span className="pointer-events-none absolute right-2 text-[9px] opacity-60">▼</span>
      )}
    </div>
  );

  const actions = (r: AdminReview) => (
    <div className="flex items-center justify-end gap-0.5">
      <button type="button" onClick={() => setViewing(r)} className={iconButton} aria-label="View and reply" title={r.adminReply ? "View or edit your reply" : "View and reply"}>
        {r.adminReply ? <MessageSquareReply className="h-4 w-4 text-emerald-600" /> : <Eye className="h-4 w-4" />}
      </button>
      <button type="button" onClick={() => setToDelete(r)} className={`${iconButton} hover:text-red-700 dark:hover:text-red-400`} aria-label="Delete review" title="Delete review">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  const productCell = (r: AdminReview) => (
    <div className="flex min-w-0 items-center gap-2">
      <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-[#F4EEDF] dark:bg-white/5">
        <img src={optimizeImageUrl(r.Product?.productImage, 80)} alt="" loading="lazy" onError={hideBrokenImage} className="h-full w-full object-cover" />
      </span>
      {r.Product ? (
        <a href={`/productdetails/${r.productId}#reviews`} target="_blank" rel="noopener noreferrer" className={`truncate text-sm font-medium hover:text-[#E6540B] ${strong}`} title="Open in store">
          {r.Product.productName}
        </a>
      ) : (
        <span className={`text-sm ${muted}`}>Deleted product</span>
      )}
    </div>
  );

  const messageCell = (r: AdminReview) => (
    <div className="min-w-0">
      <p className={`line-clamp-2 text-sm ${strong}`}>{r.message}</p>
      <p className={`mt-0.5 flex items-center gap-2 text-xs ${muted}`}>
        {r.reviewImage && <span className="inline-flex items-center gap-1"><Camera className="h-3 w-3" /> Photo</span>}
        {r.adminReply ? <span className="text-emerald-700 dark:text-emerald-400">You replied</span> : <button type="button" onClick={() => setViewing(r)} className="cursor-pointer hover:text-[#E6540B] hover:underline">Reply</button>}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-bold sm:text-3xl ${strong}`}>Reviews</h1>
          <p className={`mt-1 text-sm ${muted}`}>Decide which reviews shoppers see, and reply to customers.</p>
        </div>
        <button type="button" onClick={() => { dispatch(fetchAdminReviews()); setSelected([]); }} disabled={status === Status.LOADING} className={secondaryButton}>
          <RefreshCw className={`h-4 w-4 ${status === Status.LOADING ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const body = (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={`text-sm ${muted}`}>{stat.label}</p>
                  {firstLoad ? <Skeleton className="mt-1 h-7 w-12" /> : <p className={`mt-1 text-2xl font-bold ${strong}`}>{stat.value}</p>}
                </div>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.tone}`}><Icon className="h-4 w-4" /></span>
              </div>
              <p className={`mt-1 text-xs ${muted}`}>{stat.active ? "Showing these · click to show all" : stat.hint}</p>
            </>
          );
          return stat.onClick ? (
            <button key={stat.label} type="button" onClick={stat.onClick} aria-pressed={stat.active} className={`${card} cursor-pointer p-4 text-left transition hover:border-[#1A1613]/25 dark:hover:border-white/25 ${stat.active ? "border-[#E6540B]! ring-2 ring-[#E6540B]/15" : ""}`}>
              {body}
            </button>
          ) : (
            <div key={stat.label} className={`${card} p-4`}>{body}</div>
          );
        })}
      </div>

      <section className={card}>
        <div className="space-y-3 border-b border-[#1A1613]/10 p-4 dark:border-white/10">
          <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Moderation status">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => changeTab(t.key)}
                  className={`shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    active ? "bg-[#1A1613] text-white dark:bg-[#F5EFE6] dark:text-[#1A1613]" : "text-[#1A1613]/70 hover:bg-[#F4EEDF] dark:text-[#F5EFE6]/70 dark:hover:bg-[#2A2420]"
                  }`}
                >
                  {t.label} {counts && <span className="opacity-60">{counts[t.key].toLocaleString()}</span>}
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative lg:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1A1613]/40 dark:text-[#F5EFE6]/40" />
              <input type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} maxLength={100} placeholder="Customer, product or words in the review" aria-label="Search reviews" className={`${control} w-full pl-9`} />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-1 sm:justify-end">
              <select value={rating} onChange={(e) => changeRating(e.target.value as RatingFilter)} aria-label="Rating" className={`${control} cursor-pointer`}>
                <option value="ALL">Any rating</option>
                <option value="5">5 stars</option>
                <option value="4">4 stars</option>
                <option value="3">3 stars</option>
                <option value="2">2 stars</option>
                <option value="1">1 star</option>
                <option value="LOW">1–2 stars</option>
              </select>
              <select value={photos} onChange={(e) => changePhotos(e.target.value as PhotoFilter)} aria-label="Photos" className={`${control} cursor-pointer`}>
                <option value="ALL">With or without photo</option>
                <option value="WITH">With a photo</option>
                <option value="WITHOUT">Without a photo</option>
              </select>
              <select value={sort} onChange={(e) => changeSort(e.target.value as Sort)} aria-label="Sort" className={`${control} col-span-2 cursor-pointer sm:col-span-1`}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="rating_desc">Highest rating</option>
                <option value="rating_asc">Lowest rating</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk actions for the checked reviews */}
        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-[#1A1613]/10 bg-[#F4EEDF]/60 px-4 py-2 text-sm dark:border-white/10 dark:bg-white/5">
            <span className={`font-semibold ${strong}`}>{selected.length} selected</span>
            <button type="button" onClick={() => bulkStatus("APPROVED")} disabled={actionLoading} className={`${secondaryButton} py-1`}><Check className="h-3.5 w-3.5" /> Make visible</button>
            <button type="button" onClick={() => bulkStatus("FLAGGED")} disabled={actionLoading} className={`${secondaryButton} py-1`}><EyeOff className="h-3.5 w-3.5" /> Hide (flag)</button>
            <button type="button" onClick={() => setBulkDelete(true)} disabled={actionLoading} className={`${secondaryButton} py-1 text-red-700 dark:text-red-400`}><Trash2 className="h-3.5 w-3.5" /> Delete</button>
            <button type="button" onClick={() => setSelected([])} className={`ml-auto cursor-pointer ${muted} hover:text-[#E6540B]`} aria-label="Clear selection"><X className="h-4 w-4" /></button>
          </div>
        )}

        {firstLoad ? (
          <div className="divide-y divide-[#1A1613]/8 dark:divide-white/10">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="h-9 w-9 rounded-md" />
                <div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-full max-w-md" /></div>
              </div>
            ))}
          </div>
        ) : status === Status.ERROR && !reviewStats ? (
          <div className={`p-10 text-center text-sm ${muted}`}>
            {error || "Couldn't load reviews."}{" "}
            <button type="button" onClick={() => dispatch(fetchAdminReviews())} className="cursor-pointer font-semibold text-[#E6540B] hover:underline">Try again</button>
          </div>
        ) : reviewStats?.total === 0 ? (
          <div className="p-10 text-center">
            <p className={`font-semibold ${strong}`}>No reviews yet</p>
            <p className={`mt-1 text-sm ${muted}`}>Reviews from customers appear here as soon as they're posted.</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className={`p-10 text-center text-sm ${muted}`}>
            {tab === "TO_CHECK" && !filtered ? "Nothing to check. Every review is visible." : "No reviews match."}{" "}
            {(filtered || tab !== "ALL") && <button type="button" onClick={resetFilters} className="cursor-pointer font-semibold text-[#E6540B] hover:underline">Show all reviews</button>}
          </div>
        ) : (
          <>
            {/* Phones */}
            <ul className="divide-y divide-[#1A1613]/8 md:hidden dark:divide-white/10">
              {pageItems.map((r) => (
                <li key={r.id} className="flex gap-3 p-4">
                  <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} aria-label="Select review" className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[#E6540B]" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`truncate text-sm font-semibold ${strong}`}>{r.User?.username ?? "Customer"}</span>
                      {statusSelect(r)}
                    </div>
                    {productCell(r)}
                    <div className="flex items-center gap-2"><Stars rating={Number(r.rating)} /><span className={`text-xs ${muted}`}>{formatDate(r.createdAt)}</span></div>
                    {messageCell(r)}
                  </div>
                  {actions(r)}
                </li>
              ))}
            </ul>

            {/* Larger screens */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`border-b border-[#1A1613]/10 text-left text-xs font-semibold dark:border-white/10 ${muted}`}>
                    <th className="w-10 px-4 py-3">
                      <input type="checkbox" checked={allOnPageSelected} onChange={togglePage} aria-label="Select all on this page" className="h-4 w-4 cursor-pointer accent-[#E6540B]" />
                    </th>
                    <th className="px-4 py-3">Review</th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Rating</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1613]/8 dark:divide-white/10">
                  {pageItems.map((r) => (
                    <tr key={r.id} className={`align-top hover:bg-[#F4EEDF]/40 dark:hover:bg-white/5 ${selected.includes(r.id) ? "bg-[#E6540B]/5" : ""}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} aria-label="Select review" className="h-4 w-4 cursor-pointer accent-[#E6540B]" />
                      </td>
                      <td className="max-w-md px-4 py-3">
                        <p className={`text-xs ${muted}`}><span className={`font-semibold ${strong}`}>{r.User?.username ?? "Customer"}</span> · {formatDate(r.createdAt)}</p>
                        <div className="mt-0.5">{messageCell(r)}</div>
                      </td>
                      <td className="max-w-55 px-4 py-3">{productCell(r)}</td>
                      <td className="px-4 py-3"><Stars rating={Number(r.rating)} /></td>
                      <td className="px-4 py-3">{statusSelect(r)}</td>
                      <td className="px-4 py-3">{actions(r)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={`flex flex-wrap items-center justify-between gap-2 border-t border-[#1A1613]/10 px-4 py-3 text-sm dark:border-white/10 ${muted}`}>
              <span>{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, total)} of {total.toLocaleString()}</span>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => { setPage(currentPage - 1); setSelected([]); }} disabled={currentPage === 1 || loading} className={secondaryButton}>Previous</button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <button type="button" onClick={() => { setPage(currentPage + 1); setSelected([]); }} disabled={currentPage === totalPages || loading} className={secondaryButton}>Next</button>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <p className={`text-xs ${muted}`}>
        <strong>Visible</strong> reviews show on the product page and count towards its rating. <strong>Pending</strong> and{" "}
        <strong>Flagged</strong> reviews are hidden from shoppers; the customer is told when theirs is hidden or shown again.{" "}
        <Link to="/admin-dashboard/products" className="font-semibold text-[#E6540B] hover:underline">See product ratings</Link>
      </p>

      <ReviewViewModal key={viewingLive?.id ?? "none"} review={viewingLive} onClose={() => setViewing(null)} onDelete={(r) => setToDelete(r)} formatDate={formatDate} />

      {(toDelete || bulkDelete) && (
        <div className="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 p-4" role="alertdialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-[#FFFDF8] p-5 dark:bg-[#1E1A17]">
            <h2 className={`text-lg font-bold ${strong}`}>
              {bulkDelete ? `Delete ${selected.length} review${selected.length === 1 ? "" : "s"}?` : `Delete ${toDelete?.User?.username ?? "this"}'s review?`}
            </h2>
            <p className={`mt-2 text-sm ${muted}`}>
              Deleted reviews and their photos can't be restored. To keep a review but stop shoppers seeing it, flag it instead.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => { setToDelete(null); setBulkDelete(false); }} disabled={actionLoading} className={secondaryButton}>Cancel</button>
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

export default ReviewManagement;
