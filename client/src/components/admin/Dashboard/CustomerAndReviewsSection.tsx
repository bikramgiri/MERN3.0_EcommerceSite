import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Star,
  Mail,
  Search,
  ExternalLink,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { UserData, Review } from "../../../types/customer/productTypes";
import { OrderData } from "../../../types/admin/datasTypes";
import { Skeleton } from "../../../global/Skeleton";

interface CustomerAndReviewsSectionProps {
  recentUsers: UserData[];
  recentReviews: Review[];
  totalReviews?: number;
  recentOrders?: OrderData[];
  loading?: boolean;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "Recently";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function initials(name?: string) {
  return name?.trim()?.[0]?.toUpperCase() || "?";
}

const CustomerAndReviewsSection: React.FC<CustomerAndReviewsSectionProps> = ({
  recentUsers,
  recentReviews,
  totalReviews,
  recentOrders,
  loading = false,
}) => {
  const [userSearch, setUserSearch] = useState("");
  const [selectedRating, setSelectedRating] = useState<number | "ALL">("ALL");

  // Calculate average rating
  const avgRating =
    recentReviews.length > 0
      ? (
          recentReviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
          recentReviews.length
        ).toFixed(1)
      : "0.0";

  // Filter users
  const filteredUsers = recentUsers.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  // Filter reviews
  const filteredReviews = recentReviews.filter((r) => {
    if (selectedRating === "ALL") return true;
    return r.rating === selectedRating;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Recent Customers Directory */}
      <div className="rounded-xl border border-[#1A1613]/10 bg-[#FFFDF8] p-5 shadow-[0_2px_14px_-6px_rgba(26,22,19,0.06)] flex flex-col justify-between dark:border-white/10 dark:bg-[#1E1A17]">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#1A1613]/10 dark:border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#E6540B]" />
                <h3 className="text-base font-bold text-[#1A1613] dark:text-[#F5EFE6]">
                  Recent Customers
                </h3>
              </div>
              <p className="text-xs text-[#1A1613]/60 dark:text-[#F5EFE6]/50 mt-0.5">
                Latest active users registered on Truvora
              </p>
            </div>

            <Link
              to="/admin-dashboard/users"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#E6540B] hover:text-[#d44c0a] transition-colors"
            >
              <span>View All</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Search Input */}
          <div className="my-3.5 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1613]/40 dark:text-[#F5EFE6]/40 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search customer name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] text-xs text-[#1A1613] placeholder:text-[#1A1613]/40 focus:outline-none focus:border-[#E6540B] dark:bg-[#14110F] dark:border-white/15 dark:text-[#F5EFE6] dark:placeholder:text-[#F5EFE6]/40"
            />
          </div>

          {/* User List */}
          <div className="divide-y divide-[#1A1613]/10 dark:divide-white/10">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={`skeleton-${idx}`}
                  className="grid grid-cols-12 items-center py-3 px-2 gap-2"
                >
                  <div className="col-span-5 flex items-center gap-3 min-w-0">
                    <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className={`h-3 ${idx % 2 ? "w-16" : "w-24"}`} />
                      <Skeleton className="h-2.5 w-full max-w-32" />
                    </div>
                  </div>
                  <div className="col-span-4 flex justify-center">
                    <Skeleton className="h-4.5 w-20 rounded-full" />
                  </div>
                  <div className="col-span-3 flex items-center justify-end gap-2">
                    <Skeleton className="hidden h-2.5 w-16 sm:block" />
                    <Skeleton className="h-6 w-6 shrink-0" />
                  </div>
                </div>
              ))
            ) : filteredUsers.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#1A1613]/50 dark:text-[#F5EFE6]/50">
                No matching users found.
              </p>
            ) : (
              filteredUsers.slice(0, 5).map((user) => {
                const orderCount =
                  user.orderCount !== undefined
                    ? user.orderCount
                    : recentOrders
                    ? recentOrders.filter(
                        (o) =>
                          o.userId === user.id ||
                          (o as any).User?.id === user.id
                      ).length
                    : 0;

                return (
                  <div
                    key={user.id}
                    className="grid grid-cols-12 items-center py-3 hover:bg-[#F4EEDF]/40 dark:hover:bg-white/5 px-2 rounded-lg transition-colors gap-2"
                  >
                    {/* Left: Avatar, Username & Email */}
                    <div className="col-span-5 flex items-center gap-3 min-w-0">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover border border-[#1A1613]/10 dark:border-white/10 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#E6540B] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {initials(user.username)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-[#1A1613] dark:text-[#F5EFE6] truncate">
                          {user.username}
                        </p>
                        <p className="text-[11px] text-[#1A1613]/55 dark:text-[#F5EFE6]/50 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {/* Middle: Order Count / Customer Tier Badge (Centered) */}
                    <div className="col-span-4 flex items-center justify-center">
                      {orderCount > 1 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 whitespace-nowrap dark:bg-emerald-500/15 dark:text-emerald-400">
                          <ShoppingBag className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>{orderCount} Orders</span>
                        </span>
                      ) : orderCount === 1 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 whitespace-nowrap dark:bg-amber-500/15 dark:text-amber-400">
                          <ShoppingBag className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>1 Order</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#1A1613]/6 px-2.5 py-0.5 text-[10px] font-semibold text-[#1A1613]/55 whitespace-nowrap dark:bg-[#2A2420] dark:text-[#F5EFE6]/50">
                          <Sparkles className="w-3 h-3 text-[#1A1613]/40 dark:text-[#F5EFE6]/50" />
                          <span>New Lead</span>
                        </span>
                      )}
                    </div>

                    {/* Right: Date & Actions */}
                    <div className="col-span-3 flex items-center justify-end gap-2">
                      <span className="hidden sm:inline text-[11px] text-[#1A1613]/50 dark:text-[#F5EFE6]/50 whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </span>
                      <a
                        href={`mailto:${user.email}`}
                        className="p-1.5 rounded-md hover:bg-[#F4EEDF] text-[#1A1613]/60 hover:text-[#E6540B] transition-colors flex-shrink-0 dark:hover:bg-[#2A2420] dark:text-[#F5EFE6]/50"
                        title="Send email"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-[#1A1613]/10 flex items-center justify-between text-xs text-[#1A1613]/60 dark:border-white/10 dark:text-[#F5EFE6]/50">
          {loading ? (
            <Skeleton className="h-3.5 w-28" />
          ) : (
            <span>{recentUsers.length} total customers</span>
          )}
          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Active Community
          </span>
        </div>
      </div>

      {/* Right: Customer Reviews & Ratings */}
      <div className="rounded-xl border border-[#1A1613]/10 bg-[#FFFDF8] p-5 shadow-[0_2px_14px_-6px_rgba(26,22,19,0.06)] flex flex-col justify-between dark:border-white/10 dark:bg-[#1E1A17]">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#1A1613]/10 dark:border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-base font-bold text-[#1A1613] dark:text-[#F5EFE6]">
                  Customer Reviews
                </h3>
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full text-xs dark:bg-amber-500/15 dark:text-amber-400">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  {loading ? (
                    <span
                      aria-hidden="true"
                      className="inline-block h-2.5 w-5 animate-pulse rounded bg-amber-700/20 dark:bg-white/10"
                    />
                  ) : (
                    avgRating
                  )}
                </span>
              </div>
              <p className="text-xs text-[#1A1613]/60 dark:text-[#F5EFE6]/50 mt-0.5">
                {loading
                  ? "Feedback and product satisfaction"
                  : totalReviews !== undefined
                  ? `${totalReviews} total reviews in store`
                  : "Feedback and product satisfaction"}
              </p>
            </div>

            <Link
              to="/admin-dashboard/reviews"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#E6540B] hover:text-[#d44c0a] transition-colors"
            >
              <span>View All</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Rating Filter Tabs */}
          <div className="my-3.5 flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
            {(["ALL", 5, 4, 3, 2, 1] as const).map((starVal) => (
              <button
                key={starVal}
                onClick={() => setSelectedRating(starVal)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                  selectedRating === starVal
                    ? "bg-[#E6540B] text-white shadow-xs"
                    : "bg-[#F4EEDF] text-[#E6540B]/70 hover:bg-[#EDE5D0] dark:bg-[#2A2420] dark:text-[#E6540B] dark:hover:bg-white/10"
                }`}
              >
                {starVal === "ALL" ? (
                  "All"
                ) : (
                  <>
                    <span>{starVal}</span>
                    <Star className="w-2.5 h-2.5 fill-current" />
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Reviews List */}
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={`skeleton-${idx}`}
                  className="p-3 rounded-lg bg-[#FDF8ED] border border-[#1A1613]/10 dark:bg-[#2A2420] dark:border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-7 w-7 rounded-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-3.5 w-20" />
                  </div>
                  <Skeleton className="mt-2.5 h-3 w-full" />
                  <Skeleton className="mt-1.5 h-3 w-2/3" />
                  <div className="mt-2.5 flex items-center justify-between">
                    <Skeleton className="h-2.5 w-24" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                </div>
              ))
            ) : filteredReviews.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#1A1613]/50 dark:text-[#F5EFE6]/50">
                No reviews found for this filter.
              </p>
            ) : (
              filteredReviews.slice(0, 4).map((review) => (
                <div
                  key={review.id}
                  className="p-3 rounded-lg bg-[#FDF8ED] border border-[#1A1613]/10 hover:border-[#E6540B]/30 transition-all dark:bg-[#2A2420] dark:border-white/10 dark:hover:border-[#E6540B]/40"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#E6540B] text-white flex items-center justify-center font-bold text-[11px]">
                        {initials(review.User?.username)}
                      </div>
                      <span className="font-bold text-xs text-[#1A1613] dark:text-[#F5EFE6]">
                        {review.User?.username || "Verified Customer"}
                      </span>
                    </div>

                    {/* Star Row */}
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= (review.rating || 5)
                              ? "fill-amber-500 text-amber-500"
                              : "text-gray-300 dark:text-white/20"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <p className="mt-2 text-xs text-[#1A1613]/80 dark:text-[#F5EFE6]/70 italic">
                    "{review.message || review.comment || "Great experience with Truvora!"}"
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-[#1A1613]/50 dark:text-[#F5EFE6]/50">
                    <span className="font-medium">
                      {review.Product?.productName || "Verified Purchase"}
                    </span>
                    <span>{formatDate(review.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-[#1A1613]/10 flex items-center justify-between text-xs text-[#1A1613]/60 dark:border-white/10 dark:text-[#F5EFE6]/50">
          {loading ? (
            <Skeleton className="h-3.5 w-32" />
          ) : (
            <span>{recentReviews.length} total customer ratings</span>
          )}
          <span className="font-semibold text-amber-700 dark:text-amber-400">★ High Customer Trust</span>
        </div>
      </div>
    </div>
  );
};

export default CustomerAndReviewsSection;
