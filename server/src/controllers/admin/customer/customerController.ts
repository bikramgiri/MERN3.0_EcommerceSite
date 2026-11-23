import { Request, Response } from "express";
import { Op, QueryTypes, type WhereOptions } from "sequelize";
import User from "../../../database/models/userModel";
import Order from "../../../database/models/orderModel";
import Payment from "../../../database/models/paymentModel";
import Review from "../../../database/models/reviewModel";
import Notification from "../../../database/models/notificationModel";
import { sequelize } from "../../../database/connection";
import getFullImageUrl from "../../../services/imageHandler";
import { AuthRequest } from "../../../middleware/authMiddleware";
import { cloudinary } from "../../../cloudinary";
import { getPublicIdFromAvatar } from "../../../services/cloudinaryHelper";
import { emitToUser } from "../../../services/socketService";

// Only what the admin page shows: never passwords, one-time codes or verification tokens
const PUBLIC_USER_FIELDS = ["id", "username", "email", "avatar", "role", "isVerified", "isBlocked", "blockedAt", "createdAt"];

const SORTS: Record<string, [string, "ASC" | "DESC"]> = {
  newest: ["createdAt", "DESC"],
  oldest: ["createdAt", "ASC"],
  name_asc: ["username", "ASC"],
  name_desc: ["username", "DESC"],
};

const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

/** Orders, money spent (paid, not cancelled) and last order date for each user id */
const orderStatsFor = async (userIds: string[]) => {
  if (userIds.length === 0) return new Map<string, { orderCount: number; totalSpent: number; lastOrderAt: string | null }>();
  const rows = await sequelize.query<{ userId: string; orders: string; spent: string; last: string | null }>(
    `SELECT o."userId",
            COUNT(*) AS orders,
            COALESCE(SUM(o."totalAmount") FILTER (WHERE p."paymentStatus" = 'Paid' AND o."orderStatus" <> 'Cancelled'), 0) AS spent,
            MAX(o."createdAt") AS last
       FROM "orders" o LEFT JOIN "payments" p ON p.id = o."paymentId"
      WHERE o."userId" IN (:ids)
      GROUP BY o."userId"`,
    { type: QueryTypes.SELECT, replacements: { ids: userIds } },
  );
  return new Map(
    rows.map((r) => [r.userId, { orderCount: Number(r.orders) || 0, totalSpent: Number(r.spent) || 0, lastOrderAt: r.last }]),
  );
};

const present = (user: User, stats?: { orderCount: number; totalSpent: number; lastOrderAt: string | null }) => {
  const plain = user.toJSON();
  return {
    ...plain,
    avatar: plain.avatar ? getFullImageUrl(plain.avatar) : null,
    orderCount: stats?.orderCount ?? 0,
    totalSpent: stats?.totalSpent ?? 0,
    lastOrderAt: stats?.lastOrderAt ?? null,
  };
};

