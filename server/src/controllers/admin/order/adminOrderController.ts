import { Response } from "express";
import { AuthRequest } from "../../../middleware/authMiddleware";
import Order from "../../../database/models/orderModel";
import {
  OrderStatus,
} from "../../../types";

class AdminOrderController {

  // *Update order status
  public static async updateOrderStatus(
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

      const { orderStatus } = req.body;
      if (!orderStatus || !Object.values(OrderStatus).includes(orderStatus)) {
        res.status(400).json({
          message: "Invalid order status",
          field: "orderStatus",
        });
        return;
      }

      const order = await Order.findOne({
        where: { id: orderId, userId },
      });
      if (!order) {
        res.status(404).json({
          message: "Order not found",
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
}

export default AdminOrderController;
