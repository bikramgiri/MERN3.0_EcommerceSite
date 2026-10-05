import React, { useEffect, useState, useRef } from "react";
import { Camera, Trash2, Eye, EyeOff, Loader2, User as UserIcon, ShieldCheck } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import {
  fetchProfile,
  updateProfile,
  updateAvatar,
  deleteAvatar,
  changePassword,
} from "../../store/auth/authSlice";
import { toast } from "react-toastify";
import axios from "axios";
import { UserData, changePasswordData } from "../../types/customer/authTypes";

interface ApiErrorPayload {
  field?: string;
  message?: string;
}

const ProfileSkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-pulse font-sans">
      {/* Header Skeleton */}
      <div className="pb-4 border-b border-gray-200">
        <div className="h-7 w-44 rounded-md bg-gray-200" />
        <div className="h-4 w-72 rounded bg-gray-100 mt-2" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-6 border-b border-gray-200 pb-2">
        <div className="h-5 w-20 rounded bg-gray-200" />
        <div className="h-5 w-20 rounded bg-gray-200" />
      </div>

      {/* Card Skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs divide-y divide-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-5">
          <div className="h-5 w-36 rounded bg-gray-200" />
          <div className="h-3 w-56 rounded bg-gray-100 mt-2" />
        </div>

        {/* Avatar Row */}
        <div className="p-4 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gray-200 shrink-0" />
            <div className="space-y-2">
              <div className="h-4 w-24 rounded bg-gray-200" />
              <div className="h-3 w-36 rounded bg-gray-100" />
            </div>
          </div>
          <div className="h-8 w-28 rounded-lg bg-gray-100" />
        </div>

        {/* Inputs */}
        <div className="p-4 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <div className="h-3.5 w-16 rounded bg-gray-200" />
              <div className="h-10 w-full rounded-lg bg-gray-100" />
            </div>
            <div className="space-y-2">
              <div className="h-3.5 w-20 rounded bg-gray-200" />
              <div className="h-10 w-full rounded-lg bg-gray-100" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50/70 px-4 sm:px-6 py-3.5 flex justify-end">
          <div className="h-9 w-28 rounded-lg bg-gray-200" />
        </div>
      </div>
    </div>
  );
};

