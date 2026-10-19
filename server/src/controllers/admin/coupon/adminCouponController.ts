import { Request, Response } from "express";
import { Op, QueryTypes, UniqueConstraintError } from "sequelize";
import Coupon from "../../../database/models/couponModel";
import { sequelize } from "../../../database/connection";
import {
  describeDiscount,
  isCouponLive,
  normalizeCouponCode,
} from "../../../services/couponService";
import NewsletterSubscriber from "../../../database/models/newsletterSubscriberModel";
import { sendCouponEmail } from "../../../services/newsletterEmails";
import { emitToAll } from "../../../services/socketService";
import { notifyAdmins } from "../../../services/notificationService";

/**
 * Only one coupon can be in the announcement bar, and one offered to new customers.
 * Turning it on for this coupon turns it off for the others.
 */
const keepPromotionsExclusive = async (coupon: Coupon) => {
  const others = { id: { [Op.ne]: coupon.id } };
  if (coupon.showOnSite) await Coupon.update({ showOnSite: false }, { where: { ...others, showOnSite: true } });
  if (coupon.showToNewCustomers) {
    await Coupon.update({ showToNewCustomers: false }, { where: { ...others, showToNewCustomers: true } });
  }
};

// Storefronts refetch the announcement bar and welcome offer when coupons change
const announcePromotionsChanged = () => emitToAll("store:promotions-updated");

let emailingCouponId: string | null = null;

const CODE_PATTERN = /^[A-Z0-9_-]{3,40}$/;

type CouponInput = {
  code: string;
  description: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  startsAt: Date | null;
  expiresAt: Date | null;
  usageLimit: number | null;
  perUserLimit: number | null;
  isActive: boolean;
  firstOrderOnly: boolean;
  showToNewCustomers: boolean;
  showOnSite: boolean;
  bannerText: string;
};

const flag = (value: unknown, current: boolean) =>
  value === undefined ? current : value === true || value === "true";

const optionalNumber = (value: unknown): number | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
};

const optionalDate = (value: unknown): Date | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? new Date(NaN) : d;
};

/**
 * Validates a create/update body. For updates, missing fields keep their
 * current value (`existing`). Returns either the clean values or an error.
 */
