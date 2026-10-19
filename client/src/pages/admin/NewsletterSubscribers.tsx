import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Mail,
  Search,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Download,
  Copy,
  AlertCircle,
  CheckCircle2,
  Clock,
  MinusCircle,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { APIAuthenticated } from "../../http";
import { Skeleton, SkeletonContainer } from "../../global/Skeleton";
import SubscriberTable from "../../components/admin/Newsletter/SubscriberTable";
import SubscriberDeleteModal from "../../components/admin/Newsletter/SubscriberDeleteModal";
import {
  NewsletterListResponse,
  NewsletterStatus,
  NewsletterSubscriber,
} from "../../types/admin/newsletterTypes";

type RangeFilter = "ALL" | "7D" | "30D";
type StatusFilter = "ALL" | NewsletterStatus;

const DAY_MS = 24 * 60 * 60 * 1000;
const RANGE_DAYS: Record<Exclude<RangeFilter, "ALL">, number> = { "7D": 7, "30D": 30 };

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Confirmed subscribers joined the list when they confirmed; others when they signed up
function joinedAt(sub: NewsletterSubscriber) {
  return sub.confirmedAt ?? sub.createdAt;
}

function getErrorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message || fallback;
  }
  return fallback;
}

// Quote every cell and neutralise leading formula characters (CSV injection)
function toCsvCell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

function localDateStamp(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const SKELETON_EMAIL_WIDTHS = ["w-44", "w-56", "w-36"];

// Page-shaped placeholder shown only until the first response arrives
const NewsletterSkeleton: React.FC = () => (
  <SkeletonContainer label="Loading newsletter subscribers" className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={`stat-${idx}`}
          className="p-4 rounded-2xl border border-[#1A1613]/10 dark:border-white/10 bg-[#FFFDF8] dark:bg-[#1E1A17] shadow-xs"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="w-8 h-8 rounded-lg" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <Skeleton className="h-8 w-14" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
      ))}
    </div>

    <div className="rounded-xl border border-[#1A1613]/10 dark:border-white/10 bg-[#FFFDF8] dark:bg-[#1E1A17] shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-[#1A1613]/10 dark:border-white/10 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Skeleton className="h-10 w-full max-w-md rounded-lg" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      <div className="border-b border-[#1A1613]/10 dark:border-white/10 bg-[#F4EEDF]/40 dark:bg-white/5 px-4 py-3.5">
        <Skeleton className="h-3 w-1/3" />
      </div>
      <div className="divide-y divide-[#1A1613]/8 dark:divide-white/10">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={`row-${idx}`} className="flex items-center gap-4 px-4 py-3.5">
            <Skeleton className="h-3 w-5" />
            <div className="flex flex-1 items-center gap-2.5 min-w-0">
              <Skeleton className="w-7 h-7 rounded-full shrink-0" />
              <Skeleton className={`h-3.5 max-w-full ${SKELETON_EMAIL_WIDTHS[idx % 3]}`} />
            </div>
            <Skeleton className="h-5 w-20 rounded-full hidden sm:block" />
            <div className="hidden sm:block space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2.5 w-24" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="w-7 h-7 rounded-lg" />
              <Skeleton className="w-7 h-7 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between p-4 border-t border-[#1A1613]/10 dark:border-white/10 bg-[#FDF8ED]/30 dark:bg-white/5">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-7 w-24 rounded-lg" />
      </div>
    </div>
  </SkeletonContainer>
);

