import React from "react";
import { X, Loader2, Plus, Edit } from "lucide-react";
import type { Review } from "../../../../../types/reviewTypes";
import { DropzoneInputProps, DropzoneRootProps } from "react-dropzone";

interface ReviewFormData {
  rating: string;
  message: string;
}

interface ReviewFormModalProps {
  type: "add" | "edit";
  formData: ReviewFormData;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onDiscard: () => void;
  onRatingChange?: (rating: string) => void; 
  getRootProps: (props?: DropzoneRootProps) => DropzoneRootProps;
  getInputProps:  (props?: DropzoneInputProps) => DropzoneInputProps;
  isDragActive: boolean;
  isSubmitting: boolean;
  file: File | null;
  review?: Review;
  onClose: () => void;
  onClearFile?: () => void; // *Clears a newly-selected (not yet uploaded) file
  onRemoveExistingImage?: () => void; // *Marks the already-saved review image for removal (edit only)
  imageRemoved?: boolean; 
}

const ReviewFormModal: React.FC<ReviewFormModalProps> = ({
  type,
  review,
  file,
  onClose,
  onSubmit,
  onChange,
  onDiscard,
  getRootProps,
  getInputProps,
  isDragActive,
  isSubmitting,
  formData,
  onRatingChange,
  onClearFile,
  onRemoveExistingImage,
  imageRemoved = false,
}) => {
  const isEdit = type === "edit";

  const isFormInvalid = () => {
    const requiredMissing =
      !(formData.rating || "") || !(formData.message || "").trim();

    if (requiredMissing) return true;

    // Edit mode: disable if NOTHING changed
    if (isEdit) {
      const noChange =
        formData.rating === String(review?.rating ?? "") &&
        formData.message.trim() === review?.message &&
        !file && // no new image uploaded
        !imageRemoved; // existing image not removed

      return noChange;
    }

    return false;
  };

  const showCurrentImage = !file && !imageRemoved && review?.reviewImage && review.reviewImage.length > 0;

  return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 overflow-y-auto">
      <div className="w-full max-w-xl my-8 bg-[#FDF8ED] rounded-2xl shadow-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-8 py-4 bg-[#E6540B] rounded-t-xl">
          <h2 className="text-2xl font-['Fraunces',serif] font-semibold text-[#FDF8ED]">
            {isEdit ? "Edit Review" : "Add New Review"}
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer p-2 rounded-full hover:bg-[#c94806] transition"
          >
            <X className="h-6 w-6 text-[#FDF8ED]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#FDF8ED]">
          <form onSubmit={onSubmit} className="p-8 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#1A1613] mb-2">
                Rating
              </label>
              <span className="ms-2 flex justify-center text-lg font-bold text-[#1A1613]">
                {formData.rating || "0"} out of 5
              </span>
              <div className="flex items-center justify-center mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`cursor-pointer h-6 w-6 ${
                      star <= Number(formData.rating || 0)
                        ? "text-[#E6540B]"
                        : "text-[#1A1613]/15"
                    }`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 22 20"
                    onClick={() =>
                      onRatingChange && onRatingChange(star.toString())
                    }
                  >
                    <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z" />
                  </svg>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1A1613] mb-2">
                Review Description
              </label>
              <textarea
                name="message"
                placeholder="Enter review message"
                value={formData.message}
                onChange={onChange}
                rows={3}
                className="w-full px-3 py-3 border border-[#1A1613]/15 rounded-lg text-[#1A1613] bg-[#FDF8ED] focus:ring-1 focus:ring-[#E6540B] focus:border-[#E6540B] resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1A1613] mb-2">
                {isEdit ? (
                  <>
                    Add real photos of the product to help other customers{" "}
                    <span className="text-[#1A1613]/50">
                      (Optional - upload new to replace)
                    </span>
                  </>
                ) : (
                  <>
                    Add real photos of the product to help other customers{" "}
                    <span className="text-[#1A1613]/50">(Optional)</span>
                  </>
                )}
              </label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition ${
                  isDragActive
                    ? "border-[#E6540B] bg-[#F4EEDF]"
                    : "border-[#1A1613]/20 hover:border-[#1A1613]/35"
                }`}
              >
                <input {...getInputProps()} />
                {file ? (
                  <div className="space-y-2">
                    <div className="relative inline-block">
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className="mx-auto max-h-60 rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClearFile?.();
                        }}
                        className="cursor-pointer absolute -top-2 -right-2 p-1 rounded-full bg-[#9B3A2E] hover:bg-[#7a2e24] text-[#FDF8ED] shadow-md transition"
                        title="Remove selected image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-[#1A1613]/70">{file.name}</p>
                  </div>
                ) : showCurrentImage ? (
                  <div className="space-y-2">
                    <div className="relative inline-block">
                      <img
                        src={review!.reviewImage}
                        alt="Current"
                        className="mx-auto max-h-60 rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveExistingImage?.();
                        }}
                        className="cursor-pointer absolute -top-2 -right-2 p-1 rounded-full bg-[#9B3A2E] hover:bg-[#7a2e24] text-[#FDF8ED] shadow-md transition"
                        title="Remove current image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-[#1A1613]/70">
                      Current image (upload new to replace)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg
                      className="mx-auto h-16 w-16 text-[#1A1613]/30"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-sm text-[#1A1613]/70">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-[#1A1613]/50">
                      PNG, JPG, JPEG (MAX. 1MB)
                    </p>
                    {isEdit && imageRemoved && (
                      <p className="text-xs text-[#9B3A2E] font-medium">
                        Current image will be removed on update
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-6 pb-6 sticky bottom-0 bg-[#FDF8ED] border-t border-[#1A1613]/15">
              <button
                type="submit"
                disabled={isSubmitting || isFormInvalid()}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-[#FDF8ED] font-semibold rounded-lg transition ${
                  isSubmitting || isFormInvalid()
                    ? "bg-[#E6540B]/40 cursor-not-allowed"
                    : "bg-[#E6540B] hover:bg-[#c94806] cursor-pointer"
                }`}
              >
                {isSubmitting && (
                  <Loader2 className="animate-spin inline-block w-5 h-5 mr-2" />
                )}
                {isEdit ? (
                  <Edit className="inline-block w-4 h-4" />
                ) : (
                  <Plus className="inline-block w-4 h-4" />
                )}
                {isEdit ? "Update Review" : "Add Review"}
              </button>

              <button
                type="button"
                onClick={onDiscard}
                className="cursor-pointer flex-1 px-6 py-3 bg-[#F4EEDF] border border-[#1A1613]/15 text-[#1A1613] font-semibold rounded-lg hover:bg-[#1A1613]/10 transition"
              >
                <X className="inline-block w-5 h-5 mr-2" />
                Discard
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewFormModal;
