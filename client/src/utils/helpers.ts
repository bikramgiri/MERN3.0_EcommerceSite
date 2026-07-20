import { FilterOptions, Product } from "../types/productTypes";
import { Review } from "../types/reviewTypes";

interface HasRating {
  rating?: number | string | null;
}

export const getAverageRatingNumber = <T extends HasRating>(
  reviews: T[] | undefined | null,
): number => {
  if (!reviews || reviews.length === 0) return 0;

  const total = reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
  return Number((total / reviews.length).toFixed(1));
};

/** Get review count for a product */
export function getProductReviewCount(
  productId: string,
  reviews: Review[]
): number {
  return reviews.filter((r) => r.productId === productId).length;
}

/**
 * Filter products by price, rating, and category.
 * categoryFilter: category id string or "all" / undefined to skip.
 */
export function filterProducts(
  products: Product[],
  filters: FilterOptions,
  reviews: Review[],
  categoryFilter?: string
): Product[] {
  return products.filter((product) => {
    // Category
    if (categoryFilter && categoryFilter !== "all") {
      if (product.categoryId !== categoryFilter) return false;
    }

    // Min price
    if (
      filters.minPrice !== undefined &&
      product.productPrice < filters.minPrice
    ) {
      return false;
    }

    // Max price
    if (
      filters.maxPrice !== undefined &&
      product.productPrice > filters.maxPrice
    ) {
      return false;
    }

    // Min rating
    if (filters.minRating !== undefined && filters.minRating > 0) {
      const avg = getAverageRatingNumber(product.reviews);
      if (avg < filters.minRating) return false;
    }

    return true;
  });
}

/** Sort products by the given sort key */
export function sortProducts(
  products: Product[],
  sortBy: string,
  reviews: Review[]
): Product[] {
  const sorted = [...products];

  switch (sortBy) {
    case "price_asc":
      return sorted.sort((a, b) => a.productPrice - b.productPrice);

    case "price_desc":
      return sorted.sort((a, b) => b.productPrice - a.productPrice);

    case "rating_high":
      return sorted.sort(
        (a, b) =>
          getAverageRatingNumber(b.reviews) -
          getAverageRatingNumber(a.reviews)
      );

    case "rating_low":
      return sorted.sort(
        (a, b) =>
          getAverageRatingNumber(a.reviews) -
          getAverageRatingNumber(b.reviews)
      );

    case "newest":
      return sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    default: // relevance
      return sorted.sort((a, b) => {
        const rA = getAverageRatingNumber(a.reviews);
        const rB = getAverageRatingNumber(b.reviews);
        if (Math.abs(rB - rA) > 0.1) return rB - rA;
        return (
          getProductReviewCount(b.id, reviews) -
          getProductReviewCount(a.id, reviews)
        );
      });
  }
}

export function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-NP")}`;
}