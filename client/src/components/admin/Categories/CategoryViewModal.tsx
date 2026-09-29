import React from "react";
import { X, Edit, Package, ImageIcon, Copy, Check } from "lucide-react";
import { AdminCategory } from "../../../types/admin/categoryTypes";

interface CategoryViewModalProps {
  category: AdminCategory | null;
  onClose: () => void;
  onEdit: (category: AdminCategory) => void;
  onCopyId: (id: string, e: React.MouseEvent) => void;
  copiedId: string | null;
  formatDate: (dateStr?: string) => string;
}

const CategoryViewModal: React.FC<CategoryViewModalProps> = ({
  category,
  onClose,
  onEdit,
  onCopyId,
  copiedId,
  formatDate,
}) => {
  if (!category) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-[#1A1613]/15 bg-[#FFFDF8] p-6 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1A1613]/10">
          <h3 className="text-base font-bold text-[#1A1613]">
            Category Details
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#1A1613]/40 hover:text-[#1A1613] hover:bg-[#F4EEDF]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Banner Image */}
        <div className="h-44 w-full rounded-xl overflow-hidden border border-[#1A1613]/10 bg-[#FDF8ED] relative flex items-center justify-center">
          {category.categoryImage ? (
            <img
              src={category.categoryImage}
              alt={category.categoryName}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="w-12 h-12 text-[#1A1613]/25" />
          )}
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-semibold text-white">
              <Package className="w-3 h-3" />
              <span>
                {category.totalProducts || 0}{" "}
                {(category.totalProducts || 0) === 1 ? "Product" : "Products"}
              </span>
            </span>
          </div>
        </div>

        {/* Info Details */}
        <div className="space-y-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1613]/40">
              Category Name
            </span>
            <p className="text-base font-bold text-[#1A1613]">
              {category.categoryName}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1613]/40">
              Description
            </span>
            <p className="text-xs text-[#1A1613]/70 leading-relaxed mt-0.5">
              {category.categoryDescription || "No description provided."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1A1613]/10">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1613]/40">
                Created Date
              </span>
              <p className="text-xs font-semibold text-[#1A1613] mt-0.5">
                {formatDate(category.createdAt)}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1613]/40">
                Catalog Total
              </span>
              <p className="text-xs font-semibold text-[#E6540B] mt-0.5">
                {category.totalProducts || 0} live products
              </p>
            </div>
          </div>

          {category.id && (
            <div className="pt-2 border-t border-[#1A1613]/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1613]/40">
                Category ID
              </span>
              <div className="flex items-center justify-between mt-1 p-2 rounded-lg bg-[#FDF8ED] border border-[#1A1613]/10 text-xs font-mono text-[#1A1613]/70">
                <span className="truncate">{category.id}</span>
                <button
                  onClick={(e) => onCopyId(category.id, e)}
                  className="ml-2 text-[#E6540B] hover:text-[#d44c0a]"
                  title="Copy ID"
                >
                  {copiedId === category.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-[#1A1613]/10 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#1A1613]/15 text-xs font-semibold text-[#1A1613] hover:bg-[#F4EEDF]"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onEdit(category);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E6540B] text-xs font-semibold text-white hover:bg-[#d44c0a]"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Category</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryViewModal;
