import { Response } from "express";
import { AuthRequest } from "../../../middleware/authMiddleware";
import Order from "../../../database/models/orderModel";
import OrderDetails from "../../../database/models/orderDetailsModel";
import {
  KhaltiResponse,
  OrderDetail,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  TransactionStatus,
  TransactionVerificationResponse,
} from "../../../types";
import Payment from "../../../database/models/paymentModel";
import { envConfig } from "../../../config/config";
import Product from "../../../database/models/productModel";
import axios from "axios";
import { generateHmacSha256Hash } from "../../../services/helper";
import User from "../../../database/models/userModel";
import Category from "../../../database/models/categoryModel";
import getFullImageUrl from "../../../services/imageHandler";
import Cart from "../../../database/models/cartModel";
import { sequelize } from "../../../database/connection";
import Review from "../../../database/models/reviewModel";
import { Op } from "sequelize";
import { emitToAdmin } from "../../../services/socketService";
import {
  calculateShippingCost,
  editedOrderShippingCost,
  getStoreSettings,
} from "../../../services/storeSettingsService";
import {
  notifyAdmins,
  notifyCustomer,
  orderLabel,
} from "../../../services/notificationService";
import {
  calculateCouponDiscount,
  CouponError,
  normalizeCouponCode,
  redeemableCoupon,
} from "../../../services/couponService";
import Coupon from "../../../database/models/couponModel";
import { approvedReviewsOnly } from "../../../services/productPresenter";
import {
  buildEsewaPayment,
  checkGatewayStatus,
  paymentDueAt,
  startKhaltiPayment,
  type GatewayResult,
} from "../../../services/paymentGatewayService";

const formatRs = (amount: number | string) => `Rs ${Number(amount).toLocaleString()}`;

// Online payment confirmed: tell the customer and the admin team
const notifyPaidOrder = async (order: Order, gateway: string, customerName?: string) => {
  const label = await orderLabel(order.id);
  await notifyCustomer(order.userId, {
    type: "payment-received",
    title: "Payment received",
    message: `We received your ${gateway} payment of ${formatRs(order.totalAmount)} for order ${label}. It's now being prepared.`,
    link: `/my-orders/orderdetails/${order.id}`,
  });
  await notifyAdmins({
    type: "new-order",
    title: Number(order.totalAmount) >= 15000 ? "New high-value order" : "New order",
    message: `${customerName || "A customer"} paid ${formatRs(order.totalAmount)} by ${gateway} for order ${label}.`,
    link: "/admin-dashboard/orders",
  });
};

// Online payment failed or was cancelled
const notifyFailedPayment = async (order: Order, gateway: string) => {
  const label = await orderLabel(order.id);
  await notifyCustomer(order.userId, {
    type: "payment-failed",
    title: "Payment not completed",
    message: `Your ${gateway} payment for order ${label} didn't go through. You can try again or choose cash on delivery.`,
    link: `/my-orders/orderdetails/${order.id}`,
  });
  await notifyAdmins({
    type: "payment-failed",
    title: "Payment failed",
    message: `${gateway} payment for order ${label} (${formatRs(order.totalAmount)}) failed or was cancelled.`,
    link: "/admin-dashboard/orders",
  });
};

const gatewayName = (payment: Payment) => (payment.paymentMethod === PaymentMethod.Esewa ? "eSewa" : "Khalti");

/**
 * Checks an online payment with Khalti/eSewa and records the result. The status
 * change is conditional, so a page refresh or two tabs can't notify twice.
 */
export const settleOnlinePayment = async (order: Order, payment: Payment, customerName?: string) => {
  const result = await checkGatewayStatus(order, payment);
  const gateway = gatewayName(payment);

  if (result === "paid" && payment.paymentStatus !== PaymentStatus.Paid) {
    const marked = await sequelize.transaction(async (t) => {
      const [count] = await Payment.update(
        { paymentStatus: PaymentStatus.Paid },
        { where: { id: payment.id, paymentStatus: { [Op.ne]: PaymentStatus.Paid } }, transaction: t },
      );
      if (count && order.orderStatus === OrderStatus.Pending) {
        order.orderStatus = OrderStatus.Preparation;
        await order.save({ transaction: t });
      }
      return count > 0;
    });
    payment.paymentStatus = PaymentStatus.Paid;
    if (marked && order.orderStatus === OrderStatus.Cancelled) {
      // Money arrived for an order that was already cancelled: it has to be refunded by hand
      await notifyAdmins({
        type: "payment-failed",
        title: "Refund needed",
        message: `A ${gateway} payment of ${formatRs(order.totalAmount)} arrived for cancelled order ${await orderLabel(order.id)}. Please refund the customer.`,
        link: "/admin-dashboard/orders",
      });
    } else if (marked) {
      await notifyPaidOrder(order, gateway, customerName);
      emitToAdmin("admin:order-created", {
        orderId: order.id,
        totalAmount: order.totalAmount,
        paymentMethod: payment.paymentMethod,
        orderStatus: order.orderStatus,
        phoneNumber: order.phoneNumber,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt,
      });
      emitToAdmin("admin:dashboard-refresh", { type: "payment-completed", orderId: order.id });
      emitToAdmin("admin:payment-verified", {
        orderId: order.id,
        amount: order.totalAmount,
        paymentMethod: payment.paymentMethod,
        transactionCode: payment.pidx,
      });
    }
  } else if (result === "failed" && payment.paymentStatus === PaymentStatus.Pending) {
    const [count] = await Payment.update(
      { paymentStatus: PaymentStatus.Failed },
      { where: { id: payment.id, paymentStatus: PaymentStatus.Pending } },
    );
    payment.paymentStatus = PaymentStatus.Failed;
    if (count) {
      emitToAdmin("admin:payment-failed", {
        orderId: order.id,
        gateway,
        amount: order.totalAmount,
        reason: `${gateway} payment was cancelled, expired or failed`,
      });
      await notifyFailedPayment(order, gateway);
    }
  }
  return result;
};

