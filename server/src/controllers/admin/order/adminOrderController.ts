import { Request, Response } from "express";
import { AuthRequest } from "../../../middleware/authMiddleware";
import Order from "../../../database/models/orderModel";
import { Op, QueryTypes } from "sequelize";
import { OrderStatus, PaymentMethod, PaymentStatus } from "../../../types";
import { sequelize } from "../../../database/connection";
import OrderDetails from "../../../database/models/orderDetailsModel";
import Product from "../../../database/models/productModel";
import Payment from "../../../database/models/paymentModel";
import User from "../../../database/models/userModel";
import getFullImageUrl from '../../../services/imageHandler';
import { emitToAdmin, emitToUser } from "../../../services/socketService";
import { notifyCustomer, orderLabel } from "../../../services/notificationService";
import { withPrices } from "../../../services/productPresenter";
import { getStoreSettings } from "../../../services/storeSettingsService";

// Days ("today", "this week") are counted in the store's timezone
const STORE_TIMEZONE = process.env.STORE_TIMEZONE || "Asia/Kathmandu";
// Treat % and _ typed in the search box as plain characters
const escapeLike = (value: string) => value.replace(/[\\%_]/g, (c) => `\\${c}`);

// *Note: Difference between findOne and findByPk is that findOne allows you to specify additional options such as where clause, include, etc. while findByPk is a shorthand method for finding a record by its primary key. 
// In this case, since we want to include related models (OrderDetails, Product, Payment, User), we use findOne with the appropriate include options.

class AdminOrderController {

