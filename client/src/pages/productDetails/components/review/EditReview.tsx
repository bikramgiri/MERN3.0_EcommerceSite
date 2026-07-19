import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useAppDispatch } from "../../../../hooks/hooks";
import ReviewFormModal from "./components/ReviewFormModal";
import { toast } from "react-toastify";
import { updateReview } from "../../../../store/customer/reviewSlice";
import axios from "axios";
import type { ApiErrorPayload } from "./AddReview";
import { Review } from "../../../../types/reviewTypes";

interface EditReviewProps {
  review: Review;
  onClose: () => void;
  onSuccess: () => void;
}

const EditReview = ({ review, onClose, onSuccess }: EditReviewProps) => {
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState({
    rating: review?.rating ? String(review.rating) : "",
    message: review?.message || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({
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

  const handleRating = (rating: string) => {
    setFormData((prev) => ({ ...prev, rating }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.rating) {
      newErrors.rating = "Rating is required";
    }
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({
      rating: "",
      message: "",
      reviewImage: "",
      general: "",
    });

    const isValid = validateForm();
    if (!isValid) {
      const Errormsg = Object.values(errors).find((err) => err);
      if (Errormsg) {
        toast.error(Errormsg);
      }
      return;
    }
    setIsSubmitting(true);

    const formDataToSend = new FormData();
    formDataToSend.append("rating", formData.rating);
    formDataToSend.append("message", formData.message.trim());
    if (file) {
      formDataToSend.append("reviewImage", file);
    }

    try {
      await dispatch(
        updateReview({ reviewId: review.id, data: formDataToSend }),
      );
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

  return (
    <ReviewFormModal
      type="edit"
      formData={formData}
      onChange={handleChange}
      onSubmit={handleSubmit}
      onDiscard={handleDiscard}
      getRootProps={getRootProps}
      getInputProps={getInputProps}
      isDragActive={isDragActive}
      isSubmitting={isSubmitting}
      file={file}
      review={review}
      onRatingChange={handleRating}
      onClose={onClose}
    />
  );
};

export default EditReview;