const parseCouponInput = (
  body: Record<string, unknown>,
  existing?: Coupon,
): { data: CouponInput } | { error: string; field: string } => {
  const code = body.code === undefined && existing ? existing.code : normalizeCouponCode(body.code);
  if (!CODE_PATTERN.test(code)) {
    return { error: "Code must be 3–40 characters: letters, numbers, - or _.", field: "code" };
  }

  const description =
    body.description === undefined ? existing?.description ?? "" : String(body.description ?? "").trim();
  if (description.length > 200) return { error: "Description must be 200 characters or fewer.", field: "description" };

  const discountType = (body.discountType ?? existing?.discountType) as string;
  if (discountType !== "PERCENT" && discountType !== "FIXED") {
    return { error: "Choose a percentage or a fixed amount.", field: "discountType" };
  }

  const value = optionalNumber(body.discountValue);
  const discountValue = value === undefined ? Number(existing?.discountValue) : value;
  if (discountValue == null || !Number.isFinite(discountValue) || discountValue <= 0) {
    return { error: "Discount must be more than 0.", field: "discountValue" };
  }
  if (discountType === "PERCENT" && discountValue > 100) {
    return { error: "A percentage discount can't be more than 100%.", field: "discountValue" };
  }

  const min = optionalNumber(body.minOrderAmount);
  const minOrderAmount = min === undefined ? Number(existing?.minOrderAmount ?? 0) : min ?? 0;
  if (!Number.isFinite(minOrderAmount) || minOrderAmount < 0) {
    return { error: "Minimum order can't be negative.", field: "minOrderAmount" };
  }

  const max = optionalNumber(body.maxDiscountAmount);
  let maxDiscountAmount =
    max === undefined ? (existing?.maxDiscountAmount == null ? null : Number(existing.maxDiscountAmount)) : max;
  if (maxDiscountAmount != null && (!Number.isFinite(maxDiscountAmount) || maxDiscountAmount <= 0)) {
    return { error: "Maximum discount must be more than 0, or left empty.", field: "maxDiscountAmount" };
  }
  if (discountType === "FIXED") maxDiscountAmount = null; // only meaningful for percentages

  const starts = optionalDate(body.startsAt);
  const startsAt = starts === undefined ? existing?.startsAt ?? null : starts;
  const expires = optionalDate(body.expiresAt);
  const expiresAt = expires === undefined ? existing?.expiresAt ?? null : expires;
  if (startsAt && Number.isNaN(startsAt.getTime())) return { error: "Start date isn't valid.", field: "startsAt" };
  if (expiresAt && Number.isNaN(expiresAt.getTime())) return { error: "End date isn't valid.", field: "expiresAt" };
  if (startsAt && expiresAt && expiresAt <= startsAt) {
    return { error: "End date must be after the start date.", field: "expiresAt" };
  }

  const limitValue = (raw: unknown, current: number | null | undefined, field: string, label: string) => {
    const n = optionalNumber(raw);
    const v = n === undefined ? current ?? null : n;
    if (v != null && (!Number.isInteger(v) || v < 1)) return { error: `${label} must be a whole number of 1 or more, or left empty.`, field };
    return { value: v as number | null };
  };
  const usage = limitValue(body.usageLimit, existing?.usageLimit, "usageLimit", "Total uses");
  if ("error" in usage) return usage as { error: string; field: string };
  const perUser = limitValue(
    body.perUserLimit,
    existing ? existing.perUserLimit : 1,
    "perUserLimit",
    "Uses per customer",
  );
  if ("error" in perUser) return perUser as { error: string; field: string };

  const isActive = flag(body.isActive, existing?.isActive ?? true);
  const bannerText =
    body.bannerText === undefined ? existing?.bannerText ?? "" : String(body.bannerText ?? "").trim();
  if (bannerText.length > 120) return { error: "Announcement text must be 120 characters or fewer.", field: "bannerText" };

  return {
    data: {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      startsAt,
      expiresAt,
      usageLimit: usage.value,
      perUserLimit: perUser.value,
      isActive,
      firstOrderOnly: flag(body.firstOrderOnly, existing?.firstOrderOnly ?? false),
      showToNewCustomers: flag(body.showToNewCustomers, existing?.showToNewCustomers ?? false),
      showOnSite: flag(body.showOnSite, existing?.showOnSite ?? false),
      bannerText,
    },
  };
};

// Redemptions per code (cancelled orders and failed online payments don't count)
const usageByCode = async (): Promise<Record<string, number>> => {
  const rows = await sequelize.query<{ couponCode: string; uses: string }>(
    `SELECT o."couponCode", COUNT(*) AS uses
       FROM "orders" o
       JOIN "payments" p ON p.id = o."paymentId"
      WHERE o."couponCode" IS NOT NULL
        AND o."orderStatus" <> 'Cancelled'
        AND p."paymentStatus" <> 'Failed'
      GROUP BY o."couponCode"`,
    { type: QueryTypes.SELECT },
  );
  return Object.fromEntries(rows.map((r) => [r.couponCode, Number(r.uses)]));
};

const presentCoupon = (coupon: Coupon, uses: number) => ({
  ...coupon.toJSON(),
  discountValue: Number(coupon.discountValue),
  minOrderAmount: Number(coupon.minOrderAmount),
  maxDiscountAmount: coupon.maxDiscountAmount == null ? null : Number(coupon.maxDiscountAmount),
  timesUsed: uses,
});

const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

class AdminCouponController {
  public static async fetchCoupons(_req: Request, res: Response): Promise<void> {
    const [coupons, usage] = await Promise.all([Coupon.findAll({ order: [["createdAt", "DESC"]] }), usageByCode()]);
    res.status(200).json({
      message: "Coupons fetched successfully",
      data: coupons.map((c) => presentCoupon(c, usage[c.code] || 0)),
    });
  }

