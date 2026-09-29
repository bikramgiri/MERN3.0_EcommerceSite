import React from "react";
import { Eye, Edit, Trash2, Package, ImageIcon } from "lucide-react";
import { AdminCategory } from "../../../types/admin/categoryTypes";

interface CategoryGridProps {
  categories: AdminCategory[];
  loading?: boolean;
  onView: (category: AdminCategory) => void;
  onEdit: (category: AdminCategory) => void;
  onDelete: (category: AdminCategory) => void;
  formatDate: (dateStr?: string) => string;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  loading = false,
  onView,
  onEdit,
  onDelete,
  formatDate,
}) => {
  return (
    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {loading ? (
        Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={`grid-skeleton-${idx}`}
            className="flex flex-col justify-between rounded-xl border border-[#1A1613]/10 bg-[#FFFDF8] overflow-hidden animate-pulse shadow-xs"
          >
            <div>
              {/* Banner Skeleton */}
              <div className="h-36 w-full bg-[#1A1613]/10" />

              {/* Body Skeleton */}
              <div className="p-4 space-y-2">
                <div
                  className="h-4 rounded bg-[#1A1613]/15"
                  style={{ width: `${110 + (idx % 3) * 30}px` }}
                />
                <div className="h-3 w-full rounded bg-[#1A1613]/10" />
                <div className="h-3 w-3/4 rounded bg-[#1A1613]/10" />
              </div>
            </div>

            {/* Footer Skeleton */}
            <div className="p-3 border-t border-[#1A1613]/10 bg-[#F4EEDF]/20 flex items-center justify-between">
              <div className="h-3 w-20 rounded bg-[#1A1613]/10" />
              <div className="flex gap-1.5">
                <div className="w-6 h-6 rounded bg-[#1A1613]/10" />
                <div className="w-6 h-6 rounded bg-[#1A1613]/10" />
                <div className="w-6 h-6 rounded bg-[#1A1613]/10" />
              </div>
            </div>
          </div>
        ))
      ) : (
        categories.map((category) => (
        <div
          key={category.id}
          className="group relative flex flex-col justify-between rounded-xl border border-[#1A1613]/10 bg-[#FFFDF8] overflow-hidden shadow-xs hover:shadow-[0_8px_20px_-6px_rgba(26,22,19,0.10)] hover:-translate-y-0.5 transition-all duration-200"
        >
          <div>
            {/* Category Image Banner */}
            <div className="relative h-36 w-full bg-[#FDF8ED] overflow-hidden border-b border-[#1A1613]/10 flex items-center justify-center">
              {category.categoryImage ? (
                <img
                  src={category.categoryImage}
                  alt={category.categoryName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <ImageIcon className="w-10 h-10 text-[#1A1613]/25" />
              )}
              <div className="absolute top-2 right-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-semibold text-white">
                  <Package className="w-3 h-3" />
                  <span>
                    {category.totalProducts || 0}{" "}
                    {(category.totalProducts || 0) === 1
                      ? "Product"
                      : "Products"}
                  </span>
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-4">
              <h4 className="font-bold text-sm text-[#1A1613] truncate">
                {category.categoryName}
              </h4>
              <p className="mt-1 text-xs text-[#1A1613]/60 line-clamp-2 leading-relaxed">
                {category.categoryDescription || "No description provided."}
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-3 border-t border-[#1A1613]/10 bg-[#F4EEDF]/20 flex items-center justify-between text-xs text-[#1A1613]/55">
            <span>{formatDate(category.createdAt)}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onView(category)}
                className="p-1 rounded-md hover:bg-[#F4EEDF] text-[#1A1613]/60 hover:text-[#1A1613]"
                title="View Details"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onEdit(category)}
                className="p-1 rounded-md hover:bg-[#F4EEDF] text-[#1A1613]/60 hover:text-[#E6540B]"
                title="Edit Category"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(category)}
                className="p-1 rounded-md hover:bg-rose-50 text-rose-500 hover:text-rose-700"
                title="Delete Category"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))
    )}
    </div>
  );
};

export default CategoryGrid;
