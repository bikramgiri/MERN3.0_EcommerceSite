import { Request, Response } from "express";
import { AuthRequest } from "../../../middleware/authMiddleware";
import Order from "../../../database/models/orderModel";
import {
  OrderStatus,
} from "../../../types";
import OrderDetails from "../../../database/models/orderDetailsModel";
import Product from "../../../database/models/productModel";
import Payment from "../../../database/models/paymentModel";
import User from "../../../database/models/userModel";

// *Note: Difference between findOne and findByPk is that findOne allows you to specify additional options such as where clause, include, etc. while findByPk is a shorthand method for finding a record by its primary key. 
// In this case, since we want to include related models (OrderDetails, Product, Payment, User), we use findOne with the appropriate include options.

class AdminOrderController {

  // *Fetch all orders
  public static async fetchAllOrders(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const orders = await Order.findAll({
        include: [
          {
          model: OrderDetails,
          attributes: ["id", "quantity"],
          include: [{
            model: Product,
            attributes: ["productName", "productPrice", "productImage", "productDescription", "productStock", "categoryId"],
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

      if (!orders || orders.length === 0) {
        res.status(404).json({
          message: "No orders found",
          field: "orders",
        });
        return;
      }

      res.status(200).json({
        message: "Orders fetched successfully",
        totalOrders: orders.length,
        data: orders,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
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
            attributes: ["id", "quantity"],
            include: [{
              model: Product,
              attributes: ["productName", "productPrice", "productImage", "productDescription", "productStock", "categoryId"],
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

      res.status(200).json({
        message: "Order fetched successfully",
        data: order,
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

      const order = await Order.findByPk(orderId as string);
      if (!order) {
        res.status(404).json({
          message: "Order not found",
          field: "order",
        });
        return;
      }

      order.orderStatus = orderStatus;
      await order.save();

      res.status(200).json({
        message: "Order status updated successfully",
        data: order,
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // *Delete order
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

export default AdminOrderController;
