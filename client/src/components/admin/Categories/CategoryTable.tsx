import React from "react";
import { Eye, Edit, Trash2, Package, ImageIcon, Copy, Check } from "lucide-react";
import { AdminCategory } from "../../../types/admin/categoryTypes";

interface CategoryTableProps {
  categories: AdminCategory[];
  loading?: boolean;
  onView: (category: AdminCategory) => void;
  onEdit: (category: AdminCategory) => void;
  onDelete: (category: AdminCategory) => void;
  onCopyId: (id: string, e: React.MouseEvent) => void;
  copiedId: string | null;
  formatDate: (dateStr?: string) => string;
}

const CategoryTable: React.FC<CategoryTableProps> = ({
  categories,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onCopyId,
  copiedId,
  formatDate,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#1A1613]/10 bg-[#F4EEDF]/40 text-[11px] font-bold uppercase tracking-wider text-[#1A1613]/60">
            <th className="py-3.5 px-4">Category</th>
            <th className="py-3.5 px-4">Description</th>
            <th className="py-3.5 px-4 text-center">Products</th>
            <th className="py-3.5 px-4">Created Date</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1A1613]/8 text-xs text-[#1A1613]">
          {loading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <tr key={`skeleton-${idx}`} className="animate-pulse">
                {/* Category Info & Image Skeleton */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#1A1613]/10 shrink-0" />
                    <div className="space-y-2 flex-1 min-w-0">
                      <div
                        className="h-3.5 rounded bg-[#1A1613]/15"
                        style={{ width: `${90 + (idx % 4) * 25}px` }}
                      />
                      <div className="h-2.5 rounded bg-[#1A1613]/10 w-24" />
                    </div>
                  </div>
                </td>

                {/* Description Skeleton */}
                <td className="py-3.5 px-4 max-w-xs">
                  <div className="space-y-1.5">
                    <div className="h-3 rounded bg-[#1A1613]/10 w-full" />
                    <div className="h-3 rounded bg-[#1A1613]/10 w-3/4" />
                  </div>
                </td>

                {/* Products Count Skeleton */}
                <td className="py-3.5 px-4 text-center">
                  <div className="h-6 w-14 rounded-full bg-[#1A1613]/10 mx-auto" />
                </td>

                {/* Created Date Skeleton */}
                <td className="py-3.5 px-4">
                  <div className="h-3.5 w-20 rounded bg-[#1A1613]/10" />
                </td>

                {/* Actions Skeleton */}
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <div className="w-7 h-7 rounded-lg bg-[#1A1613]/10" />
                    <div className="w-7 h-7 rounded-lg bg-[#1A1613]/10" />
                    <div className="w-7 h-7 rounded-lg bg-[#1A1613]/10" />
                  </div>
                </td>
              </tr>
            ))
          ) : (
            categories.map((category) => (
            <tr
              key={category.id}
              className="hover:bg-[#F4EEDF]/30 transition-colors group"
            >
              {/* Category Info & Image */}
              <td className="py-3.5 px-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-[#1A1613]/10 bg-[#FDF8ED] flex-shrink-0 flex items-center justify-center">
                    {category.categoryImage ? (
                      <img
                        src={category.categoryImage}
                        alt={category.categoryName}
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
                    <p className="font-bold text-[#1A1613] text-sm truncate">
                      {category.categoryName}
                    </p>
                    {category.id && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-[#1A1613]/40 font-mono truncate max-w-[120px]">
                          {category.id}
                        </span>
                        <button
                          onClick={(e) => onCopyId(category.id, e)}
                          title="Copy Category ID"
                          className="text-[#1A1613]/40 hover:text-[#E6540B] transition-colors"
                        >
                          {copiedId === category.id ? (
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

              {/* Description */}
              <td className="py-3.5 px-4 max-w-xs">
                <p className="text-xs text-[#1A1613]/70 line-clamp-2 leading-relaxed">
                  {category.categoryDescription || "No description provided"}
                </p>
              </td>

              {/* Products Count */}
              <td className="py-3.5 px-4 text-center">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    (category.totalProducts || 0) > 0
                      ? "bg-amber-500/10 text-amber-700"
                      : "bg-[#1A1613]/5 text-[#1A1613]/40"
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>{category.totalProducts || 0}</span>
                </span>
              </td>

              {/* Created Date */}
              <td className="py-3.5 px-4 text-xs text-[#1A1613]/60 whitespace-nowrap">
                {formatDate(category.createdAt)}
              </td>

              {/* Action Buttons */}
              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onView(category)}
                    className="p-1.5 rounded-lg text-[#1A1613]/60 hover:text-[#1A1613] hover:bg-[#F4EEDF] transition-all"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(category)}
                    className="p-1.5 rounded-lg text-[#1A1613]/60 hover:text-[#E6540B] hover:bg-[#F4EEDF] transition-all"
                    title="Edit Category"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(category)}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-all"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
        </tbody>
      </table>
    </div>
  );
};

export default CategoryTable;
