import { useSyncExternalStore } from "react";
import { API, APIAuthenticated } from "../http";

export type DiscountType = "PERCENT" | "FIXED";

/** What the server tells the shopper about a code they applied */
export interface AppliedCoupon {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
}

/** A coupon as the admin sees it */
export interface Coupon extends AppliedCoupon {
  id: string;
  startsAt: string | null;
  expiresAt: string | null;
  usageLimit: number | null;
  perUserLimit: number | null;
  isActive: boolean;
  firstOrderOnly: boolean;
  showToNewCustomers: boolean;
  showOnSite: boolean;
  bannerText: string;
  lastEmailedAt: string | null;
  timesUsed: number;
  createdAt: string;
}

/** A coupon the store is advertising (announcement bar, new-customer offer) */
export interface Promotion extends AppliedCoupon {
  discountLabel: string;
  bannerText: string;
  firstOrderOnly: boolean;
  expiresAt: string | null;
}

/**
 * Same formula the server uses (server/src/services/couponService.ts), so the
 * total shown at checkout is exactly the total the server expects.
 */
export const calculateCouponDiscount = (coupon: AppliedCoupon, subtotal: number): number => {
  if (subtotal <= 0 || subtotal < coupon.minOrderAmount) return 0;
  let discount =
    coupon.discountType === "PERCENT" ? (subtotal * coupon.discountValue) / 100 : coupon.discountValue;
  if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
    discount = Math.min(discount, coupon.maxDiscountAmount);
  }
  discount = Math.min(discount, subtotal);
  return Math.round(discount * 100) / 100;
};

/** e.g. "10% off (up to Rs. 500)" or "Rs. 200 off" */
export const describeCoupon = (coupon: AppliedCoupon): string => {
  const off =
    coupon.discountType === "PERCENT"
      ? `${coupon.discountValue}% off`
      : `Rs. ${coupon.discountValue.toLocaleString("en-NP")} off`;
  const cap =
    coupon.discountType === "PERCENT" && coupon.maxDiscountAmount
      ? ` (up to Rs. ${coupon.maxDiscountAmount.toLocaleString("en-NP")})`
      : "";
  return off + cap;
};

/** Checks a code against the shopper's saved cart; throws with the server's message if it can't be used */
export const applyCouponCode = async (code: string): Promise<AppliedCoupon> => {
  const response = await APIAuthenticated.post("/customer/coupon/apply", { code });
  return response.data.data as AppliedCoupon;
};

/** New-customer offer for the signed-in shopper (null once they've ordered or used it) */
export const fetchWelcomeOffer = async (): Promise<Promotion | null> =>
  (await APIAuthenticated.get("/customer/coupon/welcome")).data.data ?? null;

// ---- Announcement bar: one shared copy for the header and its spacer ----

let siteBanner: Promotion | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

/** Loads the coupon shown at the top of the storefront (called at start-up and when the admin changes coupons) */
export const loadSitePromotion = async () => {
  try {
    siteBanner = (await API.get("/customer/promotions")).data.data?.banner ?? null;
  } catch {
    siteBanner = null;
  }
  emit();
};

export const useSitePromotion = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => siteBanner,
  );

// Shoppers can close the bar; it stays closed for that code on this device
const DISMISSED_KEY = "truvora_dismissed_promo";
let dismissedCode: string | null = (() => {
  try {
    return localStorage.getItem(DISMISSED_KEY);
  } catch {
    return null;
  }
})();

export const dismissSitePromotion = (code: string) => {
  dismissedCode = code;
  try {
    localStorage.setItem(DISMISSED_KEY, code);
  } catch {
    // closing still works for this visit
  }
  emit();
};

export const useDismissedPromotion = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => dismissedCode,
  );