const NewsletterSubscribers: React.FC = () => {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Reference point for the "last N days" stats, captured when data arrives
  const [fetchedAt, setFetchedAt] = useState(0);
  const hasLoadedRef = useRef(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals
  const [subscriberToDelete, setSubscriberToDelete] = useState<NewsletterSubscriber | null>(null);

  // State is only set inside the promise callbacks, so this is safe to call from an effect
  const fetchSubscribers = useCallback(
    () =>
      APIAuthenticated.get<NewsletterListResponse>("/admin/newsletter")
        .then((response) => {
          setSubscribers(response.data.data ?? []);
          setFetchedAt(Date.now());
          setError(null);
          hasLoadedRef.current = true;
          setHasLoaded(true);
        })
        .catch((err: unknown) => {
          const message = getErrorMessage(err, "Failed to load newsletter subscribers.");
          // Keep already-loaded rows on screen when a refresh fails
          if (hasLoadedRef.current) {
            toast.error(message);
          } else {
            setError(message);
          }
        })
        .finally(() => setLoading(false)),
    []
  );

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const handleRefresh = () => {
    setLoading(true);
    if (!hasLoadedRef.current) setError(null);
    fetchSubscribers();
  };

  // Optimistically drop the row; put it back if the server refuses
  const handleConfirmDelete = async () => {
    if (!subscriberToDelete) return;
    const target = subscriberToDelete;
    setSubscriberToDelete(null);
    setSubscribers((prev) => prev.filter((s) => s.id !== target.id));

    try {
      const response = await APIAuthenticated.delete<{ message?: string }>(
        `/admin/newsletter/${target.id}`
      );
      toast.success(response.data?.message || `${target.email} removed from the newsletter.`);
    } catch (err) {
      const message = getErrorMessage(err, "Failed to remove subscriber.");
      // A 404 means it is already gone server-side, so leave it removed
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        toast.info(message);
        return;
      }
      setSubscribers((prev) =>
        prev.some((s) => s.id === target.id) ? prev : [...prev, target]
      );
      toast.error(message);
    }
  };

  const isFiltered =
    searchTerm.trim() !== "" ||
    rangeFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    sortBy !== "newest";

  const handleResetFilters = () => {
    setSearchTerm("");
    setRangeFilter("ALL");
    setStatusFilter("ALL");
    setSortBy("newest");
    setCurrentPage(1);
  };

  const toggleStatus = (status: NewsletterStatus) => {
    setStatusFilter((prev) => (prev === status ? "ALL" : status));
    setCurrentPage(1);
  };

  // "New confirmed" card filters to confirmed subscribers who joined in the last 30 days
  const isNewConfirmedActive = statusFilter === "CONFIRMED" && rangeFilter === "30D";
  const toggleNewConfirmed = () => {
    if (isNewConfirmedActive) {
      setRangeFilter("ALL");
    } else {
      setStatusFilter("CONFIRMED");
      setRangeFilter("30D");
    }
    setCurrentPage(1);
  };

  // KPIs
  const confirmedSubscribers = subscribers.filter((s) => s.status === "CONFIRMED");
  const confirmedCount = confirmedSubscribers.length;
  const pendingCount = subscribers.filter((s) => s.status === "PENDING").length;
  const unsubscribedCount = subscribers.filter((s) => s.status === "UNSUBSCRIBED").length;
  const confirmedSince = (days: number) =>
    confirmedSubscribers.filter(
      (s) => new Date(joinedAt(s)).getTime() >= fetchedAt - days * DAY_MS
    ).length;
  const newConfirmed7 = confirmedSince(7);
  const newConfirmed30 = confirmedSince(30);

  // Filter & Sort
  const filteredSubscribers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const since = rangeFilter === "ALL" ? null : fetchedAt - RANGE_DAYS[rangeFilter] * DAY_MS;

    return subscribers
      .filter((s) => {
        if (q && !s.email.toLowerCase().includes(q)) return false;
        if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
        if (since !== null && new Date(joinedAt(s)).getTime() < since) return false;
        return true;
      })
      .sort((a, b) => {
        const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return sortBy === "newest" ? diff : -diff;
      });
  }, [subscribers, searchTerm, statusFilter, rangeFilter, sortBy, fetchedAt]);

  // Only confirmed addresses may ever be exported or copied for mailing
  const exportableSubscribers = filteredSubscribers.filter((s) => s.status === "CONFIRMED");
  const skippedCount = filteredSubscribers.length - exportableSubscribers.length;
  const skippedNote =
    skippedCount > 0 ? ` (${skippedCount} pending/unsubscribed skipped)` : "";

  // Pagination calculation (clamped so a delete on the last page never strands the view)
  const totalPages = Math.ceil(filteredSubscribers.length / pageSize) || 1;
  const page = Math.min(currentPage, totalPages);
  const paginatedSubscribers = filteredSubscribers.slice((page - 1) * pageSize, page * pageSize);

  const handleExportCsv = () => {
    if (exportableSubscribers.length === 0) {
      toast.info("No confirmed subscribers to export.");
      return;
    }

    const rows = exportableSubscribers.map((s) =>
      [toCsvCell(s.email), toCsvCell(new Date(joinedAt(s)).toISOString())].join(",")
    );
    const csv = ["email,subscribed_at", ...rows].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));

    const link = document.createElement("a");
    link.href = url;
    link.download = `newsletter-subscribers-${localDateStamp()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);

    toast.success(
      `Exported ${exportableSubscribers.length} confirmed subscriber${
        exportableSubscribers.length === 1 ? "" : "s"
      }${skippedNote}.`
    );
  };

  const handleCopyEmails = async () => {
    if (exportableSubscribers.length === 0) {
      toast.info("No confirmed emails to copy.");
      return;
    }

    try {
      await navigator.clipboard.writeText(exportableSubscribers.map((s) => s.email).join(","));
      toast.success(
        `Copied ${exportableSubscribers.length} confirmed email${
          exportableSubscribers.length === 1 ? "" : "s"
        } to clipboard${skippedNote}.`
      );
    } catch {
      toast.error("Could not access the clipboard.");
    }
  };

  // Skeletons only until the first response; refreshes keep the loaded rows visible
  const initialLoading = loading && !hasLoaded && !error;
  const actionsDisabled = !hasLoaded || exportableSubscribers.length === 0;

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E6540B]/10 dark:bg-[#E6540B]/15 text-[#E6540B] flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1A1613] dark:text-[#F5EFE6] sm:text-3xl">
              Newsletter Subscribers
            </h1>
          </div>
          <p className="mt-1 text-xs text-[#1A1613]/60 dark:text-[#F5EFE6]/50 sm:text-sm">
            Review your mailing list, export contacts, and remove unwanted subscriptions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#1A1613]/15 dark:border-white/10 bg-[#FFFDF8] dark:bg-[#1E1A17] px-4 py-2 text-xs font-semibold text-[#1A1613] dark:text-[#F5EFE6] shadow-xs hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                loading ? "animate-spin text-[#E6540B]" : ""
              }`}
            />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleCopyEmails}
            disabled={actionsDisabled}
            className="inline-flex items-center gap-2 rounded-xl border border-[#1A1613]/15 dark:border-white/10 bg-[#FFFDF8] dark:bg-[#1E1A17] px-4 py-2 text-xs font-semibold text-[#1A1613] dark:text-[#F5EFE6] shadow-xs hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420] transition-all active:scale-95 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            title={
              actionsDisabled
                ? "No confirmed subscribers in the current list"
                : `Copy ${exportableSubscribers.length} confirmed email(s) from the filtered list, comma-separated. Pending and unsubscribed addresses are excluded.`
            }
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Emails</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={actionsDisabled}
            className="inline-flex items-center gap-2 rounded-xl bg-[#E6540B] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#d44c0a] transition-all active:scale-95 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            title={
              actionsDisabled
                ? "No confirmed subscribers in the current list"
                : `Download ${exportableSubscribers.length} confirmed subscriber(s) from the filtered list as CSV. Pending and unsubscribed addresses are excluded.`
            }
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {initialLoading ? (
        <NewsletterSkeleton />
      ) : error && !hasLoaded ? (
        /* First load failed */
        <div className="rounded-xl border border-[#1A1613]/10 dark:border-white/10 bg-[#FFFDF8] dark:bg-[#1E1A17] shadow-xs py-14 px-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="mt-3 text-base font-bold text-[#1A1613] dark:text-[#F5EFE6]">
            Couldn't load subscribers
          </h3>
          <p className="mt-1 text-xs text-[#1A1613]/60 dark:text-[#F5EFE6]/50">{error}</p>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#E6540B] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#d44c0a] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Try again</span>
          </button>
        </div>
      ) : (
        <>
          {/* 2. KPI Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Confirmed Subscribers (the real mailing list) */}
            <div
              onClick={() => toggleStatus("CONFIRMED")}
              className={`p-4 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
                statusFilter === "CONFIRMED" && rangeFilter === "ALL"
                  ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10 shadow-sm ring-2 ring-emerald-500/20"
                  : !isFiltered
                  ? "border-[#E6540B]/40 bg-[#FFFDF8] dark:bg-[#1E1A17] shadow-xs hover:border-emerald-400"
                  : "border-[#1A1613]/10 dark:border-white/10 bg-[#FFFDF8] dark:bg-[#1E1A17] shadow-xs hover:border-emerald-400 hover:shadow-xs"
              }`}
              title="Click to show confirmed subscribers only"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#1A1613]/60 dark:text-[#F5EFE6]/50">
                  Confirmed Subscribers
                </span>
                <div className="flex items-center gap-1.5">
                  {statusFilter === "CONFIRMED" && rangeFilter === "ALL" && (
                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100/90 dark:bg-emerald-500/15 px-1.5 py-0.5 rounded-md">
                      Filtered
                    </span>
                  )}
                  <div className="w-8 h-8 rounded-lg bg-[#E6540B]/10 dark:bg-[#E6540B]/15 text-[#E6540B] flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#1A1613] dark:text-[#F5EFE6]">{confirmedCount}</span>
                <span className="text-[11px] text-[#1A1613]/40 dark:text-[#F5EFE6]/50">on the mailing list</span>
              </div>
            </div>

            {/* New confirmed in the last 30 days (7-day count as subtext) */}
            <div
              onClick={toggleNewConfirmed}
              className={`p-4 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
                isNewConfirmedActive
                  ? "border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 shadow-sm ring-2 ring-blue-500/20"
                  : "border-[#1A1613]/10 dark:border-white/10 bg-[#FFFDF8] dark:bg-[#1E1A17] shadow-xs hover:border-blue-400 hover:shadow-xs"
              }`}
              title="Click to show subscribers confirmed in the last 30 days"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#1A1613]/60 dark:text-[#F5EFE6]/50">
                  New Confirmed
                </span>
                <div className="flex items-center gap-1.5">
                  {isNewConfirmedActive && (
                    <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-100/90 dark:bg-blue-500/15 px-1.5 py-0.5 rounded-md">
                      Filtered
                    </span>
                  )}
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-blue-700 dark:text-blue-400">{newConfirmed30}</span>
                <span className="text-[11px] text-[#1A1613]/40 dark:text-[#F5EFE6]/50">
                  last 30 days · {newConfirmed7} this week
                </span>
              </div>
            </div>

            {/* Pending confirmation */}
            <div
              onClick={() => toggleStatus("PENDING")}
              className={`p-4 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
                statusFilter === "PENDING"
                  ? "border-amber-500 bg-amber-50/50 dark:bg-amber-500/10 shadow-sm ring-2 ring-amber-500/20"
                  : "border-[#1A1613]/10 dark:border-white/10 bg-[#FFFDF8] dark:bg-[#1E1A17] shadow-xs hover:border-amber-400 hover:shadow-xs"
              }`}
              title="Click to show sign-ups waiting for email confirmation"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#1A1613]/60 dark:text-[#F5EFE6]/50">
                  Pending
                </span>
                <div className="flex items-center gap-1.5">
                  {statusFilter === "PENDING" && (
                    <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-100/90 dark:bg-amber-500/15 px-1.5 py-0.5 rounded-md">
                      Filtered
                    </span>
                  )}
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-700 dark:text-amber-400">{pendingCount}</span>
                <span className="text-[11px] text-[#1A1613]/40 dark:text-[#F5EFE6]/50">awaiting confirmation</span>
              </div>
            </div>

            {/* Unsubscribed */}
            <div
              onClick={() => toggleStatus("UNSUBSCRIBED")}
              className={`p-4 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
                statusFilter === "UNSUBSCRIBED"
                  ? "border-stone-500 bg-stone-100/60 dark:bg-white/10 shadow-sm ring-2 ring-stone-500/20"
                  : "border-[#1A1613]/10 dark:border-white/10 bg-[#FFFDF8] dark:bg-[#1E1A17] shadow-xs hover:border-stone-400 hover:shadow-xs"
              }`}
              title="Click to show people who unsubscribed"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#1A1613]/60 dark:text-[#F5EFE6]/50">
                  Unsubscribed
                </span>
                <div className="flex items-center gap-1.5">
                  {statusFilter === "UNSUBSCRIBED" && (
                    <span className="text-[10px] font-semibold text-stone-700 dark:text-[#F5EFE6]/70 bg-stone-200/90 dark:bg-white/10 px-1.5 py-0.5 rounded-md">
                      Filtered
                    </span>
                  )}
                  <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-[#F5EFE6]/70 flex items-center justify-center">
                    <MinusCircle className="w-4 h-4" />
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-stone-600 dark:text-[#F5EFE6]/70">{unsubscribedCount}</span>
                <span className="text-[11px] text-[#1A1613]/40 dark:text-[#F5EFE6]/50">opted out</span>
              </div>
            </div>
          </div>

          {/* 3. Subscribers Container & Filter Bar */}
          <div className="rounded-xl border border-[#1A1613]/10 dark:border-white/10 bg-[#FFFDF8] dark:bg-[#1E1A17] shadow-xs overflow-hidden">
            {/* Filter Controls */}
            <div className="p-4 sm:p-5 border-b border-[#1A1613]/10 dark:border-white/10">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1A1613]/40 dark:text-[#F5EFE6]/50 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search subscribers by email..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full h-10 pl-10 pr-9 rounded-lg border border-[#1A1613]/15 dark:border-white/15 bg-[#FDF8ED] dark:bg-[#14110F] text-xs text-[#1A1613] dark:text-[#F5EFE6] placeholder:text-[#1A1613]/40 dark:placeholder:text-[#F5EFE6]/40 focus:outline-none focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B]"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1A1613]/40 dark:text-[#F5EFE6]/50 hover:text-[#1A1613] dark:hover:text-[#F5EFE6] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdowns */}
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as StatusFilter);
                      setCurrentPage(1);
                    }}
                    className="flex-1 min-w-[125px] sm:flex-initial sm:min-w-0 h-9 rounded-lg border border-[#1A1613]/15 dark:border-white/15 bg-[#FDF8ED] dark:bg-[#14110F] px-3 text-xs font-medium text-[#1A1613] dark:text-[#F5EFE6] focus:outline-none focus:border-[#E6540B]"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PENDING">Pending</option>
                    <option value="UNSUBSCRIBED">Unsubscribed</option>
                  </select>

                  {/* Date Range */}
                  <select
                    value={rangeFilter}
                    onChange={(e) => {
                      setRangeFilter(e.target.value as RangeFilter);
                      setCurrentPage(1);
                    }}
                    className="flex-1 min-w-[125px] sm:flex-initial sm:min-w-0 h-9 rounded-lg border border-[#1A1613]/15 dark:border-white/15 bg-[#FDF8ED] dark:bg-[#14110F] px-3 text-xs font-medium text-[#1A1613] dark:text-[#F5EFE6] focus:outline-none focus:border-[#E6540B]"
                  >
                    <option value="ALL">All Time</option>
                    <option value="7D">Last 7 Days</option>
                    <option value="30D">Last 30 Days</option>
                  </select>

                  {/* Sort By */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
                    className="flex-1 min-w-[125px] sm:flex-initial sm:min-w-0 h-9 rounded-lg border border-[#1A1613]/15 dark:border-white/15 bg-[#FDF8ED] dark:bg-[#14110F] px-3 text-xs font-medium text-[#1A1613] dark:text-[#F5EFE6] focus:outline-none focus:border-[#E6540B]"
                  >
                    <option value="newest">Sort: Newest First</option>
                    <option value="oldest">Sort: Oldest First</option>
                  </select>

                  {/* Reset Filter Button */}
                  {isFiltered && (
                    <button
                      onClick={handleResetFilters}
                      className="h-9 px-3 rounded-lg border border-dashed border-[#1A1613]/25 dark:border-white/20 text-xs font-semibold text-[#1A1613]/70 dark:text-[#F5EFE6]/70 hover:text-[#E6540B] hover:border-[#E6540B] transition-colors cursor-pointer"
                      title="Reset all search & filters"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Table */}
            <SubscriberTable
              subscribers={paginatedSubscribers}
              startIndex={(page - 1) * pageSize}
              onDelete={(sub) => setSubscriberToDelete(sub)}
              formatDate={formatDate}
            />

            {/* 5. Pagination Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-[#1A1613]/10 dark:border-white/10 text-xs text-[#1A1613]/60 dark:text-[#F5EFE6]/50 bg-[#FDF8ED]/30 dark:bg-white/5">
              <div>
                {filteredSubscribers.length === 0
                  ? "Showing 0 subscribers"
                  : `Showing ${(page - 1) * pageSize + 1} to ${Math.min(
                      page * pageSize,
                      filteredSubscribers.length
                    )} of ${filteredSubscribers.length} subscriber${
                      filteredSubscribers.length === 1 ? "" : "s"
                    }`}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={page === 1}
                  onClick={() => setCurrentPage(Math.max(1, page - 1))}
                  className="p-1.5 rounded-lg border border-[#1A1613]/15 dark:border-white/10 text-[#1A1613] dark:text-[#F5EFE6] hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420] disabled:opacity-40 transition-colors cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  if (
                    totalPages > 5 &&
                    pageNum !== 1 &&
                    pageNum !== totalPages &&
                    Math.abs(pageNum - page) > 1
                  ) {
                    if (Math.abs(pageNum - page) === 2) {
                      return (
                        <span key={`dots-${pageNum}`} className="px-1 text-[#1A1613]/40 dark:text-[#F5EFE6]/50">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        page === pageNum
                          ? "bg-[#E6540B] text-white shadow-xs"
                          : "border border-[#1A1613]/15 dark:border-white/10 text-[#1A1613] dark:text-[#F5EFE6] hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420]"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  disabled={page === totalPages}
                  onClick={() => setCurrentPage(Math.min(totalPages, page + 1))}
                  className="p-1.5 rounded-lg border border-[#1A1613]/15 dark:border-white/10 text-[#1A1613] dark:text-[#F5EFE6] hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420] disabled:opacity-40 transition-colors cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 6. Modals */}
      <SubscriberDeleteModal
        subscriber={subscriberToDelete}
        onClose={() => setSubscriberToDelete(null)}
        onConfirm={handleConfirmDelete}
        formatDate={formatDate}
      />
    </div>
  );
};

export default NewsletterSubscribers;
