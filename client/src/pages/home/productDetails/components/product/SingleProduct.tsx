import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Banknote,
  Check,
  Heart,
  Link2,
  Loader2,
  Minus,
  PackageSearch,
  Plus,
  RotateCcw,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-react";
import { FaFacebook, FaWhatsapp } from "react-icons/fa6";
import { useAppDispatch, useAppSelector } from "../../../../../hooks/hooks";
import { fetchSingleProduct } from "../../../../../store/customer/productSlice";
import { AddToWishlist } from "../../../../../store/customer/wishlistSlice";
import { addToCart, updateCartItems } from "../../../../../store/customer/cartSlice";
import { Status } from "../../../../../global/statuses";
import Breadcrumb from "../../../../../global/Breadcrumb";
import { Skeleton, SkeletonContainer } from "../../../../../global/Skeleton";
import useIsAdmin from "../../../../../hooks/useIsAdmin";
import usePageTitle from "../../../../../hooks/usePageTitle";
import { getAverageRatingNumber, hideBrokenImage, responsiveImage } from "../../../../../utils/helpers";
import { describeDeliveryTime, useStoreSettings } from "../../../../../services/storeSettingsService";

interface SingleProductProps {
  productId: string;
}

const LOW_STOCK = 5;

const errorMessage = (error: unknown) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
  "Something went wrong. Please try again.";

function SingleProductSkeleton() {
  return (
    <div className="bg-[#FDF8ED] pt-16">
      <SkeletonContainer label="Loading product" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="mb-6 h-4 w-56" />
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-12 w-32 rounded-lg" />
              <Skeleton className="h-12 flex-1 rounded-lg" />
              <Skeleton className="h-12 w-12 rounded-lg" />
            </div>
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        </div>
      </SkeletonContainer>
    </div>
  );
}

