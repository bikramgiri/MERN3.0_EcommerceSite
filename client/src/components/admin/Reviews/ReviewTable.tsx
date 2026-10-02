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
      { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
      { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
      { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
      { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
      { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
      { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200" },
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
                : "fill-stone-200 text-stone-300"
            }`}
          />
        ))}
        <span className="ml-1 text-[11px] font-bold text-[#1A1613]">
          {Number(rating).toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <div>
      {/* Mobile scroll hint */}
      <div className="sm:hidden px-4 py-2 bg-[#FDF8ED] border-b border-[#1A1613]/10 text-[11px] text-[#1A1613]/60 flex items-center justify-between">
        <span>↔ Scroll horizontally to view moderation &amp; customer actions</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1A1613]/10 bg-[#F4EEDF]/40 text-[11px] font-bold uppercase tracking-wider text-[#1A1613]/60">
              {/* Checkbox column */}
              <th className="py-3.5 px-4 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  disabled={loading || reviews.length === 0}
                  className="rounded border-[#1A1613]/20 text-[#E6540B] focus:ring-[#E6540B] cursor-pointer"
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
          <tbody className="divide-y divide-[#1A1613]/8 text-xs text-[#1A1613]">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="animate-pulse">
                  <td className="py-3.5 px-4 text-center">
                    <div className="w-4 h-4 rounded bg-[#1A1613]/15 mx-auto" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#1A1613]/15" />
                      <div className="h-3.5 w-24 rounded bg-[#1A1613]/15" />
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#1A1613]/10" />
                      <div className="space-y-1">
                        <div className="h-3.5 w-28 rounded bg-[#1A1613]/15" />
                        <div className="h-2.5 w-16 rounded bg-[#1A1613]/10" />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-3 w-16 rounded bg-[#1A1613]/15" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-3 w-40 rounded bg-[#1A1613]/15" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-5 w-20 rounded-full bg-[#1A1613]/10" />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="h-4 w-12 rounded-full bg-[#1A1613]/10 mx-auto" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-3 w-16 rounded bg-[#1A1613]/10" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <div className="w-7 h-7 rounded-lg bg-[#1A1613]/10" />
                      <div className="w-7 h-7 rounded-lg bg-[#1A1613]/10" />
                    </div>
                  </td>
                </tr>
              ))
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-[#1A1613]/50">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 text-[#1A1613]/30" />
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
                        ? "bg-[#E6540B]/8 hover:bg-[#E6540B]/12"
                        : "hover:bg-[#F4EEDF]/40"
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(rev.id)}
                        className="rounded border-[#1A1613]/20 text-[#E6540B] focus:ring-[#E6540B] cursor-pointer"
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
                        <span className="font-bold text-[#1A1613] truncate max-w-[130px]">
                          {user?.username || "Verified Customer"}
                        </span>
                      </div>
                    </td>

                    {/* Product */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-[#1A1613]/10 bg-[#FDF8ED] shrink-0 flex items-center justify-center">
                          <ShoppingBag className="w-3.5 h-3.5 text-[#1A1613]/30 shrink-0" />
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
                            className="font-semibold text-[#1A1613] truncate max-w-[150px]"
                            title={prod?.productName}
                          >
                            {prod?.productName || "Product"}
                          </p>
                          {prod?.Category?.categoryName && (
                            <p className="text-[10px] text-[#1A1613]/50 truncate max-w-[130px]">
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
                        className="text-xs text-[#1A1613]/80 line-clamp-2 max-w-[260px] leading-relaxed"
                        title={rev.message}
                      >
                        "{rev.message}"
                      </p>
                      {rev.adminReply && (
                        <div
                          className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-[#E6540B] bg-[#E6540B]/10 border border-[#E6540B]/20 px-2 py-0.5 rounded-md max-w-[240px] truncate"
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
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : status === "PENDING"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
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
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700 cursor-pointer hover:bg-emerald-100 transition-colors"
                          title="Click to view customer photo"
                        >
                          <Paperclip className="w-2.5 h-2.5" />
                          <span>Photo</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#1A1613]/40">
                          None
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-xs text-[#1A1613]/60 whitespace-nowrap">
                      {formatDate(rev.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onView(rev)}
                          className="p-1.5 rounded-lg text-[#1A1613]/60 hover:text-[#1A1613] hover:bg-[#F4EEDF] transition-all cursor-pointer"
                          title="View & Moderate Review"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDelete(rev)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer"
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
