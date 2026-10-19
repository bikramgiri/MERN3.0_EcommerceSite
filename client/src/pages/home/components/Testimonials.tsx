import { Star } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../../../hooks/hooks";
import { responsiveImage } from "../../../utils/helpers";
import { Status } from "../../../global/statuses";
import { Skeleton, SkeletonContainer } from "../../../global/Skeleton";

// Shows the latest real 4-5 star reviews left on products
export default function Testimonials() {
  const { product: products = [], status } = useAppSelector(
    (state) => state.product,
  );
  const [brokenAvatars, setBrokenAvatars] = useState<Set<string>>(new Set());

  const reviews = products
    .flatMap((product) =>
      (product.reviews || []).map((review) => ({ ...review, product })),
    )
    .filter((r) => Number(r.rating) >= 4 && r.message?.trim())
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 3);

  if (status === Status.LOADING && products.length === 0) {
    return <TestimonialsSkeleton />;
  }

  if (reviews.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="mb-6 text-2xl font-bold text-[#1A1613] sm:text-3xl">
        What our customers say
      </h2>

      <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
        {reviews.map((review) => {
          const name = review.User?.username || "Customer";
          const avatar = review.User?.avatar;
          const showAvatar = avatar && !brokenAvatars.has(review.id);
          return (
            <div
              key={review.id}
              className="flex flex-col rounded-xl border border-[#1A1613]/10 bg-white p-5"
            >
              <div className="flex gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill="currentColor"
                    strokeWidth={0}
                    className={
                      i < Math.round(Number(review.rating))
                        ? ""
                        : "text-[#1A1613]/15"
                    }
                  />
                ))}
              </div>

              <p className="mt-3 line-clamp-4 flex-1 text-[#1A1613]/80">
                {review.message}
              </p>

              <div className="mt-4 flex items-center gap-3 border-t border-[#1A1613]/10 pt-4">
                {showAvatar ? (
                  <img
                    {...responsiveImage(avatar, [48, 96, 144], "40px")}
                    alt={name}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setBrokenAvatars((prev) => new Set(prev).add(review.id))
                    }
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E6540B]/10 font-semibold text-[#E6540B]">
                    {name.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1A1613]">
                    {name}
                  </p>
                  <Link
                    to={`/productdetails/${review.product.id}`}
                    className="block truncate text-xs text-[#1A1613]/60 hover:text-[#E6540B]"
                  >
                    on {review.product.productName}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TestimonialsSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SkeletonContainer label="Loading reviews">
        <Skeleton className="mb-6 h-8 w-64" />
        <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#1A1613]/10 bg-white p-5"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-4 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-2/3" />
              <div className="mt-6 flex items-center gap-3 border-t border-[#1A1613]/10 pt-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </SkeletonContainer>
    </section>
  );
}