const SingleProduct = ({ productId }: SingleProductProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAdmin = useIsAdmin();
  const settings = useStoreSettings();
  const { singleProduct, status } = useAppSelector((state) => state.product);
  const { cart } = useAppSelector((state) => state.cart);
  const isWishlisted = useAppSelector((state) =>
    state.wishlist.wishlist.some((item) => item.id === productId),
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isWishlisting, setIsWishlisting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    dispatch(fetchSingleProduct(productId)).catch(() => {});
  }, [dispatch, productId]);

  const product = singleProduct?.id === productId ? singleProduct : null;
  usePageTitle(product?.productName);

  if (!product && status === Status.ERROR) {
    return (
      <div className="bg-[#FDF8ED] pt-16">
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <PackageSearch className="mx-auto mb-4 h-12 w-12 text-[#1A1613]/30" />
          <h1 className="text-2xl font-bold text-[#1A1613]">Product not found</h1>
          <p className="mt-2 text-[#1A1613]/70">
            This product may have been removed, or the link is incorrect.
          </p>
          <Link
            to="/products"
            className="mt-6 inline-flex rounded-lg bg-[#E6540B] px-6 py-3 font-semibold text-white hover:bg-[#c94806]"
          >
            Browse all products
          </Link>
        </div>
      </div>
    );
  }

  if (!product) return <SingleProductSkeleton />;

  const stock = Number(product.productStock) || 0;
  const outOfStock = stock <= 0;
  const reviewCount = product.reviews?.length || 0;
  const rating = getAverageRatingNumber(product.reviews);
  const showOldPrice = !!product.oldPrice && product.oldPrice > product.productPrice;
  const inCart = cart?.find((item) => item.productId === productId);
  const inCartQty = inCart?.quantity ?? 0;
  const canStillAdd = Math.max(0, stock - inCartQty);
  const deliveryTime = describeDeliveryTime(settings);
  const shareUrl = window.location.href;

  const requireLogin = () => {
    if (localStorage.getItem("token")) return false;
    navigate("/login");
    return true;
  };

  const handleAddToCart = async () => {
    if (requireLogin() || isAdding) return;
    if (quantity > canStillAdd) {
      toast.info(
        canStillAdd === 0
          ? "You already have all available stock of this product in your cart."
          : `You can add ${canStillAdd} more (you already have ${inCartQty} in your cart).`,
      );
      return;
    }
    setIsAdding(true);
    try {
      if (inCart) {
        await dispatch(updateCartItems({ ...inCart, quantity: inCartQty + quantity }));
      } else {
        await dispatch(addToCart(productId, quantity));
      }
      toast.success(`Added ${quantity} × ${product.productName} to your cart`);
      setQuantity(1);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsAdding(false);
    }
  };

  const handleWishlist = async () => {
    if (requireLogin() || isWishlisting) return;
    setIsWishlisting(true);
    try {
      const action = await dispatch(AddToWishlist({ id: productId }));
      toast.success(action === "removed" ? "Removed from wishlist" : "Added to wishlist");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsWishlisting(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  const stockBadge = outOfStock
    ? { text: "Out of stock", className: "bg-red-50 text-red-700" }
    : stock <= LOW_STOCK
      ? { text: `Only ${stock} left`, className: "bg-amber-50 text-amber-700" }
      : { text: "In stock", className: "bg-green-50 text-green-700" };

  return (
    <div className="bg-[#FDF8ED] pt-16 text-[#1A1613]">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Products", href: "/products" },
            ...(product.category?.categoryName
              ? [{ label: product.category.categoryName, href: `/products?category=${product.categoryId}` }]
              : []),
            { label: product.productName },
          ]}
        />

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Image */}
          <div className="relative self-start overflow-hidden rounded-xl border border-[#1A1613]/10 bg-white">
            <img
              {...responsiveImage(product.productImage, [480, 720, 960, 1200], "(min-width: 1024px) 50vw, 100vw")}
              alt={product.productName}
              fetchPriority="high"
              onError={hideBrokenImage}
              className="aspect-square w-full object-contain p-4"
            />
            {product.productDiscount > 0 && (
              <span className="absolute left-3 top-3 rounded-md bg-[#E6540B] px-2.5 py-1 text-sm font-semibold text-white">
                -{product.productDiscount}%
              </span>
            )}
          </div>

          {/* Details */}
          <div>
            {product.category?.categoryName && (
              <Link
                to={`/products?category=${product.categoryId}`}
                className="text-sm font-medium text-[#1A1613]/60 hover:text-[#E6540B]"
              >
                {product.category.categoryName}
              </Link>
            )}
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{product.productName}</h1>

            <a href="#reviews" className="mt-2 inline-flex items-center gap-1.5 text-sm text-[#1A1613]/70 hover:text-[#E6540B]">
              <span className="flex" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${s <= Math.round(rating) ? "text-amber-400" : "text-[#1A1613]/15"}`}
                    fill="currentColor"
                    strokeWidth={0}
                  />
                ))}
              </span>
              {reviewCount > 0
                ? `${rating.toFixed(1)} · ${reviewCount} ${reviewCount === 1 ? "review" : "reviews"}`
                : "No reviews yet"}
            </a>

            <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-3xl font-bold">Rs {product.productPrice.toLocaleString()}</span>
              {showOldPrice && (
                <span className="text-lg text-[#1A1613]/50 line-through">
                  Rs {product.oldPrice!.toLocaleString()}
                </span>
              )}
            </div>

            <span className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-medium ${stockBadge.className}`}>
              {stockBadge.text}
            </span>

            {product.productDescription && (
              <p className="mt-5 whitespace-pre-line leading-relaxed text-[#1A1613]/80">
                {product.productDescription}
              </p>
            )}

            {isAdmin ? (
              <div className="mt-6 rounded-xl border border-[#1A1613]/10 bg-[#F4EEDF] p-5 text-sm text-[#1A1613]/80">
                You're signed in as an admin, so cart and wishlist are turned off. You can update this
                product from{" "}
                <Link to="/admin-dashboard/products" className="font-semibold text-[#E6540B] hover:underline">
                  Product Management
                </Link>
                .
              </div>
            ) : (
              <>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {!outOfStock && (
                    <div className="flex items-center rounded-lg border border-[#1A1613]/20 bg-white">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        aria-label="Decrease quantity"
                        className="flex h-12 w-11 cursor-pointer items-center justify-center hover:bg-[#F4EEDF] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center font-semibold" aria-live="polite">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                        disabled={quantity >= stock}
                        aria-label="Increase quantity"
                        className="flex h-12 w-11 cursor-pointer items-center justify-center hover:bg-[#F4EEDF] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={outOfStock || isAdding}
                    className="flex h-12 min-w-44 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#E6540B] px-6 font-semibold text-white transition hover:bg-[#c94806] disabled:cursor-not-allowed disabled:bg-[#1A1613]/20"
                  >
                    {isAdding ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingCart className="h-5 w-5" />}
                    {outOfStock ? "Out of stock" : isAdding ? "Adding..." : "Add to cart"}
                  </button>

                  <button
                    type="button"
                    onClick={handleWishlist}
                    disabled={isWishlisting}
                    aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    aria-pressed={isWishlisted}
                    className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg border transition disabled:opacity-60 ${
                      isWishlisted
                        ? "border-[#E6540B] bg-[#E6540B]/10 text-[#E6540B]"
                        : "border-[#1A1613]/20 bg-white text-[#1A1613]/70 hover:border-[#E6540B] hover:text-[#E6540B]"
                    }`}
                  >
                    <Heart className="h-5 w-5" fill={isWishlisted ? "currentColor" : "none"} />
                  </button>
                </div>

                {inCartQty > 0 && (
                  <p className="mt-3 text-sm text-[#1A1613]/60">
                    You have {inCartQty} in your{" "}
                    <Link to="/cart" className="font-medium text-[#E6540B] hover:underline">
                      cart
                    </Link>
                    .
                  </p>
                )}
                {outOfStock && (
                  <p className="mt-3 text-sm text-[#1A1613]/60">
                    Add it to your wishlist and we'll notify you when it's back in stock.
                  </p>
                )}
              </>
            )}

            {/* Delivery & returns (from store settings) */}
            <ul className="mt-6 space-y-3 rounded-xl border border-[#1A1613]/10 bg-white p-4 text-sm text-[#1A1613]/80">
              {(deliveryTime || settings.freeShippingThreshold > 0) && (
                <li className="flex gap-3">
                  <Truck className="mt-0.5 h-4 w-4 shrink-0 text-[#E6540B]" />
                  <span>
                    {deliveryTime}
                    {settings.freeShippingThreshold > 0 &&
                      ` Free delivery on orders over Rs ${settings.freeShippingThreshold.toLocaleString()}.`}
                  </span>
                </li>
              )}
              {settings.enableCod && (
                <li className="flex gap-3">
                  <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-[#E6540B]" />
                  <span>Cash on delivery available{settings.enableOnlinePayment && ", or pay with eSewa or Khalti"}.</span>
                </li>
              )}
              {settings.returnWindowDays > 0 && (
                <li className="flex gap-3">
                  <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-[#E6540B]" />
                  <span>
                    Damaged or wrong item? Tell us within {settings.returnWindowDays} days of delivery.{" "}
                    <Link to="/faq#damaged-item" className="font-medium text-[#E6540B] hover:underline">
                      Learn more
                    </Link>
                  </span>
                </li>
              )}
            </ul>

            {/* Share */}
            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
              <span className="mr-1 text-[#1A1613]/60">Share:</span>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${product.productName} ${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1A1613]/15 bg-white text-green-600 hover:border-green-600"
              >
                <FaWhatsapp className="h-4 w-4" />
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1A1613]/15 bg-white text-blue-600 hover:border-blue-600"
              >
                <FaFacebook className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={copyLink}
                className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[#1A1613]/15 bg-white px-3 hover:border-[#E6540B] hover:text-[#E6540B]"
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Link2 className="h-4 w-4" />}
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SingleProduct;