  // *List orders: tabs, search, filters, sorting and paging all happen in the database.
  //  Query: tab, search, payment, method, range (TODAY|WEEK|MONTH), sort, page, limit
  public static async fetchAllOrders(
    req: Request,
    res: Response
  ): Promise<void> {
    const page = Math.max(1, parseInt(String(req.query.page)) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit)) || 10));
    const tab = String(req.query.tab || "ALL");
    const payment = String(req.query.payment || "ALL");
    const method = String(req.query.method || "ALL");
    const range = String(req.query.range || "ALL");
    const sortKey = String(req.query.sort || "newest");
    const rawSearch = String(req.query.search || "").trim();

    const { orderPrefix } = await getStoreSettings();
    const replacements: Record<string, unknown> = { tz: STORE_TIMEZONE };
    const filters: string[] = [];

    // Days start at midnight in the store's timezone
    if (range === "TODAY") filters.push(`o."createdAt" >= (date_trunc('day', NOW() AT TIME ZONE :tz) AT TIME ZONE :tz)`);
    if (range === "WEEK") filters.push(`o."createdAt" >= ((date_trunc('day', NOW() AT TIME ZONE :tz) - INTERVAL '6 days') AT TIME ZONE :tz)`);
    if (range === "MONTH") filters.push(`o."createdAt" >= (date_trunc('month', NOW() AT TIME ZONE :tz) AT TIME ZONE :tz)`);
    if (["Paid", "Pending", "Failed"].includes(payment)) {
      filters.push(`COALESCE(p."paymentStatus", 'Pending') = :payment`);
      replacements.payment = payment;
    }
    if (["COD", "KHALTI", "ESEWA"].includes(method.toUpperCase())) {
      // paymentMethod is an enum column, so it's compared as text
      filters.push(`UPPER(COALESCE(p."paymentMethod"::text, 'COD')) = :method`);
      replacements.method = method.toUpperCase();
    }
    if (rawSearch) {
      // "TRV-ef2462", "#ef2462" and "ef24" all find the order whose id ends that way
      let idPart = rawSearch.toLowerCase().replace(/^#/, "");
      const prefix = (orderPrefix || "").toLowerCase();
      if (prefix && idPart.startsWith(prefix)) idPart = idPart.slice(prefix.length);
      filters.push(`(
        (:idq <> '' AND CAST(o.id AS TEXT) ILIKE :idqLike)
        OR u.username ILIKE :q OR u.email ILIKE :q
        OR o."phoneNumber" ILIKE :q OR o."shippingAddress" ILIKE :q
        OR EXISTS (SELECT 1 FROM "order_details" d JOIN "products" pr ON pr.id = d."productId"
                   WHERE d."orderId" = o.id AND pr."productName" ILIKE :q)
      )`);
      replacements.q = `%${escapeLike(rawSearch)}%`;
      replacements.idq = idPart;
      replacements.idqLike = `%${escapeLike(idPart)}%`;
    }
    const baseWhere = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const from = `FROM "orders" o
      LEFT JOIN "payments" p ON p.id = o."paymentId"
      LEFT JOIN "users" u ON u.id = o."userId"`;

    // Unpaid Khalti/eSewa orders wait for the customer; other pending orders wait for the store
    const awaiting = `(o."orderStatus" = 'Pending' AND COALESCE(p."paymentMethod", 'COD') <> 'COD' AND COALESCE(p."paymentStatus", 'Pending') <> 'Paid')`;
    const TABS: Record<string, string> = {
      ALL: "TRUE",
      TO_CONFIRM: `(o."orderStatus" = 'Pending' AND NOT ${awaiting})`,
      AWAITING_PAYMENT: awaiting,
      // Paid or cash-on-delivery orders on their way to the customer
      TO_DELIVER: `o."orderStatus" IN ('Preparation', 'In Transit')`,
      Preparation: `o."orderStatus" = 'Preparation'`,
      "In Transit": `o."orderStatus" = 'In Transit'`,
      Delivered: `o."orderStatus" = 'Delivered'`,
      Cancelled: `o."orderStatus" = 'Cancelled'`,
    };
    const tabCondition = TABS[tab] ?? "TRUE";
    const SORTS: Record<string, string> = {
      newest: `o."createdAt" DESC`,
      oldest: `o."createdAt" ASC`,
      amount_desc: `o."totalAmount" DESC`,
      amount_asc: `o."totalAmount" ASC`,
    };
    const orderBy = `${SORTS[sortKey] ?? SORTS.newest}, o.id ASC`;
    const pageWhere = baseWhere ? `${baseWhere} AND ${tabCondition}` : `WHERE ${tabCondition}`;

    const [countRows, statsRows] = await Promise.all([
      // Count for every tab (for the current search/filters), plus the total for the selected tab
      sequelize.query<Record<string, string>>(
        `SELECT ${Object.entries(TABS).map(([key, cond]) => `COUNT(*) FILTER (WHERE ${cond}) AS "${key}"`).join(", ")}
         ${from} ${baseWhere}`,
        { type: QueryTypes.SELECT, replacements },
      ),
      // Card numbers across all orders, whatever is filtered
      sequelize.query<Record<string, string>>(
        `SELECT COUNT(*) AS total,
                COUNT(*) FILTER (WHERE o."createdAt" >= (date_trunc('day', NOW() AT TIME ZONE :tz) AT TIME ZONE :tz)) AS today,
                COALESCE(SUM(o."totalAmount") FILTER (WHERE o."createdAt" >= (date_trunc('day', NOW() AT TIME ZONE :tz) AT TIME ZONE :tz) AND o."orderStatus" <> 'Cancelled'), 0) AS "todayValue",
                COUNT(*) FILTER (WHERE ${TABS.TO_CONFIRM}) AS "toConfirm",
                COUNT(*) FILTER (WHERE o."orderStatus" IN ('Preparation', 'In Transit')) AS "toDeliver",
                COALESCE(SUM(o."totalAmount") FILTER (WHERE p."paymentStatus" = 'Paid' AND o."orderStatus" <> 'Cancelled'), 0) AS revenue
         FROM "orders" o LEFT JOIN "payments" p ON p.id = o."paymentId"`,
        { type: QueryTypes.SELECT, replacements: { tz: STORE_TIMEZONE } },
      ),
    ]);

    const counts = Object.fromEntries(Object.keys(TABS).map((key) => [key, Number(countRows[0]?.[key]) || 0]));
    const total = counts[tab] ?? counts.ALL ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(page, totalPages);

    const idRows = await sequelize.query<{ id: string }>(
      `SELECT o.id ${from} ${pageWhere} ORDER BY ${orderBy} LIMIT :limit OFFSET :offset`,
      { type: QueryTypes.SELECT, replacements: { ...replacements, limit, offset: (currentPage - 1) * limit } },
    );
    const ids = idRows.map((r) => r.id);

    const orders = ids.length
      ? await Order.findAll({
          where: { id: ids },
          include: [
            {
              model: OrderDetails,
              attributes: ["id", "quantity", "unitPrice", "productId"],
              include: [{
                model: Product,
                attributes: ["id", "productName", "productPrice", "productDiscount", "productImage", "productDescription", "productStock", "categoryId"],
              }],
            },
            { model: Payment, attributes: ["paymentMethod", "paymentStatus"] },
            { model: User, attributes: ["username", "email"] },
          ],
        })
      : [];
    const byId = new Map(orders.map((order) => [order.id, order]));
    const data = ids
      .map((id) => byId.get(id))
      .filter((order): order is Order => !!order)
      .map((order) => {
        const plain = order.toJSON();
        plain.OrderDetails = (plain.OrderDetails || []).map((detail: any) => {
          if (detail.Product?.productImage) detail.Product.productImage = getFullImageUrl(detail.Product.productImage);
          if (detail.Product) detail.Product = withPrices(detail.Product);
          return detail;
        });
        return plain;
      });

    const s = statsRows[0] ?? {};
    res.status(200).json({
      message: "Orders fetched successfully",
      data,
      total,
      totalPages,
      currentPage,
      counts,
      stats: {
        total: Number(s.total) || 0,
        today: Number(s.today) || 0,
        todayValue: Number(s.todayValue) || 0,
        toConfirm: Number(s.toConfirm) || 0,
        toDeliver: Number(s.toDeliver) || 0,
        revenue: Number(s.revenue) || 0,
      },
    });
  }

  // *Fetch single order
  public static async fetchSingleOrder(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const orderId = req.params.id;
      if (!orderId) {
        res.status(400).json({
          message: "Order ID is required",
          field: "orderId",
        });
        return;
      }

      const order = await Order.findOne({
        where: { id: orderId },
        include: [
          {
            model: OrderDetails,
            attributes: ["id", "quantity", "unitPrice", "productId"],
            include: [{
              model: Product,
              attributes: ["id", "productName", "productPrice", "productDiscount", "productImage", "productDescription", "productStock", "categoryId"],
            }]
          },
          {
            model: Payment,
            attributes: ["paymentMethod", "paymentStatus"],
          },
          {
            model: User,
            attributes: ["username", "email"],
          }
        ]
      });

      if (!order) {
        res.status(404).json({
          message: "Order not found",
          field: "order",
        });
        return;
      }

        const ordersWithFullImage = order.toJSON();
        if (
          ordersWithFullImage.OrderDetails &&
          Array.isArray(ordersWithFullImage.OrderDetails)
        ) {
          ordersWithFullImage.OrderDetails =
            ordersWithFullImage.OrderDetails.map((detail: any) => {
              if (detail.Product && detail.Product.productImage) {
                detail.Product.productImage = getFullImageUrl(
                  detail.Product.productImage,
                );
              }
              if (detail.Product) detail.Product = withPrices(detail.Product);
              return detail;
            });
        }

        res.status(200).json({
          message: "Order fetched successfully",
          data: ordersWithFullImage,
        });

    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // *Update order status
  public static async updateOrderStatus(
    req: Request,
    res: Response
  ): Promise<void> {
    try {

      const orderId = req.params.id;
      if (!orderId) {
        res.status(400).json({
          message: "Order ID is required",
          field: "orderId",
        });
        return;
      }

      const { orderStatus } = req.body;
      if (!orderStatus || !Object.values(OrderStatus).includes(orderStatus)) {
        res.status(400).json({
          message: "Invalid order status",
          field: "orderStatus",
        });
        return;
      }

      const order = /^[0-9a-f-]{36}$/i.test(String(orderId)) ? await Order.findByPk(orderId as string) : null;
      if (!order) {
        res.status(404).json({
          message: "Order not found",
          field: "order",
        });
        return;
      }

      const currentPayment = await Payment.findByPk(order.paymentId);
      const paidOnline =
        !!currentPayment && currentPayment.paymentMethod !== PaymentMethod.COD && currentPayment.paymentStatus === PaymentStatus.Paid;
      const awaitingPayment =
        !!currentPayment && currentPayment.paymentMethod !== PaymentMethod.COD && currentPayment.paymentStatus !== PaymentStatus.Paid;
      const shipping = [OrderStatus.Preparation, OrderStatus.InTransit, OrderStatus.Delivered].includes(orderStatus);
      if (awaitingPayment && shipping) {
        res.status(400).json({
          message: `This order is waiting for its ${currentPayment!.paymentMethod} payment, so it can't be prepared or shipped yet. Ask the customer to pay, or switch it to cash on delivery from their side.`,
          field: "orderStatus",
        });
        return;
      }

      let statusChanged = order.orderStatus !== orderStatus;

      try {
        await sequelize.transaction(async (t) => {
          // Re-read the order under a row lock: a double click, another admin, the customer or the
          // unpaid-order job may have changed it since, and stock must move exactly once
          const locked = await Order.findByPk(order.id, { transaction: t, lock: t.LOCK.UPDATE });
          if (!locked) throw new Error("ORDER_GONE");
          const previousStatus = locked.orderStatus;
          statusChanged = previousStatus !== orderStatus;
          const cancelling = statusChanged && orderStatus === OrderStatus.Cancelled;
          const restoring = statusChanged && previousStatus === OrderStatus.Cancelled;

          const details = cancelling || restoring
            ? await OrderDetails.findAll({ where: { orderId: order.id }, transaction: t })
            : [];
          // Cancelling puts the items back on sale; reopening a cancelled order takes them again
          for (const detail of details) {
            if (cancelling) {
              await Product.increment("productStock", { by: detail.quantity, where: { id: detail.productId }, transaction: t });
            } else {
              const [taken] = await Product.update(
                { productStock: sequelize.literal(`"productStock" - ${Number(detail.quantity)}`) as unknown as number },
                { where: { id: detail.productId, productStock: { [Op.gte]: detail.quantity } }, transaction: t },
              );
              if (!taken) throw new Error("INSUFFICIENT_STOCK");
            }
          }

          locked.orderStatus = orderStatus;
          await locked.save({ transaction: t });
          order.orderStatus = orderStatus;

          // Cash on delivery is collected when the order is delivered
          const payment = await Payment.findByPk(order.paymentId, { transaction: t });
          if (payment?.paymentMethod === PaymentMethod.COD) {
            const shouldBePaid = orderStatus === OrderStatus.Delivered;
            const isPaid = payment.paymentStatus === PaymentStatus.Paid;
            if (shouldBePaid !== isPaid) {
              payment.paymentStatus = shouldBePaid ? PaymentStatus.Paid : PaymentStatus.Pending;
              await payment.save({ transaction: t });
            }
          }
        });
      } catch (error) {
        if (error instanceof Error && error.message === "ORDER_GONE") {
          res.status(404).json({ message: "Order not found", field: "order" });
          return;
        }
        if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
          res.status(400).json({
            message: "There isn't enough stock left to reopen this cancelled order.",
            field: "orderStatus",
          });
          return;
        }
        throw error;
      }

      const refreshedOrder = await Order.findOne({
        where: { id: orderId },
        include: [
          {
            model: OrderDetails,
            attributes: ["id", "quantity", "unitPrice", "productId"],
            include: [{
              model: Product,
              attributes: ["id", "productName", "productPrice", "productDiscount", "productImage", "productDescription", "productStock", "categoryId"],
            }]
          },
          {
            model: Payment,
            attributes: ["paymentMethod", "paymentStatus"],
          },
          {
            model: User,
            attributes: ["username", "email"],
          }
        ]
      });

      const plainOrder = refreshedOrder ? refreshedOrder.toJSON() : order.toJSON();
      if (plainOrder.OrderDetails && Array.isArray(plainOrder.OrderDetails)) {
        plainOrder.OrderDetails = plainOrder.OrderDetails.map((detail: any) => {
          if (detail.Product && detail.Product.productImage) {
            detail.Product.productImage = getFullImageUrl(detail.Product.productImage);
          }
          if (detail.Product) detail.Product = withPrices(detail.Product);
          return detail;
        });
      }

      emitToAdmin("admin:dashboard-refresh", {
        type: "order-status-updated",
        orderId,
        orderStatus,
      });

      // Live notification for the customer who placed the order
      emitToUser(order.userId, "customer:order-updated", {
        orderId: order.id,
        orderStatus,
      });
      if (statusChanged) {
        const statusText: Record<string, string> = {
          Pending: "is pending confirmation",
          Preparation: "is being prepared",
          "In Transit": "is on its way",
          Delivered: "has been delivered",
          Cancelled: "was cancelled by the store",
        };
        await notifyCustomer(order.userId, {
          type: "order-status",
          title: orderStatus === "In Transit" ? "Order on its way" : `Order ${String(orderStatus).toLowerCase()}`,
          message: `Your order ${await orderLabel(order.id)} ${statusText[orderStatus] ?? `is now ${orderStatus}`}.`,
          link: `/my-orders/orderdetails/${order.id}`,
        });
      }

      res.status(200).json({
        message: `Order ${await orderLabel(order.id)} is now ${orderStatus}`,
        data: plainOrder,
        // Money already received online has to be paid back by hand
        refundNeeded: statusChanged && orderStatus === OrderStatus.Cancelled && paidOnline,
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // *Delete order
  public static async deleteOrder(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const orderId = req.params.id;
      if (!orderId) {
        res.status(400).json({
          message: "Order ID is required",
          field: "orderId",
        });
        return;
      }

      const order = await Order.findByPk(orderId as string);
      if (!order) {
        res.status(404).json({
          message: "Order not found",
          field: "orderId",
        });
        return;
      }

      if (order.orderStatus !== OrderStatus.Cancelled) {
        res.status(400).json({
          message: "Only cancelled orders can be deleted. Cancel this order first if it shouldn't go ahead.",
          field: "orderStatus",
        });
        return;
      }

      const customerId = order.userId;
      const label = await orderLabel(order.id);
      await sequelize.transaction(async (t) => {
        // A cancelled order already gave its stock back; any other order returns it now
        if (order.orderStatus !== OrderStatus.Cancelled) {
          const details = await OrderDetails.findAll({ where: { orderId: order.id }, transaction: t });
          for (const detail of details) {
            await Product.increment("productStock", { by: detail.quantity, where: { id: detail.productId }, transaction: t });
          }
        }
        await OrderDetails.destroy({ where: { orderId: order.id }, transaction: t });
        await order.destroy({ transaction: t });
        if (order.paymentId) {
          await Payment.destroy({ where: { id: order.paymentId }, transaction: t });
        }
      });

      emitToAdmin("admin:dashboard-refresh", {
        type: "order-deleted",
        orderId,
      });
      await notifyCustomer(customerId, {
        type: "order-removed",
        title: "Order removed",
        message: `Your order ${label} was removed by the store. Contact us if you have any questions.`,
        link: "/my-orders",
      });

      res.status(200).json({
        message: "Order deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

}

export default AdminOrderController;