const paymentResponse = (order: Order, payment: Payment, result: GatewayResult) => ({
  message:
    result === "paid"
      ? "Payment confirmed. Your order is being prepared."
      : result === "pending"
        ? "Your payment hasn't finished yet."
        : "Your payment wasn't completed.",
  paymentStatus: result,
  data: {
    id: order.id,
    totalAmount: Number(order.totalAmount),
    orderStatus: order.orderStatus,
    paymentMethod: payment.paymentMethod,
  },
});

/**
 * Before an unpaid online order is cancelled or deleted, ask the gateway whether the
 * payment went through after all, so a paid order is never thrown away.
 */
const isPaidAtGateway = async (order: Order, customerName?: string): Promise<boolean> => {
  const payment = await Payment.findByPk(order.paymentId);
  if (!payment || payment.paymentMethod === PaymentMethod.COD) return false;
  if (payment.paymentStatus === PaymentStatus.Paid) return true;
  if (!payment.pidx) return false;
  try {
    return (await settleOnlinePayment(order, payment, customerName)) === "paid";
  } catch {
    return false; // gateway unreachable: an unconfirmed payment doesn't block cancelling
  }
};

class CustomerOrderController {
  // *Create order and integrate payment gateway
  public static async createOrder(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        message: "Unauthorized",
        field: "general",
      });
      return;
    }

    const settings = await getStoreSettings();
    if (settings.maintenanceMode) {
      res.status(503).json({
        message:
          settings.maintenanceMessage ||
          "Store is currently undergoing brief maintenance. Orders are temporarily paused.",
        field: "general",
      });
      return;
    }

    const {
      phoneNumber,
      shippingAddress,
      totalAmount,
      paymentDetails,
      products,
      couponCode: rawCouponCode,
    }: OrderDetail = req.body;
    const couponCode = normalizeCouponCode(rawCouponCode);
    if (
      !phoneNumber ||
      !shippingAddress ||
      !totalAmount ||
      !paymentDetails ||
      !products ||
      !Array.isArray(products) ||
      products.length === 0
    ) {
      res.status(400).json({
        message: "All fields are required",
        field: "general",
      });
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      res.status(400).json({
        message: "Phone number must be exactly 10 digits",
        field: "phoneNumber",
      });
      return;
    }

    if (shippingAddress.length < 4 || shippingAddress.length > 200) {
      res.status(400).json({
        message: "Shipping address must be between 4 and 200 characters",
        field: "shippingAddress",
      });
      return;
    }

    const parsedTotalAmount = Number(totalAmount);
    if (isNaN(parsedTotalAmount) || parsedTotalAmount <= 0) {
      res.status(400).json({
        message: "Total amount must be a positive number",
        field: "totalAmount",
      });
      return;
    }

    let calculatedTotalCost = 0;
    const unitPrices = new Map<string, number>();
    let productsTotalCost = 0;
    for (const item of products) {
      const product = await Product.findByPk(item.productId);
      if (!product) {
        res.status(400).json({
          message: "Invalid product in order",
          field: "products",
        });
        return;
      }

      if (item.quantity <= 0) {
        res.status(400).json({
          message: "Quantity must be a positive number",
          field: "products",
        });
        return;
      }

      if (item.quantity > product.productStock) {
        res.status(400).json({
          message: `Insufficient stock for product ${product.productName}`,
          field: "products",
        });
        return;
      }

      const price = Number(product.productPrice) || 0;
      unitPrices.set(item.productId, price); // price at the time of ordering
      const qty = Number(item.quantity) || 1;
      productsTotalCost += price * qty;
    }
    // Delivery is based on the items subtotal before any promo discount
    const shippingCost = calculateShippingCost(productsTotalCost, settings);

    let discountAmount = 0;
    if (couponCode) {
      try {
        discountAmount = (await redeemableCoupon(couponCode, userId, productsTotalCost)).discount;
      } catch (error) {
        if (error instanceof CouponError) {
          res.status(400).json({ message: error.message, field: error.field });
          return;
        }
        throw error;
      }
    }
    calculatedTotalCost = productsTotalCost - discountAmount + shippingCost;

    if (calculatedTotalCost <= 0) {
      res.status(400).json({
        message: "Calculated total amount must be a positive number",
        field: "totalAmount",
      });
      return;
    }

    const roundToCents = (n: number) => Math.round(n * 100);

    if (roundToCents(calculatedTotalCost) !== roundToCents(parsedTotalAmount)) {
      res.status(400).json({
        message: "Total amount does not match with products total",
        field: "totalAmount",
      });
      return;
    }

    if (!Object.values(PaymentMethod).includes(paymentDetails.paymentMethod)) {
      res.status(400).json({
        message: "Invalid payment method",
        field: "paymentMethod",
      });
      return;
    }

    const isCod = paymentDetails.paymentMethod === PaymentMethod.COD;
    if (
      (isCod && !settings.enableCod) ||
      (!isCod && !settings.enableOnlinePayment)
    ) {
      res.status(400).json({
        message: isCod
          ? "Cash on delivery is currently unavailable"
          : "Online payment is currently unavailable",
        field: "paymentMethod",
      });
      return;
    }

    try {
      const { paymentData, order, orderDetailResponse } =
        await sequelize.transaction(async (t) => {
          // Re-check the code with its row locked so two orders can't both take the last use
          if (couponCode) {
            const { discount } = await redeemableCoupon(couponCode, userId, productsTotalCost, t);
            if (Math.round(discount * 100) !== Math.round(discountAmount * 100)) {
              throw new CouponError("This promo code changed while you were checking out. Please apply it again.");
            }
          }

          const paymentData = await Payment.create(
            {
              paymentMethod: paymentDetails.paymentMethod,
            },
            { transaction: t },
          );

          const order = await Order.create(
            {
              userId,
              phoneNumber,
              shippingAddress,
              totalAmount: calculatedTotalCost,
              subtotalAmount: productsTotalCost,
              shippingFee: shippingCost,
              discountAmount,
              couponCode: couponCode || null,
              paymentId: paymentData.id,
            },
            { transaction: t },
          );

          //  let orderDetailResponse
          // products.forEach(async function (product) {
          //   orderDetailResponse = await OrderDetails.create({
          //     orderId: order.id,
          //     productId: product.productId,
          //     quantity: product.quantity,
          //   });
          // });

          // *OR

          const orderDetailResponse = [];
          for (const item of products) {
            const [affectedCount] = await Product.update(
              {
                productStock: sequelize.literal(
                  `"productStock" - ${item.quantity}`,
                ) as unknown as number,
              },
              {
                where: {
                  id: item.productId,
                  productStock: { [Op.gte]: item.quantity },
                },
                transaction: t,
              },
            );

            if (!affectedCount) {
              throw new Error("INSUFFICIENT_STOCK");
            }

            const detail = await OrderDetails.create(
              {
                orderId: order.id,
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: unitPrices.get(item.productId) ?? null,
              },
              { transaction: t },
            );
            orderDetailResponse.push(detail);
          }

          return { paymentData, order, orderDetailResponse };
        });

      // Stock Safety Alerts: check stock levels and emit low-stock or out-of-stock alerts
      for (const item of products) {
        const product = await Product.findByPk(item.productId);
        if (product) {
          const stock = Number(product.productStock) || 0;
          if (stock === 0) {
            emitToAdmin("admin:out-of-stock", {
              productId: product.id,
              productName: product.productName,
              productImage: product.productImage,
              remainingStock: 0,
            });
            await notifyAdmins({
              type: "out-of-stock",
              title: "Out of stock",
              message: `${product.productName} just sold out. Restock it so customers can keep buying.`,
              link: "/admin-dashboard/products",
            });
          } else if (stock < settings.lowStockThreshold) {
            emitToAdmin("admin:low-stock", {
              productId: product.id,
              productName: product.productName,
              productImage: product.productImage,
              remainingStock: stock,
            });
            await notifyAdmins({
              type: "low-stock",
              title: "Low stock",
              message: `Only ${stock} left of ${product.productName}.`,
              link: "/admin-dashboard/products",
            });
          }
        }
      }

      // High-Value Order Flag (>= Rs. 15,000)
      const isHighValue = Number(order.totalAmount) >= 15000;
      if (isHighValue) {
        emitToAdmin("admin:high-value-order", {
          orderId: order.id,
          totalAmount: order.totalAmount,
          customerName: req.user?.username || "Customer",
          phoneNumber: order.phoneNumber,
        });
      }

      // Payment gateway integration
      if (paymentDetails.paymentMethod === PaymentMethod.Khalti) {
        try {
          const data = {
            return_url: envConfig.clientUrl + "/payment/khalti-callback",
            website_url: envConfig.clientUrl,
            amount: Math.round(calculatedTotalCost * 100), // Convert to paisa
            purchase_order_id: order.id.toString(),
            purchase_order_name: "orderName_" + order.id,
          };

          const response = await axios.post(
            envConfig.khaltiPaymentUrl as string,
            data,
            {
              headers: {
                Authorization: `Key ${envConfig.khaltiSecretKey}`,
              },
            },
          );
          const khaltiResponse: KhaltiResponse = response.data;
          paymentData.pidx = khaltiResponse.pidx;
          await paymentData.save();

          await Cart.destroy({ where: { userId } });

          // Real-time notification for admin
          emitToAdmin("admin:order-created", {
            orderId: order.id,
            totalAmount: order.totalAmount,
            paymentMethod: PaymentMethod.Khalti,
            orderStatus: order.orderStatus,
            phoneNumber: order.phoneNumber,
            shippingAddress: order.shippingAddress,
            isHighValue,
            createdAt: order.createdAt,
          });
          emitToAdmin("admin:dashboard-refresh", {
            type: "order-created",
            orderId: order.id,
          });

          res.status(201).json({
            message: "Order placed successfully, proceed to Khalti payment",
            data: order,
            pidx: khaltiResponse.pidx,
            paymentUrl: khaltiResponse.payment_url,
            orderDetails: orderDetailResponse,
          });
          return;
        } catch (khaltiError) {
          // Gateway failed after commit — restore stock and remove the order/payment/details
          try {
            await sequelize.transaction(async (t) => {
              for (const item of products) {
                await Product.increment("productStock", {
                  by: item.quantity,
                  where: { id: item.productId },
                  transaction: t,
                });
              }
              await OrderDetails.destroy({
                where: { orderId: order.id },
                transaction: t,
              });
              await order.destroy({ transaction: t });
              await paymentData.destroy({ transaction: t });
            });

            emitToAdmin("admin:payment-failed", {
              orderId: order.id,
              gateway: "Khalti",
              amount: calculatedTotalCost,
              reason: "Failed to initiate Khalti payment gateway session",
            });

            res.status(400).json({
              message: "Failed to initiate Khalti payment. Please try again.",
              field: "payment",
            });
          } catch (rollbackError) {
            console.error(
              `CRITICAL: Failed to roll back order ${order.id} after Khalti init failure. Manual intervention required.`,
              rollbackError,
            );
            res.status(500).json({
              message:
                "Payment could not be initiated and automatic cleanup failed. Please contact support with your order reference.",
              field: "payment",
              orderId: order.id,
            });
          }
          return;
        }
      }

      if (paymentDetails.paymentMethod === PaymentMethod.Esewa) {
        try {
          const transactionUuid = order.id.toString();
          const totalAmount = calculatedTotalCost.toString();
          const productCode = envConfig.esewaMerchantId;

          const dataToSign = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
          const signature = generateHmacSha256Hash(
            dataToSign,
            envConfig.esewaSecret as string,
          );

          const esewaPaymentData = {
            amount: totalAmount,
            tax_amount: "0",
            product_service_charge: "0",
            product_delivery_charge: "0",
            total_amount: totalAmount,
            transaction_uuid: transactionUuid,
            product_code: productCode,
            success_url: envConfig.clientUrl + "/payment/esewa-callback",
            failure_url: envConfig.clientUrl + "/payment/esewa-failure",
            signed_field_names: "total_amount,transaction_uuid,product_code",
            signature,
          };

          paymentData.pidx = order.id.toString();
          await paymentData.save();

          await Cart.destroy({ where: { userId } });

          // Real-time notification for admin
          emitToAdmin("admin:order-created", {
            orderId: order.id,
            totalAmount: order.totalAmount,
            paymentMethod: PaymentMethod.Esewa,
            orderStatus: order.orderStatus,
            phoneNumber: order.phoneNumber,
            shippingAddress: order.shippingAddress,
            isHighValue,
            createdAt: order.createdAt,
          });
          emitToAdmin("admin:dashboard-refresh", {
            type: "order-created",
            orderId: order.id,
          });

          res.status(201).json({
            message: "Order created. Proceed to eSewa payment.",
            data: order,
            esewaPaymentUrl: envConfig.esewaPaymentUrl,
            esewaPaymentData,
            orderDetails: orderDetailResponse,
          });
          return;
        } catch (esewaError) {
          try {
            await sequelize.transaction(async (t) => {
              for (const item of products) {
                await Product.increment("productStock", {
                  by: item.quantity,
                  where: { id: item.productId },
                  transaction: t,
                });
              }
              await OrderDetails.destroy({
                where: { orderId: order.id },
                transaction: t,
              });
              await order.destroy({ transaction: t });
              await paymentData.destroy({ transaction: t });
            });

            emitToAdmin("admin:payment-failed", {
              orderId: order.id,
              gateway: "eSewa",
              amount: calculatedTotalCost,
              reason: "Failed to initiate eSewa payment gateway session",
            });

            res.status(400).json({
              message: "Failed to initiate eSewa payment. Please try again.",
              field: "payment",
            });
          } catch (rollbackError) {
            console.error(
              `CRITICAL: Failed to roll back order ${order.id} after eSewa init failure. Manual intervention required.`,
              rollbackError,
            );
            res.status(500).json({
              message:
                "Payment could not be initiated and automatic cleanup failed. Please contact support with your order reference.",
              field: "payment",
              orderId: order.id,
            });
          }
          return;
        }
      }

      // Clear user's cart after order placement
      await Cart.destroy({ where: { userId } });

      // Real-time notification for admin
      emitToAdmin("admin:order-created", {
        orderId: order.id,
        totalAmount: order.totalAmount,
        paymentMethod: paymentDetails.paymentMethod,
        orderStatus: order.orderStatus,
        phoneNumber: order.phoneNumber,
        shippingAddress: order.shippingAddress,
        isHighValue,
        createdAt: order.createdAt,
      });
      emitToAdmin("admin:dashboard-refresh", {
        type: "order-created",
        orderId: order.id,
      });

      const label = await orderLabel(order.id);
      const amount = `Rs ${Number(order.totalAmount).toLocaleString()}`;
      await notifyCustomer(userId, {
        type: "order-placed",
        title: "Order placed",
        message: `Thanks! Your order ${label} (${amount}, cash on delivery) has been placed. We'll let you know when it's being prepared.`,
        link: `/my-orders/orderdetails/${order.id}`,
      });
      await notifyAdmins({
        type: "new-order",
        title: isHighValue ? "New high-value order" : "New order",
        message: `${req.user?.username || "A customer"} placed order ${label} for ${amount} (cash on delivery).`,
        link: "/admin-dashboard/orders",
      });

      res.status(201).json({
        message: "Order created successfully",
        data: order,
        orderDetails: orderDetailResponse,
      });
    } catch (error) {
      if (error instanceof CouponError) {
        res.status(400).json({ message: error.message, field: error.field });
        return;
      }
      if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
        res.status(400).json({
          message: "Some items just sold out or ran low. Please review your cart and try again.",
          field: "products",
        });
        return;
      }
      console.error("Error creating order:", error);
      res.status(500).json({
        message: "Internal server error while creating order",
        field: "general",
      });
    }
  }

  // *Khalti return page: confirm the payment with Khalti before marking the order paid
  public static async verifyKhaltiPayment(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated", field: "user" });
      return;
    }
    const pidx = typeof req.body?.pidx === "string" ? req.body.pidx : "";
    if (!pidx) {
      res.status(400).json({ message: "pidx is required", field: "pidx" });
      return;
    }

    const payment = await Payment.findOne({ where: { pidx, paymentMethod: PaymentMethod.Khalti } });
    const order = payment ? await Order.findOne({ where: { paymentId: payment.id, userId } }) : null;
    if (!payment || !order) {
      res.status(404).json({ message: "We couldn't find the order for this payment.", field: "order" });
      return;
    }

    try {
      const result = await settleOnlinePayment(order, payment, req.user?.username);
      res.status(200).json(paymentResponse(order, payment, result));
    } catch (error) {
      console.error("Khalti verification error:", error);
      res.status(502).json({ message: "We couldn't reach Khalti to confirm your payment. Please try again.", field: "payment" });
    }
  }

  // *eSewa return page: confirm with eSewa's status API using our own amount, not the browser's
  public static async verifyEsewaPayment(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated", field: "user" });
      return;
    }
    const transactionUuid = typeof req.body?.transaction_uuid === "string" ? req.body.transaction_uuid : "";
    if (!transactionUuid) {
      res.status(400).json({ message: "Invalid eSewa callback data", field: "general" });
      return;
    }

    let payment = await Payment.findOne({ where: { pidx: transactionUuid, paymentMethod: PaymentMethod.Esewa } });
    let order = payment ? await Order.findOne({ where: { paymentId: payment.id, userId } }) : null;

    // Orders paid before this change had their transaction id replaced after payment
    if (!order && /^[0-9a-f-]{36}$/i.test(transactionUuid)) {
      order = await Order.findOne({ where: { id: transactionUuid, userId } });
      payment = order ? await Payment.findByPk(order.paymentId) : null;
    }
    if (!payment || !order) {
      res.status(404).json({ message: "We couldn't find the order for this payment.", field: "order" });
      return;
    }

    try {
      const result = await settleOnlinePayment(order, payment, req.user?.username);
      res.status(200).json(paymentResponse(order, payment, result));
    } catch (error) {
      console.error("eSewa verification error:", error);
      res.status(502).json({ message: "We couldn't reach eSewa to confirm your payment. Please try again.", field: "payment" });
    }
  }

  // *Re-check an online payment with the gateway (eSewa failure page, "Check payment" on an order)
  public static async syncPayment(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    const orderId = String(req.params.id);
    if (!userId) {
      res.status(401).json({ message: "User not authenticated", field: "user" });
      return;
    }
    const order = /^[0-9a-f-]{36}$/i.test(orderId) ? await Order.findOne({ where: { id: orderId, userId } }) : null;
    const payment = order ? await Payment.findByPk(order.paymentId) : null;
    if (!order || !payment) {
      res.status(404).json({ message: "Order not found", field: "orderId" });
      return;
    }
    if (payment.paymentMethod === PaymentMethod.COD) {
      res.status(200).json(paymentResponse(order, payment, "pending"));
      return;
    }
    try {
      const result = await settleOnlinePayment(order, payment, req.user?.username);
      res.status(200).json(paymentResponse(order, payment, result));
    } catch (error) {
      console.error("Payment sync error:", error);
      res.status(502).json({ message: "We couldn't reach the payment provider. Please try again.", field: "payment" });
    }
  }

  // *Pay again for an unpaid order (online payment failed or was cancelled), or switch it to cash on delivery
  public static async retryPayment(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    const orderId = String(req.params.id);
    if (!userId) {
      res.status(401).json({ message: "User not authenticated", field: "user" });
      return;
    }
    const paymentMethod = req.body?.paymentMethod as PaymentMethod;
    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
      res.status(400).json({ message: "Invalid payment method", field: "paymentMethod" });
      return;
    }

    const order = /^[0-9a-f-]{36}$/i.test(orderId) ? await Order.findOne({ where: { id: orderId, userId } }) : null;
    const payment = order ? await Payment.findByPk(order.paymentId) : null;
    if (!order || !payment) {
      res.status(404).json({ message: "Order not found", field: "orderId" });
      return;
    }
    if (order.orderStatus !== OrderStatus.Pending) {
      res.status(400).json({ message: `This order is ${order.orderStatus === OrderStatus.Preparation ? "already being prepared" : order.orderStatus.toLowerCase()}, so its payment can't be changed.`, field: "orderStatus" });
      return;
    }

    const settings = await getStoreSettings();
    if (settings.maintenanceMode) {
      res.status(503).json({ message: settings.maintenanceMessage || "Orders are paused for maintenance. Please try again soon.", field: "general" });
      return;
    }
    const isCod = paymentMethod === PaymentMethod.COD;
    if ((isCod && !settings.enableCod) || (!isCod && !settings.enableOnlinePayment)) {
      res.status(400).json({
        message: isCod ? "Cash on delivery is currently unavailable" : "Online payment is currently unavailable",
        field: "paymentMethod",
      });
      return;
    }

    // Never start a second payment if the first one actually went through
    if (payment.paymentMethod !== PaymentMethod.COD && payment.pidx) {
      try {
        const result = await settleOnlinePayment(order, payment, req.user?.username);
        if (result === "paid") {
          res.status(200).json({ ...paymentResponse(order, payment, result), message: "This order is already paid." });
          return;
        }
      } catch {
        // Gateway unreachable: carry on with the new attempt
      }
    }

    payment.paymentMethod = paymentMethod;
    payment.paymentStatus = PaymentStatus.Pending;
    payment.pidx = null;
    await payment.save();

    try {
      if (paymentMethod === PaymentMethod.Khalti) {
        const { pidx, paymentUrl } = await startKhaltiPayment(order, payment);
        res.status(200).json({ message: "Proceed to Khalti payment", pidx, paymentUrl, data: { id: order.id } });
        return;
      }
      if (paymentMethod === PaymentMethod.Esewa) {
        const esewa = await buildEsewaPayment(order, payment);
        res.status(200).json({ message: "Proceed to eSewa payment", ...esewa, data: { id: order.id } });
        return;
      }
    } catch (error) {
      console.error("Payment retry error:", error);
      res.status(502).json({ message: `We couldn't start the ${paymentMethod} payment. Please try again.`, field: "payment" });
      return;
    }

    await notifyAdmins({
      type: "order-edited",
      title: "Switched to cash on delivery",
      message: `${req.user?.username || "A customer"} will pay ${formatRs(order.totalAmount)} in cash for order ${await orderLabel(order.id)}.`,
      link: "/admin-dashboard/orders",
    });
    res.status(200).json({ ...paymentResponse(order, payment, "pending"), message: "You'll pay when your order arrives." });
  }

  // *Fetch My orders
  public static async fetchMyOrders(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          message: "User not authenticated",
          field: "user",
        });
        return;
      }

      const orders = await Order.findAll({
        where: { userId },
        include: [
          {
            model: Payment,
            attributes: ["paymentMethod", "paymentStatus", "updatedAt"],
          },
          {
            model: OrderDetails,
            attributes: ["productId", "quantity", "unitPrice"],
            include: [
              {
                model: Product,
                attributes: [
                  "productName",
                  "productPrice",
                  "productImage",
                  "productStock",
                ],
              },
            ],
          },
        ],
      });
      // Newest first; no orders yet is a normal empty list, not an error
      orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const ordersWithFullImage = orders.map((order) => {
        const plainOrder = order.toJSON();
        plainOrder.paymentDueAt = paymentDueAt(plainOrder);
        if (plainOrder.OrderDetails && Array.isArray(plainOrder.OrderDetails)) {
          plainOrder.OrderDetails = plainOrder.OrderDetails.map(
            (detail: any) => {
              if (detail.Product && detail.Product.productImage) {
                detail.Product.productImage = getFullImageUrl(
                  detail.Product.productImage,
                );
              }
              return detail;
            },
          );
        }
        return plainOrder;
      });

      res.status(200).json({
        message: "My Orders fetched successfully",
        totalOrders: ordersWithFullImage.length,
        data: ordersWithFullImage,
      });
    } catch (err) {
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // *Fetch my single order
  public static async fetchMySingleOrder(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          message: "User not authenticated",
          field: "user",
        });
        return;
      }

      const orderId = req.params.id;
      if (!orderId) {
        res.status(400).json({
          message: "Order ID is required",
          field: "orderId",
        });
        return;
      }

      const order = await Order.findOne({
        where: { id: orderId, userId },
        include: [
          {
            model: Payment,
            attributes: ["paymentMethod", "paymentStatus", "updatedAt"],
          },
          {
            model: OrderDetails,
            attributes: ["productId", "quantity", "unitPrice"],
            include: [
              {
                model: Product,
                attributes: [
                  "id",
                  "productName",
                  "productPrice",
                  "productImage",
                  "productStock",
                ],
                include: [
                  {
                    model: Category,
                    attributes: ["categoryName"],
                  },
                  {
                    model: Review,
                    as: "reviews",
                    where: approvedReviewsOnly,
                    required: false,
                    attributes: ["id", "rating", "userId"],
                  },
                ],
              },
            ],
          },
        ],
      });

      if (!order) {
        res.status(404).json({
          message: "Order not found",
        });
        return;
      }

      const orderDetailsWithFullImage = order.toJSON();
      orderDetailsWithFullImage.paymentDueAt = paymentDueAt(orderDetailsWithFullImage);
      if (
        orderDetailsWithFullImage.OrderDetails &&
        Array.isArray(orderDetailsWithFullImage.OrderDetails)
      ) {
        orderDetailsWithFullImage.OrderDetails =
          orderDetailsWithFullImage.OrderDetails.map((detail: any) => {
            if (detail.Product && detail.Product.productImage) {
              detail.Product.productImage = getFullImageUrl(
                detail.Product.productImage,
              );
            }
            return detail;
          });
      }

      res.status(200).json({
        message: "Order fetched successfully",
        data: orderDetailsWithFullImage,
      });
    } catch (err) {
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // *Update order
  public static async updateOrder(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          message: "User not authenticated",
          field: "userId",
        });
        return;
      }

      const orderId = req.params.id;
      if (!orderId) {
        res.status(400).json({
          message: "Order ID is required",
          field: "orderId",
        });
        return;
      }

      const {
        phoneNumber,
        shippingAddress,
        totalAmount,
        paymentDetails,
        products,
      }: OrderDetail = req.body;
      if (
        !phoneNumber ||
        !shippingAddress ||
        !totalAmount ||
        !paymentDetails ||
        !products ||
        !Array.isArray(products) ||
        products.length === 0
      ) {
        res.status(400).json({
          message: "All fields are required",
          field: "general",
        });
        return;
      }

      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(phoneNumber)) {
        res.status(400).json({
          message: "Phone number must be exactly 10 digits",
          field: "phoneNumber",
        });
        return;
      }

      if (shippingAddress.length < 4 || shippingAddress.length > 200) {
        res.status(400).json({
          message: "Shipping address must be between 4 and 200 characters",
          field: "shippingAddress",
        });
        return;
      }

      const parsedTotalAmount = Number(totalAmount);
      if (isNaN(parsedTotalAmount) || parsedTotalAmount <= 0) {
        res.status(400).json({
          message: "Total amount must be a positive number",
          field: "totalAmount",
        });
        return;
      }

      const order = await Order.findOne({ where: { id: orderId, userId } });
      if (!order) {
        res.status(404).json({
          message: "Order not found",
          field: "orderId",
        });
        return;
      }
      if (order.orderStatus !== OrderStatus.Pending) {
        res.status(409).json({
          message:
            order.orderStatus === OrderStatus.Cancelled
              ? "This order was cancelled, so it can't be changed."
              : "We've already started preparing this order, so it can't be changed any more.",
          field: "orderStatus",
        });
        return;
      }

      const settings = await getStoreSettings();
      if (settings.maintenanceMode) {
        res.status(503).json({
          message: settings.maintenanceMessage || "Orders are paused for maintenance. Please try again soon.",
          field: "general",
        });
        return;
      }
      const wantsCod = paymentDetails.paymentMethod === PaymentMethod.COD;
      if ((wantsCod && !settings.enableCod) || (!wantsCod && !settings.enableOnlinePayment)) {
        res.status(400).json({
          message: wantsCod ? "Cash on delivery is currently unavailable" : "Online payment is currently unavailable",
          field: "paymentMethod",
        });
        return;
      }

      // Editing replaces any payment in progress, so first make sure it didn't just go through
      if (await isPaidAtGateway(order, req.user?.username)) {
        res.status(409).json({
          message: "Your payment for this order just went through, so it's now being prepared and can't be changed.",
          field: "orderStatus",
        });
        return;
      }

      const oldOrderDetails = await OrderDetails.findAll({
        where: { orderId: order.id },
      });

      // Only quantities of items already in the order can change (each item once)
      const seen = new Set<string>();
      for (const item of products) {
        if (seen.has(item.productId) || !oldOrderDetails.some((d) => d.productId === item.productId)) {
          res.status(400).json({ message: "Only items already in this order can be changed.", field: "products" });
          return;
        }
        seen.add(item.productId);
      }

      const unitPrices = new Map<string, number>();
      let productsTotalCost = 0;
      for (const item of products) {
        const product = await Product.findByPk(item.productId);
        if (!product) {
          res.status(400).json({
            message: "Invalid product in order",
            field: "products",
          });
          return;
        }

        if (item.quantity <= 0) {
          res.status(400).json({
            message: "Quantity must be a positive number",
            field: "products",
          });
          return;
        }

        // Stock already held by this order is released when it's edited, so it counts as available
        const heldByThisOrder = oldOrderDetails
          .filter((detail) => detail.productId === item.productId)
          .reduce((sum, detail) => sum + detail.quantity, 0);
        if (item.quantity > product.productStock + heldByThisOrder) {
          res.status(400).json({
            message: `Insufficient stock for product ${product.productName}`,
            field: "products",
          });
          return;
        }

        // Items keep the price they were ordered at, even if the shop price has changed since
        const savedPrice = oldOrderDetails.find((d) => d.productId === item.productId)?.unitPrice;
        const price = savedPrice == null ? Number(product.productPrice) || 0 : Number(savedPrice);
        unitPrices.set(item.productId, price);
        const qty = Number(item.quantity) || 1;
        productsTotalCost += price * qty;
      }
      const shippingCost = editedOrderShippingCost(order.shippingFee, productsTotalCost, settings);

      // A promo code used on the order stays applied, recalculated for the new items
      let discountAmount = 0;
      if (order.couponCode) {
        const coupon = await Coupon.findOne({ where: { code: order.couponCode } });
        if (coupon) {
          const minimum = Number(coupon.minOrderAmount) || 0;
          if (productsTotalCost < minimum) {
            res.status(400).json({
              message: `This order uses promo code ${coupon.code}, which needs items worth at least ${formatRs(minimum)}.`,
              field: "products",
            });
            return;
          }
          discountAmount = calculateCouponDiscount(coupon, productsTotalCost);
        } else {
          // The coupon was deleted since: keep the discount the customer was given
          discountAmount = Math.min(Number(order.discountAmount) || 0, productsTotalCost);
        }
      }
      const calculatedTotalCost = productsTotalCost - discountAmount + shippingCost;

      if (calculatedTotalCost <= 0) {
        res.status(400).json({
          message: "Calculated total amount must be a positive number",
          field: "totalAmount",
        });
        return;
      }

      const roundToCents = (n: number) => Math.round(n * 100);

      if (
        roundToCents(calculatedTotalCost) !== roundToCents(parsedTotalAmount)
      ) {
        res.status(400).json({
          message: "Total amount does not match with products total",
          field: "totalAmount",
        });
        return;
      }

      if (
        !Object.values(PaymentMethod).includes(paymentDetails.paymentMethod)
      ) {
        res.status(400).json({
          message: "Invalid payment method",
          field: "paymentMethod",
        });
        return;
      }

      // await order.update({
      //   phoneNumber,
      //   shippingAddress,
      //   totalAmount: calculatedTotalCost,
      // });

      // const existingPayment = await Payment.findByPk(order.paymentId as string);
      // if (!existingPayment) {
      //   res
      //     .status(404)
      //     .json({ message: "Associated payment record not found" });
      //   return;
      // }

      // // const paymentMethodChanged =
      // //   existingPayment.paymentMethod !== paymentDetails.paymentMethod;

      // existingPayment.paymentMethod = paymentDetails.paymentMethod;
      // existingPayment.paymentStatus = PaymentStatus.Pending; // reset status on update
      // existingPayment.pidx = null; // clear old gateway reference
      // await existingPayment.save();

      // await OrderDetails.destroy({ where: { orderId: order.id } });

      // const orderDetailsPromises = products.map((product) =>
      //   OrderDetails.create({
      //     orderId: order.id,
      //     productId: product.productId,
      //     quantity: product.quantity,
      //   }),
      // );
      // const updatedOrderDetails = await Promise.all(orderDetailsPromises);

      // or

      const existingPayment = await Payment.findByPk(order.paymentId as string);
      if (!existingPayment) {
        res
          .status(404)
          .json({ message: "Associated payment record not found" });
        return;
      }

      const updatedOrderDetails: OrderDetails[] = [];

      await sequelize.transaction(async (t) => {
        // Re-fetch and lock the row inside the transaction to guard against a
        // concurrent payment verification flipping status mid-update.
        const lockedOrder = await Order.findOne({
          where: { id: order.id, orderStatus: OrderStatus.Pending },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!lockedOrder) {
          throw new Error("ORDER_NO_LONGER_EDITABLE");
        }

        // Restore stock from the old line items
        for (const oldDetail of oldOrderDetails) {
          await Product.increment("productStock", {
            by: oldDetail.quantity,
            where: { id: oldDetail.productId },
            transaction: t,
          });
        }

        await OrderDetails.destroy({
          where: { orderId: order.id },
          transaction: t,
        });

        // Apply new line items and decrement stock for them
        for (const item of products) {
          const [affectedCount] = await Product.update(
            {
              productStock: sequelize.literal(
                `"productStock" - ${item.quantity}`,
              ) as unknown as number,
            },
            {
              where: {
                id: item.productId,
                productStock: { [Op.gte]: item.quantity },
              },
              transaction: t,
            },
          );

          if (!affectedCount) {
            throw new Error("INSUFFICIENT_STOCK");
          }

          const detail = await OrderDetails.create(
            {
              orderId: order.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: unitPrices.get(item.productId) ?? null,
            },
            { transaction: t },
          );
          updatedOrderDetails.push(detail);
        }

        await order.update(
          {
            phoneNumber,
            shippingAddress,
            totalAmount: calculatedTotalCost,
            subtotalAmount: productsTotalCost,
            shippingFee: shippingCost,
            discountAmount,
          },
          { transaction: t },
        );

        existingPayment.paymentMethod = paymentDetails.paymentMethod;
        existingPayment.paymentStatus = PaymentStatus.Pending;
        existingPayment.pidx = null;
        await existingPayment.save({ transaction: t });
      });

      await notifyAdmins({
        type: "order-edited",
        title: "Order edited",
        message: `${req.user?.username || "A customer"} changed order ${await orderLabel(order.id)}. New total: ${formatRs(calculatedTotalCost)}.`,
        link: "/admin-dashboard/orders",
      });

      const orderDetailsWithFullImage = updatedOrderDetails.map((detail) => {
        const plain = detail.toJSON();
        if (plain.Product?.productImage) {
          plain.Product.productImage = getFullImageUrl(
            plain.Product.productImage,
          );
        }
        return plain;
      });

      // An online payment method starts a fresh gateway session for the new total
      if (paymentDetails.paymentMethod === PaymentMethod.Khalti) {
        try {
          const { pidx, paymentUrl } = await startKhaltiPayment(order, existingPayment);
          res.status(200).json({
            message: "Order updated successfully. Proceed to Khalti payment.",
            data: order,
            pidx,
            paymentUrl,
            orderDetails: orderDetailsWithFullImage,
          });
        } catch {
          res.status(400).json({
            message: "Order updated but failed to initiate Khalti payment. You can pay from the order page.",
            field: "payment",
          });
        }
        return;
      }

      if (paymentDetails.paymentMethod === PaymentMethod.Esewa) {
        try {
          const esewa = await buildEsewaPayment(order, existingPayment);
          res.status(200).json({
            message: "Order updated successfully. Proceed to eSewa payment.",
            data: order,
            ...esewa,
            orderDetails: orderDetailsWithFullImage,
          });
        } catch {
          res.status(400).json({
            message: "Order updated but failed to initiate eSewa payment. You can pay from the order page.",
            field: "payment",
          });
        }
        return;
      }

      res.status(200).json({
        message: "Order updated successfully",
        data: order,
        orderDetails: orderDetailsWithFullImage,
      });
    } catch (error) {
      console.error("Error updating order:", error);
      if (
        error instanceof Error &&
        error.message === "ORDER_NO_LONGER_EDITABLE"
      ) {
        res.status(409).json({
          message:
            "This order can no longer be edited — payment may already be in progress or confirmed.",
          field: "general",
        });
        return;
      }
      if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
        res.status(400).json({
          message: "Some items just sold out or ran low. Please lower the quantity and try again.",
          field: "products",
        });
        return;
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // *Cancel order
  public static async cancelOrder(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          message: "User not authenticated",
          field: "userId",
        });
        return;
      }

      const orderId = req.params.id;
      if (!orderId) {
        res.status(400).json({
          message: "Order ID is required",
          field: "orderId",
        });
        return;
      }

      const order = await Order.findOne({
        where: { id: orderId, userId },
      });
      if (!order) {
        res.status(404).json({
          message: "Order not found!",
          field: "order",
        });
        return;
      }

      if (
        order.orderStatus === OrderStatus.InTransit ||
        order.orderStatus === OrderStatus.Preparation ||
        order.orderStatus === OrderStatus.Delivered
      ) {
        res.status(400).json({
          message: `Order cannot be cancelled as it is already ${order.orderStatus}`,
          field: "orderStatus",
        });
        return;
      }

      if (order.orderStatus === OrderStatus.Cancelled) {
        res.status(400).json({
          message: "Order is already cancelled",
          field: "orderId",
        });
        return;
      }

      if (await isPaidAtGateway(order, req.user?.username)) {
        res.status(409).json({
          message: "Your payment for this order just went through, so it's now being prepared. Contact us if you still want to cancel.",
          field: "orderStatus",
        });
        return;
      }

      const orderDetails = await OrderDetails.findAll({
        where: { orderId: order.id },
      });

      await sequelize.transaction(async (t) => {
        const lockedOrder = await Order.findOne({
          where: { id: order.id, orderStatus: OrderStatus.Pending },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!lockedOrder) {
          throw new Error("ORDER_NO_LONGER_CANCELLABLE");
        }

        for (const detail of orderDetails) {
          await Product.increment("productStock", {
            by: detail.quantity,
            where: { id: detail.productId },
            transaction: t,
          });
        }
        order.orderStatus = OrderStatus.Cancelled;
        await order.save({ transaction: t });
      });

      // Real-time notification for admin
      emitToAdmin("admin:order-cancelled", {
        orderId: order.id,
        totalAmount: order.totalAmount,
        customerName: req.user?.username || "Customer",
        reason: "Cancelled by customer",
      });
      emitToAdmin("admin:dashboard-refresh", {
        type: "order-cancelled",
        orderId: order.id,
      });

      const label = await orderLabel(order.id);
      await notifyAdmins({
        type: "order-cancelled",
        title: "Order cancelled",
        message: `${req.user?.username || "A customer"} cancelled order ${label} (${formatRs(order.totalAmount)}).`,
        link: "/admin-dashboard/orders",
      });
      await notifyCustomer(order.userId, {
        type: "order-cancelled",
        title: "Order cancelled",
        message: `Your order ${label} has been cancelled.`,
        link: `/my-orders/orderdetails/${order.id}`,
      });

      res.status(200).json({
        message: "Order cancelled successfully",
      });
    } catch (error) {
      if (error instanceof Error && error.message === "ORDER_NO_LONGER_CANCELLABLE") {
        res.status(409).json({ message: "This order can no longer be cancelled.", field: "orderStatus" });
        return;
      }
      console.error("Error cancelling order:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // *Delete order (if needed, but usually we just mark it as cancelled)
  public static async deleteOrder(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          message: "User not authenticated",
          field: "userId",
        });
        return;
      }

      const orderId = req.params.id;
      if (!orderId) {
        res.status(400).json({
          message: "Order ID is required",
          field: "orderId",
        });
        return;
      }

      const order = await Order.findOne({
        where: {
          id: orderId as string,
        },
      });
      if (!order) {
        res.status(404).json({
          message: "Order not found",
          field: "order",
        });
        return;
      }

      if (order.userId !== userId) {
        res.status(403).json({
          message: "You do not have permission to delete this order",
          field: "orderId",
        });
        return;
      }

      const nonDeletableStatuses = [
        OrderStatus.Preparation,
        OrderStatus.InTransit,
        OrderStatus.Delivered,
        OrderStatus.Cancelled,
      ];
      if (nonDeletableStatuses.includes(order.orderStatus as OrderStatus)) {
        res.status(400).json({
          message: `Order cannot be deleted as it is already ${order.orderStatus}`,
          field: "orderStatus",
        });
        return;
      }

      if (await isPaidAtGateway(order, req.user?.username)) {
        res.status(409).json({
          message: "Your payment for this order just went through, so it can't be deleted.",
          field: "orderStatus",
        });
        return;
      }

      const orderDetails = await OrderDetails.findAll({
        where: { orderId: order.id },
      });
      const paymentId = order.paymentId;

      await sequelize.transaction(async (t) => {
        const lockedOrder = await Order.findOne({
          where: { id: order.id, orderStatus: OrderStatus.Pending },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!lockedOrder) {
          throw new Error("ORDER_NO_LONGER_DELETABLE");
        }

        for (const detail of orderDetails) {
          await Product.increment("productStock", {
            by: detail.quantity,
            where: { id: detail.productId },
            transaction: t,
          });
        }
        await OrderDetails.destroy({
          where: { orderId: lockedOrder.id },
          transaction: t,
        });
        await lockedOrder.destroy({ transaction: t });
        if (paymentId) {
          await Payment.destroy({ where: { id: paymentId }, transaction: t });
        }
      });

      emitToAdmin("admin:dashboard-refresh", { type: "order-deleted", orderId: order.id });
      await notifyAdmins({
        type: "order-deleted",
        title: "Order deleted",
        message: `${req.user?.username || "A customer"} deleted pending order ${await orderLabel(order.id)} (${formatRs(order.totalAmount)}). Its stock was returned.`,
        link: "/admin-dashboard/orders",
      });

      res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
      console.error("Error deleting order:", error);
      if (
        error instanceof Error &&
        error.message === "ORDER_NO_LONGER_DELETABLE"
      ) {
        res.status(409).json({
          message:
            "This order can no longer be deleted — payment may already be in progress or confirmed.",
          field: "general",
        });
        return;
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }
}

export default CustomerOrderController;
