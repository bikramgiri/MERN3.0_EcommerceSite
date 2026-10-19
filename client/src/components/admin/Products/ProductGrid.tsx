import React from "react";
import {
  Eye,
  Edit,
  Trash2,
  Package,
  Layers,
  ImageIcon,
  Star,
  AlertCircle,
  Boxes,
} from "lucide-react";
import { AdminProduct } from "../../../types/admin/productTypes";

interface ProductGridProps {
  products: AdminProduct[];
  loading: boolean;
  onView: (product: AdminProduct) => void;
  onEdit: (product: AdminProduct) => void;
  onQuickStock: (product: AdminProduct) => void;
  onDelete: (product: AdminProduct) => void;
  formatDate: (dateStr?: string) => string;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading,
  onView,
  onEdit,
  onQuickStock,
  onDelete,
  formatDate,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={`grid-skeleton-${idx}`}
            className="rounded-2xl border border-[#1A1613]/10 dark:border-white/10 bg-[#FFFDF8] dark:bg-[#1E1A17] overflow-hidden shadow-xs animate-pulse"
          >
            <div className="h-44 bg-[#1A1613]/10 dark:bg-white/10" />
            <div className="p-4 space-y-3">
              <div className="h-3 w-16 rounded-full bg-[#1A1613]/10 dark:bg-white/10" />
              <div className="h-4 w-3/4 rounded bg-[#1A1613]/15 dark:bg-white/10" />
              <div className="h-3.5 w-1/2 rounded bg-[#1A1613]/10 dark:bg-white/10" />
              <div className="h-4 w-20 rounded bg-[#1A1613]/15 dark:bg-white/10 pt-2" />
            </div>
            <div className="p-3 border-t border-[#1A1613]/10 dark:border-white/10 bg-[#F4EEDF]/20 dark:bg-white/5 flex justify-between items-center">
              <div className="h-3 w-16 rounded bg-[#1A1613]/10 dark:bg-white/10" />
              <div className="h-6 w-16 rounded bg-[#1A1613]/10 dark:bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-12 text-center text-[#1A1613]/50 dark:text-[#F5EFE6]/50">
        <Package className="w-12 h-12 mx-auto mb-3 text-[#1A1613]/30 dark:text-[#F5EFE6]/30" />
        <h4 className="font-bold text-sm text-[#1A1613] dark:text-[#F5EFE6]">No products found</h4>
        <p className="text-xs text-[#1A1613]/60 dark:text-[#F5EFE6]/50 mt-1">
          Try adjusting your search query or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {products.map((product) => {
        const categoryName =
          product.category?.categoryName ||
          product.Category?.categoryName ||
          "General";

        const discount = product.productDiscount || 0;
        const originalPrice = product.productPrice || 0;
        const finalPrice =
          discount > 0
            ? Math.round(originalPrice - (originalPrice * discount) / 100)
            : originalPrice;

        const stock = product.productStock || 0;

        const reviews = product.reviews || [];
        const avgRating =
          reviews.length > 0
            ? (
                reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
                reviews.length
              ).toFixed(1)
            : null;

        return (
          <div
            key={product.id}
            className="group rounded-2xl border border-[#1A1613]/10 dark:border-white/10 bg-[#FFFDF8] dark:bg-[#1E1A17] overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            {/* Image Container with Floating Badges */}
            <div className="relative h-44 w-full bg-[#FDF8ED] dark:bg-[#2A2420] overflow-hidden flex items-center justify-center">
              {product.productImage ? (
                <img
                  src={product.productImage}
                  alt={product.productName}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <ImageIcon className="w-10 h-10 text-[#1A1613]/25 dark:text-[#F5EFE6]/30" />
              )}

              {/* Discount Tag */}
              {discount > 0 && (
                <div className="absolute top-2.5 left-2.5">
                  <span className="rounded-full bg-rose-500 text-white px-2 py-0.5 text-[10px] font-bold shadow-xs">
                    -{discount}%
                  </span>
                </div>
              )}

              {/* Stock Tag (Clickable Quick Stock) */}
              <div className="absolute top-2.5 right-2.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickStock(product);
                  }}
                  title="Click to quick update stock"
                  className="transition-transform active:scale-90 cursor-pointer"
                >
                  {stock === 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-600/90 hover:bg-rose-700 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>Out of Stock</span>
                    </span>
                  ) : stock < 10 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-600/90 hover:bg-amber-700 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                      <span>{stock} Left</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-xs">
                      <span>{stock} in Stock</span>
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                {/* Category Pill & Rating */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#1A1613]/5 dark:bg-[#2A2420] px-2 py-0.5 text-[10px] font-medium text-[#1A1613]/70 dark:text-[#F5EFE6]/70 truncate max-w-[120px]">
                    <Layers className="w-2.5 h-2.5 text-[#E6540B]" />
                    <span>{categoryName}</span>
                  </span>

                  {avgRating && (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      <span>{avgRating}</span>
                    </div>
                  )}
                </div>

                {/* Product Name */}
                <h4 className="font-bold text-sm text-[#1A1613] dark:text-[#F5EFE6] truncate group-hover:text-[#E6540B] transition-colors">
                  {product.productName}
                </h4>

                {/* Description */}
                <p className="mt-1 text-xs text-[#1A1613]/60 dark:text-[#F5EFE6]/50 line-clamp-2 leading-relaxed">
                  {product.productDescription || "No description provided."}
                </p>
              </div>

              {/* Price Row */}
              <div className="mt-3 pt-2.5 border-t border-[#1A1613]/6 dark:border-white/10 flex items-baseline gap-2">
                <span className="font-bold text-sm text-[#1A1613] dark:text-[#F5EFE6]">
                  Rs. {finalPrice.toLocaleString()}
                </span>
                {discount > 0 && (
                  <span className="text-xs text-[#1A1613]/40 dark:text-[#F5EFE6]/50 line-through">
                    Rs. {originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-3 border-t border-[#1A1613]/10 dark:border-white/10 bg-[#F4EEDF]/20 dark:bg-white/5 flex items-center justify-between text-xs text-[#1A1613]/55 dark:text-[#F5EFE6]/50">
              <span>{formatDate(product.createdAt)}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onView(product)}
                  className="p-1 rounded-md hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420] text-[#1A1613]/60 dark:text-[#F5EFE6]/50 hover:text-[#1A1613] dark:hover:text-[#F5EFE6] transition-colors"
                  title="View Details"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onQuickStock(product)}
                  className="p-1 rounded-md hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420] text-[#1A1613]/60 dark:text-[#F5EFE6]/50 hover:text-[#E6540B] transition-colors"
                  title="Quick Stock Update"
                >
                  <Boxes className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onEdit(product)}
                  className="p-1 rounded-md hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420] text-[#1A1613]/60 dark:text-[#F5EFE6]/50 hover:text-[#E6540B] transition-colors"
                  title="Edit Product"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(product)}
                  className="p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/15 text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
                  title="Delete Product"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductGrid;
