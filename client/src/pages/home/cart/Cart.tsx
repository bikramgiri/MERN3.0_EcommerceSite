import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Loader2, Minus, Plus, RotateCw, ShoppingBag, Star, Truck } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../hooks/hooks";
import { fetchCartItems, removeFromCart, saveCartItemForLater, updateCartItems } from "../../../store/customer/cartSlice";
import { fetchUserWishlist } from "../../../store/customer/wishlistSlice";
import type { CartItem } from "../../../types/customer/cartTypes";
import Breadcrumb from "../../../global/Breadcrumb";
import { Skeleton, SkeletonContainer } from "../../../global/Skeleton";
import { calculateShipping, describeDeliveryTime, useStoreSettings } from "../../../services/storeSettingsService";
import { formatCurrency, getAverageRatingNumber, hideBrokenImage, responsiveImage } from "../../../utils/helpers";
import usePageTitle from "../../../hooks/usePageTitle";

const LOW_STOCK = 5; // same "only a few left" cut-off as the product page

const errorMessage = (error: unknown) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
  "Something went wrong. Please try again.";

const layout = "grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-8";
const card = "rounded-xl border border-[#1A1613]/10 bg-white";

/** Why an item can't be ordered as it is (null when it's fine) */
const stockProblem = (item: CartItem) => {
  const stock = item.product.productStock;
  if (stock <= 0) return "out";
  if (item.quantity > stock) return "over";
  return null;
};

const CartSkeleton = () => (
  <SkeletonContainer label="Loading cart" className={layout}>
    <div className={`${card} divide-y divide-[#1A1613]/10`}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 sm:p-5">
          <Skeleton className="h-20 w-20 shrink-0 rounded-lg sm:h-24 sm:w-24" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-9 w-28 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
    <div className={`${card} space-y-4 p-5`}>
      <Skeleton className="h-6 w-36" />
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  </SkeletonContainer>
);

