import type { SyntheticEvent } from "react";
import type { Product } from "../types/customer/productTypes";

interface HasRating {
  rating?: number | string | null;
}

export const getAverageRatingNumber = <T extends HasRating>(
  reviews?: T[] | undefined | null,
): number => {
  if (!reviews || reviews?.length === 0) return 0;

  const total = reviews?.reduce((acc, r) => acc + Number(r.rating || 0), 0);
  return Number((total / reviews?.length).toFixed(1));
};

/** Search rule shared by the header search and the products page: product name or category name */
export function matchesSearch(product: Product, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    product.productName.toLowerCase().includes(q) ||
    (product.category?.categoryName || "").toLowerCase().includes(q)
  );
}

/**
 * Asks Cloudinary for a resized, modern-format copy (WebP/AVIF) of an image
 * instead of the full-size original. Non-Cloudinary URLs are returned unchanged.
 */
export function optimizeImageUrl(url: string | undefined | null, width: number): string {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,c_limit,w_${width}/`);
}

/**
 * <img> attributes offering several Cloudinary sizes, so the browser downloads the
 * smallest copy that still looks sharp (retina screens pick a larger one, phones a smaller one).
 * `sizes` tells the browser how wide the image is shown, e.g. "(min-width: 768px) 33vw, 50vw".
 * Non-Cloudinary images (e.g. Google avatars) just get a plain src.
 */
export function responsiveImage(
  url: string | undefined | null,
  widths: number[],
  sizes: string,
): { src: string; srcSet?: string; sizes?: string } {
  if (!url) return { src: "" };
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return { src: url };
  return {
    // Middle size as the fallback for browsers that ignore srcset
    src: optimizeImageUrl(url, widths[Math.floor(widths.length / 2)]),
    srcSet: widths.map((w) => `${optimizeImageUrl(url, w)} ${w}w`).join(", "),
    sizes,
  };
}

/** Hide an image that fails to load so the card background shows instead of a broken icon */
export function hideBrokenImage(e: SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.visibility = "hidden";
}

export function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-NP")}`;
}
