import React, { useEffect, useState } from "react";
import { Plus, Edit, X, UploadCloud, RefreshCw } from "lucide-react";
import { AdminProduct } from "../../../types/admin/productTypes";
import { AdminCategory } from "../../../types/admin/categoryTypes";
import { toast } from "react-toastify";

interface ProductModalProps {
  isOpen: boolean;
  product: AdminProduct | null;
  categories: AdminCategory[];
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<boolean>;
  loading: boolean;
}

const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  product,
  categories,
  onClose,
  onSubmit,
  loading,
}) => {
  const isEdit = Boolean(product);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [stock, setStock] = useState<string>("");
  const [discount, setDiscount] = useState<string>("0");
  const [categoryId, setCategoryId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setName(product.productName || "");
      setDescription(product.productDescription || "");
      setPrice(String(product.productPrice ?? ""));
      setStock(String(product.productStock ?? ""));
      setDiscount(String(product.productDiscount ?? "0"));
      setCategoryId(product.categoryId || product.Category?.id || "");
      setImagePreview(product.productImage || null);
      setImageFile(null);
    } else {
      setName("");
      setDescription("");
      setPrice("");
      setStock("");
      setDiscount("0");
      setCategoryId(categories.length > 0 ? categories[0].id : "");
      setImagePreview(null);
      setImageFile(null);
    }
  }, [product, isOpen, categories]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload a valid image file (JPG, PNG, WebP).");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const numPrice = Number(price) || 0;
  const numDiscount = Number(discount) || 0;
  const finalPrice =
    numDiscount > 0
      ? Math.max(0, Math.round(numPrice - (numPrice * numDiscount) / 100))
      : numPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedDesc = description.trim();

    if (!trimmedName || !trimmedDesc || !price || stock === "" || !categoryId) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (trimmedName.length < 3 || trimmedName.length > 30) {
      toast.error("Product name must be between 3 and 30 characters.");
      return;
    }

    if (trimmedDesc.length < 5 || trimmedDesc.length > 500) {
      toast.error("Product description must be between 5 and 500 characters.");
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error("Product price must be a positive number.");
      return;
    }

    const parsedStock = parseInt(stock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      toast.error("Stock must be 0 or greater.");
      return;
    }

    const parsedDiscount = parseFloat(discount);
    if (isNaN(parsedDiscount) || parsedDiscount < 0 || parsedDiscount > 100) {
      toast.error("Discount must be between 0% and 100%.");
      return;
    }

    if (!isEdit && !imageFile) {
      toast.error("Product main image is required.");
      return;
    }

    const formData = new FormData();
    formData.append("productName", trimmedName);
    formData.append("productDescription", trimmedDesc);
    formData.append("productPrice", String(parsedPrice));
    formData.append("productStock", String(parsedStock));
    formData.append("productDiscount", String(parsedDiscount));
    formData.append("categoryId", categoryId);

    if (imageFile) {
      formData.append("productImage", imageFile);
    }

    const success = await onSubmit(formData);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl border border-[#1A1613]/15 bg-[#FFFDF8] p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1A1613]/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E6540B]/10 text-[#E6540B] flex items-center justify-center">
              {isEdit ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1A1613]">
                {isEdit ? "Edit Product" : "Add New Product"}
              </h3>
              <p className="text-xs text-[#1A1613]/55">
                {isEdit
                  ? "Update product information, pricing, and stock"
                  : "Create a new product listing in your catalog"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-[#1A1613]/40 hover:text-[#1A1613] hover:bg-[#F4EEDF] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload Area */}
          <div>
            <label className="block text-xs font-bold text-[#1A1613] mb-1.5">
              Product Image <span className="text-[#E6540B]">*</span>
            </label>

            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-[#1A1613]/15 bg-[#FDF8ED] h-44 flex items-center justify-center group">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-white text-[#1A1613] text-xs font-semibold hover:bg-[#F4EEDF] transition-all">
                    Change Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-all"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-[#1A1613]/20 rounded-xl bg-[#FDF8ED]/50 hover:bg-[#FDF8ED] hover:border-[#E6540B]/60 transition-all cursor-pointer p-4 text-center">
                <UploadCloud className="w-8 h-8 text-[#E6540B] mb-2" />
                <span className="text-xs font-semibold text-[#1A1613]">
                  Click to upload product image
                </span>
                <span className="text-[11px] text-[#1A1613]/50 mt-0.5">
                  PNG, JPG, or WebP (max 5MB)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Row 1: Name and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1A1613] mb-1">
                Product Name <span className="text-[#E6540B]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Wireless Noise Canceling Headphones"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                required
                className="w-full h-9 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] px-3 text-xs text-[#1A1613] placeholder:text-[#1A1613]/40 focus:outline-none focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B]"
              />
              <span className="text-[10px] text-[#1A1613]/40 mt-0.5 block text-right">
                {name.length}/30
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1613] mb-1">
                Category <span className="text-[#E6540B]">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full h-9 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] px-3 text-xs text-[#1A1613] focus:outline-none focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B]"
              >
                <option value="" disabled>
                  Select a category
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.categoryName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Price, Discount & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1A1613] mb-1">
                Original Price (Rs.) <span className="text-[#E6540B]">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="any"
                placeholder="e.g. 2500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full h-9 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] px-3 text-xs text-[#1A1613] placeholder:text-[#1A1613]/40 focus:outline-none focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1613] mb-1">
                Discount (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                placeholder="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full h-9 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] px-3 text-xs text-[#1A1613] placeholder:text-[#1A1613]/40 focus:outline-none focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1613] mb-1">
                Stock Quantity <span className="text-[#E6540B]">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 50"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
                className="w-full h-9 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] px-3 text-xs text-[#1A1613] placeholder:text-[#1A1613]/40 focus:outline-none focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B]"
              />
            </div>
          </div>

          {/* Pricing Preview Badge */}
          {numPrice > 0 && (
            <div className="p-2.5 rounded-lg bg-[#F4EEDF]/40 border border-[#1A1613]/8 text-xs flex items-center justify-between">
              <span className="text-[#1A1613]/60">Customer Selling Price:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#E6540B]">
                  Rs. {finalPrice.toLocaleString()}
                </span>
                {numDiscount > 0 && (
                  <span className="text-[11px] text-[#1A1613]/40 line-through">
                    Rs. {numPrice.toLocaleString()} (-{numDiscount}%)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#1A1613] mb-1">
              Description <span className="text-[#E6540B]">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Detailed description of features, materials, and specifications..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              required
              className="w-full rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] p-3 text-xs text-[#1A1613] placeholder:text-[#1A1613]/40 focus:outline-none focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B] resize-none"
            />
            <span className="text-[10px] text-[#1A1613]/40 mt-0.5 block text-right">
              {description.length}/500
            </span>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1A1613]/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-[#1A1613]/15 text-xs font-semibold text-[#1A1613] hover:bg-[#F4EEDF] transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#E6540B] text-xs font-semibold text-white hover:bg-[#d44c0a] shadow-xs active:scale-95 transition-all disabled:opacity-50"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {loading
                  ? "Saving..."
                  : isEdit
                  ? "Update Product"
                  : "Create Product"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
