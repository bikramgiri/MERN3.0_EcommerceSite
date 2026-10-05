import React, { useState } from "react";
import {
  X,
  ShoppingCart,
  Star,
  AlertTriangle,
  UserPlus,
  AlertCircle,
  XCircle,
  Gem,
  CheckCircle2,
  Trash2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface ActivityEvent {
  id: string;
  type:
    | "order"
    | "review"
    | "low-stock"
    | "out-of-stock"
    | "user"
    | "payment-verified"
    | "payment-failed"
    | "cancelled"
    | "high-value";
  title: string;
  description: string;
  timestamp: Date;
  data?: any;
  link?: string;
}

interface LiveActivityFeedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activities: ActivityEvent[];
  onClearActivities: () => void;
}

const LiveActivityFeedDrawer: React.FC<LiveActivityFeedDrawerProps> = ({
  isOpen,
  onClose,
  activities,
  onClearActivities,
}) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>("ALL");

  if (!isOpen) return null;

  const filteredActivities = activities.filter((act) => {
    if (filter === "ALL") return true;
    if (filter === "ORDERS") return act.type === "order" || act.type === "high-value" || act.type === "cancelled";
    if (filter === "REVIEWS") return act.type === "review";
    if (filter === "STOCK") return act.type === "low-stock" || act.type === "out-of-stock";
    if (filter === "PAYMENTS") return act.type === "payment-verified" || act.type === "payment-failed";
    if (filter === "USERS") return act.type === "user";
    return true;
  });

  const getEventIcon = (type: ActivityEvent["type"]) => {
    switch (type) {
      case "high-value":
        return <Gem className="w-4 h-4 text-purple-600" />;
      case "order":
        return <ShoppingCart className="w-4 h-4 text-[#E6540B]" />;
      case "review":
        return <Star className="w-4 h-4 text-amber-500 fill-amber-500" />;
      case "low-stock":
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case "out-of-stock":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "user":
        return <UserPlus className="w-4 h-4 text-blue-600" />;
      case "payment-verified":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "payment-failed":
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-rose-600" />;
      default:
        return <Clock className="w-4 h-4 text-[#1A1613]/60" />;
    }
  };

  const getEventBadgeBg = (type: ActivityEvent["type"]) => {
    switch (type) {
      case "high-value":
        return "bg-purple-50 border-purple-200 text-purple-700";
      case "order":
        return "bg-orange-50 border-orange-200 text-orange-700";
      case "review":
        return "bg-amber-50 border-amber-200 text-amber-700";
      case "low-stock":
        return "bg-amber-50 border-amber-200 text-amber-700";
      case "out-of-stock":
        return "bg-red-50 border-red-200 text-red-700";
      case "user":
        return "bg-blue-50 border-blue-200 text-blue-700";
      case "payment-verified":
        return "bg-emerald-50 border-emerald-200 text-emerald-700";
      case "payment-failed":
      case "cancelled":
        return "bg-rose-50 border-rose-200 text-rose-700";
      default:
        return "bg-stone-50 border-stone-200 text-stone-700";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 10) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-[#FFFDF8] border-l border-[#1A1613]/10 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-[#1A1613]/10 bg-gradient-to-r from-[#FFFDF8] to-[#FDF8ED] flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-base font-bold text-[#1A1613] font-heading">
                  Live Activity Stream
                </h3>
              </div>
              <p className="text-xs text-[#1A1613]/60">
                Real-time feed of store events ({activities.length} recorded)
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {activities.length > 0 && (
                <button
                  onClick={onClearActivities}
                  className="p-1.5 rounded-lg text-[#1A1613]/50 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Clear activity log"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#1A1613]/60 hover:text-[#1A1613] hover:bg-[#1A1613]/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-3 border-b border-[#1A1613]/10 bg-[#FAF5E6]/40 flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
            {[
              { id: "ALL", label: "All" },
              { id: "ORDERS", label: "Orders" },
              { id: "REVIEWS", label: "Reviews" },
              { id: "STOCK", label: "Stock" },
              { id: "PAYMENTS", label: "Payments" },
              { id: "USERS", label: "Users" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                  filter === tab.id
                    ? "bg-[#E6540B] text-white shadow-xs"
                    : "text-[#1A1613]/70 hover:bg-[#1A1613]/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Activity Stream List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredActivities.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-[#1A1613]/40">
                <div className="p-3 rounded-full bg-[#1A1613]/5">
                  <Clock className="w-8 h-8 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#1A1613]/70">No activity yet</p>
                  <p className="text-xs text-[#1A1613]/50 max-w-xs">
                    New orders, customer reviews, inventory alerts, and payment events will stream in live.
                  </p>
                </div>
              </div>
            ) : (
              filteredActivities.map((event) => (
                <div
                  key={event.id}
                  className="relative p-3.5 rounded-xl border border-[#1A1613]/10 bg-[#FFFDF8] hover:bg-[#FDF8ED] transition-all shadow-2xs hover:shadow-xs group"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg border ${getEventBadgeBg(
                        event.type
                      )} flex-shrink-0 mt-0.5`}
                    >
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-[#1A1613] truncate">
                          {event.title}
                        </h4>
                        <span className="text-[10px] font-medium text-[#1A1613]/45 whitespace-nowrap">
                          {formatTimeAgo(event.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-[#1A1613]/75 mt-0.5 leading-relaxed break-words">
                        {event.description}
                      </p>

                      {/* Quick Action Button if link provided */}
                      {event.link && (
                        <button
                          onClick={() => {
                            navigate(event.link!);
                            onClose();
                          }}
                          className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#E6540B] hover:text-[#c44408] transition-colors"
                        >
                          <span>Open details</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Status Bar */}
          <div className="p-3 border-t border-[#1A1613]/10 bg-[#FFFDF8] text-[11px] text-[#1A1613]/55 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Socket.IO Live Gateway Connected
            </span>
            <span>Auto-synced</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveActivityFeedDrawer;
