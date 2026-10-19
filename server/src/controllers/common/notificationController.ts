import { Response } from "express";
import { Op, type WhereOptions } from "sequelize";
import { AuthRequest } from "../../middleware/authMiddleware";
import Notification from "../../database/models/notificationModel";

const PAGE_SIZE = 20;

// Admins share the team inbox; customers only ever see their own notifications
const inboxFor = (req: AuthRequest): WhereOptions =>
  req.user?.role === "admin"
    ? { audience: "admin" }
    : { audience: "customer", userId: req.user?.id ?? "" };

class NotificationController {
  // *Latest notifications + unread count ("before" = createdAt cursor for loading older ones)
  public static async list(req: AuthRequest, res: Response): Promise<void> {
    const where: WhereOptions = { ...inboxFor(req) };
    const before = typeof req.query.before === "string" ? new Date(req.query.before) : null;
    if (before && !isNaN(before.getTime())) {
      Object.assign(where, { createdAt: { [Op.lt]: before } });
    }

    const [items, unreadCount] = await Promise.all([
      Notification.findAll({
        where,
        order: [["createdAt", "DESC"]],
        limit: PAGE_SIZE + 1,
        attributes: ["id", "type", "title", "message", "link", "isRead", "createdAt"],
      }),
      Notification.count({ where: { ...inboxFor(req), isRead: false } }),
    ]);

    res.status(200).json({
      message: "Notifications fetched successfully",
      data: items.slice(0, PAGE_SIZE),
      hasMore: items.length > PAGE_SIZE,
      unreadCount,
    });
  }

  // *Mark one notification as read
  public static async markRead(req: AuthRequest, res: Response): Promise<void> {
    const [updated] = await Notification.update(
      { isRead: true },
      { where: { id: req.params.id, ...inboxFor(req) } },
    );
    if (!updated) {
      res.status(404).json({ message: "Notification not found", field: "id" });
      return;
    }
    res.status(200).json({ message: "Notification marked as read" });
  }

  // *Mark every notification in this inbox as read
  public static async markAllRead(req: AuthRequest, res: Response): Promise<void> {
    await Notification.update({ isRead: true }, { where: { ...inboxFor(req), isRead: false } });
    res.status(200).json({ message: "All notifications marked as read" });
  }
}

export default NotificationController;
