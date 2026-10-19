import React from "react";
import { CheckCircle2, Clock, Mail, MinusCircle, Trash2 } from "lucide-react";
import {
  NewsletterStatus,
  NewsletterSubscriber,
} from "../../../types/admin/newsletterTypes";

interface SubscriberTableProps {
  subscribers: NewsletterSubscriber[];
  startIndex: number;
  onDelete: (subscriber: NewsletterSubscriber) => void;
  formatDate: (dateStr?: string | null) => string;
}

const STATUS_BADGES: Record<
  NewsletterStatus,
  { label: string; title: string; className: string; icon: React.ReactNode }
> = {
  CONFIRMED: {
    label: "Confirmed",
    title: "Email confirmed — on the mailing list",
    className: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  PENDING: {
    label: "Pending",
    title: "Waiting for email confirmation",
    className: "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
    icon: <Clock className="w-3 h-3" />,
  },
  UNSUBSCRIBED: {
    label: "Unsubscribed",
    title: "Opted out via the unsubscribe link",
    className: "bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-[#F5EFE6]/70 border-stone-200 dark:border-white/10",
    icon: <MinusCircle className="w-3 h-3" />,
  },
};

const SubscriberTable: React.FC<SubscriberTableProps> = ({
  subscribers,
  startIndex,
  onDelete,
  formatDate,
}) => {
  // Small second line under the subscribed date describing the latest lifecycle event
  const statusDetail = (sub: NewsletterSubscriber) => {
    if (sub.status === "CONFIRMED" && sub.confirmedAt) {
      return `Confirmed ${formatDate(sub.confirmedAt)}`;
    }
    if (sub.status === "UNSUBSCRIBED" && sub.unsubscribedAt) {
      return `Unsubscribed ${formatDate(sub.unsubscribedAt)}`;
    }
    if (sub.status === "PENDING") return "Not confirmed yet";
    return "";
  };

  return (
    <div>
      {/* Mobile scroll hint */}
      <div className="sm:hidden px-4 py-2 bg-[#FDF8ED] dark:bg-[#1E1A17] border-b border-[#1A1613]/10 dark:border-white/10 text-[11px] text-[#1A1613]/60 dark:text-[#F5EFE6]/50 flex items-center justify-between">
        <span>↔ Scroll horizontally to view all columns</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1A1613]/10 dark:border-white/10 bg-[#F4EEDF]/40 dark:bg-white/5 text-[11px] font-bold uppercase tracking-wider text-[#1A1613]/60 dark:text-[#F5EFE6]/50">
              <th className="py-3.5 px-4 w-14">#</th>
              <th className="py-3.5 px-4">Email</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Subscribed</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A1613]/8 dark:divide-white/10 text-xs text-[#1A1613] dark:text-[#F5EFE6]">
            {subscribers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-[#1A1613]/50 dark:text-[#F5EFE6]/50">
                  <Mail className="w-10 h-10 mx-auto mb-2 text-[#1A1613]/30 dark:text-[#F5EFE6]/40" />
                  <p className="font-semibold text-sm">No subscribers found</p>
                  <p className="text-xs mt-1">
                    Try adjusting your search query, status, or date range.
                  </p>
                </td>
              </tr>
            ) : (
              subscribers.map((sub, idx) => {
                const badge = STATUS_BADGES[sub.status] ?? STATUS_BADGES.PENDING;

                return (
                  <tr key={sub.id} className="group hover:bg-[#F4EEDF]/40 dark:hover:bg-white/5 transition-colors">
                    {/* Row number */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#1A1613]/45 dark:text-[#F5EFE6]/50">
                      {startIndex + idx + 1}
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center bg-[#E6540B]/10 dark:bg-[#E6540B]/15 text-[#E6540B]">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <a
                          href={`mailto:${sub.email}`}
                          className="font-semibold text-[#1A1613] dark:text-[#F5EFE6] hover:text-[#E6540B] hover:underline truncate max-w-[300px] transition-colors"
                          title={`Send email to ${sub.email}`}
                        >
                          {sub.email}
                        </a>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge.className}`}
                        title={badge.title}
                      >
                        {badge.icon}
                        {badge.label}
                      </span>
                    </td>

                    {/* Subscribed date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-medium text-[#1A1613]/75 dark:text-[#F5EFE6]/70">{formatDate(sub.createdAt)}</p>
                      <p className="text-[10px] text-[#1A1613]/45 dark:text-[#F5EFE6]/50">{statusDetail(sub)}</p>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`mailto:${sub.email}`}
                          className="p-1.5 rounded-lg text-[#1A1613]/50 dark:text-[#F5EFE6]/50 hover:text-[#E6540B] hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420] transition-colors"
                          title="Send email"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => onDelete(sub)}
                          className="p-1.5 rounded-lg text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors cursor-pointer"
                          title="Remove subscriber"
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

export default SubscriberTable;
