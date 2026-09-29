import React from "react";
import { Link } from "react-router-dom";
import {
  Flame,
  TrendingUp,
  Package,
  ExternalLink,
  ShoppingBag,
  ArrowUpRight,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { TopSellingProduct } from "../../../types/admin/datasTypes";

interface TopSellingProductsProps {
  topSellingProducts: TopSellingProduct[];
  status?: string;
}

const rankStyles: Record<number, { bg: string; text: string; border: string }> = {
  1: {
    bg: "bg-amber-500/15",
    text: "text-amber-700",
    border: "border-amber-400/40",
  },
  2: {
    bg: "bg-slate-400/15",
    text: "text-slate-700",
    border: "border-slate-300",
  },
  3: {
    bg: "bg-amber-700/15",
    text: "text-amber-800",
    border: "border-amber-600/30",
  },
};

const TopSellingProducts: React.FC<TopSellingProductsProps> = ({
  topSellingProducts,
  status: _status,
}) => {
  const maxSold = Math.max(
    ...topSellingProducts.map((p) => p.totalSold || 0),
    1
  );

  return (
    <div className="rounded-xl border border-[#1A1613]/10 bg-[#FFFDF8] p-5 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-[#1A1613]/10">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E6540B]/10 text-[#E6540B]">
              <Flame className="w-4 h-4 fill-[#E6540B]" />
            </div>
            <h2 className="text-lg font-bold text-[#1A1613]">
              Top Selling Products
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#E6540B]/10 px-2 py-0.5 text-[10px] font-bold text-[#E6540B]">
              <TrendingUp className="w-3 h-3" />
              Bestsellers
            </span>
          </div>
          <p className="mt-1 text-xs text-[#1A1613]/60">
            Leading products by units ordered and revenue performance.
          </p>
        </div>

        <Link
          to="/admin-dashboard/products"
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] px-3 py-1.5 text-xs font-semibold text-[#1A1613] hover:bg-[#F4EEDF] hover:text-[#E6540B] transition-colors"
        >
          <span>View All Products</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Content */}
      {topSellingProducts.length === 0 ? (
        <div className="py-12 text-center text-[#1A1613]/50">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F4EEDF] text-[#1A1613]/40 mb-3">
            <Package className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-[#1A1613]/70">
            No product sales data yet
          </p>
          <p className="text-xs text-[#1A1613]/40 mt-1">
            Once customer orders are completed, your top selling items will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs text-[#1A1613]">
            <thead className="bg-[#F4EEDF]/40 text-[11px] uppercase tracking-wider text-[#1A1613]/60 font-semibold border-b border-[#1A1613]/10">
              <tr>
                <th className="py-3 px-3 w-12 text-center">Rank</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Sales Volume</th>
                <th className="py-3 px-4">Revenue</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#1A1613]/5">
              {topSellingProducts.map((item, index) => {
                const rank = index + 1;
                const p = item.product;
                const percentage =
                  item.totalSold > 0
                    ? Math.round((item.totalSold / maxSold) * 100)
                    : 0;

                const isLowStock = p.productStock <= 5 && p.productStock > 0;
                const isOutOfStock = p.productStock <= 0;

                return (
                  <tr
                    key={p.id || index}
                    className="hover:bg-[#F4EEDF]/40 transition-colors group"
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          rankStyles[rank]
                            ? `${rankStyles[rank].bg} ${rankStyles[rank].text} border ${rankStyles[rank].border}`
                            : "bg-[#1A1613]/5 text-[#1A1613]/60"
                        }`}
                      >
                        {rank}
                      </span>
                    </td>

                    {/* Product */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {p.productImage ? (
                          <img
                            src={p.productImage}
                            alt={p.productName}
                            className="h-10 w-10 rounded-lg object-cover border border-[#1A1613]/10 shrink-0"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = "none";
                              const fallback = target.nextElementSibling;
                              if (fallback) (fallback as HTMLElement).style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F4EEDF] text-[#E6540B] shrink-0 font-bold text-xs"
                          style={{ display: p.productImage ? "none" : "flex" }}
                        >
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 max-w-[200px] sm:max-w-xs">
                          <p className="font-semibold text-xs text-[#1A1613] truncate">
                            {p.productName}
                          </p>
                          <span className="text-[10px] text-[#1A1613]/50">
                            ID: #{p.id?.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex rounded-md bg-[#F4EEDF] px-2 py-0.5 text-[11px] font-medium text-[#1A1613]/70">
                        {p.categoryName || "General"}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 font-semibold text-[#1A1613]">
                      Rs {p.productPrice?.toLocaleString() || "0"}
                    </td>

                    {/* Sales Volume with Progress Bar */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1.5 min-w-[120px]">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-bold text-[#E6540B]">
                            {item.totalSold}{" "}
                            <span className="font-normal text-[#1A1613]/60">
                              sold
                            </span>
                          </span>
                          <span className="text-[10px] text-[#1A1613]/40">
                            {percentage}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[#1A1613]/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#E6540B] transition-all duration-500"
                            style={{ width: `${Math.max(percentage, 5)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Total Revenue */}
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      Rs {(item.totalRevenue || item.totalSold * (p.productPrice || 0)).toLocaleString()}
                    </td>

                    {/* Stock */}
                    <td className="py-3.5 px-4">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 text-[10px] font-semibold">
                          <AlertCircle className="w-3 h-3 text-red-600" />
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          Low ({p.productStock})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          {p.productStock} in stock
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-3 text-right">
                      <Link
                        to={`/productdetails/${p.id}`}
                        target="_blank"
                        className="inline-flex items-center justify-center p-1.5 rounded-lg text-[#1A1613]/50 hover:bg-[#F4EEDF] hover:text-[#E6540B] transition-colors"
                        title="View product storefront page"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TopSellingProducts;
