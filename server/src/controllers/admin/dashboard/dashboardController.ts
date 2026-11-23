import { Request, Response } from "express";
import { Op, QueryTypes } from "sequelize";
import { sequelize } from "../../../database/connection";
import User from "../../../database/models/userModel";
import Product from "../../../database/models/productModel";
import Category from "../../../database/models/categoryModel";
import Order from "../../../database/models/orderModel";
import Review from "../../../database/models/reviewModel";
import Payment from "../../../database/models/paymentModel";
import OrderDetails from "../../../database/models/orderDetailsModel";
import getFullImageUrl from "../../../services/imageHandler";
import { getStoreSettings } from "../../../services/storeSettingsService";
import { sellingPrice } from "../../../services/productPresenter";

const RECENT_LIMIT = 10;
// Days are counted in the store's timezone, so an order at 11 pm Nepal time lands on that day
const STORE_TIMEZONE = process.env.STORE_TIMEZONE || "Asia/Kathmandu";

const safeUser = { exclude: ["password", "otp", "otpGeneratedTime", "resetPasswordToken", "emailVerificationToken", "updatedAt"] };

const query = <T extends object>(sql: string, replacements: Record<string, unknown> = {}) =>
  sequelize.query<T>(sql, { type: QueryTypes.SELECT, replacements });

const num = (value: unknown) => Number(value) || 0;

/** "YYYY-MM-DD" for today in the store's timezone */
const todayInStore = () => new Intl.DateTimeFormat("en-CA", { timeZone: STORE_TIMEZONE }).format(new Date());

