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
            message: "Order placed successfully, proceed to Khalti payment",
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

          res.status(201).json({
            message: "Order created. Proceed to eSewa payment.",
            data: order,
            esewaPaymentUrl: envConfig.esewaPaymentUrl,
            esewaPaymentData,
            orderDetails: orderDetailResponse,
          });
          return;
        } catch (esewaError) {
          await paymentData.destroy();
          await order.destroy();
          res.status(400).json({
            message: "Failed to initiate eSewa payment. Please try again.",
            field: "payment",
          });
          return;
        }
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

  // *Verify Khalti Payment and update order status after successful payment
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

        // const order = await Order.findOne({ where: { paymentId: payment.id } });
        // if (order) {
        //   order.orderStatus = OrderStatus.Delivered;
        //   await order.save();
        // }

        // const fullOrderDetails = await Order.findOne({
        //   where: { paymentId: payment.id },
        //   include: [
        //     {
        //       model: Payment,
        //       attributes: ["paymentMethod", "paymentStatus"],
        //     },
        //     {
        //       model: OrderDetails,
        //       attributes: ["productId", "quantity"],
        //     },
        //     {
        //       model: User,
        //       attributes: ["username", "email"],
        //     },
        //   ],
        // });

        res.status(200).json({
          message: "Khalti payment verified and order confirmed successfully",
          // data: fullOrderDetails,
          paymentData: data,
        });
        return;
      } else if (data.status === TransactionStatus.Pending) {
        res.status(200).json({
          message:
            "Payment is still pending. Please complete the payment to confirm your order.",
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

  // *Verify eSewa Payment and update order status after successful payment
  public static async verifyEsewaPayment(
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

      const {
        transaction_uuid,
        transaction_code,
        total_amount,
        status,
        product_code,
      } = req.body;

      if (!transaction_uuid || !status) {
        res.status(400).json({
          message: "Invalid eSewa callback data",
          field: "general",
        });
        return;
      }
      if (status !== "COMPLETE") {
        res
          .status(400)
          .json({ message: "eSewa payment was not completed", status });
        return;
      }

      // Double-check with eSewa status API
      const verifyUrl = `${envConfig.esewaVerificationUrl}?product_code=${product_code}&total_amount=${total_amount}&transaction_uuid=${transaction_uuid}`;
      const verifyRes = await axios.get(verifyUrl);
      const verifyData = verifyRes.data;

      if (verifyData.status !== "COMPLETE") {
        res
          .status(400)
          .json({
            message: "eSewa payment verification failed",
            status: verifyData.status,
          });
        return;
      }

      const payment = await Payment.findOne({
        where: { pidx: transaction_uuid },
      });
      if (!payment) {
        res.status(404).json({
          message: "Payment record not found for the provided transaction_uuid",
        });
        return;
      }
      payment.paymentStatus = PaymentStatus.Paid;
      payment.pidx = transaction_code; // Store transaction_uuid in pidx for reference
      await payment.save();

      // const order = await Order.findOne({ where: { paymentId: payment.id } });
      // if (order) {
      //   order.orderStatus = OrderStatus.Delivered;
      //   await order.save();
      // }

      // const fullOrderDetails = await Order.findOne({
      //   where: { paymentId: payment.id },
      //   include: [
      //     {
      //       model: Payment,
      //       attributes: ["paymentMethod", "paymentStatus"],
      //     },
      //     {
      //       model: OrderDetails,
      //       attributes: ["productId", "quantity"],
      //     },
      //     {
      //       model: User,
      //       attributes: ["username", "email"],
      //     },
      //   ],
      // });

      res.status(200).json({
        message: "eSewa payment verified and order delivered successfully",
        // data: fullOrderDetails,
        paymentData: verifyData,
      });
      return;
    } catch (err) {
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // *Fetch My orders
  public static async fetchMyOrders(req: AuthRequest, res: Response): Promise<void> {
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
            attributes: ["paymentMethod", "paymentStatus"],
          },
          {
            model: OrderDetails,
            attributes: ["productId", "quantity"],
            include: [
              {
                model: Product,
                attributes: ["productName", "productPrice", "productImage", "productStock"],
              },
            ],
          },
        ],
      });
      orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      if (!orders || orders.length === 0) {
        res.status(404).json({
          message: "No orders found for this user",
        });
        return;
      }

      res.status(200).json({
        message: "Orders fetched successfully",
        totalOrders: orders.length,
        data: orders,
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

      const orderDetails = await OrderDetails.findAll({
        where: { orderId },
        include: [
          {
            model: Product,
            attributes: ["productName", "productPrice", "productImage", "productStock"],
            include: [{
              model: Category,
              attributes: ["categoryName"],
            }],
          },
          {
            model: Order,
            where: { userId },
            attributes: ["phoneNumber", "shippingAddress", "totalAmount", "orderStatus"],
            include: [
              {
                model: Payment,
                attributes: ["paymentMethod", "paymentStatus"],
              },
              {
                model: User,
                attributes: ["username", "email"],
              }
            ],
          }
        ],
      });

      if (!orderDetails || orderDetails.length === 0) {
        res.status(404).json({
          message: "Order not found",
        });
        return;
      }

      res.status(200).json({
        message: "Order fetched successfully",
        data: orderDetails,
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
    res: Response
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

    const order = await Order.findOne({ where: { id: orderId, userId, orderStatus: OrderStatus.Pending } });
    if (!order) {
      res.status(404).json({
        message: "Order not found",
      });
      return;
    }

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
      const qty = Number(item.quantity) || 1;
      productsTotalCost += price * qty;
    }
    const calculatedTotalCost = productsTotalCost + shippingCost;

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

      await order.update({
        phoneNumber,
        shippingAddress,
        totalAmount: calculatedTotalCost,
      });
 
      const existingPayment = await Payment.findByPk(order.paymentId as string);
      if (!existingPayment) {
        res.status(404).json({ message: "Associated payment record not found" });
        return;
      }
 
      // const paymentMethodChanged =
      //   existingPayment.paymentMethod !== paymentDetails.paymentMethod;
 
      existingPayment.paymentMethod = paymentDetails.paymentMethod;
      existingPayment.paymentStatus = PaymentStatus.Pending; // reset status on update
      existingPayment.pidx = null;                           // clear old gateway reference
      await existingPayment.save();
 
      await OrderDetails.destroy({ where: { orderId: order.id } });
 
      const orderDetailsPromises = products.map((product) =>
        OrderDetails.create({
          orderId: order.id,
          productId: product.productId,
          quantity: product.quantity,
        })
      );
      const updatedOrderDetails = await Promise.all(orderDetailsPromises);
 
      // If payment method changed to a gateway, initiate new payment process
      if (paymentDetails.paymentMethod === PaymentMethod.Khalti) {
        try {
          const data = {
            return_url: envConfig.clientUrl + "/payment/khalti-callback",
            website_url: envConfig.clientUrl,
            amount: Math.round(calculatedTotalCost * 100),
            purchase_order_id: order.id.toString(),
            purchase_order_name: "orderName_" + order.id,
          };
 
          const response = await axios.post(
            envConfig.khaltiPaymentUrl as string,
            data,
            { headers: { Authorization: `Key ${envConfig.khaltiSecretKey}` } }
          );
 
          const khaltiResponse: KhaltiResponse = response.data;
          existingPayment.pidx = khaltiResponse.pidx;
          await existingPayment.save();
 
          res.status(200).json({
            message: "Order updated successfully. Proceed to Khalti payment.",
            data: order,
            paymentUrl: khaltiResponse.payment_url,
            orderDetails: updatedOrderDetails,
          });
          return;
        } catch {
          res.status(400).json({
            message: "Order updated but failed to initiate Khalti payment. Please retry payment.",
            field: "payment",
          });
          return;
        }
      }
 
      if (paymentDetails.paymentMethod === PaymentMethod.Esewa) {
        try {
          const transactionUuid = order.id.toString();
          const esewaTotal = calculatedTotalCost.toString();
          const productCode = envConfig.esewaMerchantId;
 
          const dataToSign = `total_amount=${esewaTotal},transaction_uuid=${transactionUuid},product_code=${productCode}`;
          const signature = generateHmacSha256Hash(
            dataToSign,
            envConfig.esewaSecret as string
          );
 
          const esewaPaymentData = {
            amount: esewaTotal,
            tax_amount: "0",
            product_service_charge: "0",
            product_delivery_charge: "0",
            total_amount: esewaTotal,
            transaction_uuid: transactionUuid,
            product_code: productCode,
            success_url: envConfig.clientUrl + "/payment/esewa-callback",
            failure_url: envConfig.clientUrl + "/payment/esewa-failure",
            signed_field_names: "total_amount,transaction_uuid,product_code",
            signature,
          };
 
          existingPayment.pidx = order.id.toString();
          await existingPayment.save();
 
          res.status(200).json({
            message: "Order updated successfully. Proceed to eSewa payment.",
            data: order,
            esewaPaymentUrl: envConfig.esewaPaymentUrl,
            esewaPaymentData,
            orderDetails: updatedOrderDetails,
          });
          return;
        } catch {
          res.status(400).json({
            message: "Order updated but failed to initiate eSewa payment. Please retry payment.",
            field: "payment",
          });
          return;
        }
      }
 
      res.status(200).json({
        message: "Order updated successfully",
        data: order,
        orderDetails: updatedOrderDetails,
      });
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // *Cancel order
  public static async cancelOrder(
    req: AuthRequest,
    res: Response
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

      const order = await Order.findOne({ where: { id: orderId, userId} });
      if (!order) {
        res.status(404).json({
          message: "Order not found!",
          field: "orderId",
        });
        return;
      }

      if (order.orderStatus === OrderStatus.InTransit || order.orderStatus === OrderStatus.Preparation || order.orderStatus === OrderStatus.Delivered) {
        res.status(400).json({
          message: `Order cannot be cancelled as it is already ${order.orderStatus}`,
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

      order.orderStatus = OrderStatus.Cancelled;
      await order.save();

      res.status(200).json({
        message: "Order cancelled successfully",
        data: order,
      });
    } catch (error) {
      console.error("Error cancelling order:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // *Delete order (if needed, but usually we just mark it as cancelled)
  public static async deleteOrder(
    req: AuthRequest,
    res: Response  ): Promise<void> {
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

      const order = await Order.findOne({ where: { id: orderId as string, userId } });
      if (!order) {
        res.status(404).json({
          message: "Order not found",
          field: "orderId",
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

      const nonDeletableStatuses = [OrderStatus.Preparation, OrderStatus.InTransit, OrderStatus.Delivered];
      if (nonDeletableStatuses.includes(order.orderStatus as OrderStatus)) {
        res.status(400).json({
          message: `Order cannot be deleted as it is already ${order.orderStatus}`,
          field: "orderId",
        });
        return;
      }

      await OrderDetails.destroy({ where: { orderId: order.id } });
      if (order.paymentId) {
        await Payment.destroy({ where: { id: order.paymentId } });
      }
      await order.destroy(); 

      res.status(200).json({
        message: "Order deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}

export default CustomerOrderController;