const Profile: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  // Tabs: 'general' | 'security'
  const [activeTab, setActiveTab] = useState<"general" | "security">("general");

  // Loading States
  const [isInitialLoading, setIsInitialLoading] = useState(!user?.id);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Avatar file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteAvatarModal, setShowDeleteAvatarModal] = useState(false);

  // Personal Details State
  const [formData, setFormData] = useState({
    username: "",
    email: "",
  });
  const [detailsErrors, setDetailsErrors] = useState<{ [key: string]: string }>({});

  // Change Password State
  const [passwordForm, setPasswordForm] = useState<changePasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<{ [key: string]: string }>({});
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Fetch Profile on Mount
  useEffect(() => {
    loadProfile();
  }, []);

  // Sync Form Data when User Updates
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user?.id) setIsInitialLoading(true);
    try {
      await dispatch(fetchProfile());
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // --- Avatar Handlers ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.type)) {
      toast.error("Please upload a JPG, JPEG, or PNG image.");
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB.");
      e.target.value = "";
      return;
    }

    const payload = new FormData();
    payload.append("avatar", file);

    setIsUploadingAvatar(true);
    try {
      await dispatch(updateAvatar(payload));
      toast.success("Profile photo updated");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error((error.response?.data as ApiErrorPayload)?.message || "Failed to update photo");
      } else {
        toast.error("Failed to update photo");
      }
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleDeleteAvatar = async () => {
    setIsDeletingAvatar(true);
    try {
      await dispatch(deleteAvatar());
      toast.success("Profile photo removed");
      setShowDeleteAvatarModal(false);
    } catch (error) {
      toast.error("Failed to remove photo");
    } finally {
      setIsDeletingAvatar(false);
    }
  };

  // --- Profile Details Handlers ---
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setDetailsErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleDiscardChanges = () => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
      });
      setDetailsErrors({});
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!formData.username.trim()) {
      errors.username = "Username is required";
    } else if (formData.username.length < 3 || formData.username.length > 20) {
      errors.username = "Must be between 3 and 20 characters";
    }

    if (!formData.email.trim()) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (Object.keys(errors).length > 0) {
      setDetailsErrors(errors);
      return;
    }

    setIsUpdatingProfile(true);
    try {
      await dispatch(updateProfile(formData as UserData));
      toast.success("Profile updated");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errData = error.response?.data as ApiErrorPayload;
        if (errData?.field && errData.field !== "general") {
          setDetailsErrors({ [errData.field]: errData.message || "Invalid input" });
        }
        toast.error(errData?.message || "Failed to update profile");
      } else {
        toast.error("Failed to update profile");
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // --- Password Handlers ---
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setPasswordErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = "Enter your current password";
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = "Enter a new password";
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters";
    }
    if (!passwordForm.confirmNewPassword) {
      errors.confirmNewPassword = "Confirm your new password";
    } else if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      errors.confirmNewPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setIsChangingPassword(true);
    try {
      await dispatch(changePassword(passwordForm));
      toast.success("Password changed successfully");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setPasswordErrors({});
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errData = error.response?.data as ApiErrorPayload;
        if (errData?.field && errData.field !== "general") {
          setPasswordErrors({ [errData.field]: errData.message || "Error" });
        }
        toast.error(errData?.message || "Failed to change password");
      } else {
        toast.error("Failed to change password");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Has Form Changed?
  const isDirty =
    formData.username !== (user?.username || "") ||
    formData.email !== (user?.email || "");

  // Formatted date
  const memberDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  if (isInitialLoading && !user?.id) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 font-sans">
      {/* 1. Page Header */}
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-heading">
          Profile Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account information, profile picture, and login credentials.
        </p>
      </div>

      {/* 2. Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`pb-3 px-4 text-sm font-medium border-b-2 inline-flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === "general"
              ? "border-[#E6540B] text-[#E6540B]"
              : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>General</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`pb-3 px-4 text-sm font-medium border-b-2 inline-flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === "security"
              ? "border-[#E6540B] text-[#E6540B]"
              : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Security</span>
        </button>
      </div>

      {/* TAB 1: General Details */}
      {activeTab === "general" && (
        <form
          onSubmit={handleProfileSubmit}
          className="bg-white rounded-xl border border-gray-200 shadow-2xs divide-y divide-gray-100 overflow-hidden"
        >
          {/* Card Header */}
          <div className="px-4 sm:px-6 py-5">
            <h2 className="text-base font-semibold text-gray-900">Personal Information</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Update your photo and personal details.
            </p>
          </div>

          {/* Avatar Section */}
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 rounded-full overflow-hidden shrink-0 border-2 border-[#E6540B]/25">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username || "Profile"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-semibold bg-[#E6540B] text-[#FDF8ED] font-['Fraunces',serif] uppercase">
                    {user?.username ? user.username.charAt(0).toUpperCase() : "A"}
                  </div>
                )}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900">Profile photo</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  JPG, JPEG, or PNG under 10MB.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/jpg"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-gray-500" />
                <span>{isUploadingAvatar ? "Uploading..." : "Change photo"}</span>
              </button>

              {user?.avatar && (
                <button
                  type="button"
                  onClick={() => setShowDeleteAvatarModal(true)}
                  disabled={isDeletingAvatar || isUploadingAvatar}
                  className="p-2 text-xs rounded-lg border border-gray-300 text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
                  title="Remove photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="p-4 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Username */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleFormChange}
                  placeholder="Username"
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none transition-colors ${
                    detailsErrors.username
                      ? "border-red-500 focus:border-red-500 bg-red-50/20"
                      : "border-gray-300 focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B]"
                  }`}
                />
                {detailsErrors.username && (
                  <p className="mt-1 text-xs text-red-600">{detailsErrors.username}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="Email"
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none transition-colors ${
                    detailsErrors.email
                      ? "border-red-500 focus:border-red-500 bg-red-50/20"
                      : "border-gray-300 focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B]"
                  }`}
                />
                {detailsErrors.email && (
                  <p className="mt-1 text-xs text-red-600">{detailsErrors.email}</p>
                )}
              </div>
            </div>

            {/* Readonly info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-gray-100">
              <div>
                <span className="block text-xs font-medium text-gray-500">Account role</span>
                <span className="inline-block mt-1 text-xs font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded capitalize">
                  {user?.role || "Admin"}
                </span>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500">Member since</span>
                <span className="text-xs font-medium text-gray-700 mt-1 inline-block">
                  {memberDate}
                </span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="bg-gray-50/70 px-4 sm:px-6 py-3.5 flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs text-gray-500 flex items-center gap-1.5">
              {isDirty ? (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-amber-700 font-medium">Unsaved changes</span>
                </>
              ) : (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                  <span>All changes saved</span>
                </>
              )}
            </span>

            <div className="flex items-center gap-2">
              {isDirty && (
                <button
                  type="button"
                  onClick={handleDiscardChanges}
                  disabled={isUpdatingProfile}
                  className="rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer"
                >
                  Discard
                </button>
              )}
              <button
                type="submit"
                disabled={isUpdatingProfile || !isDirty}
                className="inline-flex items-center gap-2 rounded-lg bg-[#E6540B] px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#d44c0a] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isUpdatingProfile ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save changes</span>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: Security */}
      {activeTab === "security" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs divide-y divide-gray-100 overflow-hidden max-w-2xl">
          <div className="px-6 py-5">
            <h2 className="text-base font-semibold text-gray-900">Change Password</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Ensure your account is using a long, random password to stay secure.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            <div className="p-6 space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Current password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    className={`w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm text-gray-900 focus:outline-none transition-colors ${
                      passwordErrors.currentPassword
                        ? "border-red-500 bg-red-50/20"
                        : "border-gray-300 focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-xs text-red-600">{passwordErrors.currentPassword}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? "text" : "password"}
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Minimum 8 characters"
                    className={`w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm text-gray-900 focus:outline-none transition-colors ${
                      passwordErrors.newPassword
                        ? "border-red-500 bg-red-50/20"
                        : "border-gray-300 focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-xs text-red-600">{passwordErrors.newPassword}</p>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    name="confirmNewPassword"
                    value={passwordForm.confirmNewPassword}
                    onChange={handlePasswordChange}
                    placeholder="Re-enter new password"
                    className={`w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm text-gray-900 focus:outline-none transition-colors ${
                      passwordErrors.confirmNewPassword
                        ? "border-red-500 bg-red-50/20"
                        : "border-gray-300 focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.confirmNewPassword && (
                  <p className="mt-1 text-xs text-red-600">{passwordErrors.confirmNewPassword}</p>
                )}
              </div>
            </div>

            {/* Action Footer */}
            <div className="bg-gray-50/70 px-6 py-3.5 flex items-center justify-end">
              <button
                type="submit"
                disabled={isChangingPassword}
                className="inline-flex items-center gap-2 rounded-lg bg-[#E6540B] px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#d44c0a] transition-all disabled:opacity-50 cursor-pointer"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Update password</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Photo Confirmation Modal */}
      {showDeleteAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Remove profile photo?</h3>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              Your photo will be deleted and replaced with your default initial.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteAvatarModal(false)}
                disabled={isDeletingAvatar}
                className="px-3.5 py-2 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAvatar}
                disabled={isDeletingAvatar}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                {isDeletingAvatar ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <span>Remove</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
