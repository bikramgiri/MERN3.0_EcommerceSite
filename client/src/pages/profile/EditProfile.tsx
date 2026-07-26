import React, { useState } from "react";
import { useAppDispatch } from "../../hooks/hooks";
import { toast } from "react-toastify";
import ProfileFormModal from "./components/ProfileFormModel";
import { updateProfile } from "../../store/auth/authSlice";
import axios from "axios";
import { UserData } from "../../types/authTypes";

interface ApiErrorPayload {
  field?: string;
  message?: string;
}

interface EditProfileProps {
  user: UserData | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const EditProfile = ({ user, onClose, onSuccess }: EditProfileProps) => {
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
  });

  const [, setErrors] = useState({
    username: "",
    email: "",
    general: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({ username: "", email: "", general: "" });

    if (isSubmitting) return;

    let hasError = false;
    const newErrors = { username: "", email: "", general: "" };

    if (!formData.username) {
      newErrors.username = "Username is required";
      hasError = true;
      toast.error(newErrors.username);
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
      hasError = true;
      toast.error(newErrors.email);
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid email format";
      hasError = true;
      toast.error(newErrors.email);
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await dispatch(updateProfile(formData as UserData));
      onSuccess?.();
      onClose();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errData = error.response?.data as ApiErrorPayload | undefined;
        const httpStatus = error.response?.status;

        if (errData && httpStatus !== undefined && httpStatus >= 400 && httpStatus < 500) {
          const field = errData.field;
          const msg = errData.message || "Update failed";

          if (field && ["username", "email", "general"].includes(field)) {
            setErrors((prev) => ({ ...prev, [field]: msg }));
          } else {
            setErrors((prev) => ({ ...prev, general: msg }));
          }
          toast.error(msg);
          setIsSubmitting(false);
          return;
        }
      }

      setErrors((prev) => ({
        ...prev,
        general: "Something went wrong. Please try again.",
      }));
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => {
    onClose();
  };

  return (
    <ProfileFormModal
      type="edit"
      formData={formData}
      onChange={handleChange}
      onSubmit={handleSubmit}
      onDiscard={handleDiscard}
      isSubmitting={isSubmitting}
      profile={user}
      onClose={onClose}
    />
  );
};

export default EditProfile;