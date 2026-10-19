import { useEffect, useState } from "react";
import { Heart, RotateCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../hooks/hooks";
import { fetchUserWishlist } from "../../../store/customer/wishlistSlice";
import Breadcrumb from "../../../global/Breadcrumb";
import { Status } from "../../../global/statuses";
import { SkeletonContainer } from "../../../global/Skeleton";
import ProductCard, { ProductCardSkeleton } from "../../../components/customer/ProductCard";
import usePageTitle from "../../../hooks/usePageTitle";

const ITEMS_PER_PAGE = 12; // fills 2, 3 and 4 column grids evenly

const grid = "grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4";

const ProductWishlist = () => {
  usePageTitle("My wishlist");
  const dispatch = useAppDispatch();
  const { wishlist, status } = useAppSelector((state) => state.wishlist);
  const [page, setPage] = useState(1);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = () => {
    dispatch(fetchUserWishlist())
      .then(() => setLoadFailed(false))
      .catch(() => setLoadFailed(true));
  };

  useEffect(() => {
    dispatch(fetchUserWishlist())
      .then(() => setLoadFailed(false))
      .catch(() => setLoadFailed(true));
  }, [dispatch]);

  // IDLE means the first fetch hasn't started yet
  const isInitialLoad =
    wishlist.length === 0 && !loadFailed && (status === Status.LOADING || status === Status.IDLE);

  const totalPages = Math.max(1, Math.ceil(wishlist.length / ITEMS_PER_PAGE));
  // Removing the last item on the last page moves back a page instead of showing an empty grid
  const currentPage = Math.min(page, totalPages);
  const items = wishlist.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const goToPage = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-[#FDF8ED] pt-16 text-[#1A1613]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Wishlist" }]} />

        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">My wishlist</h1>
            {wishlist.length > 0 && (
              <p className="mt-1 text-sm text-[#1A1613]/60">
                {wishlist.length} saved {wishlist.length === 1 ? "item" : "items"} · move them to your cart or tap the heart to remove
              </p>
            )}
          </div>
          {wishlist.length > 0 && (
            <Link to="/products" className="text-sm font-semibold text-[#E6540B] hover:underline">
              Continue shopping
            </Link>
          )}
        </div>

        {isInitialLoad ? (
          <SkeletonContainer label="Loading wishlist" className={grid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </SkeletonContainer>
        ) : loadFailed && wishlist.length === 0 ? (
          <div className="rounded-xl border border-[#1A1613]/10 bg-white px-4 py-16 text-center">
            <p className="text-[#1A1613]/70">We couldn't load your wishlist right now.</p>
            <button
              type="button"
              onClick={load}
              className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#1A1613]/20 px-4 py-2 text-sm font-semibold hover:border-[#E6540B] hover:text-[#E6540B]"
            >
              <RotateCw className="h-4 w-4" /> Try again
            </button>
          </div>
        ) : wishlist.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#1A1613]/15 bg-white px-4 py-16 text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E6540B]/10">
              <Heart className="h-7 w-7 text-[#E6540B]" />
            </span>
            <h2 className="text-xl font-semibold">Your wishlist is empty</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-[#1A1613]/60">
              Tap the heart on any product to save it here. We'll also let you know when a saved
              item that sold out is back in stock.
            </p>
            <Link
              to="/products"
              className="mt-6 inline-flex rounded-lg bg-[#E6540B] px-6 py-3 font-semibold text-white hover:bg-[#c94806]"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <>
            <div className={grid}>
              {items.map((product) => (
                <ProductCard key={product.id} product={product} moveToCart />
              ))}
            </div>

            {totalPages > 1 && (
              <nav aria-label="Wishlist pages" className="mt-10 flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-10 cursor-pointer rounded-lg border border-[#1A1613]/15 bg-white px-3 text-sm hover:bg-[#F4EEDF] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => goToPage(n)}
                    aria-current={n === currentPage ? "page" : undefined}
                    className={`h-10 w-10 cursor-pointer rounded-lg text-sm font-medium ${
                      n === currentPage ? "bg-[#E6540B] text-white" : "border border-[#1A1613]/15 bg-white hover:bg-[#F4EEDF]"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-10 cursor-pointer rounded-lg border border-[#1A1613]/15 bg-white px-3 text-sm hover:bg-[#F4EEDF] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductWishlist;

