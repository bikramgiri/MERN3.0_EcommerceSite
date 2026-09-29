import React, { useEffect, useState } from "react";
import { Plus, Edit, X, UploadCloud, RefreshCw } from "lucide-react";
import { AdminCategory } from "../../../types/admin/categoryTypes";
import { toast } from "react-toastify";

interface CategoryModalProps {
  isOpen: boolean;
  category: AdminCategory | null;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<boolean>;
  loading: boolean;
}

const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  category,
  onClose,
  onSubmit,
  loading,
}) => {
  const isEdit = Boolean(category);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setName(category.categoryName || "");
      setDescription(category.categoryDescription || "");
      setImagePreview(category.categoryImage || null);
      setImageFile(null);
    } else {
      setName("");
      setDescription("");
      setImagePreview(null);
      setImageFile(null);
    }
  }, [category, isOpen]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedDesc = description.trim();

    if (!trimmedName || !trimmedDesc) {
      toast.error("Category name and description are required.");
      return;
    }
    if (trimmedName.length < 5 || trimmedName.length > 30) {
      toast.error("Category name must be between 5 and 30 characters.");
      return;
    }
    if (trimmedDesc.length < 5 || trimmedDesc.length > 100) {
      toast.error("Category description must be between 5 and 100 characters.");
      return;
    }
    if (!isEdit && !imageFile) {
      toast.error("Category banner image is required.");
      return;
    }

    const formData = new FormData();
    formData.append("categoryName", trimmedName);
    formData.append("categoryDescription", trimmedDesc);
    if (imageFile) {
      formData.append("categoryImage", imageFile);
    }

    const success = await onSubmit(formData);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-[#1A1613]/15 bg-[#FFFDF8] p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1A1613]/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E6540B]/10 text-[#E6540B] flex items-center justify-center">
              {isEdit ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1A1613]">
                {isEdit ? "Edit Category" : "Create New Category"}
              </h3>
              <p className="text-xs text-[#1A1613]/60">
                {isEdit
                  ? "Update department title, description, or banner image"
                  : "Add a new category collection to your product catalog"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-[#1A1613]/40 hover:text-[#1A1613] hover:bg-[#F4EEDF]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Name */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#1A1613]">
                Category Name <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[10px] ${
                  name.length >= 5 && name.length <= 30
                    ? "text-emerald-600 font-semibold"
                    : "text-[#1A1613]/40"
                }`}
              >
                {name.length} / 30 chars (min 5)
              </span>
            </div>
            <input
              type="text"
              placeholder="e.g. Footwear & Shoes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              className="w-full h-10 px-3 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] text-xs text-[#1A1613] placeholder:text-[#1A1613]/40 focus:outline-none focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B]"
              required
            />
          </div>

          {/* Category Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#1A1613]">
                Description <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[10px] ${
                  description.length >= 5 && description.length <= 100
                    ? "text-emerald-600 font-semibold"
                    : "text-[#1A1613]/40"
                }`}
              >
                {description.length} / 100 chars (min 5)
              </span>
            </div>
            <textarea
              placeholder="Describe what shoppers will discover in this department..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
              rows={3}
              className="w-full p-3 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] text-xs text-[#1A1613] placeholder:text-[#1A1613]/40 focus:outline-none focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B] resize-none"
              required
            />
          </div>

          {/* Category Image Upload */}
          <div>
            <label className="text-xs font-semibold text-[#1A1613] block mb-1">
              Category Banner Image {!isEdit && <span className="text-rose-500">*</span>}
            </label>
            {imagePreview ? (
              <div className="relative rounded-xl border border-[#1A1613]/15 bg-[#FDF8ED] p-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-14 h-14 rounded-lg object-cover border border-[#1A1613]/10"
                  />
                  <div>
                    <p className="text-xs font-semibold text-[#1A1613] truncate max-w-[200px]">
                      {imageFile ? imageFile.name : isEdit ? "Current Banner Image" : "Selected Image"}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-medium">
                      {imageFile ? "New file ready for upload" : "Using saved category banner"}
                    </p>
                  </div>
                </div>
                {isEdit ? (
                  <label className="px-3 py-1.5 rounded-lg border border-[#1A1613]/15 bg-[#FFFDF8] text-[11px] font-semibold text-[#1A1613] hover:bg-[#F4EEDF] cursor-pointer">
                    Change
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#1A1613]/20 rounded-xl p-5 bg-[#FDF8ED]/50 hover:bg-[#FDF8ED] cursor-pointer transition-colors group">
                <UploadCloud className="w-8 h-8 text-[#E6540B] group-hover:scale-110 transition-transform mb-1.5" />
                <span className="text-xs font-semibold text-[#1A1613]">
                  {isEdit ? "Upload replacement banner image" : "Click to choose banner image"}
                </span>
                <span className="text-[10px] text-[#1A1613]/50 mt-0.5">
                  JPG, PNG, or WebP up to 5MB
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

          {/* Modal Actions */}
          <div className="pt-3 border-t border-[#1A1613]/10 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-[#1A1613]/15 text-xs font-semibold text-[#1A1613] hover:bg-[#F4EEDF] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#E6540B] text-xs font-semibold text-white hover:bg-[#d44c0a] transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{isEdit ? "Saving..." : "Creating..."}</span>
                </>
              ) : isEdit ? (
                <span>Save Changes</span>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Category</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;
