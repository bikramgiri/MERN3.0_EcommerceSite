import { Response } from "express";
import { AuthRequest } from "../../../middleware/authMiddleware";
import Cart from "../../../database/models/cartModel";
import Product from "../../../database/models/productModel";
import Order from "../../../database/models/orderModel";
import Coupon from "../../../database/models/couponModel";
import {
  CouponError,
  findSiteBannerCoupon,
  presentCouponTerms,
  presentPromotion,
  redeemableCoupon,
  welcomeCouponFor,
} from "../../../services/couponService";
import { Request } from "express";

class CouponController {
  // *Check a promo code against the shopper's current cart
  public static async applyCoupon(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized", field: "general" });
      return;
    }

    // The subtotal comes from the saved cart, never from the request
    const cartItems = await Cart.findAll({
      where: { userId },
      include: [{ model: Product, attributes: ["productPrice"] }],
    });
    const subtotal = cartItems.reduce(
      (sum, item) => sum + (item.product ? Number(item.product.productPrice) * item.quantity : 0),
      0,
    );
    if (subtotal <= 0) {
      res.status(400).json({ message: "Your cart is empty.", field: "couponCode" });
      return;
    }

    try {
      const { coupon, discount } = await redeemableCoupon(req.body?.code, userId, subtotal);
      res.status(200).json({
        message: "Promo code applied.",
        data: { ...presentCouponTerms(coupon), discountAmount: discount },
      });
    } catch (error) {
      if (error instanceof CouponError) {
        res.status(400).json({ message: error.message, field: error.field });
        return;
      }
      throw error;
    }
  }

  // *Terms of the promo code used on one of the shopper's orders, so the edit page
  // can show the same discount the server will apply
  public static async getOrderCoupon(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    const orderId = String(req.params.orderId);
    if (!userId) {
      res.status(401).json({ message: "Unauthorized", field: "general" });
      return;
    }
    const order = /^[0-9a-f-]{36}$/i.test(orderId)
      ? await Order.findOne({ where: { id: orderId, userId }, attributes: ["couponCode", "discountAmount"] })
      : null;
    if (!order) {
      res.status(404).json({ message: "Order not found", field: "orderId" });
      return;
    }
    if (!order.couponCode) {
      res.status(200).json({ message: "No promo code on this order", data: null });
      return;
    }
    const coupon = await Coupon.findOne({ where: { code: order.couponCode } });
    res.status(200).json({
      message: "Order promo code",
      // A deleted coupon keeps the discount the order already had
      data: coupon
        ? { ...presentCouponTerms(coupon), fixedDiscount: null }
        : { code: order.couponCode, fixedDiscount: Number(order.discountAmount) || 0 },
    });
  }

  // *Public: the promo shown in the storefront announcement bar (null when none is switched on)
  public static async getPromotions(_req: Request, res: Response): Promise<void> {
    const banner = await findSiteBannerCoupon();
    res.status(200).json({ message: "Promotions", data: { banner: banner ? presentPromotion(banner) : null } });
  }

  // *The new-customer offer, only for shoppers who haven't ordered yet
  public static async getWelcomeOffer(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized", field: "general" });
      return;
    }
    const coupon = await welcomeCouponFor(userId);
    res.status(200).json({ message: "Welcome offer", data: coupon ? presentPromotion(coupon) : null });
  }
}

export default CouponController;
