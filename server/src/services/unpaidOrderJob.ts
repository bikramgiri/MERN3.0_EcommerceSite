import { Op } from "sequelize";
import { sequelize } from "../database/connection";
import Order from "../database/models/orderModel";
import OrderDetails from "../database/models/orderDetailsModel";
import Payment from "../database/models/paymentModel";
import Product from "../database/models/productModel";
import { OrderStatus, PaymentMethod, PaymentStatus } from "../types";
import { settleOnlinePayment } from "../controllers/customer/order/customerOrderController";
import { emitToAdmin } from "./socketService";
import { UNPAID_ORDER_HOURS } from "./paymentGatewayService";
import { notifyAdmins, notifyCustomer, orderLabel } from "./notificationService";

const CHECK_EVERY_MS = 30 * 60 * 1000; // every 30 minutes

let running = false;

/**
 * Cancels unpaid Khalti/eSewa orders whose last payment attempt is older than the
 * time limit, and puts their items back in stock. Each order is checked with the
 * gateway first: a payment that did go through confirms the order instead.
 * The clock restarts whenever the shopper tries to pay again.
 */
export const cancelExpiredUnpaidOrders = async (): Promise<number> => {
  if (running) return 0; // never overlap with a slow previous run
  running = true;
  let cancelled = 0;
  try {
    const cutoff = new Date(Date.now() - UNPAID_ORDER_HOURS * 60 * 60 * 1000);
    const orders = await Order.findAll({
      where: { orderStatus: OrderStatus.Pending },
      include: [
        {
          model: Payment,
          required: true,
          where: {
            paymentMethod: { [Op.in]: [PaymentMethod.Khalti, PaymentMethod.Esewa] },
            paymentStatus: { [Op.ne]: PaymentStatus.Paid },
            updatedAt: { [Op.lt]: cutoff },
          },
        },
      ],
      limit: 50,
    });

    for (const order of orders) {
      const payment = order.Payment;
      try {
        const result = await settleOnlinePayment(order, payment);
        if (result !== "failed") continue; // paid now, or the gateway is still deciding
      } catch (error) {
        console.warn(`Unpaid order check skipped for ${order.id} (gateway unreachable)`, error);
        continue; // never cancel without a clear answer
      }

      const done = await sequelize.transaction(async (t) => {
        const locked = await Order.findOne({
          where: { id: order.id, orderStatus: OrderStatus.Pending },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!locked) return false;
        const details = await OrderDetails.findAll({ where: { orderId: order.id }, transaction: t });
        for (const detail of details) {
          await Product.increment("productStock", { by: detail.quantity, where: { id: detail.productId }, transaction: t });
        }
        locked.orderStatus = OrderStatus.Cancelled;
        await locked.save({ transaction: t });
        return true;
      });
      if (!done) continue;
      cancelled++;

      const label = await orderLabel(order.id);
      emitToAdmin("admin:order-cancelled", {
        orderId: order.id,
        totalAmount: order.totalAmount,
        customerName: "Customer",
        reason: "Payment not completed in time",
      });
      emitToAdmin("admin:dashboard-refresh", { type: "order-cancelled", orderId: order.id });
      await notifyCustomer(order.userId, {
        type: "order-cancelled",
        title: "Order cancelled",
        message: `We cancelled order ${label} because the payment wasn't completed within ${UNPAID_ORDER_HOURS} hours. Nothing was charged, and you're welcome to order again.`,
        link: `/my-orders/orderdetails/${order.id}`,
      });
      await notifyAdmins({
        type: "order-cancelled",
        title: "Unpaid order cancelled",
        message: `Order ${label} was cancelled automatically: its online payment wasn't completed within ${UNPAID_ORDER_HOURS} hours. The stock was returned.`,
        link: "/admin-dashboard/orders",
      });
    }
  } catch (error) {
    console.error("Unpaid order cleanup failed:", error);
  } finally {
    running = false;
  }
  if (cancelled) console.log(`Cancelled ${cancelled} unpaid order(s) older than ${UNPAID_ORDER_HOURS}h`);
  return cancelled;
};

/** Runs the cleanup shortly after start-up and then every 30 minutes */
export const startUnpaidOrderJob = () => {
  setTimeout(() => void cancelExpiredUnpaidOrders(), 60 * 1000);
  setInterval(() => void cancelExpiredUnpaidOrders(), CHECK_EVERY_MS).unref();
};
