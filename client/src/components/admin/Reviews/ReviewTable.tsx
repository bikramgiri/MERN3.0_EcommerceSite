import React from "react";
import {
  Eye,
  Trash2,
  Star,
  User,
  ShoppingBag,
  MessageSquare,
  Paperclip,
  ShieldCheck,
} from "lucide-react";
import {
  AdminReview,
  ReviewModerationStatus,
} from "../../../types/admin/reviewTypes";

interface ReviewTableProps {
  reviews: AdminReview[];
  loading: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  isAllSelected: boolean;
  onView: (review: AdminReview) => void;
  onDelete: (review: AdminReview) => void;
  onStatusChange: (id: string, status: ReviewModerationStatus) => void;
  formatDate: (dateStr?: string) => string;
}

const ReviewTable: React.FC<ReviewTableProps> = ({
  reviews,
  loading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  isAllSelected,
  onView,
  onDelete,
  onStatusChange,
  formatDate,
}) => {
  const getAvatarColor = (name: string = "") => {
    const colors = [
      { bg: "bg-purple-100 dark:bg-purple-500/15", text: "text-purple-700 dark:text-purple-400", border: "border-purple-200 dark:border-purple-500/30" },
      { bg: "bg-amber-100 dark:bg-amber-500/15", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-500/30" },
      { bg: "bg-orange-100 dark:bg-orange-500/15", text: "text-orange-700 dark:text-orange-400", border: "border-orange-200 dark:border-orange-500/30" },
      { bg: "bg-emerald-100 dark:bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-500/30" },
      { bg: "bg-blue-100 dark:bg-blue-500/15", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-500/30" },
      { bg: "bg-rose-100 dark:bg-rose-500/15", text: "text-rose-700 dark:text-rose-400", border: "border-rose-200 dark:border-rose-500/30" },
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-stone-200 dark:fill-white/10 text-stone-300 dark:text-white/20"
            }`}
          />
        ))}
        <span className="ml-1 text-[11px] font-bold text-[#1A1613] dark:text-[#F5EFE6]">
          {Number(rating).toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <div>
      {/* Mobile scroll hint */}
      <div className="sm:hidden px-4 py-2 bg-[#FDF8ED] dark:bg-[#1E1A17] border-b border-[#1A1613]/10 dark:border-white/10 text-[11px] text-[#1A1613]/60 dark:text-[#F5EFE6]/50 flex items-center justify-between">
        <span>↔ Scroll horizontally to view moderation &amp; customer actions</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1A1613]/10 dark:border-white/10 bg-[#F4EEDF]/40 dark:bg-white/5 text-[11px] font-bold uppercase tracking-wider text-[#1A1613]/60 dark:text-[#F5EFE6]/50">
              {/* Checkbox column */}
              <th className="py-3.5 px-4 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  disabled={loading || reviews.length === 0}
                  className="rounded border-[#1A1613]/20 dark:border-white/15 text-[#E6540B] focus:ring-[#E6540B] cursor-pointer"
                  title="Select all reviews on this page"
                />
              </th>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Product</th>
              <th className="py-3.5 px-4">Rating</th>
              <th className="py-3.5 px-4">Review &amp; Reply</th>
              <th className="py-3.5 px-4">Moderation</th>
              <th className="py-3.5 px-4 text-center">Attachment</th>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A1613]/8 dark:divide-white/10 text-xs text-[#1A1613] dark:text-[#F5EFE6]">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="animate-pulse">
                  <td className="py-3.5 px-4 text-center">
                    <div className="w-4 h-4 rounded bg-[#1A1613]/15 dark:bg-white/10 mx-auto" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#1A1613]/15 dark:bg-white/10" />
                      <div className="h-3.5 w-24 rounded bg-[#1A1613]/15 dark:bg-white/10" />
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#1A1613]/10 dark:bg-white/10" />
                      <div className="space-y-1">
                        <div className="h-3.5 w-28 rounded bg-[#1A1613]/15 dark:bg-white/10" />
                        <div className="h-2.5 w-16 rounded bg-[#1A1613]/10 dark:bg-white/10" />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-3 w-16 rounded bg-[#1A1613]/15 dark:bg-white/10" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-3 w-40 rounded bg-[#1A1613]/15 dark:bg-white/10" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-5 w-20 rounded-full bg-[#1A1613]/10 dark:bg-white/10" />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="h-4 w-12 rounded-full bg-[#1A1613]/10 dark:bg-white/10 mx-auto" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-3 w-16 rounded bg-[#1A1613]/10 dark:bg-white/10" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <div className="w-7 h-7 rounded-lg bg-[#1A1613]/10 dark:bg-white/10" />
                      <div className="w-7 h-7 rounded-lg bg-[#1A1613]/10 dark:bg-white/10" />
                    </div>
                  </td>
                </tr>
              ))
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-[#1A1613]/50 dark:text-[#F5EFE6]/50">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 text-[#1A1613]/30 dark:text-[#F5EFE6]/40" />
                  <p className="font-semibold text-sm">No customer reviews found</p>
                  <p className="text-xs mt-1">
                    Try adjusting your search query, status filter, or rating criteria.
                  </p>
                </td>
              </tr>
            ) : (
              reviews.map((rev) => {
                const user = rev.User;
                const prod = rev.Product;
                const hasImage = Boolean(rev.reviewImage);
                const isSelected = selectedIds.includes(rev.id);
                const status: ReviewModerationStatus = rev.status || "APPROVED";
                const avatarColor = getAvatarColor(user?.username || "");

                return (
                  <tr
                    key={rev.id}
                    className={`group transition-colors ${
                      isSelected
                        ? "bg-[#E6540B]/8 dark:bg-[#E6540B]/12 hover:bg-[#E6540B]/12 dark:hover:bg-[#E6540B]/20"
                        : "hover:bg-[#F4EEDF]/40 dark:hover:bg-white/5"
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(rev.id)}
                        className="rounded border-[#1A1613]/20 dark:border-white/15 text-[#E6540B] focus:ring-[#E6540B] cursor-pointer"
                      />
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center font-bold text-[10px] border ${avatarColor.bg} ${avatarColor.text} ${avatarColor.border}`}
                        >
                          {user?.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.username}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            user?.username?.charAt(0).toUpperCase() || (
                              <User className="w-3.5 h-3.5" />
                            )
                          )}
                        </div>
                        <span className="font-bold text-[#1A1613] dark:text-[#F5EFE6] truncate max-w-[130px]">
                          {user?.username || "Verified Customer"}
                        </span>
                      </div>
                    </td>

                    {/* Product */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-[#1A1613]/10 dark:border-white/10 bg-[#FDF8ED] dark:bg-[#1E1A17] shrink-0 flex items-center justify-center">
                          <ShoppingBag className="w-3.5 h-3.5 text-[#1A1613]/30 dark:text-[#F5EFE6]/40 shrink-0" />
                          {prod?.productImage && (
                            <img
                              src={prod.productImage}
                              alt={prod?.productName || "Product"}
                              className="absolute inset-0 w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p
                            className="font-semibold text-[#1A1613] dark:text-[#F5EFE6] truncate max-w-[150px]"
                            title={prod?.productName}
                          >
                            {prod?.productName || "Product"}
                          </p>
                          {prod?.Category?.categoryName && (
                            <p className="text-[10px] text-[#1A1613]/50 dark:text-[#F5EFE6]/50 truncate max-w-[130px]">
                              {prod.Category.categoryName}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderStars(rev.rating)}
                    </td>

                    {/* Message Preview & Reply Badge */}
                    <td className="py-3.5 px-4">
                      <p
                        className="text-xs text-[#1A1613]/80 dark:text-[#F5EFE6]/70 line-clamp-2 max-w-[260px] leading-relaxed"
                        title={rev.message}
                      >
                        "{rev.message}"
                      </p>
                      {rev.adminReply && (
                        <div
                          className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-[#E6540B] bg-[#E6540B]/10 dark:bg-[#E6540B]/15 border border-[#E6540B]/20 px-2 py-0.5 rounded-md max-w-[240px] truncate"
                          title={`Store Reply: ${rev.adminReply}`}
                        >
                          <ShieldCheck className="w-3 h-3 shrink-0" />
                          <span className="truncate">Replied: "{rev.adminReply}"</span>
                        </div>
                      )}
                    </td>

                    {/* Moderation Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <select
                        value={status}
                        onChange={(e) =>
                          onStatusChange(
                            rev.id,
                            e.target.value as ReviewModerationStatus
                          )
                        }
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                          status === "APPROVED"
                            ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                            : status === "PENDING"
                            ? "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30"
                            : "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30"
                        }`}
                      >
                        <option value="APPROVED">✓ Approved</option>
                        <option value="PENDING">⏱ Pending</option>
                        <option value="FLAGGED">⚠ Flagged</option>
                      </select>
                    </td>

                    {/* Image Attachment Preview */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {hasImage ? (
                        <div
                          onClick={() => onView(rev)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                          title="Click to view customer photo"
                        >
                          <Paperclip className="w-2.5 h-2.5" />
                          <span>Photo</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#1A1613]/40 dark:text-[#F5EFE6]/50">
                          None
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-xs text-[#1A1613]/60 dark:text-[#F5EFE6]/50 whitespace-nowrap">
                      {formatDate(rev.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onView(rev)}
                          className="p-1.5 rounded-lg text-[#1A1613]/60 dark:text-[#F5EFE6]/50 hover:text-[#1A1613] dark:hover:text-[#F5EFE6] hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420] transition-all cursor-pointer"
                          title="View & Moderate Review"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDelete(rev)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition-all cursor-pointer"
                          title="Delete Review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReviewTable;
