import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useAppDispatch } from "../../../../hooks/hooks";
import ReviewFormModal from "./components/ReviewFormModal";
import { toast } from "react-toastify";
import { addReview } from "../../../../store/customer/reviewSlice";
import axios from "axios";

interface AddReviewProps {
  productId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export interface ApiErrorPayload {
  field?: string;
  message?: string;
}

const AddReview = ({ productId, onClose, onSuccess }: AddReviewProps) => {
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState({
    rating: "",
    message: "",
  });
  const [errors, setErrors] = useState({
    rating: "",
    message: "",
    reviewImage: "",
    general: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setErrors((prev) => ({ ...prev, reviewImage: "", general: "" }));
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".gif"] },
    maxFiles: 1,
    maxSize: 1 * 1024 * 1024,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
  };

  const handleClearFile = () => {
    setFile(null);
  };

  const validateForm = () => {
    const newErrors = { rating: "", message: "", reviewImage: "", general: "" };

    if (!formData.rating) {
      newErrors.rating = "Rating is required";
    }
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    }
    if (!file) {
      newErrors.reviewImage = "Review image is required";
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({
      rating: "",
      message: "",
      reviewImage: "",
      general: "",
    });

    if (!validateForm()) {
      const Errormsg = Object.values(errors).find((error) => error);
      if (Errormsg) {
        toast.error(Errormsg);
        return;
      }
    }

    setIsSubmitting(true);

    const formDataToSend = new FormData();
    formDataToSend.append("rating", formData.rating);
    formDataToSend.append("message", formData.message.trim());
    if (file) {
      formDataToSend.append("reviewImage", file);
    }

    try {
      await dispatch(addReview({ data: formDataToSend, productId: productId }));
      onSuccess();
      onClose();
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
          const msg = errData.message || "Failed to add review";

          if (field && ["rating", "message", "reviewImage"].includes(field)) {
            setErrors((prev) => ({ ...prev, [field]: msg }));
            toast.error(msg);
          } else {
            setErrors((prev) => ({ ...prev, general: msg }));
            toast.error(msg);
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

  const handleRating = (rating: string) => {
    setFormData((prev) => ({ ...prev, rating }));
  };

  return (
    <ReviewFormModal
      type="add"
      formData={formData}
      onRatingChange={handleRating}
      onChange={handleChange}
      onSubmit={handleSubmit}
      onDiscard={handleDiscard}
      getRootProps={getRootProps}
      getInputProps={getInputProps}
      isDragActive={isDragActive}
      isSubmitting={isSubmitting}
      file={file}
      onClose={onClose}
      onClearFile={handleClearFile}
    />
  );
};

export default AddReview;
