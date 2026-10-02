import React, { useState, useEffect } from "react";
import {
  X,
  Star,
  User,
  ShoppingBag,
  Calendar,
  Trash2,
  ExternalLink,
  MessageSquare,
  Tag,
  ImageIcon,
  Package,
  Send,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import {
  AdminReview,
  ReviewModerationStatus,
} from "../../../types/admin/reviewTypes";
import { useAppDispatch } from "../../../hooks/hooks";
import {
  updateReviewStatus,
  replyToReview,
} from "../../../store/admin/reviewSlice";

interface ReviewViewModalProps {
  review: AdminReview | null;
  onClose: () => void;
  onDelete: (review: AdminReview) => void;
  formatDate: (dateStr?: string) => string;
}

const ReviewViewModal: React.FC<ReviewViewModalProps> = ({
  review,
  onClose,
  onDelete,
  formatDate,
}) => {
  const dispatch = useAppDispatch();
  const [imageError, setImageError] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSavingReply, setIsSavingReply] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    setImageError(false);
    if (review) {
      setReplyText(review.adminReply || "");
    }
  }, [review]);

  if (!review) return null;

  const user = review.User;
  const prod = review.Product;
  const rating = Number(review.rating || 5);
  const currentStatus: ReviewModerationStatus = review.status || "APPROVED";

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

  const avatarColor = getAvatarColor(user?.username || "");

  const getRatingLabel = (score: number) => {
    if (score >= 5) return "Exceptional (5/5)";
    if (score >= 4) return "Very Good (4/5)";
    if (score >= 3) return "Average (3/5)";
    if (score >= 2) return "Poor (2/5)";
    return "Terrible (1/5)";
  };

  const handleStatusChange = async (newStatus: ReviewModerationStatus) => {
    if (newStatus === currentStatus || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    await dispatch(updateReviewStatus(review.id, newStatus));
    setIsUpdatingStatus(false);
  };

  const handleSaveReply = async () => {
    if (isSavingReply) return;
    setIsSavingReply(true);
    await dispatch(replyToReview(review.id, replyText.trim()));
    setIsSavingReply(false);
  };

  const handleClearReply = async () => {
    if (isSavingReply) return;
    setIsSavingReply(true);
    setReplyText("");
    await dispatch(replyToReview(review.id, ""));
    setIsSavingReply(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl border border-[#1A1613]/15 bg-[#FFFDF8] p-5 sm:p-6 shadow-xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1A1613]/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1A1613]">
                Customer Review Details
              </h3>
              <p className="text-xs text-[#1A1613]/60">
                Submitted on {formatDate(review.createdAt)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#1A1613]/40 hover:text-[#1A1613] hover:bg-[#F4EEDF] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Moderation Status Control Bar */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#1A1613]/10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#1A1613]/70">
              Moderation Status:
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                currentStatus === "APPROVED"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : currentStatus === "PENDING"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              {currentStatus === "APPROVED" && <CheckCircle2 className="w-3 h-3" />}
              {currentStatus === "PENDING" && <Clock className="w-3 h-3" />}
              {currentStatus === "FLAGGED" && <AlertTriangle className="w-3 h-3" />}
              <span>{currentStatus}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isUpdatingStatus || currentStatus === "APPROVED"}
              onClick={() => handleStatusChange("APPROVED")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentStatus === "APPROVED"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
              }`}
            >
              Approve
            </button>
            <button
              type="button"
              disabled={isUpdatingStatus || currentStatus === "PENDING"}
              onClick={() => handleStatusChange("PENDING")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentStatus === "PENDING"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
              }`}
            >
              Pending
            </button>
            <button
              type="button"
              disabled={isUpdatingStatus || currentStatus === "FLAGGED"}
              onClick={() => handleStatusChange("FLAGGED")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentStatus === "FLAGGED"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
              }`}
            >
              Flag
            </button>
          </div>
        </div>

        {/* Customer & Rating Card */}
        <div className="p-4 rounded-xl bg-[#FDF8ED] border border-[#1A1613]/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs border ${avatarColor.bg} ${avatarColor.text} ${avatarColor.border}`}
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
                    <User className="w-4 h-4" />
                  )
                )}
              </div>
              <div>
                <p className="font-bold text-xs text-[#1A1613]">
                  {user?.username || "Verified Customer"}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-[#1A1613]/50">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(review.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Stars */}
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${
                      star <= Math.round(rating)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-stone-200 text-stone-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] font-bold text-amber-700 block mt-0.5">
                {getRatingLabel(rating)}
              </span>
            </div>
          </div>

          {/* Review Message Body */}
          <div className="pt-2.5 border-t border-[#1A1613]/8">
            <p className="text-xs text-[#1A1613] leading-relaxed italic bg-white/70 p-3 rounded-lg border border-[#1A1613]/5">
              "{review.message}"
            </p>
          </div>
        </div>

        {/* Product Information Card with Direct Catalog Navigation */}
        <div className="p-3.5 rounded-xl border border-[#1A1613]/10 bg-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1613]/45">
              Reviewed Product
            </span>

            {/* Quick Navigation Links */}
            <div className="flex items-center gap-2">
              {prod?.id && (
                <a
                  href={`/productdetails/${prod.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#1A1613]/60 hover:text-[#E6540B] transition-colors"
                  title="View Live Store Page"
                >
                  <span>Store Page</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}

              <a
                href={`/admin-dashboard/products?search=${encodeURIComponent(
                  prod?.productName || ""
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E6540B]/30 bg-[#E6540B]/5 hover:bg-[#E6540B]/10 text-[#E6540B] text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Jump directly to product in Product Management"
              >
                <Package className="w-3.5 h-3.5" />
                <span>View Product in Catalog</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#1A1613]/10 bg-[#FDF8ED] shrink-0 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-[#1A1613]/30 shrink-0" />
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

            <div className="min-w-0 flex-1">
              <p className="font-bold text-xs text-[#1A1613] truncate">
                {prod?.productName || "Unknown Product"}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {prod?.Category?.categoryName && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#1A1613]/5 text-[#1A1613]/60">
                    <Tag className="w-2.5 h-2.5" />
                    <span>{prod.Category.categoryName}</span>
                  </span>
                )}
                {prod?.productPrice !== undefined && (
                  <span className="text-[11px] font-bold text-[#E6540B]">
                    Rs. {Number(prod.productPrice).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Uploaded Photo (if any) */}
        {review.reviewImage && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[10px] uppercase tracking-wider text-[#1A1613]/50">
                Customer Photo Attachment
              </span>
              {!imageError && (
                <a
                  href={review.reviewImage}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-[#E6540B] hover:underline"
                >
                  <span>Open Full Size</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>

            <div className="w-full h-44 sm:h-48 rounded-xl overflow-hidden border border-[#1A1613]/10 bg-[#FDF8ED] flex items-center justify-center p-2">
              {imageError ? (
                <div className="flex flex-col items-center justify-center text-center p-4 text-[#1A1613]/40">
                  <ImageIcon className="w-7 h-7 mb-1.5 text-[#1A1613]/30" />
                  <p className="text-xs font-medium">Customer photo could not be loaded</p>
                  <p className="text-[10px] text-[#1A1613]/35 mt-0.5 max-w-xs truncate">
                    {review.reviewImage}
                  </p>
                </div>
              ) : (
                <img
                  src={review.reviewImage}
                  alt="Customer review attachment"
                  className="w-full h-full object-contain rounded-lg transition-transform hover:scale-[1.02]"
                  onError={() => setImageError(true)}
                />
              )}
            </div>
          </div>
        )}

        {/* Official Admin Response Section */}
        <div className="p-3.5 rounded-xl border border-[#1A1613]/10 bg-white space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#E6540B]" />
              <span className="font-bold text-xs text-[#1A1613]">
                Official Store Response
              </span>
            </div>
            {review.repliedAt && (
              <span className="text-[10px] text-[#1A1613]/50">
                Replied on {formatDate(review.repliedAt)}
              </span>
            )}
          </div>

          <p className="text-[11px] text-[#1A1613]/60">
            Write an official public response to address concerns or acknowledge helpful feedback.
          </p>

          <div className="space-y-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="e.g. Thank you for your feedback! We are delighted to hear you love the product..."
              rows={3}
              maxLength={500}
              className="w-full p-2.5 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED]/40 text-xs text-[#1A1613] placeholder:text-[#1A1613]/40 focus:outline-none focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B] resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#1A1613]/40">
                {replyText.length}/500 characters
              </span>
              <div className="flex items-center gap-2">
                {review.adminReply && (
                  <button
                    type="button"
                    onClick={handleClearReply}
                    disabled={isSavingReply}
                    className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear Response
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveReply}
                  disabled={
                    isSavingReply ||
                    replyText.trim() === (review.adminReply || "").trim()
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E6540B] text-white text-xs font-semibold hover:bg-[#d04b0a] disabled:opacity-50 transition-all cursor-pointer shadow-2xs"
                >
                  <Send className="w-3 h-3" />
                  <span>
                    {isSavingReply
                      ? "Saving..."
                      : review.adminReply
                      ? "Update Response"
                      : "Post Response"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#1A1613]/10">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(review);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-rose-600 bg-rose-50 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Review</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#1A1613]/15 text-xs font-semibold text-[#1A1613] hover:bg-[#F4EEDF] transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewViewModal;
