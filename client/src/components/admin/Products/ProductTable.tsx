import React from "react";
import {
  Eye,
  Edit,
  Trash2,
  Copy,
  Check,
  Star,
  Package,
  Layers,
  ImageIcon,
  AlertCircle,
  Boxes,
} from "lucide-react";
import { AdminProduct } from "../../../types/admin/productTypes";

interface ProductTableProps {
  products: AdminProduct[];
  loading: boolean;
  onView: (product: AdminProduct) => void;
  onEdit: (product: AdminProduct) => void;
  onQuickStock: (product: AdminProduct) => void;
  onDelete: (product: AdminProduct) => void;
  onCopyId: (id: string, e: React.MouseEvent) => void;
  copiedId: string | null;
  formatDate: (dateStr?: string) => string;
}

const ProductTable: React.FC<ProductTableProps> = ({
  products,
  loading,
  onView,
  onEdit,
  onQuickStock,
  onDelete,
  onCopyId,
  copiedId,
  formatDate,
}) => {
  return (
    <div>
      {/* Mobile scroll hint */}
      <div className="sm:hidden px-4 py-2 bg-[#FDF8ED] border-b border-[#1A1613]/10 text-[11px] text-[#1A1613]/60 flex items-center justify-between">
        <span>↔ Scroll horizontally to view stock levels &amp; actions</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left border-collapse">
        <thead>
          <tr className="border-b border-[#1A1613]/10 bg-[#F4EEDF]/40 text-[11px] font-bold uppercase tracking-wider text-[#1A1613]/60">
            <th className="py-3.5 px-4">Product</th>
            <th className="py-3.5 px-4">Category</th>
            <th className="py-3.5 px-4">Price</th>
            <th className="py-3.5 px-4 text-center">Stock</th>
            <th className="py-3.5 px-4 text-center">Rating</th>
            <th className="py-3.5 px-4">Created Date</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1A1613]/8 text-xs text-[#1A1613]">
          {loading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <tr key={`skeleton-${idx}`} className="animate-pulse">
                {/* Product Info & Image Skeleton */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#1A1613]/10 shrink-0" />
                    <div className="space-y-2 flex-1 min-w-0">
                      <div
                        className="h-3.5 rounded bg-[#1A1613]/15"
                        style={{ width: `${100 + (idx % 4) * 25}px` }}
                      />
                      <div className="h-2.5 rounded bg-[#1A1613]/10 w-20" />
                    </div>
                  </div>
                </td>

                {/* Category Skeleton */}
                <td className="py-3.5 px-4">
                  <div className="h-5 w-24 rounded-full bg-[#1A1613]/10" />
                </td>

                {/* Price Skeleton */}
                <td className="py-3.5 px-4">
                  <div className="h-3.5 w-16 rounded bg-[#1A1613]/15" />
                </td>

                {/* Stock Skeleton */}
                <td className="py-3.5 px-4 text-center">
                  <div className="h-5 w-14 rounded-full bg-[#1A1613]/10 mx-auto" />
                </td>

                {/* Rating Skeleton */}
                <td className="py-3.5 px-4 text-center">
                  <div className="h-3.5 w-12 rounded bg-[#1A1613]/10 mx-auto" />
                </td>

                {/* Date Skeleton */}
                <td className="py-3.5 px-4">
                  <div className="h-3 w-16 rounded bg-[#1A1613]/10" />
                </td>

                {/* Actions Skeleton */}
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <div className="w-7 h-7 rounded-lg bg-[#1A1613]/10" />
                    <div className="w-7 h-7 rounded-lg bg-[#1A1613]/10" />
                    <div className="w-7 h-7 rounded-lg bg-[#1A1613]/10" />
                  </div>
                </td>
              </tr>
            ))
          ) : products.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center text-[#1A1613]/50">
                <Package className="w-10 h-10 mx-auto mb-2 text-[#1A1613]/30" />
                <p className="font-semibold text-sm">No products found</p>
                <p className="text-xs mt-1">
                  Try adjusting your search terms or filter criteria.
                </p>
              </td>
            </tr>
          ) : (
            products.map((product) => {
              const categoryName =
                product.category?.categoryName ||
                product.Category?.categoryName ||
                "Unassigned";

              const discount = product.productDiscount || 0;
              const originalPrice = product.productPrice || 0;
              const finalPrice =
                discount > 0
                  ? Math.round(originalPrice - (originalPrice * discount) / 100)
                  : originalPrice;

              const stock = product.productStock || 0;

              // Reviews calculation
              const reviews = product.reviews || [];
              const avgRating =
                reviews.length > 0
                  ? (
                      reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
                      reviews.length
                    ).toFixed(1)
                  : null;

              return (
                <tr
                  key={product.id}
                  className="group hover:bg-[#F4EEDF]/40 transition-colors"
                >
                  {/* Product Info & Image */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-[#1A1613]/10 bg-[#FDF8ED] flex-shrink-0 flex items-center justify-center">
                        {product.productImage ? (
                          <img
                            src={product.productImage}
                            alt={product.productName}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-[#1A1613]/30" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[#1A1613] text-sm truncate max-w-[200px]">
                          {product.productName}
                        </p>
                        {product.id && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-[#1A1613]/40 font-mono truncate max-w-[120px]">
                              {product.id}
                            </span>
                            <button
                              onClick={(e) => onCopyId(product.id, e)}
                              title="Copy Product ID"
                              className="text-[#1A1613]/40 hover:text-[#E6540B] transition-colors"
                            >
                              {copiedId === product.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#1A1613]/5 border border-[#1A1613]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#1A1613]/80">
                      <Layers className="w-3 h-3 text-[#E6540B]" />
                      <span className="truncate max-w-[110px]">
                        {categoryName}
                      </span>
                    </span>
                  </td>

                  {/* Price */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-[#1A1613]">
                          Rs. {finalPrice.toLocaleString()}
                        </span>
                        {discount > 0 && (
                          <span className="rounded bg-rose-50 border border-rose-200 px-1 py-0.2 text-[9px] font-bold text-rose-700">
                            -{discount}%
                          </span>
                        )}
                      </div>
                      {discount > 0 && (
                        <span className="text-[10px] text-[#1A1613]/40 line-through">
                          Rs. {originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Stock */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onQuickStock(product)}
                      title="Click to quick update stock"
                      className="group/stock inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      {stock === 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 group-hover/stock:bg-rose-100 group-hover/stock:border-rose-300">
                          <AlertCircle className="w-3 h-3" />
                          <span>Out of Stock</span>
                          <Edit className="w-2.5 h-2.5 opacity-0 group-hover/stock:opacity-100 transition-opacity ml-0.5" />
                        </span>
                      ) : stock < 10 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 group-hover/stock:bg-amber-100 group-hover/stock:border-amber-300">
                          <span>{stock} left</span>
                          <Edit className="w-2.5 h-2.5 opacity-0 group-hover/stock:opacity-100 transition-opacity ml-0.5" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 group-hover/stock:bg-emerald-100 group-hover/stock:border-emerald-300">
                          <span>{stock} in stock</span>
                          <Edit className="w-2.5 h-2.5 opacity-0 group-hover/stock:opacity-100 transition-opacity ml-0.5" />
                        </span>
                      )}
                    </button>
                  </td>

                  {/* Rating */}
                  <td className="py-3.5 px-4 text-center">
                    {avgRating ? (
                      <div className="inline-flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span className="font-semibold text-xs text-[#1A1613]">
                          {avgRating}
                        </span>
                        <span className="text-[10px] text-[#1A1613]/40">
                          ({reviews.length})
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#1A1613]/40 italic">
                        No reviews
                      </span>
                    )}
                  </td>

                  {/* Created Date */}
                  <td className="py-3.5 px-4 text-xs text-[#1A1613]/60 whitespace-nowrap">
                    {formatDate(product.createdAt)}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onView(product)}
                        className="p-1.5 rounded-lg text-[#1A1613]/60 hover:text-[#1A1613] hover:bg-[#F4EEDF] transition-all cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onQuickStock(product)}
                        className="p-1.5 rounded-lg text-[#1A1613]/60 hover:text-[#E6540B] hover:bg-[#F4EEDF] transition-all cursor-pointer"
                        title="Quick Stock Update"
                      >
                        <Boxes className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(product)}
                        className="p-1.5 rounded-lg text-[#1A1613]/60 hover:text-[#E6540B] hover:bg-[#F4EEDF] transition-all cursor-pointer"
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(product)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  </div>
);
};

export default ProductTable;
