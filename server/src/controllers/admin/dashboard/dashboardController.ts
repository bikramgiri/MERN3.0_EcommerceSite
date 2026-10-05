import { Request, Response } from "express";
import { fn, col } from "sequelize";
import User from "../../../database/models/userModel";
import Product from "../../../database/models/productModel";
import Category from "../../../database/models/categoryModel";
import Order from "../../../database/models/orderModel";
import Review from "../../../database/models/reviewModel";
import Payment from "../../../database/models/paymentModel";
import OrderDetails from "../../../database/models/orderDetailsModel";
import { PaymentStatus, PaymentMethod, OrderStatus } from "../../../types";
import getFullImageUrl from "../../../services/imageHandler";

class DashboardController {
  public static async fetchAllData(req: Request, res: Response): Promise<void> {
    const RECENT_LIMIT = 10;
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
      orderDetailsList,
      allOrdersForStats,
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
          {
            model: OrderDetails,
            attributes: ["id", "quantity", "productId"],
            include: [
              {
                model: Product,
                attributes: ["id", "productName", "productPrice", "productImage", "productStock"],
                include: [{ model: Category, attributes: ["id", "categoryName"] }],
              },
            ],
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
          {
            model: Product,
            attributes: ["id", "productName"],
          },
        ],
      }),
      OrderDetails.findAll({
        attributes: ["productId", "quantity"],
        include: [
          {
            model: Product,
            attributes: [
              "id",
              "productName",
              "productPrice",
              "productImage",
              "productStock",
              "productDiscount",
            ],
            include: [{ model: Category, attributes: ["id", "categoryName"] }],
          },
        ],
      }),
      Order.findAll({
        attributes: ["id", "userId", "orderStatus", "totalAmount", "createdAt"],
        include: [
          {
            model: Payment,
            attributes: ["paymentMethod", "paymentStatus"],
          },
        ],
        order: [["createdAt", "ASC"]],
      }),
    ]);

    const totalRevenue = Number((revenueResult as any)?.totalRevenue) || 0;

    // Calculate Top Selling Products
    const productSalesMap = new Map<
      string,
      {
        product: any;
        totalSold: number;
        totalRevenue: number;
      }
    >();

    for (const detail of orderDetailsList) {
      const p = (detail as any).Product;
      if (!p) continue;
      const pid = detail.productId;
      const categoryName =
        p.category?.categoryName || p.Category?.categoryName || "General";
      const curr = productSalesMap.get(pid) || {
        product: {
          id: p.id,
          productName: p.productName,
          productPrice: p.productPrice,
          productImage: getFullImageUrl(p.productImage),
          productStock: p.productStock,
          productDiscount: p.productDiscount,
          categoryName,
        },
        totalSold: 0,
        totalRevenue: 0,
      };
      const qty = detail.quantity || 1;
      curr.totalSold += qty;
      curr.totalRevenue += qty * (p.productPrice || 0);
      productSalesMap.set(pid, curr);
    }

    let topSellingProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5);

    // Fallback if no sales recorded yet: show catalog items with 0 sales
    if (topSellingProducts.length === 0) {
      const fallbackProducts = await Product.findAll({
        attributes: [
          "id",
          "productName",
          "productPrice",
          "productImage",
          "productStock",
          "productDiscount",
        ],
        include: [{ model: Category, attributes: ["id", "categoryName"] }],
        order: [["createdAt", "DESC"]],
        limit: 5,
      });

      topSellingProducts = fallbackProducts.map((p: any) => ({
        product: {
          id: p.id,
          productName: p.productName,
          productPrice: p.productPrice,
          productImage: getFullImageUrl(p.productImage),
          productStock: p.productStock,
          productDiscount: p.productDiscount,
          categoryName:
            p.category?.categoryName || p.Category?.categoryName || "General",
        },
        totalSold: 0,
        totalRevenue: 0,
      }));
    }

    // Calculate Order Distribution across ALL orders in the database
    let preparationCount = 0;
    let deliveredCount = 0;
    let pendingCount = 0;
    let inTransitCount = 0;
    let cancelledCount = 0;

    let khaltiCount = 0;
    let khaltiPaidAmount = 0;
    let khaltiTotalAmount = 0;

    let esewaCount = 0;
    let esewaPaidAmount = 0;
    let esewaTotalAmount = 0;

    let codCount = 0;
    let codPaidAmount = 0;
    let codTotalAmount = 0;

    let paidOrdersCount = 0;

    for (const order of allOrdersForStats) {
      const status = order.orderStatus;
      if (status === OrderStatus.Preparation) preparationCount++;
      else if (status === OrderStatus.Delivered) deliveredCount++;
      else if (status === OrderStatus.Pending) pendingCount++;
      else if (status === OrderStatus.InTransit) inTransitCount++;
      else if (status === OrderStatus.Cancelled) cancelledCount++;

      const pMethod = (order as any).Payment?.paymentMethod;
      const pStatus = (order as any).Payment?.paymentStatus;
      const amount = Number(order.totalAmount) || 0;
      const isPaid = pStatus === PaymentStatus.Paid;

      if (isPaid) {
        paidOrdersCount++;
      }

      if (pMethod === PaymentMethod.Khalti) {
        khaltiCount++;
        khaltiTotalAmount += amount;
        if (isPaid) khaltiPaidAmount += amount;
      } else if (pMethod === PaymentMethod.Esewa) {
        esewaCount++;
        esewaTotalAmount += amount;
        if (isPaid) esewaPaidAmount += amount;
      } else if (pMethod === PaymentMethod.COD) {
        codCount++;
        codTotalAmount += amount;
        if (isPaid) codPaidAmount += amount;
      }
    }

    const orderDistribution = {
      totalOrders: allOrdersForStats.length,
      paidOrdersCount,
      verifiedPaymentPercent:
        allOrdersForStats.length > 0
          ? Math.round((paidOrdersCount / allOrdersForStats.length) * 100)
          : 0,
      statusBreakdown: {
        preparation: preparationCount,
        delivered: deliveredCount,
        pending: pendingCount,
        inTransit: inTransitCount,
        cancelled: cancelledCount,
      },
      paymentBreakdown: {
        khalti: {
          count: khaltiCount,
          paidAmount: khaltiPaidAmount,
          totalAmount: khaltiTotalAmount,
        },
        esewa: {
          count: esewaCount,
          paidAmount: esewaPaidAmount,
          totalAmount: esewaTotalAmount,
        },
        cod: {
          count: codCount,
          paidAmount: codPaidAmount,
          totalAmount: codTotalAmount,
        },
      },
    };

    const formattedRecentOrders = recentOrders.map((order) => {
      const plainOrder = (order as any).toJSON ? (order as any).toJSON() : order;
      return {
        ...plainOrder,
        OrderDetails: (plainOrder.OrderDetails || []).map((detail: any) => ({
          ...detail,
          Product: detail.Product
            ? {
                ...detail.Product,
                productImage: getFullImageUrl(detail.Product.productImage),
                categoryName:
                  detail.Product.category?.categoryName ||
                  detail.Product.Category?.categoryName ||
                  "General",
              }
            : null,
        })),
      };
    });

    const userOrderCounts: Record<string, number> = {};
    for (const ord of allOrdersForStats) {
      const uId = (ord as any).userId;
      if (uId) {
        userOrderCounts[uId] = (userOrderCounts[uId] || 0) + 1;
      }
    }

    const formattedRecentUsers = recentUsers.map((user) => {
      const plainUser = (user as any).toJSON ? (user as any).toJSON() : user;
      return {
        ...plainUser,
        avatar: plainUser.avatar ? getFullImageUrl(plainUser.avatar) : null,
        orderCount: userOrderCounts[plainUser.id] || 0,
      };
    });

    const salesAnalytics = allOrdersForStats.map((ord: any) => ({
      id: ord.id,
      totalAmount: Number(ord.totalAmount) || 0,
      orderStatus: ord.orderStatus,
      paymentStatus: ord.Payment?.paymentStatus || "Unpaid",
      createdAt: ord.createdAt,
    }));

    res.status(200).json({
      message: "Data fetched successfully",
      data: {
        totalUsers,
        totalProducts,
        totalCategories,
        totalOrders,
        totalReviews,
        totalRevenue,
        recentUsers: formattedRecentUsers,
        recentOrders: formattedRecentOrders,
        recentReviews,
        topSellingProducts,
        orderDistribution,
        salesAnalytics,
      },
    });
  }
}

export default DashboardController;