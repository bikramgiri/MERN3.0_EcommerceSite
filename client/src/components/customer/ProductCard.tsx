import { useState } from "react";
import { Heart, Loader2, ShoppingCart, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import useIsAdmin from "../../hooks/useIsAdmin";
import { addToCart } from "../../store/customer/cartSlice";
import { AddToWishlist, removeWishlistItem } from "../../store/customer/wishlistSlice";
import type { Product } from "../../types/customer/productTypes";
import { getAverageRatingNumber, hideBrokenImage, responsiveImage } from "../../utils/helpers";
import { Skeleton } from "../../global/Skeleton";

const errorMessage = (error: unknown) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
  "Something went wrong. Please try again.";

/**
 * Product card used across the storefront (home, products page, wishlist).
 * Handles its own add-to-cart and wishlist actions; admins get "View details" instead.
 * `moveToCart` (wishlist page): the button adds to cart and then removes it from the wishlist.
 */
const ProductCard = ({ product, moveToCart = false }: { product: Product; moveToCart?: boolean }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const isWishlisted = useAppSelector((state) =>
    state.wishlist.wishlist.some((item) => item.id === product.id),
  );
  const alreadyInCart = useAppSelector((state) =>
    (state.cart.cart || []).some((item) => item.productId === product.id),
  );
  const [isAdding, setIsAdding] = useState(false);
  const [isWishlisting, setIsWishlisting] = useState(false);

  const reviewCount = product.reviews?.length || 0;
  const rating = getAverageRatingNumber(product.reviews);
  const outOfStock = product.productStock <= 0;
  const showOldPrice = !!product.oldPrice && product.oldPrice > product.productPrice;
  const detailsUrl = `/productdetails/${product.id}`;

  const requireLogin = () => {
    if (localStorage.getItem("token")) return false;
    navigate("/login");
    return true;
  };

  const handleAddToCart = async () => {
    if (requireLogin() || isAdding) return;
    setIsAdding(true);
    try {
      // Moving something that's already in the cart shouldn't add a second one
      if (!(moveToCart && alreadyInCart)) {
        await dispatch(addToCart(product.id));
      }
    } catch (error) {
      toast.error(errorMessage(error));
      setIsAdding(false);
      return;
    }

    if (!moveToCart) {
      toast.success("Added to cart");
      setIsAdding(false);
      return;
    }

    // Only remove from the wishlist once the cart step has worked
    try {
      await dispatch(removeWishlistItem(product.id));
      toast.success(alreadyInCart ? "Already in your cart, removed from your wishlist" : "Moved to cart");
    } catch {
      toast.info("Added to cart, but we couldn't remove it from your wishlist.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleWishlist = async () => {
    if (requireLogin() || isWishlisting) return;
    setIsWishlisting(true);
    try {
      const action = await dispatch(AddToWishlist({ id: product.id }));
      toast.success(action === "removed" ? "Removed from wishlist" : "Added to wishlist");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsWishlisting(false);
    }
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-[#1A1613]/10 bg-white transition hover:shadow-md">
      <div className="relative bg-[#F4EEDF]">
        <Link to={detailsUrl} tabIndex={-1} aria-hidden="true">
          <img
            {...responsiveImage(
              product.productImage,
              [300, 450, 600, 900],
              "(min-width: 1280px) 300px, (min-width: 768px) 33vw, 50vw",
            )}
            alt=""
            loading="lazy"
            onError={hideBrokenImage}
            className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        </Link>
        {product.productDiscount > 0 && (
          <span className="absolute left-2 top-2 rounded-md bg-[#E6540B] px-2 py-0.5 text-xs font-semibold text-white">
            -{product.productDiscount}%
          </span>
        )}
        {outOfStock && (
          <span className="absolute bottom-2 left-2 rounded-md bg-[#1A1613]/80 px-2 py-0.5 text-xs font-semibold text-white">
            Out of stock
          </span>
        )}
        {!isAdmin && (
          <button
            type="button"
            onClick={handleWishlist}
            disabled={isWishlisting}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={isWishlisted}
            className={`absolute right-2 top-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white shadow transition hover:scale-105 disabled:opacity-60 ${
              isWishlisted ? "text-[#E6540B]" : "text-[#1A1613]/60"
            }`}
          >
            <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {product.category?.categoryName && (
          <p className="mb-0.5 truncate text-xs text-[#1A1613]/50">
            {product.category.categoryName}
          </p>
        )}
        <Link
          to={detailsUrl}
          className="line-clamp-1 font-semibold text-[#1A1613] group-hover:text-[#E6540B]"
        >
          {product.productName}
        </Link>

        <div className="mt-1 flex items-center gap-1 text-xs text-[#1A1613]/60 sm:text-sm">
          <Star
            size={14}
            className={reviewCount > 0 ? "text-amber-400" : "text-[#1A1613]/20"}
            fill="currentColor"
            strokeWidth={0}
          />
          {reviewCount > 0 ? (
            <span>
              {rating.toFixed(1)} ({reviewCount})
            </span>
          ) : (
            <span>No reviews yet</span>
          )}
        </div>

        <div className="mb-3 mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg font-bold text-[#1A1613]">
            Rs {product.productPrice.toLocaleString()}
          </span>
          {showOldPrice && (
            <span className="text-sm text-[#1A1613]/50 line-through">
              Rs {product.oldPrice!.toLocaleString()}
            </span>
          )}
        </div>

        {isAdmin ? (
          <Link
            to={detailsUrl}
            className="mt-auto flex w-full items-center justify-center rounded-lg border border-[#1A1613]/15 px-3 py-2 text-sm font-semibold text-[#1A1613] transition hover:border-[#E6540B] hover:text-[#E6540B]"
          >
            View details
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock || isAdding}
            className="mt-auto flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#E6540B] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#c94806] disabled:cursor-not-allowed disabled:bg-[#1A1613]/20"
          >
            {isAdding ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
            {outOfStock
              ? "Out of stock"
              : isAdding
                ? moveToCart ? "Moving..." : "Adding..."
                : moveToCart ? "Move to cart" : "Add to cart"}
          </button>
        )}
      </div>
    </div>
  );
};

/** Loading placeholder with the same shape as ProductCard */
export const ProductCardSkeleton = () => (
  <div className="flex flex-col overflow-hidden rounded-xl border border-[#1A1613]/10 bg-white">
    <Skeleton className="aspect-square rounded-none" />
    <div className="space-y-2 p-3 sm:p-4">
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-6 w-24" />
      <Skeleton className="mt-3 h-9 w-full rounded-lg" />
    </div>
  </div>
);

export default ProductCard;
