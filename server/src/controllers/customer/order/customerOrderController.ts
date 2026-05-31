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

class CustomerOrderController {
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

    if (shippingAddress.length < 4 || shippingAddress.length > 20) {
      res.status(400).json({
        message: "Shipping address must be between 4 and 20 characters",
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
    let productsTotalCost = 0;
    let shippingCost = 50;
    for (const item of products) {
      const product = await Product.findByPk(item.productId);
      if (!product) {
        res.status(400).json({
          message: "Invalid product in order",
          field: "products",
        });
        return;
      }
      const price = Number(product.productPrice) || 0;
      const qty = Number(item.quantity) || 1;
      productsTotalCost += price * qty;
    }
    calculatedTotalCost = productsTotalCost + shippingCost;

    if (calculatedTotalCost <= 0) {
      res.status(400).json({
        message: "Calculated total amount must be a positive number",
        field: "totalAmount",
      });
      return;
    }

    if (calculatedTotalCost !== totalAmount) {
      res.status(400).json({
        message: "Total amount does not match with products total",
        field: "totalAmount",
      });
      return;
    }

    try {
      const paymentData = await Payment.create({
        paymentMethod: paymentDetails.paymentMethod,
      });

      const order = await Order.create({
        userId,
        phoneNumber,
        shippingAddress,
        totalAmount: calculatedTotalCost,
        paymentId: paymentData.id,
      });

      //  let orderDetailResponse
      // products.forEach(async function (product) {
      //   orderDetailResponse = await OrderDetails.create({
      //     orderId: order.id,
      //     productId: product.productId,
      //     quantity: product.quantity,
      //   });
      // });

      // *OR

      // Safely wait for all order details to be created using Promise.all
      const orderDetailsPromises = products.map(async function (product) {
        return await OrderDetails.create({
          orderId: order.id,
          productId: product.productId,
          quantity: product.quantity,
        });
      });
      const orderDetailResponse = await Promise.all(orderDetailsPromises);

      // *Clear user's cart after order placement

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

          res.status(201).json({
            message: "Order placed successfully",
            order: order,
            paymentUrl: khaltiResponse.payment_url,
            orderDetails: orderDetailResponse,
          });
          return;
        } catch (khaltiError) {
          await paymentData.destroy();
          await order.destroy();
          res.status(400).json({
            message: "Failed to initiate Khalti payment. Please try again.",
            field: "payment",
          });
          return;
        }
      }

      if (paymentDetails.paymentMethod === PaymentMethod.Esewa) {
        // integrate esewa payment gateway here
      }

      res.status(201).json({
        message: "Order created successfully",
        data: order,
        orderDetails: orderDetailResponse,
      });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({
        message: "Internal server error while creating order",
        field: "general",
      });
    }
  }

  // Verify Khalti Payment and update order status after successful payment
  public static async verifyKhaltiPayment(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    const { pidx } = req.body;
    if (!pidx) {
      res.status(400).json({
        message: "pidx is required",
      });
      return;
    }

    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        message: "User not authenticated",
        field: "user",
      });
      return;
    }

    try {
      const response = await axios.post(
        envConfig.khaltiVerificationUrl as string,
        { pidx: pidx },
        {
          headers: {
            Authorization: `Key ${envConfig.khaltiSecretKey}`,
          },
        },
      );

      const data: TransactionVerificationResponse = response.data;

      if (data.status === TransactionStatus.Completed) {
        const payment = await Payment.findOne({ where: { pidx: pidx } });
        if (!payment) {
          res.status(404).json({
            message: "Payment record not found for the provided pidx",
          });
          return;
        }
        payment.paymentStatus = PaymentStatus.Paid;
        await payment.save();

        const order = await Order.findOne({ where: { paymentId: payment.id } });
        if (order) {
          order.orderStatus = OrderStatus.Delivered;
          await order.save();
        }

        const fullOrderDetails = await Order.findOne({
          where: { paymentId: payment.id },
          include: [
            {
              model: Payment,
              attributes: ["paymentMethod", "paymentStatus"],
            },
            {
              model: OrderDetails,
              attributes: ["productId", "quantity"],
            },
          ],
        });

        res.status(200).json({
          message: "Khalti payment verified and order confirmed successfully",
          data: fullOrderDetails,
          paymentData: data,
        });
        return;
      } else if (data.status === TransactionStatus.Pending) {
        res.status(200).json({
          message: "Payment is still pending. Please complete the payment to confirm your order.",
          paymentData: data,
        });
        return;
      } else {
        await Payment.update(
          { paymentStatus: PaymentStatus.Failed },
          { where: { pidx: pidx } },
        );

        res.status(400).json({
          message: "Payment failed or was cancelled.",
          paymentData: data,
        });
        return;
      }
    } catch (err) {
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }
}

export default CustomerOrderController;
