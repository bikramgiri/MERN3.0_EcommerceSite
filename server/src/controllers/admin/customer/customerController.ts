import { Request, Response } from "express";
import User from "../../../database/models/userModel";
import Order from "../../../database/models/orderModel";
import getFullImageUrl from "../../../services/imageHandler";
import { AuthRequest } from "../../../middleware/authMiddleware";
import { cloudinary } from "../../../cloudinary";
import { getPublicIdFromAvatar } from "../../../services/cloudinaryHelper";

class CustomerController {
  public static async fetchAllCustomers(
    req: Request,
    res: Response,
  ): Promise<void> {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;
    const role = req.query.role as string;

    const whereClause: any = {};
    if (role && role !== "ALL") {
      whereClause.role = role;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: {
        exclude: [
          "password",
          "otp",
          "otpGeneratedTime",
          "resetPasswordToken",
          "updatedAt",
        ],
      },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    if (count === 0) {
      res.status(404).json({ message: "No users found", field: "users" });
      return;
    }

    // Compute total order count for each user in the result
    const userIds = users.map((u) => u.id);
    const orders = await Order.findAll({
      where: { userId: userIds },
      attributes: ["userId"],
    });

    const orderCountMap: Record<string, number> = {};
    for (const ord of orders) {
      if (ord.userId) {
        orderCountMap[ord.userId] = (orderCountMap[ord.userId] || 0) + 1;
      }
    }

    const formattedUsers = users.map((u) => {
      const plain = (u as any).toJSON ? (u as any).toJSON() : u;
      return {
        ...plain,
        avatar: plain.avatar ? getFullImageUrl(plain.avatar) : plain.avatar,
        orderCount: orderCountMap[plain.id] || 0,
      };
    });

    res.status(200).json({
      message: "Users fetched successfully",
      totalCustomers: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: formattedUsers,
    });
  }

  // Delete a customer
  public static async deleteCustomer(req: AuthRequest, res: Response) {
    const userId = req.params.id;
    if (!userId) {
      return res.status(400).json({
        message: "Customer ID is required",
        field: "id",
      });
    }

    const user = await User.findByPk(userId as string);
    if (!user || user.role !== "customer") {
      return res
        .status(404)
        .json({ message: "Customer not found", field: "user" });
    }

    // Delete avatar from Cloudinary before removing the user
    if (user.avatar) {
      const publicId = getPublicIdFromAvatar(user.avatar);
      if (publicId) {
        try {
          const result = await cloudinary.uploader.destroy(publicId);
          console.log("Customer avatar deleted from Cloudinary:", result);
        } catch (error) {
          console.error("Error deleting customer avatar from Cloudinary:", error);
        }
      }
    }

    await user.destroy();

    return res.status(200).json({
      message: "Customer deleted successfully",
    });
  }
}

export default CustomerController;