class DashboardController {
  /**
   * Everything on the admin dashboard. Totals are worked out by the database
   * (counts, sums, GROUP BY), so the response stays small however many orders there are.
   */
  public static async fetchAllData(_req: Request, res: Response): Promise<void> {
    const settings = await getStoreSettings();
    const lowStockLimit = Math.max(1, Number(settings.lowStockThreshold) || 5);

    const [
      totalUsers,
      verifiedCustomers,
      newCustomers30d,
      totalProducts,
      totalCategories,
      totalOrders,
      totalReviews,
      lowStock,
      outOfStock,
      reviewsToModerate,
      recentUsers,
      recentOrders,
      recentReviews,
      statusRows,
      paymentRows,
      attentionRows,
      revenueRows,
      topRows,
      dailyRows,
    ] = await Promise.all([
      User.count({ where: { role: "customer" } }),
      User.count({ where: { role: "customer", isVerified: true } }),
      User.count({ where: { role: "customer", createdAt: { [Op.gte]: new Date(Date.now() - 30 * 86400000) } } }),
      Product.count(),
      Category.count(),
      Order.count(),
      Review.count(),
      Product.count({ where: { productStock: { [Op.gt]: 0, [Op.lte]: lowStockLimit } } }),
      Product.count({ where: { productStock: { [Op.lte]: 0 } } }),
      Review.count({ where: { status: { [Op.in]: ["PENDING", "FLAGGED"] } } }),
      User.findAll({ where: { role: "customer" }, attributes: safeUser, order: [["createdAt", "DESC"]], limit: RECENT_LIMIT }),
      Order.findAll({
        attributes: { exclude: ["updatedAt"] },
        order: [["createdAt", "DESC"]],
        limit: RECENT_LIMIT,
        include: [
          { model: User, attributes: safeUser },
          { model: Payment, attributes: ["paymentStatus", "paymentMethod"] },
          {
            model: OrderDetails,
            attributes: ["id", "quantity", "productId", "unitPrice"],
            include: [
              {
                model: Product,
                attributes: ["id", "productName", "productPrice", "productImage", "productStock"],
                include: [{ model: Category, attributes: ["id", "categoryName"] }],
              },
            ],
          },
        ],
      }),
      Review.findAll({
        attributes: { exclude: ["updatedAt"] },
        order: [["createdAt", "DESC"]],
        limit: RECENT_LIMIT,
        include: [
          { model: User, attributes: ["id", "username", "email"] },
          { model: Product, attributes: ["id", "productName"] },
        ],
      }),
      // Orders per status
      query<{ status: string; count: string }>(
        `SELECT "orderStatus" AS status, COUNT(*) AS count FROM "orders" GROUP BY "orderStatus"`,
      ),
      // Orders and money per payment method
      query<{ method: string; count: string; paidCount: string; total: string; paid: string }>(
        `SELECT p."paymentMethod" AS method,
                COUNT(*) AS count,
                COUNT(*) FILTER (WHERE p."paymentStatus" = 'Paid') AS "paidCount",
                COALESCE(SUM(o."totalAmount"), 0) AS total,
                COALESCE(SUM(o."totalAmount") FILTER (WHERE p."paymentStatus" = 'Paid'), 0) AS paid
           FROM "orders" o JOIN "payments" p ON p.id = o."paymentId"
          GROUP BY p."paymentMethod"`,
      ),
      // Pending orders: unpaid online ones wait for the customer, the rest wait for the store
      query<{ awaitingPayment: string; toConfirm: string }>(
        `SELECT COUNT(*) FILTER (WHERE p."paymentMethod" <> 'COD' AND p."paymentStatus" <> 'Paid') AS "awaitingPayment",
                COUNT(*) FILTER (WHERE p.id IS NULL OR p."paymentMethod" = 'COD' OR p."paymentStatus" = 'Paid') AS "toConfirm"
           FROM "orders" o LEFT JOIN "payments" p ON p.id = o."paymentId"
          WHERE o."orderStatus" = 'Pending'`,
      ),
      // Revenue = money received for orders that weren't cancelled
      query<{ revenue: string }>(
        `SELECT COALESCE(SUM(o."totalAmount"), 0) AS revenue
           FROM "orders" o JOIN "payments" p ON p.id = o."paymentId"
          WHERE p."paymentStatus" = 'Paid' AND o."orderStatus" <> 'Cancelled'`,
      ),
      // Best sellers from orders that weren't cancelled, at the price paid
      query<{ productId: string; sold: string; revenue: string }>(
        `SELECT d."productId",
                SUM(d."quantity") AS sold,
                SUM(d."quantity" * COALESCE(d."unitPrice", pr."productPrice")) AS revenue
           FROM "order_details" d
           JOIN "orders" o ON o.id = d."orderId"
           JOIN "products" pr ON pr.id = d."productId"
          WHERE o."orderStatus" <> 'Cancelled'
          GROUP BY d."productId"
          ORDER BY sold DESC, revenue DESC
          LIMIT 5`,
      ),
      // One row per day for the sales chart (enough history for "12 months vs the 12 before")
      query<{ day: string; orders: string; revenue: string }>(
        `SELECT to_char(o."createdAt" AT TIME ZONE :tz, 'YYYY-MM-DD') AS day,
                COUNT(*) FILTER (WHERE o."orderStatus" <> 'Cancelled') AS orders,
                COALESCE(SUM(o."totalAmount") FILTER (WHERE p."paymentStatus" = 'Paid' AND o."orderStatus" <> 'Cancelled'), 0) AS revenue
           FROM "orders" o LEFT JOIN "payments" p ON p.id = o."paymentId"
          WHERE o."createdAt" >= NOW() - INTERVAL '25 months'
          GROUP BY day
          ORDER BY day`,
        { tz: STORE_TIMEZONE },
      ),
    ]);

    // ---- Status and payment breakdown ----
    const statusCount = (status: string) => num(statusRows.find((r) => r.status === status)?.count);
    const method = (name: string) => {
      const row = paymentRows.find((r) => r.method === name);
      return { count: num(row?.count), paidAmount: num(row?.paid), totalAmount: num(row?.total) };
    };
    const paidOrdersCount = paymentRows.reduce((sum, r) => sum + num(r.paidCount), 0);
    const orderDistribution = {
      totalOrders,
      paidOrdersCount,
      verifiedPaymentPercent: totalOrders > 0 ? Math.round((paidOrdersCount / totalOrders) * 100) : 0,
      statusBreakdown: {
        preparation: statusCount("Preparation"),
        delivered: statusCount("Delivered"),
        pending: statusCount("Pending"),
        inTransit: statusCount("In Transit"),
        cancelled: statusCount("Cancelled"),
      },
      paymentBreakdown: { khalti: method("Khalti"), esewa: method("Esewa"), cod: method("COD") },
    };

    // ---- Best sellers (newest products stand in until something has sold) ----
    const topIds = topRows.map((r) => r.productId);
    const productAttributes = ["id", "productName", "productPrice", "productImage", "productStock", "productDiscount"];
    const topProducts = topIds.length
      ? await Product.findAll({
          where: { id: topIds },
          attributes: productAttributes,
          include: [{ model: Category, attributes: ["id", "categoryName"] }],
        })
      : await Product.findAll({
          attributes: productAttributes,
          include: [{ model: Category, attributes: ["id", "categoryName"] }],
          order: [["createdAt", "DESC"]],
          limit: 5,
        });
    const presentProduct = (p: any) => ({
      id: p.id,
      productName: p.productName,
      productPrice: sellingPrice(p),
      productImage: getFullImageUrl(p.productImage),
      productStock: p.productStock,
      productDiscount: p.productDiscount,
      categoryName: p.category?.categoryName || p.Category?.categoryName || "General",
    });
    const topSellingProducts = topIds.length
      ? topRows
          .map((row) => {
            const product = topProducts.find((p) => p.id === row.productId);
            return product ? { product: presentProduct(product), totalSold: num(row.sold), totalRevenue: num(row.revenue) } : null;
          })
          .filter(Boolean)
      : topProducts.map((p) => ({ product: presentProduct(p), totalSold: 0, totalRevenue: 0 }));

    // ---- Recent lists ----
    const recentUserIds = recentUsers.map((u) => u.id);
    const orderCountRows = recentUserIds.length
      ? await query<{ userId: string; count: string }>(
          `SELECT "userId", COUNT(*) AS count FROM "orders" WHERE "userId" IN (:ids) GROUP BY "userId"`,
          { ids: recentUserIds },
        )
      : [];
    const formattedRecentUsers = recentUsers.map((user) => {
      const plain = user.toJSON();
      return {
        ...plain,
        avatar: plain.avatar ? getFullImageUrl(plain.avatar) : null,
        orderCount: num(orderCountRows.find((r) => r.userId === plain.id)?.count),
      };
    });
    const formattedRecentOrders = recentOrders.map((order) => {
      const plain = order.toJSON();
      return {
        ...plain,
        OrderDetails: (plain.OrderDetails || []).map((detail: any) => ({
          ...detail,
          Product: detail.Product
            ? {
                ...detail.Product,
                productImage: getFullImageUrl(detail.Product.productImage),
                categoryName: detail.Product.category?.categoryName || detail.Product.Category?.categoryName || "General",
              }
            : null,
        })),
      };
    });

    // ---- Daily sales, and this month vs last month (store timezone) ----
    const dailySales = dailyRows.map((r) => ({ day: r.day, orders: num(r.orders), revenue: num(r.revenue) }));
    const today = todayInStore();
    const thisMonth = today.slice(0, 7);
    const year = Number(thisMonth.slice(0, 4));
    const month = Number(thisMonth.slice(5, 7));
    const lastMonth = month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`;
    const period = { revenueThisMonth: 0, revenueLastMonth: 0, ordersThisMonth: 0, ordersLastMonth: 0 };
    for (const row of dailySales) {
      const rowMonth = row.day.slice(0, 7);
      if (rowMonth === thisMonth) {
        period.revenueThisMonth += row.revenue;
        period.ordersThisMonth += row.orders;
      } else if (rowMonth === lastMonth) {
        period.revenueLastMonth += row.revenue;
        period.ordersLastMonth += row.orders;
      }
    }

    const attention = attentionRows[0] ?? { awaitingPayment: "0", toConfirm: "0" };

    res.status(200).json({
      message: "Data fetched successfully",
      data: {
        totalUsers,
        totalProducts,
        totalCategories,
        totalOrders,
        totalReviews,
        totalRevenue: num(revenueRows[0]?.revenue),
        recentUsers: formattedRecentUsers,
        recentOrders: formattedRecentOrders,
        recentReviews,
        topSellingProducts,
        orderDistribution,
        verifiedCustomers,
        newCustomers30d,
        attention: {
          ordersToConfirm: num(attention.toConfirm),
          awaitingPayment: num(attention.awaitingPayment),
          lowStock,
          outOfStock,
          reviewsToModerate,
          lowStockLimit,
        },
        period,
        dailySales,
        today,
        timezone: STORE_TIMEZONE,
      },
    });
  }
}

export default DashboardController;
