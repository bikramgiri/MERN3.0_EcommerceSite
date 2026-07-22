import { Heart, Loader2, ShoppingCart } from "lucide-react";
import { Status } from "../../../global/statuses";
import { fetchProducts } from "../../../store/customer/productSlice";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks/hooks";
import { Link, useNavigate } from "react-router-dom";
import { AddToWishlist } from "../../../store/customer/wishlistSlice";
import type { Product } from "../../../types/productTypes";
import { toast } from "react-toastify";
import { addToCart } from "../../../store/customer/cartSlice";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-['IBM_Plex_Mono',monospace] text-xl tracking-[0.25em] uppercase text-[#E6540B]">
      {children}
    </p>
  );
}

export default function Bestsellers() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { product: products = [], status } = useAppSelector(
    (state) => state.product,
  );
  const { wishlist } = useAppSelector((state) => state.wishlist);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  if (!products || products.length === 0 || status === Status.LOADING) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FDF8ED] to-[#FAF3E4]">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-[#E6540B] mx-auto mb-4" />
          <p className="text-xl text-[#1A1613]/60">Loading product.....</p>
        </div>
      </div>
    );
  }

  const handleWishlistToggle = async (product: Product) => {
    try {
      const action = await dispatch(AddToWishlist({ id: product.id }));
      if (action === "removed") {
        toast.success("Product removed from wishlist!");
      } else {
        toast.success("Product added to wishlist!");
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF8ED] text-[#1A1613] font-['Inter',sans-serif] antialiased">
      <style>{`
        @keyframes truvora-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .truvora-marquee-track {
          animation: truvora-marquee 22s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .truvora-marquee-track { animation: none; }
        }
      `}</style>

      <section
        id="bestsellers"
        className="border-y border-[#1A1613]/10 bg-[#F4EEDF] py-20"
      >
        <div className="mx-auto max-w-[1500px] px-6 lg:px-10">
          <div className="flex items-end justify-between gap-6">
            <div>
              <SectionLabel>This Week's Picks</SectionLabel>
              <h2 className="mt-3 font-['Fraunces',serif] text-3xl sm:text-4xl">
                Best Sellers products
              </h2>
            </div>
            <Link
              to="/products"
              className="font-medium text-md tracking-widest text-[#E6540B] transition hover:text-[#9B3A2E] underline"
            >
              View All Products
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.length > 0 ? (
              products
                .filter((p) =>
                  [
                    "Mobile",
                    "Vest",
                    "Biscuit",
                    "Soap",
                    "Perfume",
                    "Sofa",
                    "Headphone",
                    "Copy",
                  ].includes(p.productName),
                )
                .map((product) => {
                  const isWishlisted = wishlist.some(
                    (item) => item.id === product.id,
                  );

                  const reviewCount = product.reviews?.length || 0;
                  const averageRating =
                    reviewCount > 0
                      ? (
                          product.reviews!.reduce(
                            (acc, r) => acc + Number(r.rating || 0),
                            0,
                          ) / reviewCount
                        ).toFixed(1)
                      : "0.0";

                  const handleAddToCart = async () => {
                    if (!localStorage.getItem("token")) {
                      navigate("/login");
                      return;
                    }
                    if (product.id && product) {
                      try {
                        await dispatch(addToCart(product.id));
                        toast.success("Product added to cart!");
                      } catch {
                        toast.error("Something went wrong. Please try again.");
                      }
                    }
                  };

                  return (
                    <div
                      key={product.id}
                      className="group overflow-hidden rounded-xl border border-[#1A1613]/10 bg-[#FDF8ED] shadow-sm transition-all hover:shadow-lg hover:border-[#E6540B]/40"
                    >
                      <Link
                        to={`/productdetails/${product.id}`}
                        key={product.id}
                      >
                        <div className="relative h-56 overflow-hidden bg-[#F4EEDF]">
                          <img
                            src={product.productImage}
                            alt={product.productName}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {product.productDiscount && (
                            <span className="absolute left-3 top-3 rounded-full bg-[#9B3A2E] px-3 py-1 text-xs font-bold text-[#FDF8ED]">
                              {product.productDiscount}% OFF
                            </span>
                          )}
                        </div>

                        <div className="p-5">
                          <h3 className="mb-2 text-xl font-['Fraunces',serif] font-semibold text-[#1A1613] line-clamp-2 group-hover:text-[#E6540B]">
                            {product.productName}
                          </h3>

                          <div className="flex items-center mb-2 gap-1">
                            {reviewCount > 0 ? (
                              <>
                                {[...Array(5)].map((_, i) => (
                                  <svg
                                    key={i}
                                    className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                      i < Math.round(Number(averageRating))
                                        ? "text-[#E6540B]"
                                        : "text-[#1A1613]/15"
                                    }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                                <span className="ml-1 text-sm font-medium text-[#1A1613]/80">
                                  {averageRating}
                                </span>
                                <span className="text-sm text-[#1A1613]/50">
                                  ({reviewCount})
                                </span>
                              </>
                            ) : (
                              <>
                                <svg
                                    className="w-4 h-4 sm:w-5 sm:h-5 text-[#1A1613]/15"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                <span className="ml-1 text-sm font-medium text-[#1A1613]/80">
                                  0.0
                                </span>
                                <span className="text-sm text-[#1A1613]/50">
                                  (0)
                                </span>
                              </>
                            )}
                          </div>

                          <div className="mb-3 flex items-center gap-2">
                            <span className="font-['IBM_Plex_Mono',monospace] text-xl font-bold text-[#8A3B12]">
                              Rs {product.productPrice}
                            </span>
                          </div>
                        </div>
                      </Link>
                      <div className="p-5 border-t gap-2 border-[#1A1613]/10 flex justify-between">
                        <button
                          type="button"
                          onClick={handleAddToCart}
                          disabled={product.productStock === 0}
                          className="cursor-pointer gap-2 flex flex-1 items-center justify-center rounded-xl px-4 py-3 text-sm sm:text-base font-semibold disabled:bg-[#1A1613]/20 disabled:cursor-not-allowed text-[#FDF8ED] bg-[#E6540B] hover:bg-[#c94806] transition-colors"
                        >
                          <ShoppingCart className="w-6 h-6" />
                          Add to Cart
                        </button>
                        <button
                          onClick={() => handleWishlistToggle(product)}
                          className={`cursor-pointer flex items-center justify-center rounded-xl px-8 py-2 text-base font-semibold border-2 transition-colors ${
                            isWishlisted
                              ? "text-[#9B3A2E] border-[#9B3A2E] bg-[#9B3A2E]/10"
                              : "text-[#E6540B] border-[#E6540B] hover:text-[#9B3A2E] hover:bg-[#9B3A2E]/10 hover:border-[#9B3A2E]"
                          }`}
                        >
                          <Heart
                            className="w-6 h-6"
                            fill={isWishlisted ? "currentColor" : "none"}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })
            ) : (
              <p className="text-center text-[#1A1613]/50 col-span-full">
                No products match the selected filters.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}