import React from "react";
import { AlertTriangle, RefreshCw, X } from "lucide-react";

interface ReviewBulkDeleteModalProps {
  isOpen: boolean;
  count: number;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
}

const ReviewBulkDeleteModal: React.FC<ReviewBulkDeleteModalProps> = ({
  isOpen,
  count,
  onClose,
  onConfirm,
  loading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-[#1A1613]/15 bg-[#FFFDF8] p-5 sm:p-6 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1A1613]/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1A1613]">
                Delete Multiple Reviews
              </h3>
              <p className="text-xs text-[#1A1613]/55">
                Bulk action cannot be undone.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-[#1A1613]/40 hover:text-[#1A1613] hover:bg-[#F4EEDF] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Details */}
        <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200 space-y-1.5 text-xs text-rose-800">
          <p className="font-bold">
            You are about to permanently delete {count} selected review{count === 1 ? "" : "s"}.
          </p>
          <p className="text-[11px] text-rose-700/80 leading-relaxed">
            All associated customer ratings, uploaded image attachments, and official replies will be permanently wiped from the database.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1A1613]/10">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-[#1A1613]/15 text-xs font-semibold text-[#1A1613] hover:bg-[#F4EEDF] transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Confirm Delete ({count})</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewBulkDeleteModal;
