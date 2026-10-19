import { useState, useEffect, useRef, type FormEvent, type KeyboardEvent } from "react";
import { LayoutGrid, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../../hooks/hooks";
import { fetchProducts } from "../../../../store/customer/productSlice";
import { fetchCategories } from "../../../../store/customer/categorySlice";
import { hideBrokenImage, matchesSearch, responsiveImage } from "../../../../utils/helpers";
import type { Product } from "../../../../types/customer/productTypes";
import type { Category } from "../../../../types/customer/categoriesTypes";

interface SearchProductsProps {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void; // e.g. close the mobile menu after navigating
}

const MAX_CATEGORIES = 3;
const MAX_PRODUCTS = 6;

// One list for keyboard navigation across both groups
type Option =
  | { type: "category"; category: Category }
  | { type: "product"; product: Product };

const SearchProducts = ({
  variant = "desktop",
  onNavigate,
}: SearchProductsProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { product: allProducts = [] } = useAppSelector((state) => state.product);
  const { categories = [] } = useAppSelector((state) => state.category);

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  // Highlighted option for keyboard navigation (-1 = none)
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = `search-suggestions-${variant}`;

  // Make sure there's something to search through, without refetching every render
  useEffect(() => {
    if (allProducts.length === 0) dispatch(fetchProducts()).catch(() => {});
  }, [dispatch, allProducts.length]);

  useEffect(() => {
    if (categories.length === 0) dispatch(fetchCategories()).catch(() => {});
  }, [dispatch, categories.length]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const trimmedQuery = query.trim();
  const q = trimmedQuery.toLowerCase();

  const categoryMatches = q
    ? categories.filter((c) => c.id && c.categoryName.toLowerCase().includes(q)).slice(0, MAX_CATEGORIES)
    : [];

  // Products whose own name matches come before ones that only match by category
  const productMatches = q
    ? allProducts
        .filter((p) => matchesSearch(p, q))
        .sort(
          (a, b) =>
            Number(b.productName.toLowerCase().includes(q)) -
            Number(a.productName.toLowerCase().includes(q)),
        )
    : [];

  const options: Option[] = [
    ...categoryMatches.map((category) => ({ type: "category" as const, category })),
    ...productMatches.slice(0, MAX_PRODUCTS).map((product) => ({ type: "product" as const, product })),
  ];

  const finish = () => {
    setQuery("");
    setIsOpen(false);
    setActiveIndex(-1);
    onNavigate?.();
  };

  const goToResults = () => {
    if (!trimmedQuery) return;
    navigate(`/products?search=${encodeURIComponent(trimmedQuery)}`);
    setIsOpen(false);
    setActiveIndex(-1);
    onNavigate?.();
  };

  const openOption = (option: Option) => {
    if (option.type === "category") {
      navigate(`/products?category=${option.category.id}`);
    } else {
      navigate(`/productdetails/${option.product.id}`);
    }
    finish();
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const highlighted = options[activeIndex];
    if (isOpen && highlighted) openOption(highlighted);
    else goToResults();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && options.length > 0) {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex((i) => (i + 1) % options.length);
    } else if (e.key === "ArrowUp" && options.length > 0) {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const wrapperClass =
    variant === "mobile"
      ? "relative w-full"
      : "hidden md:flex flex-1 items-center justify-center max-w-md";

  const inputClass =
    variant === "mobile"
      ? "w-full pl-11 pr-5 py-3 rounded-full border border-[#1A1613]/20 bg-white focus:outline-none focus:ring-1 focus:ring-[#E6540B] text-[#1A1613] placeholder:text-[#1A1613]/50"
      : "w-full pl-10 pr-4 py-2.5 rounded-full border border-[#1A1613]/30 focus:outline-none focus:ring-1 focus:ring-[#E6540B] focus:border-transparent text-[#1A1613] placeholder:text-[#1A1613]/60 text-sm shadow-sm";

  const iconClass =
    variant === "mobile"
      ? "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#1A1613]/50"
      : "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#1A1613]/60";

  const showDropdown = isOpen && !!trimmedQuery;
  const groupLabel = "px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-[#1A1613]/50";
  const optionClass = (index: number) =>
    `cursor-pointer w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
      index === activeIndex ? "bg-[#F4EEDF]" : "hover:bg-[#F4EEDF]"
    }`;

  return (
    <div className={wrapperClass} ref={containerRef}>
      <form role="search" onSubmit={handleSubmit} className="relative w-full">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => trimmedQuery && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search products or categories..."
          aria-label="Search products or categories"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          enterKeyHint="search"
          autoComplete="off"
          className={`${inputClass} [&::-webkit-search-cancel-button]:hidden`}
        />
        <Search className={iconClass} />

        {showDropdown && (
          <div
            id={listId}
            role="listbox"
            className="absolute left-0 right-0 top-full mt-2 max-h-[70vh] overflow-y-auto bg-[#FDF8ED] border border-[#1A1613]/10 rounded-xl shadow-lg z-50"
          >
            {options.length === 0 ? (
              <p className="px-4 py-3 text-sm text-[#1A1613]/50">
                No products or categories found for "{trimmedQuery}"
              </p>
            ) : (
              <>
                {categoryMatches.length > 0 && (
                  <div role="group" aria-label="Categories">
                    <p className={groupLabel}>Categories</p>
                    {categoryMatches.map((category, index) => (
                      <button
                        key={category.id}
                        id={`${listId}-${index}`}
                        type="button"
                        role="option"
                        aria-selected={index === activeIndex}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => openOption({ type: "category", category })}
                        className={optionClass(index)}
                      >
                        {category.categoryImage ? (
                          <img
                            {...responsiveImage(category.categoryImage, [40, 80, 120], "36px")}
                            alt=""
                            onError={hideBrokenImage}
                            className="h-9 w-9 shrink-0 rounded-lg bg-[#F4EEDF] object-cover"
                          />
                        ) : (
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E6540B]/10 text-[#E6540B]">
                            <LayoutGrid className="h-4 w-4" />
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-[#1A1613]">
                            {category.categoryName}
                          </span>
                          <span className="block text-xs text-[#1A1613]/60">
                            Category · {category.totalProducts ?? 0}{" "}
                            {category.totalProducts === 1 ? "item" : "items"}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {productMatches.length > 0 && (
                  <div
                    role="group"
                    aria-label="Products"
                    className={categoryMatches.length > 0 ? "border-t border-[#1A1613]/10" : ""}
                  >
                    <p className={groupLabel}>Products</p>
                    {productMatches.slice(0, MAX_PRODUCTS).map((product, i) => {
                      const index = categoryMatches.length + i;
                      return (
                        <button
                          key={product.id}
                          id={`${listId}-${index}`}
                          type="button"
                          role="option"
                          aria-selected={index === activeIndex}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => openOption({ type: "product", product })}
                          className={optionClass(index)}
                        >
                          <img
                            {...responsiveImage(product.productImage, [40, 80, 120], "36px")}
                            alt=""
                            onError={hideBrokenImage}
                            className="h-9 w-9 shrink-0 rounded-lg bg-[#F4EEDF] object-cover"
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-[#1A1613]">
                              {product.productName}
                            </span>
                            <span className="block truncate text-xs text-[#1A1613]/60">
                              <span className="text-[#8A3B12]">
                                Rs {product.productPrice?.toLocaleString()}
                              </span>
                              {product.category?.categoryName && <> · {product.category.categoryName}</>}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {productMatches.length > 0 && (
                  <button
                    type="submit"
                    className="cursor-pointer w-full border-t border-[#1A1613]/10 px-4 py-2.5 text-left text-sm font-medium text-[#E6540B] hover:bg-[#F4EEDF]"
                  >
                    See all {productMatches.length} product{productMatches.length === 1 ? "" : "s"} for "{trimmedQuery}"
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchProducts;
