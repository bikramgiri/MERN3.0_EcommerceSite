import { Op, type Transaction, type WhereOptions } from "sequelize";
import Coupon from "../database/models/couponModel";
import Order from "../database/models/orderModel";
import Payment from "../database/models/paymentModel";
import { OrderStatus, PaymentStatus } from "../types";

/** A coupon that can't be used; the message is safe to show to the shopper */
export class CouponError extends Error {
  field = "couponCode";
}

export const normalizeCouponCode = (code: unknown): string =>
  typeof code === "string" ? code.trim().toUpperCase() : "";

const formatRs = (amount: number) => `Rs ${amount.toLocaleString()}`;

/**
 * Discount in rupees for a given items subtotal (delivery is never discounted).
 * The client repeats this exact formula to preview the total, and the server
 * checks the submitted total against it.
 */
export const calculateCouponDiscount = (
  coupon: Pick<Coupon, "discountType" | "discountValue" | "maxDiscountAmount">,
  subtotal: number,
): number => {
  if (subtotal <= 0) return 0;
  const value = Number(coupon.discountValue) || 0;
  let discount = coupon.discountType === "PERCENT" ? (subtotal * value) / 100 : value;
  const cap = coupon.maxDiscountAmount == null ? 0 : Number(coupon.maxDiscountAmount);
  if (cap > 0) discount = Math.min(discount, cap);
  discount = Math.min(discount, subtotal);
  return Math.round(discount * 100) / 100;
};

/**
 * How many times a code has been redeemed. Cancelled orders and orders whose
 * online payment failed don't count, so the shopper can use the code again.
 */
export const countCouponUses = async (
  code: string,
  options: { userId?: string; transaction?: Transaction | null } = {},
): Promise<number> => countLiveOrders({ couponCode: code, ...(options.userId ? { userId: options.userId } : {}) }, options.transaction);

/** Orders that count: not cancelled, and not an online payment that failed */
const countLiveOrders = async (filter: WhereOptions, transaction?: Transaction | null): Promise<number> => {
  const where: WhereOptions = { ...filter, orderStatus: { [Op.ne]: OrderStatus.Cancelled } };
  return Order.count({
    where,
    include: [
      {
        model: Payment,
        required: true,
        attributes: [],
        where: { paymentStatus: { [Op.ne]: PaymentStatus.Failed } },
      },
    ],
    transaction: transaction ?? null,
  });
};

/** Whether this customer has ever placed an order that counts (for first-order-only codes) */
export const hasOrderedBefore = async (userId: string, transaction?: Transaction | null) =>
  (await countLiveOrders({ userId }, transaction)) > 0;

/** Active and inside its start/end dates */
export const isCouponLive = (coupon: Coupon, now = new Date()) =>
  coupon.isActive && !(coupon.startsAt && coupon.startsAt > now) && !(coupon.expiresAt && coupon.expiresAt < now);

/** e.g. "25% off (up to Rs 500)" or "Rs 200 off" */
export const describeDiscount = (coupon: Coupon) => {
  const value = Number(coupon.discountValue);
  if (coupon.discountType === "FIXED") return `${formatRs(value)} off`;
  const cap = coupon.maxDiscountAmount == null ? 0 : Number(coupon.maxDiscountAmount);
  return `${value}% off${cap > 0 ? ` (up to ${formatRs(cap)})` : ""}`;
};

/** Public summary of a coupon, enough for the client to show and recalculate the discount */
export const presentCouponTerms = (coupon: Coupon) => ({
  code: coupon.code,
  description: coupon.description,
  discountType: coupon.discountType,
  discountValue: Number(coupon.discountValue),
  minOrderAmount: Number(coupon.minOrderAmount),
  maxDiscountAmount: coupon.maxDiscountAmount == null ? null : Number(coupon.maxDiscountAmount),
});

/**
 * Checks that a code can be used by this customer for this subtotal and returns
 * the discount. Pass a transaction to lock the coupon row while an order is
 * being created, so two orders can't both take the last redemption.
 */
export const redeemableCoupon = async (
  rawCode: unknown,
  userId: string,
  subtotal: number,
  transaction: Transaction | null = null,
): Promise<{ coupon: Coupon; discount: number }> => {
  const code = normalizeCouponCode(rawCode);
  if (!code) throw new CouponError("Enter a promo code.");

  const coupon = await Coupon.findOne({
    where: { code },
    transaction,
    ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
  });
  if (!coupon || !coupon.isActive) throw new CouponError("This promo code isn't valid.");

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) throw new CouponError("This promo code isn't active yet.");
  if (coupon.expiresAt && coupon.expiresAt < now) throw new CouponError("This promo code has expired.");

  if (coupon.firstOrderOnly && (await hasOrderedBefore(userId, transaction))) {
    throw new CouponError("This promo code is only for your first order.");
  }

  const minimum = Number(coupon.minOrderAmount) || 0;
  if (subtotal < minimum) {
    throw new CouponError(
      `This code needs an order of at least ${formatRs(minimum)}. Add ${formatRs(minimum - subtotal)} more to use it.`,
    );
  }

  if (coupon.usageLimit != null && (await countCouponUses(code, { transaction })) >= coupon.usageLimit) {
    throw new CouponError("This promo code has been fully used.");
  }
  if (
    coupon.perUserLimit != null &&
    (await countCouponUses(code, { userId, transaction })) >= coupon.perUserLimit
  ) {
    throw new CouponError(
      coupon.perUserLimit === 1 ? "You've already used this promo code." : "You've used this promo code the maximum number of times.",
    );
  }

  const discount = calculateCouponDiscount(coupon, subtotal);
  if (discount <= 0) throw new CouponError("This promo code doesn't give a discount on this order.");
  return { coupon, discount };
};

/** Short public summary used by the announcement bar, emails and the new-customer offer */
export const presentPromotion = (coupon: Coupon) => ({
  ...presentCouponTerms(coupon),
  discountLabel: describeDiscount(coupon),
  bannerText: coupon.bannerText,
  firstOrderOnly: coupon.firstOrderOnly,
  expiresAt: coupon.expiresAt,
});

const notUsedUp = async (coupon: Coupon) =>
  coupon.usageLimit == null || (await countCouponUses(coupon.code)) < coupon.usageLimit;

/** The coupon in the storefront announcement bar, if one is switched on and still usable */
export const findSiteBannerCoupon = async () => {
  const coupon = await Coupon.findOne({ where: { showOnSite: true }, order: [["updatedAt", "DESC"]] });
  return coupon && isCouponLive(coupon) && (await notUsedUp(coupon)) ? coupon : null;
};

/** The welcome offer for new customers, if one is switched on and still usable */
export const findWelcomeCoupon = async () => {
  const coupon = await Coupon.findOne({ where: { showToNewCustomers: true }, order: [["updatedAt", "DESC"]] });
  return coupon && isCouponLive(coupon) && (await notUsedUp(coupon)) ? coupon : null;
};

/** Welcome offer for this customer: only before their first order, and only if they can still use it */
export const welcomeCouponFor = async (userId: string) => {
  const coupon = await findWelcomeCoupon();
  if (!coupon || (await hasOrderedBefore(userId))) return null;
  if (coupon.perUserLimit != null && (await countCouponUses(coupon.code, { userId })) >= coupon.perUserLimit) return null;
  return coupon;
};
