import { ChevronRight, RotateCw } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Status } from "../../../global/statuses";
import { fetchPopularProducts } from "../../../store/customer/productSlice";
import { useAppDispatch, useAppSelector } from "../../../hooks/hooks";
import ProductCard, { ProductCardSkeleton } from "../../../components/customer/ProductCard";

export default function Bestsellers() {
  const dispatch = useAppDispatch();
  const { product: products = [], status } = useAppSelector((state) => state.product);

  // Errors are reflected in the slice status, so the rejection is not needed here
  const loadProducts = () => dispatch(fetchPopularProducts()).catch(() => {});

  useEffect(() => {
    dispatch(fetchPopularProducts()).catch(() => {});
  }, [dispatch]);

  const isLoading = status === Status.LOADING && products.length === 0;
  const hasError = status === Status.ERROR && products.length === 0;

  // Already ranked by the server (weighted rating, so a single 5-star review can't jump to the top)
  const popular = products.slice(0, 8);

  if (!isLoading && !hasError && popular.length === 0) return null;

  return (
    <section id="popular-products" className="bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-[#1A1613] sm:text-3xl">Popular products</h2>
          <Link
            to="/products"
            className="flex items-center gap-1 text-sm font-semibold text-[#E6540B] hover:underline"
          >
            View all <ChevronRight size={16} />
          </Link>
        </div>

        {hasError ? (
          <div className="rounded-xl border border-[#1A1613]/10 py-12 text-center">
            <p className="text-[#1A1613]/70">We couldn't load products right now.</p>
            <button
              type="button"
              onClick={loadProducts}
              className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#1A1613]/20 px-4 py-2 text-sm font-semibold transition hover:border-[#E6540B] hover:text-[#E6540B]"
            >
              <RotateCw size={16} /> Try again
            </button>
          </div>
        ) : (
          <div
            aria-busy={isLoading}
            className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4"
          >
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : popular.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </div>
    </section>
  );
}
