import { Bell, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAppDispatch } from "../../../../hooks/hooks";
import { fetchMyOrder } from "../../../../store/customer/checkoutSlice";
import { connectSocket } from "../../../../services/socket";
import useNotifications, { type AppNotification } from "../../../../hooks/useNotifications";
import { notificationVisual, timeAgo } from "../../../../global/notificationVisuals";

/** Customer notifications (order updates, payments, review replies, back in stock…), live via socket.io */
const Notifications = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { items, unreadCount, hasMore, loaded, loadingMore, loadMore, markRead, markAllRead } =
    useNotifications({
      onNew: (n) => toast.info(`${n.title}: ${n.message}`, { toastId: n.id }),
    });

  // Keep My orders up to date when the store changes an order
  useEffect(() => {
    const socket = connectSocket();
    const refreshOrders = () => {
      dispatch(fetchMyOrder()).catch(() => {});
    };
    socket.on("customer:order-updated", refreshOrders);
    return () => {
      socket.off("customer:order-updated", refreshOrders);
    };
  }, [dispatch]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const openNotification = (n: AppNotification) => {
    markRead(n.id);
    setIsOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={isOpen}
        className="relative cursor-pointer rounded-full p-1.5 text-[#1A1613]/80 transition-colors hover:text-[#E6540B]"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed left-3 right-3 top-16 z-50 flex max-h-[70vh] flex-col overflow-hidden rounded-xl border border-[#1A1613]/10 bg-[#FDF8ED] shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-96">
          <div className="flex items-center justify-between border-b border-[#1A1613]/10 px-4 py-3">
            <h3 className="font-semibold text-[#1A1613]">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 rounded-full bg-[#E6540B]/10 px-2 py-0.5 text-xs font-medium text-[#E6540B]">
                  {unreadCount} new
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="cursor-pointer text-xs font-semibold text-[#E6540B] hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {!loaded ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-[#E6540B]" />
              </div>
            ) : items.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Bell className="mx-auto mb-3 h-8 w-8 text-[#1A1613]/25" />
                <p className="text-sm font-medium text-[#1A1613]">No notifications yet</p>
                <p className="mt-1 text-xs text-[#1A1613]/60">
                  Order updates, payment confirmations and replies to your reviews will appear here.
                </p>
              </div>
            ) : (
              <>
                {items.map((n) => {
                  const visual = notificationVisual(n.type, n.title);
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => openNotification(n)}
                      className={`flex w-full cursor-pointer gap-3 border-b border-[#1A1613]/10 p-3 text-left transition-colors last:border-b-0 hover:bg-[#F4EEDF] sm:p-4 ${
                        n.isRead ? "" : "bg-[#E6540B]/5"
                      }`}
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${visual.className}`}>
                        {visual.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-[#1A1613]">{n.title}</span>
                        <span className="mt-0.5 block text-sm text-[#1A1613]/75">{n.message}</span>
                        <span className="mt-1 block text-xs text-[#1A1613]/50">{timeAgo(n.createdAt)}</span>
                      </span>
                      {!n.isRead && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#E6540B]" aria-label="Unread" />
                      )}
                    </button>
                  );
                })}
                {hasMore && (
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="w-full cursor-pointer py-3 text-sm font-medium text-[#E6540B] hover:bg-[#F4EEDF] disabled:opacity-60"
                  >
                    {loadingMore ? "Loading..." : "Show older notifications"}
                  </button>
                )}
              </>
            )}
          </div>

          <div className="border-t border-[#1A1613]/10 bg-[#F4EEDF] px-4 py-3 text-center">
            <Link
              to="/my-orders"
              onClick={() => setIsOpen(false)}
              className="text-sm font-medium text-[#E6540B] transition-colors hover:text-[#c94806]"
            >
              View my orders
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
