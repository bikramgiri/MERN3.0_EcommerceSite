import React from "react";
import { Sparkles } from "lucide-react";

interface CategoryStatsCardsProps {
  totalCategories: number;
  totalAssignedProducts: number;
  emptyCategoriesCount: number;
  loading: boolean;
}

const CategoryStatsCards: React.FC<CategoryStatsCardsProps> = ({
  totalCategories,
  totalAssignedProducts,
  emptyCategoriesCount,
  loading,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Stat 1: Total Categories */}
      <div className="rounded-2xl border border-[#1A1613]/8 bg-[#FFFDF8] p-4.5 shadow-[0_2px_12px_-4px_rgba(26,22,19,0.04)]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A1613]/55">
            Total Categories
          </span>
          <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
            Active Catalog
          </span>
        </div>
        <h4 className="mt-2 text-2xl font-extrabold tracking-tight text-[#1A1613]">
          {loading ? "..." : totalCategories}
        </h4>
        <p className="mt-1 text-xs text-[#1A1613]/60">
          Available departments in store
        </p>
      </div>

      {/* Stat 2: Assigned Products */}
      <div className="rounded-2xl border border-[#1A1613]/8 bg-[#FFFDF8] p-4.5 shadow-[0_2px_12px_-4px_rgba(26,22,19,0.04)]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A1613]/55">
            Assigned Products
          </span>
          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            In Stock
          </span>
        </div>
        <h4 className="mt-2 text-2xl font-extrabold tracking-tight text-[#1A1613]">
          {loading ? "..." : totalAssignedProducts}
        </h4>
        <p className="mt-1 text-xs text-[#1A1613]/60">
          Products classified under collections
        </p>
      </div>

      {/* Stat 3: Empty Categories */}
      <div className="rounded-2xl border border-[#1A1613]/8 bg-[#FFFDF8] p-4.5 shadow-[0_2px_12px_-4px_rgba(26,22,19,0.04)]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A1613]/55">
            Empty Collections
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              emptyCategoriesCount > 0
                ? "bg-rose-500/10 text-rose-700"
                : "bg-emerald-500/10 text-emerald-700"
            }`}
          >
            {emptyCategoriesCount > 0 ? "Needs Items" : "Balanced"}
          </span>
        </div>
        <h4 className="mt-2 text-2xl font-extrabold tracking-tight text-[#1A1613]">
          {loading ? "..." : emptyCategoriesCount}
        </h4>
        <p className="mt-1 text-xs text-[#1A1613]/60">
          {emptyCategoriesCount === 0
            ? "All categories have items"
            : "Categories without any products"}
        </p>
      </div>

      {/* Stat 4: Catalog Status */}
      <div className="rounded-2xl border border-[#1A1613]/8 bg-[#FFFDF8] p-4.5 shadow-[0_2px_12px_-4px_rgba(26,22,19,0.04)]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A1613]/55">
            Catalog Health
          </span>
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            Optimal
          </span>
        </div>
        <h4 className="mt-2 text-2xl font-extrabold tracking-tight text-emerald-700 flex items-center gap-1.5">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <span>100% Live</span>
        </h4>
        <p className="mt-1 text-xs text-[#1A1613]/60">
          All categories active for customer orders
        </p>
      </div>
    </div>
  );
};

export default CategoryStatsCards;
