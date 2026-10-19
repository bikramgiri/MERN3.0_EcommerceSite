import { useCallback, useEffect, useRef, useState } from "react";
import { APIAuthenticated } from "../http";
import { connectSocket } from "../services/socket";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationPage {
  data: AppNotification[];
  hasMore: boolean;
  unreadCount: number;
}

/**
 * The signed-in user's notifications (customers: their own, admins: the team inbox).
 * Loads from the server, then adds new ones live over socket.io ("notification:new").
 */
const useNotifications = (options: { onNew?: (n: AppNotification) => void } = {}) => {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Keep the latest callback without re-subscribing to the socket on every render
  const onNewRef = useRef(options.onNew);
  useEffect(() => {
    onNewRef.current = options.onNew;
  });

  const loadLatest = useCallback(() => {
    APIAuthenticated.get<NotificationPage>("/notifications")
      .then((res) => {
        setItems(res.data.data);
        setHasMore(res.data.hasMore);
        setUnreadCount(res.data.unreadCount);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    const socket = connectSocket();
    const handleNew = (notification: AppNotification) => {
      setItems((prev) =>
        prev.some((n) => n.id === notification.id) ? prev : [notification, ...prev],
      );
      setUnreadCount((count) => count + 1);
      onNewRef.current?.(notification);
    };

    loadLatest();
    socket.on("notification:new", handleNew);
    // After a dropped connection (e.g. server restart), reload so nothing is missed
    socket.on("connect", loadLatest);
    return () => {
      socket.off("notification:new", handleNew);
      socket.off("connect", loadLatest);
    };
  }, [loadLatest]);

  const loadMore = async () => {
    const oldest = items[items.length - 1];
    if (!oldest || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await APIAuthenticated.get<NotificationPage>("/notifications", {
        params: { before: oldest.createdAt },
      });
      setItems((prev) => [...prev, ...res.data.data.filter((n) => !prev.some((p) => p.id === n.id))]);
      setHasMore(res.data.hasMore);
    } catch {
      // Keep what's already shown; the user can try again
    } finally {
      setLoadingMore(false);
    }
  };

  const markRead = (id: string) => {
    const target = items.find((n) => n.id === id);
    if (!target || target.isRead) return;
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((count) => Math.max(0, count - 1));
    APIAuthenticated.patch(`/notifications/${id}/read`).catch(() => {});
  };

  const markAllRead = () => {
    if (unreadCount === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    APIAuthenticated.patch("/notifications/read-all").catch(() => {});
  };

  return { items, unreadCount, hasMore, loaded, loadingMore, loadMore, markRead, markAllRead };
};

export default useNotifications;
