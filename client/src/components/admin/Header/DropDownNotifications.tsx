import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Clock, Loader2, X } from "lucide-react";
import { toast } from "react-toastify";
import ClickOutside from "../ClickOutside";
import useNotifications, { type AppNotification } from "../../../hooks/useNotifications";
import { notificationVisual, timeAgo } from "../../../global/notificationVisuals";

/** Admin team inbox: new orders, payments, cancellations, reviews, stock alerts, sign-ups — live via socket.io */
const DropdownNotifications: React.FC = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { items, unreadCount, hasMore, loaded, loadingMore, loadMore, markRead, markAllRead } =
    useNotifications({
      // The dashboard already shows its own live pop-ups, so only toast on other admin pages
      onNew: (n) => {
        if (pathname !== "/admin-dashboard") toast.info(`${n.title}: ${n.message}`, { toastId: n.id });
      },
    });

  const openNotification = (n: AppNotification) => {
    markRead(n.id);
    setDropdownOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <ClickOutside onClick={() => setDropdownOpen(false)} className="relative">
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="relative cursor-pointer outline-none focus:outline-none flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center p-2 rounded-full text-[#1A1613]/70 dark:text-[#F5EFE6]/70 hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420] hover:text-[#1A1613] dark:hover:text-[#F5EFE6] transition-colors"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={dropdownOpen}
      >
        <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 -mt-0.5 -mr-0.5 flex h-4.5 min-w-4.5 sm:h-5 sm:min-w-5 items-center justify-center rounded-full bg-[#E6540B] px-1 text-white text-[10px] sm:text-xs font-semibold">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-3 w-[calc(100vw-2rem)] max-w-92 sm:w-92 max-h-[520px] flex flex-col rounded-xl border border-[#1A1613]/10 dark:border-white/10 bg-[#FFFDF8] dark:bg-[#1E1A17] shadow-xl shadow-[#1A1613]/10 dark:shadow-black/40 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-[#1A1613]/10 dark:border-white/10">
            <div className="flex items-center gap-3">
              <h5 className="text-base font-semibold text-[#1A1613] dark:text-[#F5EFE6]">Notifications</h5>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#E6540B]/10 dark:bg-[#E6540B]/15 text-[#E6540B] border border-[#E6540B]/20">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="cursor-pointer text-xs font-semibold text-[#E6540B] hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setDropdownOpen(false)}
                className="outline-none focus:outline-none p-1.5 cursor-pointer rounded-full bg-[#F4EEDF] dark:bg-[#2A2420] hover:bg-[#EDE5D0] dark:hover:bg-white/10 text-[#1A1613] dark:text-[#F5EFE6] transition-colors"
                aria-label="Close notifications"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {!loaded ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#E6540B]" />
              </div>
            ) : items.length === 0 ? (
              <div className="py-12 px-6 text-center text-sm text-[#1A1613]/55 dark:text-[#F5EFE6]/50">
                No notifications yet. New orders, payments, reviews and stock alerts will appear here.
              </div>
            ) : (
              <ul className="divide-y divide-[#1A1613]/10 dark:divide-white/10">
                {items.map((n) => {
                  const visual = notificationVisual(n.type, n.title);
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => openNotification(n)}
                        className={`flex w-full cursor-pointer gap-3 py-3 px-4 text-left transition-colors ${
                          n.isRead
                            ? "hover:bg-[#F4EEDF]/40 dark:hover:bg-[#2A2420]"
                            : "bg-[#F4EEDF]/40 dark:bg-white/5 hover:bg-[#F4EEDF]/70 dark:hover:bg-[#2A2420]"
                        }`}
                      >
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${visual.className}`}>
                          {visual.icon}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium text-[#1A1613] dark:text-[#F5EFE6]">{n.title}</span>
                          <span className="mt-0.5 block text-xs text-[#1A1613]/65 dark:text-[#F5EFE6]/70 line-clamp-2">
                            {n.message}
                          </span>
                          <span className="mt-1 flex items-center gap-1.5 text-[11px] text-[#1A1613]/45 dark:text-[#F5EFE6]/50">
                            <Clock className="h-3 w-3" />
                            {timeAgo(n.createdAt)}
                          </span>
                        </span>
                        {!n.isRead && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#E6540B]" aria-label="Unread" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {hasMore && (
            <div className="px-5 py-2.5 border-t border-[#1A1613]/10 dark:border-white/10 bg-[#FBF9F4] dark:bg-[#2A2420] text-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="cursor-pointer text-xs font-semibold text-[#E6540B] hover:underline disabled:opacity-60"
              >
                {loadingMore ? "Loading..." : "Show older notifications"}
              </button>
            </div>
          )}
        </div>
      )}
    </ClickOutside>
  );
};

export default DropdownNotifications;
