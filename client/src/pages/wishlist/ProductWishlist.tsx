import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Loader2,
  ShoppingCart,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import {
  fetchUserWishlist,
  removeWishlistItem,
} from "../../store/customer/wishlistSlice";
import Breadcrumb from "../../global/components/Breadcrumb";
import { getAverageRatingNumber } from "../../utils/helpers";
import { toast } from "react-toastify";
import { addToCart } from "../../store/customer/cartSlice";

const ProductWishlist = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { wishlist } = useAppSelector((state) => state.wishlist);
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    dispatch(fetchUserWishlist());
  }, [dispatch]);

  const handleRemove = (productId: string) => {
    dispatch(removeWishlistItem(productId));
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const totalPages = Math.ceil(wishlist.length / itemsPerPage);
  const currentItems = wishlist.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // if (status === Status.LOADING) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FDF8ED] to-[#FAF3E4]">
  //       <div className="text-center">
  //         <Loader2 className="w-16 h-16 animate-spin text-[#E6540B] mx-auto mb-4" />
  //         <p className="text-xl text-gray-600">Loading wishlist.....</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <section className="py-8 md:py-12 bg-[#FDF8ED] pb-16 mt-9 md:pt-18 font-['Inter',sans-serif] text-[#1A1613]">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-1 mb-1 ">
          <Breadcrumb items={[{ label: "Wishlist" }]} />
        </div>
        <h1 className="mb-6 text-3xl md:text-3xl font-['Fraunces',serif] font-semibold text-[#1A1613]">
          My Wishlist
        </h1>

        {wishlist.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-20 h-20 mx-auto text-[#E6540B] mb-6" />
            <h2 className="text-2xl font-['Fraunces',serif] font-medium text-[#1A1613] mb-3">
              Your wishlist is empty
            </h2>
            <p className="text-[#1A1613]/60 mb-8">
              Start adding products you love!
            </p>
            <Link
              to="/"
              className="inline-block bg-[#E6540B] text-[#FDF8ED] px-8 py-3 rounded-lg font-medium hover:bg-[#c94806] transition"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {currentItems.map((product) => {
              const isAdding = addingIds.has(product.id);

              const averageRating = getAverageRatingNumber(product.reviews);

              const reviewCount = product.reviews?.length || 0;

              const handleAddToCart = async () => {
                if (!localStorage.getItem("token")) {
                  navigate("/login");
                  return;
                }
                if (product.id && product) {
                  setAddingIds((prev) => new Set(prev).add(product.id));
                  try {
                    await dispatch(addToCart(product.id));
                    toast.success("Product added to cart!");
                  } catch {
                    toast.error("Something went wrong. Please try again.");
                  } finally {
                    setAddingIds((prev) => {
                      const next = new Set(prev);
                      next.delete(product.id);
                      return next;
                    });
                  }
                }
              };
              return (
                <div
                  key={product.id}
                  className="group overflow-hidden rounded-xl border border-[#1A1613]/10 bg-[#FDF8ED] shadow-sm transition-all hover:shadow-lg hover:border-[#E6540B]/40"
                >
                  <Link to={`/productdetails/${product.id}`} key={product.id}>
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

                      <div className="flex items-center gap-1 mb-2">
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

                      <div className="flex items-center gap-2">
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
                      disabled={product.productStock === 0 || isAdding}
                      className="cursor-pointer gap-2 flex flex-1 items-center justify-center rounded-xl px-4 py-3 text-sm sm:text-base font-semibold disabled:bg-[#1A1613]/20 disabled:cursor-not-allowed text-[#FDF8ED] bg-[#E6540B] hover:bg-[#c94806] transition-colors"
                    >
                      {isAdding ? (
                        <Loader2 className="animate-spin inline-block w-5 h-5 mr-2" />
                      ) : (
                        <ShoppingCart className="w-6 h-6" />
                      )}
                      {isAdding ? "Adding..." : "Add to Cart"}
                    </button>
                    <button
                      onClick={() => handleRemove(product.id)}
                      className="cursor-pointer flex items-center justify-center rounded-xl px-8 py-3 text-base font-semibold border-2 border-[#9B3A2E] text-[#9B3A2E] hover:bg-[#9B3A2E]/10 transition-colors"
                      title="Remove from favorites"
                    >
                      <Heart className="w-6 h-6 fill-current" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex justify-center">
            <nav className="flex items-center gap-2 rounded-lg border border-[#1A1613]/10 bg-[#FDF8ED] p-2 shadow-sm">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-md text-[#E6540B] hover:bg-[#F4EEDF] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-6 w-6 text-[#1A1613]" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`cursor-pointer h-10 w-10 rounded-md text-sm font-medium transition ${
                      currentPage === page
                        ? "bg-[#E6540B] text-[#FDF8ED]"
                        : "text-[#E6540B] hover:bg-[#F4EEDF]"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-md text-[#E6540B] hover:bg-[#F4EEDF] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowRight className="h-6 w-6 text-[#1A1613]" />
              </button>
            </nav>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductWishlist;
