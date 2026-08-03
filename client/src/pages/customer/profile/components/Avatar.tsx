import { useState, useRef } from "react";
import { Trash2, Camera, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../../hooks/hooks";
import { toast } from "react-toastify";
import { deleteAvatar, updateAvatar } from "../../../../store/auth/authSlice";
import axios from "axios";

interface ApiErrorPayload {
  field?: string;
  message?: string;
}

const Avatar = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const effectiveUser = user || storedUser;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [errors, setErrors] = useState({
    avatar: "",
    general: "",
  });

  const handleChangeAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrors({ avatar: "", general: "" });

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      const msg = "Only JPG, JPEG, or PNG files are allowed.";
      setErrors((prev) => ({ ...prev, avatar: msg }));
      toast.error(msg);
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      const msg = "File size must be less than 10MB.";
      setErrors((prev) => ({ ...prev, avatar: msg }));
      toast.error(msg);
      e.target.value = "";
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("avatar", file);

    setIsUploading(true);
    try {
      await dispatch(updateAvatar(formDataToSend));
      toast.success("Avatar updated successfully!");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errData = error.response?.data as ApiErrorPayload | undefined;
        const httpStatus = error.response?.status;

        if (
          errData &&
          httpStatus !== undefined &&
          httpStatus >= 400 &&
          httpStatus < 500
        ) {
          const field = errData.field;
          const msg = errData.message || "Upload failed";

          if (field && ["avatar", "general"].includes(field)) {
            setErrors((prev) => ({ ...prev, [field]: msg }));
          } else {
            setErrors((prev) => ({ ...prev, general: msg }));
          }
          toast.error(msg);
          setIsUploading(false);
          return;
        }
      }

      setErrors((prev) => ({
        ...prev,
        general: "Something went wrong. Please try again.",
      }));
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const renderAvatar = () => {
    if (effectiveUser?.avatar) {
      return (
        <img
          className="w-20 h-20 rounded-full object-cover border-2 border-[#E6540B]/30"
          src={effectiveUser.avatar}
          alt="User avatar"
        />
      );
    }

    const initials = effectiveUser?.username?.charAt(0).toUpperCase() || "U";
    return (
      <div className="w-20 h-20 rounded-full bg-[#E6540B] text-[#FDF8ED] flex items-center justify-center font-['Fraunces',serif] font-semibold text-3xl">
        {initials}
      </div>
    );
  };

  const handleRemoveAvatar = async () => {
    setIsDeleting(true);
    try {
      await dispatch(deleteAvatar());
      toast.success("Avatar deleted successfully!");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errData = error.response?.data as ApiErrorPayload | undefined;
        const httpStatus = error.response?.status;

        if (
          errData &&
          httpStatus !== undefined &&
          httpStatus >= 400 &&
          httpStatus < 500
        ) {
          const field = errData.field;
          const msg = errData.message || "Delete failed";

          if (field && ["avatar", "general"].includes(field)) {
            setErrors((prev) => ({ ...prev, [field]: msg }));
          } else {
            setErrors((prev) => ({ ...prev, general: msg }));
          }
          toast.error(msg);
          setIsDeleting(false);
          return;
        }
      }

      setErrors((prev) => ({
        ...prev,
        general: "Something went wrong. Please try again.",
      }));
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="font-['Inter',sans-serif]">
      <label className="block text-xs font-['IBM_Plex_Mono',monospace] uppercase tracking-[0.15em] text-[#1A1613]/60 mb-3">
        Profile Photo
      </label>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 bg-[#F4EEDF] flex items-center justify-center border border-[#1A1613]/10">
          {renderAvatar()}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleChangeAvatarClick}
              disabled={isUploading}
              className={`cursor-pointer rounded-sm px-3 py-1.5 border border-[#E6540B] text-[#E6540B] text-sm flex items-center gap-2 transition ${
                isUploading
                  ? "bg-[#F4EEDF] cursor-not-allowed opacity-70"
                  : "bg-[#FDF8ED] hover:bg-[#E6540B]/10"
              }`}
            >
              <Camera size={16} />
              {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isUploading ? "Uploading..." : "Change Photo"}
            </button>

            {effectiveUser?.avatar && (
              <button
                onClick={handleRemoveAvatar}
                disabled={isDeleting}
                className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-sm text-[#FDF8ED] transition-colors ${
                  isDeleting
                    ? "bg-[#8B2E1F]/60 cursor-not-allowed"
                    : "bg-[#8B2E1F] hover:bg-[#6e2417]"
                }`}
              >
                <Trash2 size={16} />
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isDeleting ? "Removing..." : "Remove Avatar"}
              </button>
            )}
          </div>

          <p className="text-xs text-[#1A1613]/50">
            JPG, JPEG or PNG. 1MB max.
          </p>
          {errors.avatar && (
            <p className="text-xs text-[#8B2E1F]">{errors.avatar}</p>
          )}
          {errors.general && (
            <p className="text-xs text-[#8B2E1F]">{errors.general}</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Avatar;