const Cart = () => {
  usePageTitle("Your cart");
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const cart = useAppSelector((state) => state.cart.cart) || [];
  const settings = useStoreSettings();

  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Always refresh on open so prices and stock are current, even if the header already loaded the cart
  const load = () => {
    setLoadFailed(false);
    dispatch(fetchCartItems())
      .then(() => setLoaded(true))
      .catch(() => setLoadFailed(true));
  };

  useEffect(() => {
    dispatch(fetchCartItems())
      .then(() => setLoaded(true))
      .catch(() => setLoadFailed(true));
  }, [dispatch]);

  const changeQuantity = async (item: CartItem, quantity: number) => {
    if (busyId || quantity < 1 || quantity === item.quantity) return;
    setBusyId(item.id);
    try {
      await dispatch(updateCartItems({ ...item, quantity }));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const removeItem = async (item: CartItem) => {
    if (busyId) return;
    setBusyId(item.id);
    try {
      await dispatch(removeFromCart(item.id));
      toast.success(`Removed ${item.product.productName}`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const saveForLater = async (item: CartItem) => {
    if (busyId) return;
    setBusyId(item.id);
    try {
      await dispatch(saveCartItemForLater(item.id));
      dispatch(fetchUserWishlist()).catch(() => {});
      toast.success(`Saved ${item.product.productName} to your wishlist`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.productPrice * item.quantity, 0);
  const { fee: shipping } = calculateShipping(subtotal, settings);
  const total = subtotal + shipping;
  const hasProblems = cart.some((item) => stockProblem(item) !== null);

  const showFreeDeliveryProgress = settings.standardShippingFee > 0 && settings.freeShippingThreshold > 0;
  const amountToFreeDelivery = Math.max(0, settings.freeShippingThreshold - subtotal);
  const deliveryEstimate = describeDeliveryTime(settings);
  const paymentNote =
    settings.enableCod && settings.enableOnlinePayment
      ? "Pay with cash on delivery or online at checkout."
      : settings.enableCod
        ? "Pay with cash on delivery."
        : settings.enableOnlinePayment
          ? "Pay online at checkout."
          : "";

  // Show the skeleton only until this page's first fetch finishes (and only if nothing is cached)
  const isInitialLoad = !loaded && !loadFailed && cart.length === 0;

  return (
    <div className="bg-[#FDF8ED] pt-16 text-[#1A1613]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Cart" }]} />

        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Your cart</h1>
            {cart.length > 0 && (
              <p className="mt-1 text-sm text-[#1A1613]/60">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </p>
            )}
          </div>
          {cart.length > 0 && (
            <Link to="/products" className="text-sm font-semibold text-[#E6540B] hover:underline">
              Continue shopping
            </Link>
          )}
        </div>

        {isInitialLoad ? (
          <CartSkeleton />
        ) : loadFailed && cart.length === 0 ? (
          <div className={`${card} px-4 py-16 text-center`}>
            <p className="text-[#1A1613]/70">We couldn't load your cart right now.</p>
            <button
              type="button"
              onClick={load}
              className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#1A1613]/20 px-4 py-2 text-sm font-semibold hover:border-[#E6540B] hover:text-[#E6540B]"
            >
              <RotateCw className="h-4 w-4" /> Try again
            </button>
          </div>
        ) : cart.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#1A1613]/15 bg-white px-4 py-16 text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E6540B]/10">
              <ShoppingBag className="h-7 w-7 text-[#E6540B]" />
            </span>
            <h2 className="text-xl font-semibold">Your cart is empty</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-[#1A1613]/60">
              Add a few things you like and they'll show up here.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/products"
                className="inline-flex rounded-lg bg-[#E6540B] px-6 py-3 font-semibold text-white hover:bg-[#c94806]"
              >
                Browse products
              </Link>
              <Link
                to="/wishlist"
                className="inline-flex rounded-lg border border-[#1A1613]/15 px-6 py-3 font-semibold hover:border-[#E6540B] hover:text-[#E6540B]"
              >
                View wishlist
              </Link>
            </div>
          </div>
        ) : (
          <div className={layout}>
            <ul className={`${card} divide-y divide-[#1A1613]/10`}>
              {cart.map((item) => {
                const { product } = item;
                const detailsUrl = `/productdetails/${product.id}`;
                const reviewCount = product.reviews?.length || 0;
                const rating = getAverageRatingNumber(product.reviews);
                const problem = stockProblem(item);
                const isBusy = busyId === item.id;
                const locked = busyId !== null;

                return (
                  <li key={item.id} className={`flex gap-4 p-4 transition-opacity sm:p-5 ${isBusy ? "opacity-60" : ""}`}>
                    <Link to={detailsUrl} className="shrink-0" tabIndex={-1} aria-hidden="true">
                      <img
                        {...responsiveImage(product.productImage, [120, 200], "96px")}
                        alt=""
                        loading="lazy"
                        onError={hideBrokenImage}
                        className="h-20 w-20 rounded-lg bg-[#F4EEDF] object-cover sm:h-24 sm:w-24"
                      />
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {product.category?.categoryName && (
                            <p className="truncate text-xs text-[#1A1613]/50">{product.category.categoryName}</p>
                          )}
                          <Link to={detailsUrl} className="line-clamp-2 font-semibold hover:text-[#E6540B]">
                            {product.productName}
                          </Link>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-[#1A1613]/60">
                            <span>{formatCurrency(product.productPrice)} each</span>
                            {reviewCount > 0 && (
                              <span className="inline-flex items-center gap-0.5">
                                <Star size={13} className="text-amber-400" fill="currentColor" strokeWidth={0} />
                                {rating.toFixed(1)} ({reviewCount})
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="shrink-0 text-right font-bold">
                          {formatCurrency(product.productPrice * item.quantity)}
                        </p>
                      </div>

                      {problem === "out" ? (
                        <p className="mt-2 text-sm font-medium text-red-700">
                          Out of stock. Remove it to check out.
                        </p>
                      ) : problem === "over" ? (
                        <p className="mt-2 text-sm font-medium text-red-700">
                          Only {product.productStock} left.{" "}
                          <button
                            type="button"
                            onClick={() => changeQuantity(item, product.productStock)}
                            disabled={locked}
                            className="cursor-pointer underline hover:no-underline disabled:cursor-not-allowed"
                          >
                            Change to {product.productStock}
                          </button>
                        </p>
                      ) : (
                        product.productStock <= LOW_STOCK && (
                          <p className="mt-2 text-sm text-amber-700">Only {product.productStock} left in stock</p>
                        )
                      )}

                      <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                        <div className="inline-flex items-center rounded-lg border border-[#1A1613]/15">
                          <button
                            type="button"
                            onClick={() => changeQuantity(item, item.quantity - 1)}
                            disabled={locked || item.quantity <= 1 || problem === "out"}
                            aria-label={`Decrease quantity of ${product.productName}`}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-l-lg hover:bg-[#F4EEDF] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Minus size={15} />
                          </button>
                          <span className="flex w-9 justify-center text-sm font-semibold" aria-live="polite">
                            {isBusy ? <Loader2 size={15} className="animate-spin" /> : item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => changeQuantity(item, item.quantity + 1)}
                            disabled={locked || item.quantity >= product.productStock}
                            aria-label={`Increase quantity of ${product.productName}`}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-r-lg hover:bg-[#F4EEDF] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                        <div className="flex items-center gap-4 text-sm font-medium">
                          <button
                            type="button"
                            onClick={() => saveForLater(item)}
                            disabled={locked}
                            className="cursor-pointer text-[#1A1613]/60 hover:text-[#E6540B] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Save for later
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item)}
                            disabled={locked}
                            className="cursor-pointer text-[#1A1613]/60 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <aside className={`${card} p-5 lg:sticky lg:top-24`}>
              <h2 className="text-lg font-semibold">Order summary</h2>

              {showFreeDeliveryProgress && (
                <div className="mt-4 rounded-lg bg-[#F4EEDF] p-3 text-sm">
                  <p className="flex items-center gap-2">
                    <Truck size={16} className="shrink-0 text-[#E6540B]" />
                    {amountToFreeDelivery > 0 ? (
                      <span>
                        Add <strong>{formatCurrency(amountToFreeDelivery)}</strong> more for free delivery
                      </span>
                    ) : (
                      <span className="font-medium text-emerald-700">You get free delivery</span>
                    )}
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                    <div
                      className={`h-full rounded-full transition-all ${amountToFreeDelivery > 0 ? "bg-[#E6540B]" : "bg-emerald-600"}`}
                      style={{ width: `${Math.min(100, (subtotal / settings.freeShippingThreshold) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[#1A1613]/70">
                    Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                  </dt>
                  <dd className="font-medium">{formatCurrency(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#1A1613]/70">Delivery</dt>
                  <dd className={shipping === 0 ? "font-medium text-emerald-700" : "font-medium"}>
                    {shipping === 0 ? "Free" : formatCurrency(shipping)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-[#1A1613]/10 pt-3 text-base font-bold">
                  <dt>Total</dt>
                  <dd>{formatCurrency(total)}</dd>
                </div>
              </dl>

              <button
                type="button"
                onClick={() => navigate("/checkout")}
                disabled={hasProblems || busyId !== null}
                className="mt-5 w-full cursor-pointer rounded-lg bg-[#E6540B] px-4 py-3 font-semibold text-white transition hover:bg-[#c94806] disabled:cursor-not-allowed disabled:bg-[#1A1613]/20"
              >
                Proceed to checkout
              </button>
              {hasProblems && (
                <p className="mt-2 text-center text-sm text-red-700">
                  Fix the items marked in red to continue.
                </p>
              )}

              {!hasProblems && (
                <p className="mt-2 text-center text-xs text-[#1A1613]/50">Have a promo code? Add it at checkout.</p>
              )}

              {(paymentNote || deliveryEstimate) && (
                <div className="mt-4 space-y-1 border-t border-[#1A1613]/10 pt-4 text-xs text-[#1A1613]/60">
                  {paymentNote && <p>{paymentNote}</p>}
                  {deliveryEstimate && <p>{deliveryEstimate}</p>}
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
