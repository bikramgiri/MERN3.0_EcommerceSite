import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  SlidersHorizontal,
  ChevronDown,
  ShoppingCart,
  Heart,
  ArrowLeft,
  ArrowRight,
  X,
  Loader2,
  PackageSearch,
} from "lucide-react";
import { FilterPanel } from "./components/FilterPanel";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import {
  filterProducts,
  sortProducts,
  getAverageRatingNumber,
} from "../../utils/helpers";
import { FilterOptions, Product } from "../../types/productTypes";
import { fetchProducts } from "../../store/customer/productSlice";
import { fetchAllReviews } from "../../store/customer/reviewSlice";
import { AddToWishlist } from "../../store/customer/wishlistSlice";
import { toast } from "react-toastify";
import { Status } from "../../global/statuses";
import { addToCart } from "../../store/customer/cartSlice";

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating_high", label: "Highest Rated" },
  { value: "rating_low", label: "Lowest Rated" },
];

const ITEMS_PER_PAGE = 8;

const Stars = ({ rating, count }: { rating: string; count?: number }) => (
  <div className="flex items-center gap-1 flex-wrap">
    <div className="flex">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          className={`w-3.5 h-3.5 ${
            s <= Math.round(parseFloat(rating))
              ? "text-[#E6540B]"
              : "text-[#1A1613]/15"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
    {count !== undefined && (
      <>
        <span className="text-[11px] sm:text-xs font-['IBM_Plex_Mono',monospace] text-[#1A1613]/80">
          {parseFloat(rating).toFixed(1)}
        </span>
        <span className="text-[11px] sm:text-xs text-[#1A1613]/50">
          ({count})
        </span>
      </>
    )}
  </div>
);

// Windowed pagination so the bar doesn't overflow on narrow screens
function getVisiblePages(current: number, total: number) {
  const delta = 1;
  const range: (number | "...")[] = [];
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  range.push(1);
  if (left > 2) range.push("...");
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push("...");
  if (total > 1) range.push(total);

  return range;
}

export default function Products() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { product: allProducts = [], status } = useAppSelector(
    (state) => state.product,
  );
  const { review } = useAppSelector((state) => state.review);
  const { wishlist } = useAppSelector((state) => state.wishlist);

  const [filters, setFilters] = useState<FilterOptions>({});
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState("relevance");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
   
  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchAllReviews());
  }, [dispatch]);

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      setTimeout(() => {
        setCategoryFilter(cat);
      }, 100);
    }
  }, [searchParams]);

  useEffect(() => {
    const search = searchParams.get("search");
    setTimeout(() => {
      setSearchQuery(search ?? "");
    }, 100);
  }, [searchParams]);

  useEffect(() => {
    setTimeout(() => {
      setCurrentPage(1);
    }, 100);
  }, [filters, categoryFilter, sortBy, searchQuery]);

  const processedProducts = useMemo(() => {
    let result = allProducts.filter((p) =>
      p.productName.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    result = filterProducts(result, filters, review, categoryFilter);
    result = sortProducts(result, sortBy, review);
    return result;
  }, [allProducts, filters, categoryFilter, sortBy, searchQuery, review]);

  const totalPages = Math.ceil(processedProducts.length / ITEMS_PER_PAGE);
  const currentItems = processedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const activeFilterCount = [
    categoryFilter !== "all",
    filters.minPrice !== undefined,
    filters.maxPrice !== undefined,
    filters.minRating !== undefined,
  ].filter(Boolean).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    if (isSortOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSortOpen]);

  const currentSortLabel =
    SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label ?? "Sort";

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

  const handleResetAll = () => {
    setFilters({});
    setCategoryFilter("all");
    setSortBy("relevance");
    setSearchQuery("");
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("search");
    setSearchParams(newParams);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("search");
    setSearchParams(newParams);
  };

  if (status === Status.LOADING && allProducts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDF8ED] px-4">
        <div className="text-center">
          <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-[#E6540B] mx-auto mb-3" />
          <p className="text-[#1A1613]/60 font-medium text-sm sm:text-base">
            Loading products…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-10 bg-[#FDF8ED] text-[#1A1613] font-['Inter',sans-serif] antialiased">
      <div className="max-w-[1500px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-['Fraunces',serif] font-bold text-[#1A1613]">
              All Products
            </h1>
            <p className="text-sm sm:text-md text-[#1A1613]/60 mt-1">
              {processedProducts.length} product
              {processedProducts.length !== 1 ? "s" : ""} found
            </p>
          </div>

          <div className="relative w-full sm:w-auto" ref={sortRef}>
            <button
              type="button"
              onClick={() => setIsSortOpen((v) => !v)}
              className="cursor-pointer w-full sm:w-52 flex items-center justify-between gap-2 pl-4 pr-4 py-2.5 bg-[#FDF8ED] border border-[#1A1613]/15 rounded-xl text-sm text-[#1A1613] hover:bg-[#F4EEDF] transition-colors"
            >
              <span className="truncate">{currentSortLabel}</span>
              <ChevronDown
                className={`w-4 h-4 text-[#1A1613]/40 flex-shrink-0 transition-transform duration-200 ${
                  isSortOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isSortOpen && (
              <>
                {/* Mobile: bottom sheet with its own backdrop */}
                <div className="sm:hidden fixed inset-0 z-50">
                  <div
                    className="absolute inset-0 bg-[#1A1613]/50 backdrop-blur-sm"
                    onClick={() => setIsSortOpen(false)}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-[#FDF8ED] rounded-t-2xl shadow-2xl max-h-[70vh] overflow-y-auto">
                    <div className="sticky top-0 bg-[#FDF8ED] flex items-center justify-between px-5 py-4 border-b border-[#1A1613]/10">
                      <h3 className="font-['Fraunces',serif] font-semibold text-[#1A1613]">
                        Sort By
                      </h3>
                      <button
                        onClick={() => setIsSortOpen(false)}
                        className="cursor-pointer p-1 rounded-full hover:bg-[#F4EEDF]"
                      >
                        <X className="w-5 h-5 text-[#1A1613]/60" />
                      </button>
                    </div>
                    <div className="py-2 pb-[env(safe-area-inset-bottom)]">
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setSortBy(opt.value);
                            setIsSortOpen(false);
                          }}
                          className={`cursor-pointer w-full text-left px-5 py-3 text-sm font-medium transition-colors ${
                            sortBy === opt.value
                              ? "bg-[#E6540B]/10 text-[#E6540B]"
                              : "text-[#1A1613] hover:bg-[#F4EEDF]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Desktop: small anchored dropdown */}
                <div className="hidden sm:block absolute right-0 top-full mt-2 w-52 bg-[#FDF8ED] rounded-xl shadow-lg border border-[#1A1613]/10 py-1.5 z-50">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSortBy(opt.value);
                        setIsSortOpen(false);
                      }}
                      className={`cursor-pointer w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
                        sortBy === opt.value
                          ? "bg-[#E6540B]/10 text-[#E6540B]"
                          : "text-[#1A1613] hover:bg-[#F4EEDF]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 my-4 sm:mb-6 sm:mt-6">
          <button
            onClick={() => setShowMobileFilters(true)}
            className="cursor-pointer lg:hidden relative flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FDF8ED] border border-[#1A1613]/15 rounded-xl hover:bg-[#F4EEDF] text-sm font-medium transition-colors w-full sm:w-auto"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#E6540B] text-[#FDF8ED] text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-6">
              <FilterPanel
                filters={filters}
                categoryFilter={categoryFilter}
                onFilterChange={setFilters}
                onCategoryChange={setCategoryFilter}
              />
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {(activeFilterCount > 0 || searchQuery) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {searchQuery && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-[#F4EEDF] text-[#8A3B12] rounded-full text-xs font-medium">
                    Search: "{searchQuery}"
                    <button
                      onClick={handleClearSearch}
                      className="cursor-pointer hover:text-[#9B3A2E] ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {categoryFilter !== "all" && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-[#F4EEDF] text-[#8A3B12] rounded-full text-xs font-medium">
                    Category
                    <button
                      onClick={() => setCategoryFilter("all")}
                      className="cursor-pointer hover:text-[#9B3A2E] ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.minPrice !== undefined && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-[#F4EEDF] text-[#8A3B12] rounded-full text-xs font-medium">
                    Min Rs.{filters.minPrice}
                    <button
                      onClick={() =>
                        setFilters({ ...filters, minPrice: undefined })
                      }
                      className="cursor-pointer hover:text-[#9B3A2E] ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.maxPrice !== undefined && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-[#F4EEDF] text-[#8A3B12] rounded-full text-xs font-medium">
                    Max Rs.{filters.maxPrice}
                    <button
                      onClick={() =>
                        setFilters({ ...filters, maxPrice: undefined })
                      }
                      className="cursor-pointer hover:text-[#9B3A2E] ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.minRating !== undefined && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-[#F4EEDF] text-[#8A3B12] rounded-full text-xs font-medium">
                    {filters.minRating}+ Stars
                    <button
                      onClick={() =>
                        setFilters({ ...filters, minRating: undefined })
                      }
                      className="cursor-pointer hover:text-[#9B3A2E] ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={handleResetAll}
                  className="cursor-pointer px-2.5 py-1 text-[#9B3A2E] hover:text-[#7a2f24] text-xs font-medium underline"
                >
                  Clear all
                </button>
              </div>
            )}

            {currentItems.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                  {currentItems.map((product) => {
                    const isAdding = addingIds.has(product.id);

                    const isWishlisted = wishlist.some(
                      (item) => item.id === product.id,
                    );
                    const avgRating = getAverageRatingNumber(product.reviews);
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
                          toast.error(
                            "Something went wrong. Please try again.",
                          );
                        } finally {
                          setAddingIds((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete(product.id);
                            return newSet;
                          });
                        }
                      }
                    };

                    return (
                      <div
                        key={product.id}
                        className="group flex flex-col overflow-hidden rounded-xl border border-[#1A1613]/10 bg-[#FDF8ED] shadow-sm transition-all duration-200 hover:shadow-md hover:border-[#E6540B]/40"
                      >
                        <Link to={`/productdetails/${product.id}`}>
                          <div className="relative h-32 sm:h-40 md:h-48 overflow-hidden bg-[#F4EEDF] flex-shrink-0">
                            <img
                              src={product.productImage}
                              alt={product.productName}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>

                          <div className="p-3 sm:p-4 flex-1">
                            <h3 className="mb-1.5 text-md sm:text-xl font-['Fraunces',serif] font-semibold text-[#1A1613] line-clamp-2 group-hover:text-[#E6540B] transition-colors leading-tight">
                              {product.productName}
                            </h3>

                            <div className="mb-2">
                              {reviewCount > 0 ? (
                                <Stars
                                  rating={avgRating.toString()}
                                  count={reviewCount}
                                />
                              ) : (
                                <div className="flex items-center gap-1 flex-wrap">
                                  <svg
                                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1A1613]/15"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <span className="ml-1 text-[11px] sm:text-xs font-['IBM_Plex_Mono',monospace] text-[#1A1613]/80">
                                    0.0
                                  </span>
                                  <span className="ml-1 text-[11px] sm:text-xs font-['IBM_Plex_Mono',monospace] text-[#1A1613]/50">
                                    (0)
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-sm sm:text-base font-['IBM_Plex_Mono',monospace] font-bold text-[#8A3B12]">
                                Rs {product.productPrice.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </Link>

                        {/* <div className="px-3 sm:px-4 pb-3 sm:pb-4 flex gap-2">
                          <button
                            disabled={product.productStock === 0 || isAdding}
                            onClick={handleAddToCart}
                            className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold text-[#FDF8ED] bg-[#E6540B] hover:bg-[#c94806] disabled:bg-[#1A1613]/20 disabled:cursor-not-allowed transition-colors"
                          >
                            {isAdding ? (
                              <Loader2 className="animate-spin inline-block w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            ) : (
                              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            )}
                            {isAdding ? (
                              "Adding..."
                              ) : (
                                <>
                              <span className="hidden md:inline">
                              Add to Cart
                            </span>
                            <span className="md:hidden">Add</span>
                            </>
                            )}
                          </button>
                          <button
                            onClick={() => handleWishlistToggle(product)}
                            className={`cursor-pointer w-14 sm:w-20 flex-shrink-0 flex items-center justify-center rounded-lg border-2 transition-all ${
                              isWishlisted
                                ? "border-[#9B3A2E] bg-[#9B3A2E]/10 text-[#9B3A2E]"
                                : "border-[#1A1613]/15 text-[#1A1613]/40 hover:border-[#9B3A2E] hover:text-[#9B3A2E] hover:bg-[#9B3A2E]/10"
                            }`}
                          >
                            <Heart
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                              fill={isWishlisted ? "currentColor" : "none"}
                            />
                          </button>
                        </div> */}

                        <div className="px-3 sm:px-4 pb-3 sm:pb-4 flex gap-2">
                          <button
                            disabled={product.productStock === 0 || isAdding}
                            onClick={handleAddToCart}
                            className="cursor-pointer flex-1 flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold text-[#FDF8ED] bg-[#E6540B] hover:bg-[#c94806] disabled:bg-[#1A1613]/20 disabled:cursor-not-allowed transition-colors min-w-0"
                          >
                            {isAdding ? (
                              <Loader2 className="animate-spin flex-shrink-0 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            ) : (
                              <ShoppingCart className="flex-shrink-0 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            )}
                            <span className="truncate">
                              {isAdding ? (
                                "Adding..."
                              ) : (
                                <>
                                  <span className="hidden md:inline">
                                    Add to Cart
                                  </span>
                                  <span className="md:hidden">Add</span>
                                </>
                              )}
                            </span>
                          </button>

                          <button
                            onClick={() => handleWishlistToggle(product)}
                            aria-label={
                              isWishlisted
                                ? "Remove from wishlist"
                                : "Add to wishlist"
                            }
                            className={`cursor-pointer flex-shrink-0 w-10 sm:w-14 flex items-center justify-center rounded-lg border-2 transition-all ${
                              isWishlisted
                                ? "border-[#9B3A2E] bg-[#9B3A2E]/10 text-[#9B3A2E]"
                                : "border-[#1A1613]/15 text-[#1A1613]/40 hover:border-[#9B3A2E] hover:text-[#9B3A2E] hover:bg-[#9B3A2E]/10"
                            }`}
                          >
                            <Heart
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                              fill={isWishlisted ? "currentColor" : "none"}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <div className="flex items-center gap-1.5 max-w-full overflow-x-auto px-1 py-1">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className="cursor-pointer flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] text-[#1A1613] hover:bg-[#F4EEDF] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>

                      {getVisiblePages(currentPage, totalPages).map(
                        (page, idx) =>
                          page === "..." ? (
                            <span
                              key={`ellipsis-${idx}`}
                              className="w-9 shrink-0 text-center text-[#1A1613]/40 text-sm select-none"
                            >
                              …
                            </span>
                          ) : (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page as number)}
                              className={`cursor-pointer h-9 w-9 shrink-0 rounded-lg text-sm font-medium transition-colors ${
                                currentPage === page
                                  ? "bg-[#E6540B] text-[#FDF8ED] shadow-sm"
                                  : "bg-[#FDF8ED] border border-[#1A1613]/15 text-[#1A1613]/70 hover:bg-[#F4EEDF]"
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
                        className="cursor-pointer flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] text-[#1A1613] hover:bg-[#F4EEDF] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#F4EEDF] flex items-center justify-center mb-4">
                  <PackageSearch className="w-7 h-7 sm:w-9 sm:h-9 text-[#1A1613]/40" />
                </div>
                <h3 className="text-base sm:text-lg font-['Fraunces',serif] font-semibold text-[#1A1613] mb-1">
                  No products found
                </h3>
                <p className="text-[#1A1613]/60 text-sm mb-6 max-w-xs">
                  Try adjusting your filters or search term to find what you're
                  looking for.
                </p>
                <button
                  onClick={handleResetAll}
                  className="cursor-pointer px-6 py-2.5 bg-[#E6540B] hover:bg-[#c94806] text-[#FDF8ED] text-sm font-semibold rounded-lg transition-colors"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-[#1A1613]/50 backdrop-blur-sm"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute inset-x-0 bottom-0 bg-[#FDF8ED] rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <FilterPanel
              filters={filters}
              categoryFilter={categoryFilter}
              onFilterChange={setFilters}
              onCategoryChange={setCategoryFilter}
              onClose={() => setShowMobileFilters(false)}
              isMobile
            />
          </div>
        </div>
      )}
    </div>
  );
}
