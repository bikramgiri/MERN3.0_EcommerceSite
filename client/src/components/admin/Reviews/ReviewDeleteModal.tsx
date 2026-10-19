import React from "react";
import { AlertTriangle, RefreshCw, X, Star } from "lucide-react";
import { AdminReview } from "../../../types/admin/reviewTypes";

interface ReviewDeleteModalProps {
  review: AdminReview | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
}

const ReviewDeleteModal: React.FC<ReviewDeleteModalProps> = ({
  review,
  onClose,
  onConfirm,
  loading,
}) => {
  if (!review) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-[#1A1613]/15 dark:border-white/10 bg-[#FFFDF8] dark:bg-[#1E1A17] p-5 sm:p-6 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1A1613]/10 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1A1613] dark:text-[#F5EFE6]">
                Delete Review
              </h3>
              <p className="text-xs text-[#1A1613]/55 dark:text-[#F5EFE6]/50">
                This action is permanent and cannot be undone.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-[#1A1613]/40 dark:text-[#F5EFE6]/50 hover:text-[#1A1613] dark:hover:text-[#F5EFE6] hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Review Preview Box */}
        <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-500/10 border border-rose-200/60 dark:border-rose-500/30 space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold text-[#1A1613] dark:text-[#F5EFE6]">
            <span>{review.User?.username || "Customer"}</span>
            <div className="flex items-center gap-0.5 text-amber-500">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{review.rating} / 5</span>
            </div>
          </div>

          <p className="text-[11px] text-[#1A1613]/60 dark:text-[#F5EFE6]/50">
            For: <span className="font-semibold text-[#1A1613] dark:text-[#F5EFE6]">{review.Product?.productName || "Product"}</span>
          </p>

          <p className="text-xs text-[#1A1613]/80 dark:text-[#F5EFE6]/70 italic line-clamp-2 bg-white/70 dark:bg-[#1E1A17]/70 p-2 rounded border border-rose-100 dark:border-rose-500/30">
            "{review.message}"
          </p>
        </div>

        <p className="text-xs text-[#1A1613]/65 dark:text-[#F5EFE6]/70 leading-relaxed">
          Are you sure you want to delete this customer review? Any associated photo uploaded by the customer will also be deleted from cloud storage.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1A1613]/10 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-[#1A1613]/15 dark:border-white/10 text-xs font-semibold text-[#1A1613] dark:text-[#F5EFE6] hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420] transition-all disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700 shadow-xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>{loading ? "Deleting..." : "Confirm Delete"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewDeleteModal;
