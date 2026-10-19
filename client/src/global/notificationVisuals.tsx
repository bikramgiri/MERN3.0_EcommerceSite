import type { ReactNode } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  CreditCard,
  Mail,
  MessageCircle,
  Package,
  PackageX,
  PartyPopper,
  PencilLine,
  ShoppingBag,
  Star,
  Truck,
  UserPlus,
  XCircle,
} from "lucide-react";

const tone = {
  green: "bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400",
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  red: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  purple: "bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400",
  orange: "bg-[#E6540B]/10 text-[#E6540B] dark:bg-[#E6540B]/15",
};

const icon = (node: ReactNode, className: string) => ({ icon: node, className });

/** Icon and colour for each notification type (shared by the customer and admin bells) */
export const notificationVisual = (type: string, title = "") => {
  switch (type) {
    case "order-placed":
      return icon(<ShoppingBag className="h-5 w-5" />, tone.orange);
    case "order-status":
      if (/on its way/i.test(title)) return icon(<Truck className="h-5 w-5" />, tone.orange);
      if (/delivered/i.test(title)) return icon(<CheckCircle2 className="h-5 w-5" />, tone.green);
      if (/cancel/i.test(title)) return icon(<XCircle className="h-5 w-5" />, tone.red);
      return icon(<Package className="h-5 w-5" />, tone.blue);
    case "payment-received":
      return icon(<CreditCard className="h-5 w-5" />, tone.green);
    case "payment-failed":
      return icon(<CreditCard className="h-5 w-5" />, tone.red);
    case "order-cancelled":
    case "order-removed":
    case "order-deleted":
      return icon(<XCircle className="h-5 w-5" />, tone.red);
    case "order-edited":
      return icon(<PencilLine className="h-5 w-5" />, tone.blue);
    case "new-order":
      return icon(<ShoppingBag className="h-5 w-5" />, tone.green);
    case "review-reply":
      return icon(<MessageCircle className="h-5 w-5" />, tone.blue);
    case "review-hidden":
      return icon(<AlertTriangle className="h-5 w-5" />, tone.amber);
    case "review-visible":
      return icon(<CheckCircle2 className="h-5 w-5" />, tone.green);
    case "new-review":
      return icon(<Star className="h-5 w-5" />, tone.amber);
    case "back-in-stock":
      return icon(<Package className="h-5 w-5" />, tone.orange);
    case "low-stock":
      return icon(<AlertTriangle className="h-5 w-5" />, tone.amber);
    case "out-of-stock":
      return icon(<PackageX className="h-5 w-5" />, tone.red);
    case "new-customer":
      return icon(<UserPlus className="h-5 w-5" />, tone.blue);
    case "new-subscriber":
      return icon(<Mail className="h-5 w-5" />, tone.purple);
    case "welcome":
      return icon(<PartyPopper className="h-5 w-5" />, tone.orange);
    default:
      return icon(<Bell className="h-5 w-5" />, tone.orange);
  }
};

/** "Just now", "5 min ago", "3 hours ago", "2 days ago", then a short date */
export const timeAgo = (iso: string) => {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};
