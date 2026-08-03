import { Request, Response } from "express";
import { fn, col } from "sequelize";
import User from "../../../database/models/userModel";
import Product from "../../../database/models/productModel";
import Category from "../../../database/models/categoryModel";
import Order from "../../../database/models/orderModel";
import Review from "../../../database/models/reviewModel";
import Payment from "../../../database/models/paymentModel";
import { PaymentStatus } from "../../../types";

class DashboardController {
  public static async fetchAllData(req: Request, res: Response): Promise<void> {
    const RECENT_LIMIT = 5;
    const [
      totalUsers,
      totalProducts,
      totalCategories,
      totalOrders,
      totalReviews,
      revenueResult,
      recentUsers,
      recentOrders,
      recentReviews,
    ] = await Promise.all([
      User.count({ where: { role: "customer" } }),
      Product.count(),
      Category.count(),
      Order.count(),
      Review.count(),
      Order.findOne({
        attributes: [[fn("SUM", col("Order.totalAmount")), "totalRevenue"]],
        include: [
          {
            model: Payment,
            attributes: [],
            where: { paymentStatus: PaymentStatus.Paid },
          },
        ],
        subQuery: false,
        raw: true,
      }),
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
          {
            model: Payment,
            attributes: ["paymentStatus", "paymentMethod"],
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

    const totalRevenue = Number((revenueResult as any)?.totalRevenue) || 0;

    res.status(200).json({
      message: "Data fetched successfully",
      data: {
        totalUsers,
        totalProducts,
        totalCategories,
        totalOrders,
        totalReviews,
        totalRevenue,
        recentUsers,
        recentOrders,
        recentReviews,
      },
    });
  }
}

export default DashboardController;