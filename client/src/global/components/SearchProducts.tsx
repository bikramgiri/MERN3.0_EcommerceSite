import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { fetchProducts } from "../../store/customer/productSlice";

interface SearchProductsProps {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void; // e.g. close the mobile menu after navigating
}

const SearchProducts = ({ variant = "desktop", onNavigate }: SearchProductsProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { product: allProducts = [] } = useAppSelector((state) => state.product);

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Make sure we have products to search through, without refetching every render
  useEffect(() => {
    if (allProducts.length === 0) {
      dispatch(fetchProducts());
    }
  }, [dispatch, allProducts.length]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const trimmedQuery = query.trim();

  const suggestions = trimmedQuery
    ? allProducts.filter((p) =>
        p.productName.toLowerCase().includes(trimmedQuery.toLowerCase())
      )
    : [];

  const goToProducts = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    navigate(`/products?search=${encodeURIComponent(trimmed)}`);
    setIsOpen(false);
    onNavigate?.();
  };

  const handleSuggestionClick = (name: string) => {
    setQuery(name);
    goToProducts(name);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      goToProducts(query);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const wrapperClass =
    variant === "mobile"
      ? "relative w-full"
      : "hidden md:flex flex-1 items-center justify-center max-w-md";

  const inputClass =
    variant === "mobile"
      ? "w-full pl-11 pr-5 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#E6540B] text-gray-900 placeholder-gray-500"
      : "w-full pl-10 pr-4 py-2.5 rounded-full border border-[#1A1613]/30 focus:outline-none focus:ring-1 focus:ring-[#E6540B] focus:border-transparent text-[#1A1613] placeholder:text-[#1A1613]/60 text-sm shadow-sm";

  const iconClass =
    variant === "mobile"
      ? "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500"
      : "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#1A1613]/60";

  return (
    <div className={wrapperClass} ref={containerRef}>
      <div className="relative w-full">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => trimmedQuery && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search products..."
          className={inputClass}
        />
        <Search className={iconClass} />

        {isOpen && trimmedQuery && (
          <div className="absolute left-0 right-0 top-full mt-2 max-h-80 overflow-y-auto bg-[#FDF8ED] border border-[#1A1613]/10 rounded-xl shadow-lg z-50">
            {suggestions.length > 0 ? (
              suggestions.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleSuggestionClick(product.productName)}
                  className="cursor-pointer w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#F4EEDF] transition-colors"
                >
                  <img
                    src={product.productImage}
                    alt={product.productName}
                    className="w-9 h-9 rounded-lg object-cover flex-shrink-0 bg-[#F4EEDF]"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1A1613] truncate">
                      {product.productName}
                    </p>
                    <p className="text-xs text-[#8A3B12] font-['IBM_Plex_Mono',monospace]">
                      Rs {product.productPrice?.toLocaleString()}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <p className="px-4 py-3 text-sm text-[#1A1613]/50">
                No products found for "{query}"
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchProducts;