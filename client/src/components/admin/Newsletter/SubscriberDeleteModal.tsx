import React from "react";
import { AlertTriangle, Mail, Trash2, X } from "lucide-react";
import { NewsletterSubscriber } from "../../../types/admin/newsletterTypes";

interface SubscriberDeleteModalProps {
  subscriber: NewsletterSubscriber | null;
  onClose: () => void;
  onConfirm: () => void;
  formatDate: (dateStr?: string) => string;
}

const SubscriberDeleteModal: React.FC<SubscriberDeleteModalProps> = ({
  subscriber,
  onClose,
  onConfirm,
  formatDate,
}) => {
  if (!subscriber) return null;

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
                Remove Subscriber
              </h3>
              <p className="text-xs text-[#1A1613]/55 dark:text-[#F5EFE6]/50">
                This action is permanent and cannot be undone.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#1A1613]/40 dark:text-[#F5EFE6]/50 hover:text-[#1A1613] dark:hover:text-[#F5EFE6] hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subscriber Preview Box */}
        <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-500/10 border border-rose-200/60 dark:border-rose-500/30 space-y-1.5 text-xs">
          <div className="flex items-center gap-2 font-bold text-[#1A1613] dark:text-[#F5EFE6] min-w-0">
            <Mail className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="truncate">{subscriber.email}</span>
          </div>
          <p className="text-[11px] text-[#1A1613]/60 dark:text-[#F5EFE6]/50">
            Subscribed on{" "}
            <span className="font-semibold text-[#1A1613] dark:text-[#F5EFE6]">
              {formatDate(subscriber.createdAt)}
            </span>
          </p>
        </div>

        <p className="text-xs text-[#1A1613]/65 dark:text-[#F5EFE6]/70 leading-relaxed">
          Are you sure you want to remove this email from the newsletter list? They will no longer
          receive store updates unless they subscribe again.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1A1613]/10 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#1A1613]/15 dark:border-white/10 text-xs font-semibold text-[#1A1613] dark:text-[#F5EFE6] hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420] transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700 shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Confirm Remove</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriberDeleteModal;
