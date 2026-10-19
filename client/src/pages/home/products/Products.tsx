import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, PackageSearch, RotateCw, SlidersHorizontal, X } from "lucide-react";
import { FilterPanel, type FilterValues } from "./components/FilterPanel";
import axios from "axios";
import { useAppDispatch, useAppSelector } from "../../../hooks/hooks";
import { fetchCategories } from "../../../store/customer/categorySlice";
import { API } from "../../../http";
import type { Product } from "../../../types/customer/productTypes";
import { Skeleton, SkeletonContainer } from "../../../global/Skeleton";
import Breadcrumb from "../../../global/Breadcrumb";
import ProductCard, { ProductCardSkeleton } from "../../../components/customer/ProductCard";
import usePageTitle from "../../../hooks/usePageTitle";

const SORT_OPTIONS = [
  { value: "relevance", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "rating_high", label: "Top rated" },
  { value: "popular", label: "Most reviewed" },
];

const ITEMS_PER_PAGE = 12; // fills 2, 3 and 4 column grids evenly

interface ProductPage {
  items: Product[];
  total: number;
  page: number;
  totalPages: number;
}

const toNumber = (value: string | null) => {
  if (value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

// Page numbers with "…" gaps so the bar fits on phones
function getVisiblePages(current: number, total: number) {
  const pages: (number | "...")[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  if (left > 2) pages.push("...");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push("...");
  if (total > 1) pages.push(total);
  return pages;
}

export default function Products() {
  const dispatch = useAppDispatch();
  const { categories = [] } = useAppSelector((state) => state.category);
  // Search, filters, sorting and pages are handled by the server (GET /products)
  const [result, setResult] = useState<ProductPage | null>(null);
  // Which request the latest response (success or failure) belongs to
  const [settled, setSettled] = useState<{ key: string; failed: boolean } | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // The URL is the single source of truth, so filters survive refresh, back button and sharing
  const searchQuery = searchParams.get("search") ?? "";
  const sortBy = SORT_OPTIONS.some((o) => o.value === searchParams.get("sort"))
    ? (searchParams.get("sort") as string)
    : "relevance";
  const filters: FilterValues = {
    category: searchParams.get("category") || "all",
    minPrice: toNumber(searchParams.get("min")),
    maxPrice: toNumber(searchParams.get("max")),
    minRating: toNumber(searchParams.get("rating")),
  };

  useEffect(() => {
    dispatch(fetchCategories()).catch(() => {});
  }, [dispatch]);

  const requestedPage = Math.max(1, Math.floor(toNumber(searchParams.get("page")) || 1));
  const queryKey = JSON.stringify([
    searchQuery, filters.category, filters.minPrice, filters.maxPrice, filters.minRating, sortBy, requestedPage, retryKey,
  ]);

  useEffect(() => {
    // Abort the previous request so a slow, outdated response can't overwrite newer results
    const controller = new AbortController();
    const [search, category, minPrice, maxPrice, minRating, sort, page] = JSON.parse(queryKey);
    API.get("/products", {
      params: {
        search: search || undefined,
        category: category === "all" ? undefined : category,
        minPrice: minPrice ?? undefined,
        maxPrice: maxPrice ?? undefined,
        minRating: minRating ?? undefined,
        sort,
        page,
        limit: ITEMS_PER_PAGE,
      },
      signal: controller.signal,
    })
      .then((res) => {
        setResult({
          items: res.data.data,
          total: res.data.total,
          page: res.data.page,
          totalPages: res.data.totalPages,
        });
        setSettled({ key: queryKey, failed: false });
      })
      .catch((error) => {
        if (axios.isCancel(error)) return;
        setSettled({ key: queryKey, failed: true });
      });
    return () => controller.abort();
  }, [queryKey]);

  /** Update URL params; filter changes go back to page 1 */
  const updateParams = (changes: Record<string, string | number | undefined>, resetPage = true) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === undefined || value === "" || value === "all") next.delete(key);
      else next.set(key, String(value));
    });
    if (resetPage) next.delete("page");
    setSearchParams(next, { replace: resetPage });
  };

  const handleFilterChange = (changes: Partial<FilterValues>) => {
    const mapped: Record<string, string | number | undefined> = {};
    if ("category" in changes) mapped.category = changes.category;
    if ("minPrice" in changes) mapped.min = changes.minPrice;
    if ("maxPrice" in changes) mapped.max = changes.maxPrice;
    if ("minRating" in changes) mapped.rating = changes.minRating;
    updateParams(mapped);
  };

  const resetFilters = () => {
    // Clears filters only; the search term and sort order stay as chosen
    const next = new URLSearchParams();
    if (searchQuery) next.set("search", searchQuery);
    if (sortBy !== "relevance") next.set("sort", sortBy);
    setSearchParams(next, { replace: true });
  };

  const isFetching = settled?.key !== queryKey;
  const loadFailed = !isFetching && !!settled?.failed;
  const totalProducts = result?.total ?? 0;
  const totalPages = result?.totalPages ?? 1;
  const currentPage = result?.page ?? requestedPage;
  const currentItems = result?.items ?? [];

  const goToPage = (page: number) => {
    updateParams({ page: page === 1 ? undefined : page }, false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Product counts per category for the filter list
  const categoryOptions = categories
    .filter((c) => c.id)
    .map((c) => ({ id: c.id as string, name: c.categoryName, count: c.totalProducts ?? 0 }));
  const activeCategory = categoryOptions.find((c) => c.id === filters.category);

  const categoryPending = filters.category !== "all" && !activeCategory;
  const pageTitle = searchQuery
    ? `Results for "${searchQuery}"`
    : activeCategory?.name ?? (categoryPending ? "Products" : "All products");
  usePageTitle(searchQuery ? `Search: ${searchQuery}` : activeCategory?.name ?? "Products");

  const activeFilterCount = [
    filters.category !== "all",
    filters.minPrice !== undefined || filters.maxPrice !== undefined,
    filters.minRating !== undefined,
  ].filter(Boolean).length;

  // Mobile filter sheet: Escape closes it and the page behind doesn't scroll
  useEffect(() => {
    if (!showMobileFilters) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShowMobileFilters(false);
    document.addEventListener("keydown", onKey);
    // The sheet is hidden from lg up, so close it when the screen grows (e.g. tablet rotation)
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = (e: MediaQueryListEvent) => e.matches && setShowMobileFilters(false);
    desktop.addEventListener("change", onResize);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
      document.body.style.overflow = previousOverflow;
    };
  }, [showMobileFilters]);

  // Skeleton only for the very first load; later changes keep the current results visible
  if (!result && isFetching) {
    return <ProductsSkeleton />;
  }

  const priceLabel =
    filters.minPrice !== undefined && filters.maxPrice !== undefined
      ? `Rs ${filters.minPrice.toLocaleString()} – ${filters.maxPrice.toLocaleString()}`
      : filters.minPrice !== undefined
        ? `From Rs ${filters.minPrice.toLocaleString()}`
        : `Up to Rs ${filters.maxPrice?.toLocaleString()}`;

  const chips = [
    searchQuery && { label: `"${searchQuery}"`, clear: () => updateParams({ search: undefined }) },
    activeCategory && { label: activeCategory.name, clear: () => handleFilterChange({ category: "all" }) },
    (filters.minPrice !== undefined || filters.maxPrice !== undefined) && {
      label: priceLabel,
      clear: () => handleFilterChange({ minPrice: undefined, maxPrice: undefined }),
    },
    filters.minRating !== undefined && {
      label: `${filters.minRating}★ & up`,
      clear: () => handleFilterChange({ minRating: undefined }),
    },
  ].filter((chip): chip is { label: string; clear: () => void } => !!chip);


  return (
    <div className="bg-[#FDF8ED] pt-16 text-[#1A1613]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={
            activeCategory
              ? [{ label: "Products", href: "/products" }, { label: activeCategory.name }]
              : [{ label: "Products" }]
          }
        />

        {/* Title + sort */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{pageTitle}</h1>
            <p className="mt-1 text-sm text-[#1A1613]/60">
              {totalProducts} {totalProducts === 1 ? "product" : "products"}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowMobileFilters(true)}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#1A1613]/20 bg-white px-4 py-2.5 text-sm font-medium lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E6540B] px-1 text-xs font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <label className="flex flex-1 items-center gap-2 text-sm sm:flex-none">
              <span className="hidden text-[#1A1613]/60 sm:inline">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => updateParams({ sort: e.target.value === "relevance" ? undefined : e.target.value })}
                aria-label="Sort products"
                className="w-full cursor-pointer rounded-lg border border-[#1A1613]/20 bg-white px-3 py-2.5 text-sm focus:border-[#E6540B] focus:outline-none focus:ring-1 focus:ring-[#E6540B] sm:w-auto"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Active filters */}
        {chips.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={chip.clear}
                aria-label={`Remove filter ${chip.label}`}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[#1A1613]/15 bg-white px-3 py-1 text-sm hover:border-[#E6540B] hover:text-[#E6540B]"
              >
                {chip.label}
                <X className="h-3.5 w-3.5" />
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSearchParams({}, { replace: true })}
              className="cursor-pointer px-2 text-sm font-medium text-[#E6540B] hover:underline"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="mt-6 flex gap-8">
          <aside className="hidden w-60 shrink-0 lg:block">
            <div className="sticky top-24 rounded-xl border border-[#1A1613]/10 bg-white p-5">
              <FilterPanel
                values={filters}
                categories={categoryOptions}
                onChange={handleFilterChange}
                onReset={resetFilters}
              />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            {loadFailed && !result ? (
              <div className="rounded-xl border border-[#1A1613]/10 bg-white px-4 py-16 text-center">
                <p className="text-[#1A1613]/70">We couldn't load products right now.</p>
                <button
                  type="button"
                  onClick={() => setRetryKey((k) => k + 1)}
                  className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#1A1613]/20 px-4 py-2 text-sm font-semibold transition hover:border-[#E6540B] hover:text-[#E6540B]"
                >
                  <RotateCw className="h-4 w-4" /> Try again
                </button>
              </div>
            ) : currentItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#1A1613]/15 bg-white px-4 py-16 text-center">
                <PackageSearch className="mx-auto mb-3 h-10 w-10 text-[#1A1613]/30" />
                <h2 className="text-lg font-semibold">No products found</h2>
                <p className="mx-auto mt-1 max-w-xs text-sm text-[#1A1613]/60">
                  Try a different search or remove some filters.
                </p>
                {chips.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSearchParams({}, { replace: true })}
                    className="mt-5 cursor-pointer rounded-lg bg-[#E6540B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#c94806]"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {loadFailed && (
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                    Couldn't update the results.
                    <button
                      type="button"
                      onClick={() => setRetryKey((k) => k + 1)}
                      className="cursor-pointer font-semibold underline"
                    >
                      Try again
                    </button>
                  </div>
                )}
                <div
                  aria-busy={isFetching}
                  className={`grid grid-cols-2 gap-3 transition-opacity sm:gap-5 md:grid-cols-3 xl:grid-cols-4 ${
                    isFetching ? "opacity-60" : ""
                  }`}
                >
                  {currentItems.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                      className="flex h-10 cursor-pointer items-center gap-1 rounded-lg border border-[#1A1613]/15 bg-white px-3 text-sm hover:bg-[#F4EEDF] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Previous</span>
                    </button>
                    {getVisiblePages(currentPage, totalPages).map((page, i) =>
                      page === "..." ? (
                        <span key={`gap-${i}`} className="w-8 text-center text-[#1A1613]/40">
                          …
                        </span>
                      ) : (
                        <button
                          key={page}
                          type="button"
                          onClick={() => goToPage(page)}
                          aria-current={page === currentPage ? "page" : undefined}
                          className={`h-10 w-10 cursor-pointer rounded-lg text-sm font-medium transition-colors ${
                            page === currentPage
                              ? "bg-[#E6540B] text-white"
                              : "border border-[#1A1613]/15 bg-white hover:bg-[#F4EEDF]"
                          }`}
                        >
                          {page}
                        </button>
                      ),
                    )}
                    <button
                      type="button"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      aria-label="Next page"
                      className="flex h-10 cursor-pointer items-center gap-1 rounded-lg border border-[#1A1613]/15 bg-white px-3 text-sm hover:bg-[#F4EEDF] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile / tablet filter sheet */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-[#1A1613]/50" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-2xl bg-[#FDF8ED] shadow-2xl">
            <div className="overflow-y-auto overscroll-contain p-5">
              <FilterPanel
                values={filters}
                categories={categoryOptions}
                onChange={handleFilterChange}
                onReset={resetFilters}
                onClose={() => setShowMobileFilters(false)}
              />
            </div>
            <div className="border-t border-[#1A1613]/10 p-4">
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className="w-full cursor-pointer rounded-lg bg-[#E6540B] py-3 font-semibold text-white hover:bg-[#c94806]"
              >
                {isFetching
                  ? "Updating..."
                  : `Show ${totalProducts} ${totalProducts === 1 ? "product" : "products"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductsSkeleton() {
  return (
    <div className="bg-[#FDF8ED] pt-16">
      <SkeletonContainer label="Loading products" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="mb-4 h-4 w-32" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 sm:h-9" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg sm:w-56" />
        </div>
        <div className="mt-6 flex gap-8">
          <aside className="hidden w-60 shrink-0 space-y-3 rounded-xl border border-[#1A1613]/10 bg-white p-5 lg:block">
            <Skeleton className="h-6 w-20" />
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </aside>
          <div className="grid min-w-0 flex-1 grid-cols-2 content-start gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </SkeletonContainer>
    </div>
  );
}
