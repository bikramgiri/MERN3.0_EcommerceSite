import { Request, Response } from "express";
import User from "../../../database/models/userModel";
import Product from "../../../database/models/productModel";
import Category from "../../../database/models/categoryModel";
import Order from "../../../database/models/orderModel";
import Review from "../../../database/models/reviewModel";

class DashboardController {
  public static async fetchAllData(req: Request, res: Response): Promise<void> {
    const RECENT_LIMIT = 5;
    const [
      totalUsers,
      totalProducts,
      totalCategories,
      totalOrders,
      totalReviews,
      recentUsers,
      recentOrders,
      recentReviews,
    ] = await Promise.all([
      User.count({ where: { role: "customer" } }),
      Product.count(),
      Category.count(),
      Order.count(),
      Review.count(),
      User.findAll({
        where: { role: "customer" },
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
        limit: RECENT_LIMIT,
      }),
      Order.findAll({
        attributes: { exclude: ["updatedAt"] },
        order: [["createdAt", "DESC"]],
        limit: RECENT_LIMIT,
        include: [
          {
            model: User,
            attributes: { exclude: ["password", "otp", "otpGeneratedTime", "resetPasswordToken", "updatedAt"] },
          },
        ],
      }),
      Review.findAll({
        attributes: { exclude: ["updatedAt"] },
        order: [["createdAt", "DESC"]],
        limit: RECENT_LIMIT,
        include: [
          {
            model: User,
            attributes: ["id", "username", "email"],
          },
        ],
      }),
    ]);

    res.status(200).json({
      message: "Data fetched successfully",
      data: {
        totalUsers,
        totalProducts,
        totalCategories,
        totalOrders,
        totalReviews,
        recentUsers,
        recentOrders,
        recentReviews,
      },
    });
  }
}

export default DashboardController;
