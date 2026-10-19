import { ChevronRight, RotateCw } from "lucide-react";
import { Status } from "../../../global/statuses";
import { useAppDispatch, useAppSelector } from "../../../hooks/hooks";
import { fetchCategories } from "../../../store/customer/categorySlice";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { hideBrokenImage, responsiveImage } from "../../../utils/helpers";
import { Skeleton } from "../../../global/Skeleton";

export default function Categories() {
  const dispatch = useAppDispatch();
  const { categories, status } = useAppSelector((state) => state.category);

  // Errors are reflected in the slice status, so the rejection is not needed here
  const loadCategories = () => dispatch(fetchCategories()).catch(() => {});

  useEffect(() => {
    dispatch(fetchCategories()).catch(() => {});
  }, [dispatch]);

  const isLoading = status === Status.LOADING && categories.length === 0;
  const hasError = status === Status.ERROR && categories.length === 0;

  if (!isLoading && !hasError && categories.length === 0) return null;

  return (
    <section
      id="categories"
      className="mx-auto max-w-7xl scroll-mt-20 px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-[#1A1613] sm:text-3xl">
          Shop by category
        </h2>
        <Link
          to="/products"
          className="flex items-center gap-1 text-sm font-semibold text-[#E6540B] hover:underline"
        >
          See all <ChevronRight size={16} />
        </Link>
      </div>

      {hasError ? (
        <div className="rounded-xl border border-[#1A1613]/10 bg-white py-10 text-center">
          <p className="text-[#1A1613]/70">
            We couldn't load categories right now.
          </p>
          <button
            type="button"
            onClick={loadCategories}
            className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#1A1613]/20 px-4 py-2 text-sm font-semibold transition hover:border-[#E6540B] hover:text-[#E6540B]"
          >
            <RotateCw size={16} /> Try again
          </button>
        </div>
      ) : (
        <div
          aria-busy={isLoading}
          className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 md:grid-cols-4 lg:grid-cols-6"
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-32 shrink-0 sm:w-auto">
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="mt-3 h-4 w-2/3" />
                  <Skeleton className="mt-1.5 h-3 w-1/3" />
                </div>
              ))
            : categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.id}`}
                  className="group w-32 shrink-0 snap-start sm:w-auto"
                >
                  <div className="aspect-square overflow-hidden rounded-xl border border-[#1A1613]/10 bg-[#F4EEDF]">
                    <img
                      {...responsiveImage(
                        cat.categoryImage,
                        [200, 300, 400, 600],
                        "(min-width: 1024px) 200px, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 128px",
                      )}
                      alt={cat.categoryName}
                      loading="lazy"
                      onError={hideBrokenImage}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-3 truncate font-semibold text-[#1A1613] group-hover:text-[#E6540B]">
                    {cat.categoryName}
                  </p>
                  <p className="text-xs text-[#1A1613]/60">
                    {cat.totalProducts ?? 0}{" "}
                    {cat.totalProducts === 1 ? "item" : "items"}
                  </p>
                </Link>
              ))}
        </div>
      )}
    </section>
  );
}
