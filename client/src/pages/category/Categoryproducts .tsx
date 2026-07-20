import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Loader2,
  PackageSearch,
  ShoppingCart,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { fetchCategories } from "../../store/customer/categorySlice";
import { fetchProductsByCategory } from "../../store/customer/productSlice";
import { AddToWishlist } from "../../store/customer/wishlistSlice";
import { Status } from "../../global/statuses";
import Breadcrumb from "../../global/components/Breadcrumb";
import type { Product } from "../../types/productTypes";
import { toast } from "react-toastify";

const ITEMS_PER_PAGE = 8;

type SortOrder = "featured" | "price-asc" | "price-desc";

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

export default function CategoryProducts() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const dispatch = useAppDispatch();

  const { categories } = useAppSelector((state) => state.category);
  const { product: products = [], status } = useAppSelector(
    (state) => state.product,
  );
  const { wishlist } = useAppSelector((state) => state.wishlist);

  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<SortOrder>("featured");

  // Sidebar list is fetched once; keep it around across category switches
  useEffect(() => {
    if (!categories || categories.length === 0) {
      dispatch(fetchCategories());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    if (categoryId) {
      dispatch(fetchProductsByCategory(categoryId));
     setTimeout(() => {
       setCurrentPage(1);
      setSortOrder("featured");
     }, 0);
    }
  }, [dispatch, categoryId]);

  const activeCategory = categories.find((cat) => cat.id === categoryId);

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

  const sortedProducts = useMemo(() => {
    if (sortOrder === "featured") return products;
    const copy = [...products];
    copy.sort((a, b) =>
      sortOrder === "price-asc"
        ? a.productPrice - b.productPrice
        : b.productPrice - a.productPrice,
    );
    return copy;
  }, [products, sortOrder]);

  const handleSortChange = (value: SortOrder) => {
    setSortOrder(value);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);
  const currentItems = sortedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const isLoadingProducts = status === Status.LOADING;
  const hasNoProducts = status === Status.ERROR || (!isLoadingProducts && products.length === 0);

  return (
    <section className="min-h-screen bg-[#FDF8ED] pb-16 pt-9 font-['Inter',sans-serif] text-[#1A1613] md:pt-18">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <div className="mb-1 mt-1">
          <Breadcrumb
            items={[
              { label: "Categories" },
              { label: activeCategory?.categoryName || "Category" },
            ]}
          />
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2 md:hidden">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.id}`}
              className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                cat.id === categoryId
                  ? "border-[#E6540B] bg-[#E6540B] text-[#FDF8ED]"
                  : "border-[#1A1613]/15 bg-[#FDF8ED] text-[#1A1613]/70 hover:border-[#E6540B]/40"
              }`}
            >
              {cat.categoryName}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-8 md:flex-row">
          <aside className="hidden w-64 shrink-0 md:block">
            <div className="sticky top-24 rounded-xl border border-[#1A1613]/10 bg-[#F4EEDF] p-4">
              <p className="mb-3 font-['IBM_Plex_Mono',monospace] text-md uppercase tracking-[0.2em] text-[#1A1613]/50">
                Categories
              </p>
              <nav className="flex flex-col gap-1">
                {categories.map((cat) => {
                  const isActive = cat.id === categoryId;
                  return (
                    <Link
                      key={cat.id}
                      to={`/category/${cat.id}`}
                      className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-[#E6540B] text-[#FDF8ED]"
                          : "text-[#1A1613]/75 hover:bg-[#FDF8ED] hover:text-[#E6540B]"
                      }`}
                    >
                      <span>{cat.categoryName}</span>
                      <span
                        className={`font-['IBM_Plex_Mono',monospace] text-xs ${
                          isActive ? "text-[#FDF8ED]/80" : "text-[#1A1613]/40"
                        }`}
                      >
                        {cat.totalProducts ?? 0}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          <div className="flex-1">
            {isLoadingProducts ? (
              <div className="flex min-h-[50vh] items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#E6540B]" />
                  <p className="text-[#1A1613]/60">Loading products...</p>
                </div>
              </div>
            ) : hasNoProducts ? (
              <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border border-dashed border-[#1A1613]/15 bg-[#F4EEDF]/40 py-16 text-center">
                <PackageSearch className="mb-5 h-16 w-16 text-[#E6540B]" />
                <h2 className="mb-2 font-['Fraunces',serif] text-xl font-medium text-[#1A1613]">
                  No products here yet
                </h2>
                <p className="max-w-sm text-sm text-[#1A1613]/60">
                  We don't have any products listed under{" "}
                  {activeCategory?.categoryName || "this category"} right now.
                  Try another category from the list.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="font-['IBM_Plex_Mono',monospace] text-sm uppercase tracking-[0.25em] text-[#E6540B]">
                      Shop by category
                    </p>
                    <h1 className=" font-['Fraunces',serif] text-3xl font-semibold text-[#1A1613] md:text-4xl">
                      {activeCategory?.categoryName || "Products"}
                    </h1>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <label
                      htmlFor="sort-by"
                      className="whitespace-nowrap text-sm text-[#1A1613]/60"
                    >
                      Sort by:
                    </label>
                    <select
                      id="sort-by"
                      value={sortOrder}
                      onChange={(e) =>
                        handleSortChange(e.target.value as SortOrder)
                      }
                      className="cursor-pointer rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] px-3 py-2 text-sm font-medium text-[#1A1613] outline-none transition-colors hover:border-[#E6540B]/40 focus:border-[#E6540B] focus:ring-2 focus:ring-[#E6540B]/20"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {currentItems.map((product) => {
                    const isWishlisted = wishlist.some(
                      (item) => item.id === product.id,
                    );
                    const averageRating =
                      product.reviews && product.reviews.length > 0
                        ? (
                            product.reviews.reduce(
                              (acc, r) => acc + Number(r.rating || 0),
                              0,
                            ) / product.reviews.length
                          ).toFixed(1)
                        : "0.0";
                    const reviewCount = product.reviews?.length || 0;

                    return (
                      <div
                        key={product.id}
                        className="group overflow-hidden rounded-xl border border-[#1A1613]/10 bg-[#FDF8ED] shadow-sm transition-all hover:shadow-lg hover:border-[#E6540B]/40"
                      >
                        <Link to={`/productdetails/${product.id}`}>
                          <div className="relative h-56 overflow-hidden bg-[#F4EEDF]">
                            <img
                              src={product.productImage}
                              alt={product.productName}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {product.productDiscount ? (
                              <span className="absolute left-3 top-3 rounded-full bg-[#9B3A2E] px-3 py-1 text-xs font-bold text-[#FDF8ED]">
                                {product.productDiscount}% OFF
                              </span>
                            ) : null}
                          </div>

                          <div className="p-5">
                            <h3 className="mb-2 text-lg font-['Fraunces',serif] font-semibold text-[#1A1613] line-clamp-2 group-hover:text-[#E6540B]">
                              {product.productName}
                            </h3>

                            <div className="mb-2 flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`h-4 w-4 ${
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
                            </div>

                            <span className="font-['IBM_Plex_Mono',monospace] text-xl font-bold text-[#8A3B12]">
                              Rs {product.productPrice}
                            </span>
                          </div>
                        </Link>

                        <div className="flex justify-between gap-2 border-t border-[#1A1613]/10 p-5">
                          <button
                            type="button"
                            disabled={product.productStock === 0}
                            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#E6540B] px-4 py-3 text-sm font-semibold text-[#FDF8ED] transition-colors hover:bg-[#c94806] disabled:cursor-not-allowed disabled:bg-[#1A1613]/20 sm:text-base"
                          >
                            <ShoppingCart className="h-5 w-5" />
                            Add to cart
                          </button>
                          <button
                            onClick={() => handleWishlistToggle(product)}
                            className={`flex shrink-0 cursor-pointer items-center justify-center rounded-xl border-2 px-4 py-3 font-semibold transition-colors ${
                              isWishlisted
                                ? "border-[#9B3A2E] bg-[#9B3A2E]/10 text-[#9B3A2E]"
                                : "border-[#E6540B] text-[#E6540B] hover:border-[#9B3A2E] hover:bg-[#9B3A2E]/10 hover:text-[#9B3A2E]"
                            }`}
                            title="Add to wishlist"
                          >
                            <Heart
                              className="h-5 w-5"
                              fill={isWishlisted ? "currentColor" : "none"}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="mt-10 flex justify-center">
                    <nav className="flex items-center gap-2 rounded-lg border border-[#1A1613]/10 bg-[#FDF8ED] p-2 shadow-sm">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-[#E6540B] hover:bg-[#F4EEDF] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowLeft className="h-5 w-5 text-[#1A1613]" />
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`h-10 w-10 cursor-pointer rounded-md text-sm font-medium transition ${
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
                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-[#E6540B] hover:bg-[#F4EEDF] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowRight className="h-5 w-5 text-[#1A1613]" />
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
