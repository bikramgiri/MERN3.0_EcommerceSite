import { Op, type WhereOptions } from "sequelize";
import getFullImageUrl from "./imageHandler";

// Only show reviews that are visible to shoppers (same rule as the public review endpoint)
export const approvedReviewsOnly: WhereOptions = {
  [Op.or]: [{ status: "APPROVED" }, { status: null }],
};

// Converts stored review image and reviewer avatar paths into full URLs
export const formatReviewImages = (review: any) => ({
  ...review,
  reviewImage: review.reviewImage ? getFullImageUrl(review.reviewImage) : null,
  User: review.User
    ? {
        ...review.User,
        avatar: review.User.avatar ? getFullImageUrl(review.User.avatar) : null,
      }
    : review.User,
});

type Priced = { productPrice: number | string; productDiscount?: number | string | null };

/**
 * What a customer pays: the price entered by the admin minus the product discount,
 * rounded to whole rupees. Used for orders, coupons, filters and every price shown in the store.
 */
export const sellingPrice = (product: Priced): number => {
  const list = Number(product.productPrice) || 0;
  const discount = Math.min(100, Math.max(0, Number(product.productDiscount) || 0));
  return discount > 0 ? Math.round(list - (list * discount) / 100) : list;
};

/**
 * Product data for API responses: productPrice is the price the customer pays,
 * oldPrice is the price before the discount (null when there's no discount), and
 * listPrice is the stored price the admin edits.
 */
export const withPrices = <T extends Priced>(product: T) => {
  const listPrice = Number(product.productPrice) || 0;
  const price = sellingPrice(product);
  return { ...product, listPrice, productPrice: price, oldPrice: price < listPrice ? listPrice : null };
};

/** The same selling price as an SQL expression, for filtering and sorting in the database */
export const SELLING_PRICE_SQL =
  `ROUND(("Product"."productPrice" - "Product"."productPrice" * COALESCE("Product"."productDiscount", 0) / 100.0)::numeric)`;