  public static async createCoupon(req: Request, res: Response): Promise<void> {
    const parsed = parseCouponInput(req.body || {});
    if ("error" in parsed) {
      res.status(400).json({ message: parsed.error, field: parsed.field });
      return;
    }
    try {
      const coupon = await Coupon.create(parsed.data);
      await keepPromotionsExclusive(coupon);
      announcePromotionsChanged();
      res.status(201).json({ message: "Coupon created", data: presentCoupon(coupon, 0) });
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        res.status(409).json({ message: "A coupon with this code already exists.", field: "code" });
        return;
      }
      throw error;
    }
  }

  public static async updateCoupon(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id);
    const coupon = isUuid(id) ? await Coupon.findByPk(id) : null;
    if (!coupon) {
      res.status(404).json({ message: "Coupon not found", field: "id" });
      return;
    }

    const parsed = parseCouponInput(req.body || {}, coupon);
    if ("error" in parsed) {
      res.status(400).json({ message: parsed.error, field: parsed.field });
      return;
    }

    const usage = await usageByCode();
    // Renaming a code that's already on orders would break the link to those orders
    if (parsed.data.code !== coupon.code && (usage[coupon.code] || 0) > 0) {
      res.status(400).json({
        message: "This code has already been used on orders, so it can't be renamed. Create a new coupon instead.",
        field: "code",
      });
      return;
    }

    try {
      await coupon.update(parsed.data);
      await keepPromotionsExclusive(coupon);
      announcePromotionsChanged();
      res.status(200).json({ message: "Coupon updated", data: presentCoupon(coupon, usage[coupon.code] || 0) });
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        res.status(409).json({ message: "A coupon with this code already exists.", field: "code" });
        return;
      }
      throw error;
    }
  }

  // Orders keep their saved code and discount, so deleting a coupon never changes past orders
  public static async deleteCoupon(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id);
    const coupon = isUuid(id) ? await Coupon.findByPk(id) : null;
    if (!coupon) {
      res.status(404).json({ message: "Coupon not found", field: "id" });
      return;
    }
    await coupon.destroy();
    announcePromotionsChanged();
    res.status(200).json({ message: "Coupon deleted", data: { id } });
  }

  // *Email the code to every confirmed newsletter subscriber (sent in the background)
  public static async emailCoupon(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id);
    const coupon = isUuid(id) ? await Coupon.findByPk(id) : null;
    if (!coupon) {
      res.status(404).json({ message: "Coupon not found", field: "id" });
      return;
    }
    if (!isCouponLive(coupon)) {
      res.status(400).json({ message: "Turn the coupon on (and check its dates) before emailing it.", field: "isActive" });
      return;
    }
    if (emailingCouponId) {
      res.status(409).json({ message: "Another coupon email is still being sent. Please wait for it to finish.", field: "general" });
      return;
    }

    const subscribers = await NewsletterSubscriber.findAll({
      where: { status: "CONFIRMED", unsubscribeToken: { [Op.ne]: null } },
      attributes: ["email", "unsubscribeToken"],
    });
    if (subscribers.length === 0) {
      res.status(400).json({ message: "There are no confirmed subscribers to email yet.", field: "general" });
      return;
    }

    coupon.lastEmailedAt = new Date();
    await coupon.save();
    emailingCouponId = coupon.id;
    res.status(202).json({
      message: `Sending ${coupon.code} to ${subscribers.length} subscriber(s). You'll get a notification when it's done.`,
      data: { recipients: subscribers.length, lastEmailedAt: coupon.lastEmailedAt },
    });

    // Send a few at a time so the mail provider doesn't throttle us
    const offer = {
      code: coupon.code,
      headline: coupon.bannerText || `${describeDiscount(coupon)} with code ${coupon.code}`,
      details: coupon.description,
      minOrderAmount: Number(coupon.minOrderAmount) || 0,
      expiresAt: coupon.expiresAt,
      firstOrderOnly: coupon.firstOrderOnly,
    };
    let sent = 0;
    let failed = 0;
    try {
      for (let i = 0; i < subscribers.length; i += 3) {
        const batch = subscribers.slice(i, i + 3);
        const results = await Promise.allSettled(
          batch.map((sub) => sendCouponEmail(sub.email, sub.unsubscribeToken as string, offer)),
        );
        results.forEach((r) => (r.status === "fulfilled" ? sent++ : failed++));
      }
    } finally {
      emailingCouponId = null;
      await notifyAdmins({
        type: failed ? "payment-failed" : "new-subscriber",
        title: failed ? "Coupon email partly sent" : "Coupon email sent",
        message: `${coupon.code} was emailed to ${sent} subscriber(s)${failed ? `; ${failed} couldn't be delivered` : ""}.`,
        link: "/admin-dashboard/coupons",
      });
    }
  }
}

export default AdminCouponController;
