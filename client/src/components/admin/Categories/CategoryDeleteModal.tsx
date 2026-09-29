import React from "react";
import { AlertTriangle, Trash2, RefreshCw, ImageIcon } from "lucide-react";
import { AdminCategory } from "../../../types/admin/categoryTypes";

interface CategoryDeleteModalProps {
  category: AdminCategory | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
}

const CategoryDeleteModal: React.FC<CategoryDeleteModalProps> = ({
  category,
  onClose,
  onConfirm,
  loading,
}) => {
  if (!category) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-[#FFFDF8] p-6 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1A1613]">
              Delete Category?
            </h3>
            <p className="text-xs text-[#1A1613]/60">
              This action is permanent and cannot be undone.
            </p>
          </div>
        </div>

        {/* Category Preview Card */}
        <div className="p-3.5 rounded-xl border border-[#1A1613]/10 bg-[#FDF8ED] flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#1A1613]/10 bg-white flex-shrink-0 flex items-center justify-center">
            {category.categoryImage ? (
              <img
                src={category.categoryImage}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-5 h-5 text-[#1A1613]/30" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-[#1A1613] truncate">
              {category.categoryName}
            </p>
            <p className="text-xs text-[#1A1613]/55 truncate">
              {(category.totalProducts || 0) === 1
                ? "1 associated product"
                : `${category.totalProducts || 0} associated products`}
            </p>
          </div>
        </div>

        {/* Warning if category has products */}
        {(category.totalProducts || 0) > 0 && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              Warning: This category currently contains{" "}
              <strong>{category.totalProducts} products</strong>. Deleting it
              may leave those products unassigned.
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-[#1A1613]/15 text-xs font-semibold text-[#1A1613] hover:bg-[#F4EEDF]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryDeleteModal;
