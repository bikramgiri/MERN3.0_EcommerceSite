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

interface CustomerAndReviewsSectionProps {
  recentUsers: UserData[];
  recentReviews: Review[];
  totalReviews?: number;
  recentOrders?: OrderData[];
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
      <div className="rounded-xl border border-[#1A1613]/10 bg-[#FFFDF8] p-5 shadow-[0_2px_14px_-6px_rgba(26,22,19,0.06)] flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#1A1613]/10">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#E6540B]" />
                <h3 className="text-base font-bold text-[#1A1613]">
                  Recent Customers
                </h3>
              </div>
              <p className="text-xs text-[#1A1613]/60 mt-0.5">
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1613]/40 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search customer name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] text-xs text-[#1A1613] placeholder:text-[#1A1613]/40 focus:outline-none focus:border-[#E6540B]"
            />
          </div>

          {/* User List */}
          <div className="divide-y divide-[#1A1613]/10">
            {filteredUsers.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#1A1613]/50">
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
                    className="grid grid-cols-12 items-center py-3 hover:bg-[#F4EEDF]/40 px-2 rounded-lg transition-colors gap-2"
                  >
                    {/* Left: Avatar, Username & Email */}
                    <div className="col-span-5 flex items-center gap-3 min-w-0">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover border border-[#1A1613]/10 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#E6540B] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {initials(user.username)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-[#1A1613] truncate">
                          {user.username}
                        </p>
                        <p className="text-[11px] text-[#1A1613]/55 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {/* Middle: Order Count / Customer Tier Badge (Centered) */}
                    <div className="col-span-4 flex items-center justify-center">
                      {orderCount > 1 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 whitespace-nowrap">
                          <ShoppingBag className="w-3 h-3 text-emerald-600" />
                          <span>{orderCount} Orders</span>
                        </span>
                      ) : orderCount === 1 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 whitespace-nowrap">
                          <ShoppingBag className="w-3 h-3 text-amber-600" />
                          <span>1 Order</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#1A1613]/6 px-2.5 py-0.5 text-[10px] font-semibold text-[#1A1613]/55 whitespace-nowrap">
                          <Sparkles className="w-3 h-3 text-[#1A1613]/40" />
                          <span>New Lead</span>
                        </span>
                      )}
                    </div>

                    {/* Right: Date & Actions */}
                    <div className="col-span-3 flex items-center justify-end gap-2">
                      <span className="hidden sm:inline text-[11px] text-[#1A1613]/50 whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </span>
                      <a
                        href={`mailto:${user.email}`}
                        className="p-1.5 rounded-md hover:bg-[#F4EEDF] text-[#1A1613]/60 hover:text-[#E6540B] transition-colors flex-shrink-0"
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
        <div className="mt-4 pt-3 border-t border-[#1A1613]/10 flex items-center justify-between text-xs text-[#1A1613]/60">
          <span>{recentUsers.length} total customers</span>
          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Active Community
          </span>
        </div>
      </div>

      {/* Right: Customer Reviews & Ratings */}
      <div className="rounded-xl border border-[#1A1613]/10 bg-[#FFFDF8] p-5 shadow-[0_2px_14px_-6px_rgba(26,22,19,0.06)] flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#1A1613]/10">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-[#1A1613]">
                  Customer Reviews
                </h3>
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full text-xs">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  {avgRating}
                </span>
              </div>
              <p className="text-xs text-[#1A1613]/60 mt-0.5">
                {totalReviews !== undefined
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
                    : "bg-[#F4EEDF] text-[#E6540B]/70 hover:bg-[#EDE5D0]"
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
            {filteredReviews.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#1A1613]/50">
                No reviews found for this filter.
              </p>
            ) : (
              filteredReviews.slice(0, 4).map((review) => (
                <div
                  key={review.id}
                  className="p-3 rounded-lg bg-[#FDF8ED] border border-[#1A1613]/10 hover:border-[#E6540B]/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#E6540B] text-white flex items-center justify-center font-bold text-[11px]">
                        {initials(review.User?.username)}
                      </div>
                      <span className="font-bold text-xs text-[#1A1613]">
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
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <p className="mt-2 text-xs text-[#1A1613]/80 italic">
                    "{review.message || review.comment || "Great experience with Truvora!"}"
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-[#1A1613]/50">
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
        <div className="mt-4 pt-3 border-t border-[#1A1613]/10 flex items-center justify-between text-xs text-[#1A1613]/60">
          <span>{recentReviews.length} total customer ratings</span>
          <span className="font-semibold text-amber-700">★ High Customer Trust</span>
        </div>
      </div>
    </div>
  );
};

export default CustomerAndReviewsSection;
