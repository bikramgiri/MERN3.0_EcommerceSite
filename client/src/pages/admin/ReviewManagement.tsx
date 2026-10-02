import React, { useEffect, useState, useMemo } from "react";
import {
  MessageSquare,
  Search,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import {
  fetchAdminReviews,
  deleteAdminReview,
  updateReviewStatus,
  bulkUpdateReviewStatus,
  bulkDeleteReviews,
} from "../../store/admin/reviewSlice";
import { fetchDatas as syncDashboardStats } from "../../store/admin/datasSlice";
import {
  AdminReview,
  ReviewModerationStatus,
} from "../../types/admin/reviewTypes";
import { Status } from "../../global/statuses";
import ReviewTable from "../../components/admin/Reviews/ReviewTable";
import ReviewViewModal from "../../components/admin/Reviews/ReviewViewModal";
import ReviewDeleteModal from "../../components/admin/Reviews/ReviewDeleteModal";
import ReviewBulkDeleteModal from "../../components/admin/Reviews/ReviewBulkDeleteModal";

function formatDate(dateStr?: string) {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const ReviewManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { reviews, status, actionLoading } = useAppSelector(
    (state) => state.adminReview
  );

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRating, setSelectedRating] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedAttachment, setSelectedAttachment] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "rating_desc" | "rating_asc"
  >("newest");

  // Multi-select for Bulk Moderation
  const [selectedReviewIds, setSelectedReviewIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals
  const [viewingReview, setViewingReview] = useState<AdminReview | null>(null);
  const [deletingReview, setDeletingReview] = useState<AdminReview | null>(null);

  // Initial load
  useEffect(() => {
    dispatch(fetchAdminReviews());
  }, [dispatch]);

  const handleRefresh = async () => {
    await dispatch(fetchAdminReviews());
    setSelectedReviewIds([]);
  };

  const handleConfirmDelete = async () => {
    if (!deletingReview) return;
    const result = await dispatch(deleteAdminReview(deletingReview.id));
    if (result && result.success) {
      dispatch(syncDashboardStats());
      setDeletingReview(null);
      setSelectedReviewIds((prev) => prev.filter((id) => id !== deletingReview.id));
      if (viewingReview && viewingReview.id === deletingReview.id) {
        setViewingReview(null);
      }
    }
  };

  // Status Change
  const handleSingleStatusChange = async (
    id: string,
    newStatus: ReviewModerationStatus
  ) => {
    await dispatch(updateReviewStatus(id, newStatus));
  };

  // Bulk Actions
  const handleToggleSelect = (id: string) => {
    setSelectedReviewIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = async () => {
    if (selectedReviewIds.length === 0) return;
    await dispatch(bulkUpdateReviewStatus(selectedReviewIds, "APPROVED"));
    setSelectedReviewIds([]);
  };

  const handleBulkFlag = async () => {
    if (selectedReviewIds.length === 0) return;
    await dispatch(bulkUpdateReviewStatus(selectedReviewIds, "FLAGGED"));
    setSelectedReviewIds([]);
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedReviewIds.length === 0) return;
    const res = await dispatch(bulkDeleteReviews(selectedReviewIds));
    if (res && res.success) {
      dispatch(syncDashboardStats());
      setSelectedReviewIds([]);
      setIsBulkDeleting(false);
    }
  };

  const isFiltered =
    searchTerm.trim() !== "" ||
    selectedRating !== "ALL" ||
    selectedStatus !== "ALL" ||
    selectedAttachment !== "ALL" ||
    sortBy !== "newest";

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedRating("ALL");
    setSelectedStatus("ALL");
    setSelectedAttachment("ALL");
    setSortBy("newest");
    setCurrentPage(1);
    setSelectedReviewIds([]);
  };

  // KPIs
  const totalReviewsCount = reviews.length;
  const averageRating =
    totalReviewsCount > 0
      ? (
          reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
          totalReviewsCount
        ).toFixed(1)
      : "0.0";

  const pendingReviewsCount = reviews.filter(
    (r) => r.status === "PENDING"
  ).length;

  const criticalReviewsCount = reviews.filter(
    (r) => Number(r.rating || 0) <= 2 || r.status === "FLAGGED"
  ).length;

  // Filter & Sort
  const filteredReviews = useMemo(() => {
    return reviews
      .filter((rev) => {
        // Search
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchUser = rev.User?.username?.toLowerCase().includes(q);
          const matchProduct = rev.Product?.productName
            ?.toLowerCase()
            .includes(q);
          const matchCategory = rev.Product?.Category?.categoryName
            ?.toLowerCase()
            .includes(q);
          const matchMessage = rev.message?.toLowerCase().includes(q);
          const matchReply = rev.adminReply?.toLowerCase().includes(q);
          if (
            !matchUser &&
            !matchProduct &&
            !matchCategory &&
            !matchMessage &&
            !matchReply
          ) {
            return false;
          }
        }

        // Rating Filter
        if (selectedRating !== "ALL") {
          if (
            selectedRating === "1,2" ||
            selectedRating === "1_2" ||
            selectedRating === "LOW"
          ) {
            const r = Math.round(Number(rev.rating || 0));
            if (r !== 1 && r !== 2) {
              return false;
            }
          } else {
            const targetRating = Number(selectedRating);
            if (Math.round(Number(rev.rating || 0)) !== targetRating) {
              return false;
            }
          }
        }

        // Status Filter
        if (selectedStatus !== "ALL") {
          const revStatus = rev.status || "APPROVED";
          if (revStatus !== selectedStatus) {
            return false;
          }
        }

        // Attachment Filter
        if (selectedAttachment === "WITH_PHOTO" && !rev.reviewImage) {
          return false;
        }
        if (selectedAttachment === "TEXT_ONLY" && rev.reviewImage) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          );
        }
        if (sortBy === "oldest") {
          return (
            new Date(a.createdAt || 0).getTime() -
            new Date(b.createdAt || 0).getTime()
          );
        }
        if (sortBy === "rating_desc") {
          return Number(b.rating || 0) - Number(a.rating || 0);
        }
        if (sortBy === "rating_asc") {
          return Number(a.rating || 0) - Number(b.rating || 0);
        }
        return 0;
      });
  }, [reviews, searchTerm, selectedRating, selectedStatus, selectedAttachment, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredReviews.length / pageSize) || 1;
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const isAllSelectedOnPage =
    paginatedReviews.length > 0 &&
    paginatedReviews.every((r) => selectedReviewIds.includes(r.id));

  const handleToggleSelectAll = () => {
    const pageIds = paginatedReviews.map((r) => r.id);
    if (isAllSelectedOnPage) {
      setSelectedReviewIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedReviewIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const loading = status === Status.LOADING;

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E6540B]/10 text-[#E6540B] flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1A1613] sm:text-3xl">
              Review Management
            </h1>
          </div>
          <p className="mt-1 text-xs text-[#1A1613]/60 sm:text-sm">
            Moderate product reviews, approve feedback, post official responses, and manage ratings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#1A1613]/15 bg-[#FFFDF8] px-4 py-2 text-xs font-semibold text-[#1A1613] shadow-xs hover:bg-[#F4EEDF] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                loading ? "animate-spin text-[#E6540B]" : ""
              }`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Reviews */}
        <div
          onClick={handleResetFilters}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
            !isFiltered
              ? "border-[#E6540B]/40 bg-[#FFFDF8] shadow-xs"
              : "border-[#1A1613]/10 bg-[#FFFDF8] shadow-xs hover:border-[#E6540B]/40"
          }`}
          title="Click to reset filters and view all reviews"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#1A1613]/60">
              Total Reviews
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#E6540B]/10 text-[#E6540B] flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#1A1613]">
              {loading ? "..." : totalReviewsCount}
            </span>
            <span className="text-[11px] text-[#1A1613]/40">submitted</span>
          </div>
        </div>

        {/* Average Rating */}
        <div className="p-4 rounded-2xl border border-[#1A1613]/10 bg-[#FFFDF8] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#1A1613]/60">
              Average Rating
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700">
              {loading ? "..." : `${averageRating}`}
            </span>
            <span className="text-[11px] text-[#1A1613]/40">out of 5.0</span>
          </div>
        </div>

        {/* Pending Moderation */}
        <div
          onClick={() => {
            if (selectedStatus === "PENDING") {
              setSelectedStatus("ALL");
            } else {
              setSelectedStatus("PENDING");
              setCurrentPage(1);
            }
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
            selectedStatus === "PENDING"
              ? "border-amber-500 bg-amber-50/50 shadow-sm ring-2 ring-amber-500/20"
              : "border-[#1A1613]/10 bg-[#FFFDF8] shadow-xs hover:border-amber-400 hover:shadow-xs"
          }`}
          title="Click to filter reviews awaiting moderation (PENDING)"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#1A1613]/60">
              Pending Approval
            </span>
            <div className="flex items-center gap-1.5">
              {selectedStatus === "PENDING" && (
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/90 px-1.5 py-0.5 rounded-md">
                  Filtered
                </span>
              )}
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700">
              {loading ? "..." : pendingReviewsCount}
            </span>
            <span className="text-[11px] text-[#1A1613]/40">awaiting review</span>
          </div>
        </div>

        {/* Critical or Flagged */}
        <div
          onClick={() => {
            if (selectedRating === "1,2") {
              setSelectedRating("ALL");
            } else {
              setSelectedRating("1,2");
              setCurrentPage(1);
            }
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
            selectedRating === "1,2"
              ? "border-rose-500 bg-rose-50/50 shadow-sm ring-2 ring-rose-500/20"
              : "border-[#1A1613]/10 bg-[#FFFDF8] shadow-xs hover:border-rose-400 hover:shadow-xs"
          }`}
          title="Click to filter 1 & 2 star reviews"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#1A1613]/60">
              Needs Attention
            </span>
            <div className="flex items-center gap-1.5">
              {selectedRating === "1,2" && (
                <span className="text-[10px] font-semibold text-rose-700 bg-rose-100/90 px-1.5 py-0.5 rounded-md">
                  Filtered
                </span>
              )}
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-700">
              {loading ? "..." : criticalReviewsCount}
            </span>
            <span className="text-[11px] text-[#1A1613]/40">
              flagged / low ratings
            </span>
          </div>
        </div>
      </div>

      {/* 3. Bulk Action Banner (when items are checked) */}
      {selectedReviewIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#1A1613] text-white shadow-md animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-[#E6540B] text-white font-bold text-xs flex items-center justify-center">
              {selectedReviewIds.length}
            </span>
            <span className="text-xs font-semibold">
              Review{selectedReviewIds.length === 1 ? "" : "s"} selected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBulkApprove}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve Selected</span>
            </button>

            <button
              onClick={handleBulkFlag}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Flag Selected</span>
            </button>

            <button
              onClick={() => setIsBulkDeleting(true)}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>

            <button
              onClick={() => setSelectedReviewIds([])}
              className="text-xs text-white/60 hover:text-white underline cursor-pointer ml-1"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* 4. Reviews Container & Filter Bar */}
      <div className="rounded-xl border border-[#1A1613]/10 bg-[#FFFDF8] shadow-xs overflow-hidden">
        {/* Filter Controls */}
        <div className="p-4 sm:p-5 border-b border-[#1A1613]/10 space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1A1613]/40 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by customer, product, message, reply..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-10 pl-10 pr-9 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] text-xs text-[#1A1613] placeholder:text-[#1A1613]/40 focus:outline-none focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1A1613]/40 hover:text-[#1A1613] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 min-w-[125px] sm:flex-initial sm:min-w-0 h-9 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] px-3 text-xs font-medium text-[#1A1613] focus:outline-none focus:border-[#E6540B]"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Approved Only</option>
                <option value="PENDING">Pending Moderation</option>
                <option value="FLAGGED">Flagged Reviews</option>
              </select>

              {/* Rating Filter */}
              <select
                value={selectedRating}
                onChange={(e) => {
                  setSelectedRating(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 min-w-[125px] sm:flex-initial sm:min-w-0 h-9 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] px-3 text-xs font-medium text-[#1A1613] focus:outline-none focus:border-[#E6540B]"
              >
                <option value="ALL">All Ratings</option>
                <option value="1,2">1 &amp; 2 Stars (Needs Attention)</option>
                <option value="5">5 Stars (★★★★★)</option>
                <option value="4">4 Stars (★★★★☆)</option>
                <option value="3">3 Stars (★★★☆☆)</option>
                <option value="2">2 Stars (★★☆☆☆)</option>
                <option value="1">1 Star (★☆☆☆☆)</option>
              </select>

              {/* Attachment Filter */}
              <select
                value={selectedAttachment}
                onChange={(e) => {
                  setSelectedAttachment(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 min-w-[125px] sm:flex-initial sm:min-w-0 h-9 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] px-3 text-xs font-medium text-[#1A1613] focus:outline-none focus:border-[#E6540B]"
              >
                <option value="ALL">All Attachments</option>
                <option value="WITH_PHOTO">With Photos</option>
                <option value="TEXT_ONLY">Text Only</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 min-w-[125px] sm:flex-initial sm:min-w-0 h-9 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] px-3 text-xs font-medium text-[#1A1613] focus:outline-none focus:border-[#E6540B]"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="rating_desc">Rating: High to Low</option>
                <option value="rating_asc">Rating: Low to High</option>
              </select>

              {/* Reset Filter Button */}
              {isFiltered && (
                <button
                  onClick={handleResetFilters}
                  className="h-9 px-3 rounded-lg border border-dashed border-[#1A1613]/25 text-xs font-semibold text-[#1A1613]/70 hover:text-[#E6540B] hover:border-[#E6540B] transition-colors cursor-pointer"
                  title="Reset all search & filters"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 5. Table */}
        <ReviewTable
          reviews={paginatedReviews}
          loading={loading}
          selectedIds={selectedReviewIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          isAllSelected={isAllSelectedOnPage}
          onView={(rev) => setViewingReview(rev)}
          onDelete={(rev) => setDeletingReview(rev)}
          onStatusChange={handleSingleStatusChange}
          formatDate={formatDate}
        />

        {/* 6. Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-[#1A1613]/10 text-xs text-[#1A1613]/60 bg-[#FDF8ED]/30">
          <div>
            {loading ? (
              <div className="h-3.5 w-32 rounded bg-[#1A1613]/10 animate-pulse" />
            ) : filteredReviews.length === 0 ? (
              "Showing 0 reviews"
            ) : (
              `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(
                currentPage * pageSize,
                filteredReviews.length
              )} of ${filteredReviews.length} review${
                filteredReviews.length === 1 ? "" : "s"
              }`
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={loading || currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[#1A1613]/15 text-[#1A1613] hover:bg-[#F4EEDF] disabled:opacity-40 transition-colors cursor-pointer"
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
                Math.abs(pageNum - currentPage) > 1
              ) {
                if (Math.abs(pageNum - currentPage) === 2) {
                  return (
                    <span key={`dots-${pageNum}`} className="px-1 text-[#1A1613]/40">
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
                    currentPage === pageNum
                      ? "bg-[#E6540B] text-white shadow-xs"
                      : "border border-[#1A1613]/15 text-[#1A1613] hover:bg-[#F4EEDF]"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              disabled={loading || currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-[#1A1613]/15 text-[#1A1613] hover:bg-[#F4EEDF] disabled:opacity-40 transition-colors cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 7. Modals */}
      <ReviewViewModal
        review={viewingReview}
        onClose={() => setViewingReview(null)}
        onDelete={(rev) => {
          setViewingReview(null);
          setDeletingReview(rev);
        }}
        formatDate={formatDate}
      />

      <ReviewDeleteModal
        review={deletingReview}
        onClose={() => setDeletingReview(null)}
        onConfirm={handleConfirmDelete}
        loading={actionLoading}
      />

      <ReviewBulkDeleteModal
        isOpen={isBulkDeleting}
        count={selectedReviewIds.length}
        onClose={() => setIsBulkDeleting(false)}
        onConfirm={handleConfirmBulkDelete}
        loading={actionLoading}
      />
    </div>
  );
};

export default ReviewManagement;
