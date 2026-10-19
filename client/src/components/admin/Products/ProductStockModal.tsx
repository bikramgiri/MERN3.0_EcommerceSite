import React, { useEffect, useState } from "react";
import {
  X,
  Package,
  Layers,
  Check,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Plus,
  Minus,
} from "lucide-react";
import { AdminProduct } from "../../../types/admin/productTypes";

interface ProductStockModalProps {
  isOpen: boolean;
  product: AdminProduct | null;
  onClose: () => void;
  onUpdateStock: (productId: string, newStock: number) => Promise<boolean>;
  loading: boolean;
}

const ProductStockModal: React.FC<ProductStockModalProps> = ({
  isOpen,
  product,
  onClose,
  onUpdateStock,
  loading,
}) => {
  const [stock, setStock] = useState<number>(0);

  useEffect(() => {
    if (product) {
      setStock(product.productStock ?? 0);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const currentStock = product.productStock ?? 0;
  const categoryName =
    product.category?.categoryName ||
    product.Category?.categoryName ||
    "Unassigned";

  const handleAdjust = (delta: number) => {
    setStock((prev) => Math.max(0, prev + delta));
  };

  const handleSetStock = (value: number) => {
    setStock(Math.max(0, value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onUpdateStock(product.id, stock);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-[#1A1613]/15 dark:border-white/10 bg-[#FFFDF8] dark:bg-[#1E1A17] p-5 sm:p-6 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1A1613]/10 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E6540B]/10 dark:bg-[#E6540B]/15 text-[#E6540B] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1A1613] dark:text-[#F5EFE6]">
                Quick Stock Update
              </h3>
              <p className="text-xs text-[#1A1613]/55 dark:text-[#F5EFE6]/50">
                Adjust inventory quantity for this product
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-[#1A1613]/40 dark:text-[#F5EFE6]/50 hover:text-[#1A1613] dark:hover:text-[#F5EFE6] hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product Summary Mini-Card */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FDF8ED] dark:bg-[#1E1A17] border border-[#1A1613]/10 dark:border-white/10">
          <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#1A1613]/10 dark:border-white/10 bg-white dark:bg-[#2A2420] shrink-0 flex items-center justify-center">
            {product.productImage ? (
              <img
                src={product.productImage}
                alt={product.productName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <Package className="w-6 h-6 text-[#1A1613]/25 dark:text-[#F5EFE6]/30" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-xs text-[#1A1613] dark:text-[#F5EFE6] truncate">
              {product.productName}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#1A1613]/5 dark:bg-[#2A2420] px-2 py-0.5 text-[10px] font-medium text-[#1A1613]/70 dark:text-[#F5EFE6]/70">
                <Layers className="w-2.5 h-2.5 text-[#E6540B]" />
                <span className="truncate max-w-[100px]">{categoryName}</span>
              </span>
              <span className="text-[10px] text-[#1A1613]/50 dark:text-[#F5EFE6]/50">
                Current: <strong className="text-[#1A1613] dark:text-[#F5EFE6]">{currentStock}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Stock Control Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1A1613] dark:text-[#F5EFE6] mb-2 text-center">
              New Stock Level
            </label>

            {/* Stepper Input */}
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleAdjust(-10)}
                disabled={stock <= 0 || loading}
                className="h-10 px-2.5 rounded-lg border border-[#1A1613]/15 dark:border-white/10 bg-[#FDF8ED] dark:bg-[#1E1A17] text-xs font-bold text-[#1A1613] dark:text-[#F5EFE6] hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420] disabled:opacity-30 active:scale-95 transition-all"
                title="Decrease by 10"
              >
                -10
              </button>
              <button
                type="button"
                onClick={() => handleAdjust(-1)}
                disabled={stock <= 0 || loading}
                className="w-10 h-10 rounded-lg border border-[#1A1613]/15 dark:border-white/10 bg-[#FDF8ED] dark:bg-[#1E1A17] flex items-center justify-center text-[#1A1613] dark:text-[#F5EFE6] hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420] disabled:opacity-30 active:scale-95 transition-all"
                title="Decrease by 1"
              >
                <Minus className="w-4 h-4" />
              </button>

              <input
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => handleSetStock(parseInt(e.target.value, 10) || 0)}
                className="w-24 h-11 text-center font-bold text-lg rounded-xl border-2 border-[#E6540B] bg-white dark:bg-[#14110F] text-[#1A1613] dark:text-[#F5EFE6] focus:outline-none focus:ring-2 focus:ring-[#E6540B]/20"
              />

              <button
                type="button"
                onClick={() => handleAdjust(1)}
                disabled={loading}
                className="w-10 h-10 rounded-lg border border-[#1A1613]/15 dark:border-white/10 bg-[#FDF8ED] dark:bg-[#1E1A17] flex items-center justify-center text-[#1A1613] dark:text-[#F5EFE6] hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420] active:scale-95 transition-all"
                title="Increase by 1"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleAdjust(10)}
                disabled={loading}
                className="h-10 px-2.5 rounded-lg border border-[#1A1613]/15 dark:border-white/10 bg-[#FDF8ED] dark:bg-[#1E1A17] text-xs font-bold text-[#1A1613] dark:text-[#F5EFE6] hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420] active:scale-95 transition-all"
                title="Increase by 10"
              >
                +10
              </button>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <span className="block text-[11px] font-medium text-[#1A1613]/50 dark:text-[#F5EFE6]/50 mb-1.5 text-center">
              Quick Shortcuts
            </span>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleSetStock(0)}
                className="py-1.5 px-2 rounded-lg border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/15 text-[11px] font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
              >
                Out of Stock
              </button>
              <button
                type="button"
                onClick={() => handleAdjust(5)}
                className="py-1.5 px-2 rounded-lg border border-[#1A1613]/15 dark:border-white/10 bg-[#FDF8ED] dark:bg-[#1E1A17] text-[11px] font-semibold text-[#1A1613] dark:text-[#F5EFE6] hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420] transition-colors"
              >
                +5 Units
              </button>
              <button
                type="button"
                onClick={() => handleAdjust(20)}
                className="py-1.5 px-2 rounded-lg border border-[#1A1613]/15 dark:border-white/10 bg-[#FDF8ED] dark:bg-[#1E1A17] text-[11px] font-semibold text-[#1A1613] dark:text-[#F5EFE6] hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420] transition-colors"
              >
                +20 Units
              </button>
              <button
                type="button"
                onClick={() => handleAdjust(50)}
                className="py-1.5 px-2 rounded-lg border border-[#1A1613]/15 dark:border-white/10 bg-[#FDF8ED] dark:bg-[#1E1A17] text-[11px] font-semibold text-[#1A1613] dark:text-[#F5EFE6] hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420] transition-colors"
              >
                +50 Units
              </button>
            </div>
          </div>

          {/* New Status Indicator */}
          <div className="p-3 rounded-xl bg-[#F4EEDF]/40 dark:bg-[#2A2420] border border-[#1A1613]/10 dark:border-white/10 flex items-center justify-between text-xs">
            <span className="text-[#1A1613]/60 dark:text-[#F5EFE6]/50">Projected Status:</span>
            {stock === 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 dark:text-rose-400">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Out of Stock</span>
              </span>
            ) : stock < 10 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Low Stock ({stock} left)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>In Stock ({stock} units)</span>
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1A1613]/10 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-[#1A1613]/15 dark:border-white/10 text-xs font-semibold text-[#1A1613] dark:text-[#F5EFE6] hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420] transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#E6540B] text-xs font-semibold text-white hover:bg-[#d44c0a] shadow-xs active:scale-95 transition-all disabled:opacity-50"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? "Updating..." : "Save Stock"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductStockModal;