class CustomerController {
  // *List users: search, role and verification filters, sorting and paging all happen in the database
  public static async fetchAllCustomers(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, parseInt(String(req.query.page)) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit)) || 20));
    const role = String(req.query.role || "ALL");
    const status = String(req.query.status || "ALL");
    const search = String(req.query.search || "").trim();
    const sort: [string, "ASC" | "DESC"] = SORTS[String(req.query.sort)] ?? ["createdAt", "DESC"];

    const conditions: WhereOptions[] = [];
    if (search) {
      conditions.push({ [Op.or]: [{ username: { [Op.iLike]: `%${search}%` } }, { email: { [Op.iLike]: `%${search}%` } }] });
    }
    if (status === "verified") conditions.push({ isVerified: true });
    if (status === "unverified") conditions.push({ isVerified: false });
    if (status === "blocked") conditions.push({ isBlocked: true });
    // Tab counts follow the search and verification filters, but not the role tab itself
    const base: WhereOptions = conditions.length ? { [Op.and]: conditions } : {};
    const where: WhereOptions =
      role === "customer" || role === "admin" ? { [Op.and]: [...conditions, { role }] } : base;

    const [{ count, rows }, customers, admins] = await Promise.all([
      User.findAndCountAll({
        where,
        attributes: PUBLIC_USER_FIELDS,
        order: [sort, ["id", "ASC"]],
        limit,
        offset: (page - 1) * limit,
      }),
      User.count({ where: { [Op.and]: [...conditions, { role: "customer" }] } }),
      User.count({ where: { [Op.and]: [...conditions, { role: "admin" }] } }),
    ]);

    const stats = await orderStatsFor(rows.map((u) => u.id));
    res.status(200).json({
      message: "Users fetched successfully",
      data: rows.map((u) => present(u, stats.get(u.id))),
      total: count,
      totalPages: Math.max(1, Math.ceil(count / limit)),
      currentPage: page,
      counts: { all: customers + admins, customer: customers, admin: admins },
    });
  }

  // *One user with their latest orders, for the details panel
  public static async fetchCustomer(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id);
    const user = isUuid(id) ? await User.findByPk(id, { attributes: PUBLIC_USER_FIELDS }) : null;
    if (!user) {
      res.status(404).json({ message: "User not found", field: "id" });
      return;
    }
    const [stats, recentOrders, reviewCount] = await Promise.all([
      orderStatsFor([user.id]),
      Order.findAll({
        where: { userId: user.id },
        attributes: ["id", "totalAmount", "orderStatus", "createdAt"],
        include: [{ model: Payment, attributes: ["paymentMethod", "paymentStatus"] }],
        order: [["createdAt", "DESC"]],
        limit: 5,
      }),
      Review.count({ where: { userId: user.id } }),
    ]);
    res.status(200).json({
      message: "User fetched successfully",
      data: { ...present(user, stats.get(user.id)), reviewCount, recentOrders },
    });
  }

  // *Block or unblock a customer: they can't sign in while blocked, but nothing is deleted
  public static async setBlocked(req: AuthRequest, res: Response): Promise<void> {
    const id = String(req.params.id);
    const blocked = req.body?.blocked === true;
    const user = isUuid(id) ? await User.findByPk(id) : null;
    if (!user || user.role !== "customer") {
      res.status(404).json({ message: "Customer not found", field: "user" });
      return;
    }
    if (user.isBlocked !== blocked) {
      user.isBlocked = blocked;
      user.blockedAt = blocked ? new Date() : null;
      await user.save();
      // Sign them out of any open tab right away
      if (blocked) emitToUser(user.id, "auth:blocked");
    }
    res.status(200).json({
      message: blocked ? `${user.username} is blocked` : `${user.username} is unblocked`,
      data: { id: user.id, isBlocked: user.isBlocked, blockedAt: user.blockedAt },
    });
  }

  // *Delete a customer account that has no order or review history
  public static async deleteCustomer(req: AuthRequest, res: Response): Promise<void> {
    const id = String(req.params.id);
    const user = isUuid(id) ? await User.findByPk(id) : null;
    if (!user || user.role !== "customer") {
      res.status(404).json({ message: "Customer not found", field: "user" });
      return;
    }

    // Orders and reviews are store records (sales, accounts, ratings), so they must not disappear
    const [orders, reviews] = await Promise.all([
      Order.count({ where: { userId: user.id } }),
      Review.count({ where: { userId: user.id } }),
    ]);
    if (orders > 0 || reviews > 0) {
      const parts = [orders ? `${orders} order${orders === 1 ? "" : "s"}` : "", reviews ? `${reviews} review${reviews === 1 ? "" : "s"}` : ""]
        .filter(Boolean)
        .join(" and ");
      res.status(409).json({
        message: `${user.username} has ${parts}, so the account can't be deleted without losing that history.`,
        field: "user",
      });
      return;
    }

    if (user.avatar) {
      const publicId = getPublicIdFromAvatar(user.avatar);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.error("Error deleting customer avatar from Cloudinary:", error);
        }
      }
    }

    // Cart and wishlist rows are removed by the database (ON DELETE CASCADE)
    await sequelize.transaction(async (t) => {
      await Notification.destroy({ where: { userId: user.id }, transaction: t });
      await user.destroy({ transaction: t });
    });

    res.status(200).json({ message: "Customer deleted successfully" });
  }
}

export default CustomerController;
