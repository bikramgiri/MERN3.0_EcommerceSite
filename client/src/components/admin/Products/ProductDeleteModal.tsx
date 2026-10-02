import React from "react";
import { AlertTriangle, Trash2, RefreshCw, ImageIcon } from "lucide-react";
import { AdminProduct } from "../../../types/admin/productTypes";

interface ProductDeleteModalProps {
  product: AdminProduct | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
}

const ProductDeleteModal: React.FC<ProductDeleteModalProps> = ({
  product,
  onClose,
  onConfirm,
  loading,
}) => {
  if (!product) return null;

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
              Delete Product?
            </h3>
            <p className="text-xs text-[#1A1613]/60">
              This action is permanent and cannot be undone.
            </p>
          </div>
        </div>

        {/* Product Preview Card */}
        <div className="p-3.5 rounded-xl border border-[#1A1613]/10 bg-[#FDF8ED] flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#1A1613]/10 bg-white flex-shrink-0 flex items-center justify-center">
            {product.productImage ? (
              <img
                src={product.productImage}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-5 h-5 text-[#1A1613]/30" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm text-[#1A1613] truncate">
              {product.productName}
            </p>
            <div className="flex items-center gap-2 text-xs text-[#1A1613]/60 mt-0.5">
              <span>Rs. {product.productPrice?.toLocaleString()}</span>
              <span>•</span>
              <span>{product.productStock} units in stock</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-[#1A1613]/70 leading-relaxed">
          Are you sure you want to permanently delete{" "}
          <span className="font-bold text-[#1A1613]">
            {product.productName}
          </span>
          ? The listing and its Cloudinary media assets will be completely removed.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-[#1A1613]/15 text-xs font-semibold text-[#1A1613] hover:bg-[#F4EEDF] transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700 shadow-xs active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>{loading ? "Deleting..." : "Delete Product"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDeleteModal;
