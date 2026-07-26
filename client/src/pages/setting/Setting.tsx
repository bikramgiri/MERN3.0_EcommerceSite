import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { FaLock } from "react-icons/fa";
import { FaCheck, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { changePassword, logout } from "../../store/auth/authSlice";
import { useAppDispatch } from "../../hooks/hooks";
import Breadcrumb from "../../global/components/Breadcrumb";
import axios from "axios";
import { changePasswordData } from "../../types/authTypes";

interface ApiErrorPayload {
  field?: string;
  message?: string;
}

interface ValidationCheckProps {
  passed: boolean;
  label: string;
}

interface FormErrors {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  general: string;
}

const ValidationCheck = ({ passed, label }: ValidationCheckProps) => (
  <div
    className={`flex items-center gap-2 text-sm transition-all ${
      passed ? "text-[#E6540B]" : "text-[#1A1613]/35"
    }`}
  >
    {passed ? (
      <FaCheck className="text-[#E6540B]" />
    ) : (
      <FaTimes className="text-[#1A1613]/25" />
    )}
    <span className={passed ? "font-medium" : ""}>{label}</span>
  </div>
);

const Setting = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [isChanging, setIsChanging] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [errors, setErrors] = useState<FormErrors>({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
    general: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
  };

  const passwordChecks = {
    minLength: formData.newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(formData.newPassword),
    hasLowercase: /[a-z]/.test(formData.newPassword),
    hasSpecialCharacter: /[^A-Za-z0-9]/.test(formData.newPassword),
    hasNumber: /\d/.test(formData.newPassword),
  };

  const allChecksPassed = Object.values(passwordChecks).every(Boolean);

  const getPasswordStrength = () => {
    const password = formData.newPassword;
    if (!password) return { label: "", color: "", width: "0%" };

    const length = password.length;

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialCharacter = /[^A-Za-z0-9]/.test(password);

    const criteriaMet = [
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialCharacter,
    ].filter(Boolean).length;

    if (length >= 8 && criteriaMet === 4) {
      return { label: "Strong", color: "bg-green-500", width: "100%" };
    }

    if (length >= 5 && length <= 7 && criteriaMet >= 3) {
      return { label: "Good", color: "bg-yellow-500", width: "75%" };
    }

    if (length >= 3 && length <= 4 && criteriaMet >= 2) {
      return { label: "Fair", color: "bg-orange-500", width: "50%" };
    }

    if (length > 0) {
      return { label: "Weak", color: "bg-red-500", width: "25%" };
    }

    return { label: "", color: "", width: "0%" };
  };

  const passwordStrength = getPasswordStrength();

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
      general: "",
    };

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = "Current password is required";
    }
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    }
    if (!formData.confirmNewPassword.trim()) {
      newErrors.confirmNewPassword = "Please confirm your new password";
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
      general: "",
    });

    if (!allChecksPassed) {
      toast.error("Please meet all password requirements");
      return;
    }

    if (isChanging) return; 

    const newErrors = validateForm();
    const isValid = Object.values(newErrors).every((val) => !val);
    if (!isValid) {
      const firstErrorMsg = Object.values(newErrors).find((err) => err);
      if (firstErrorMsg) {
        toast.error(firstErrorMsg);
      }
      return;
    }

    setIsChanging(true);

    const payload = {
      currentPassword: formData.currentPassword.trim(),
      newPassword: formData.newPassword.trim(),
      confirmNewPassword: formData.confirmNewPassword.trim(),
    };

    try {
      await dispatch(changePassword(payload as changePasswordData));
      dispatch(logout());
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      toast.success("Password updated successfully!");
      navigate("/login?changePassword=true");

      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setErrors({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
        general: "",
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errData = error.response?.data as ApiErrorPayload | undefined;
        const httpStatus = error.response?.status;

        if (errData && httpStatus !== undefined && httpStatus >= 400 && httpStatus < 500) {
          const field = errData.field;
          const msg = errData.message || "Update failed";

          if (field && ["currentPassword", "newPassword", "confirmNewPassword", "general"].includes(field)) {
            setErrors((prev) => ({ ...prev, [field]: msg }));
          } else {
            setErrors((prev) => ({ ...prev, general: msg }));
          }
          toast.error(msg);
          setIsChanging(false);
          return;
        }
      }

      setErrors((prev) => ({
        ...prev,
        general: "Something went wrong. Please try again.",
      }));
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <>
      <div className="bg-[#FDF8ED] py-6 md:py-10">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mt-10">
          <Breadcrumb items={[{ label: "Setting" }]} />
          </div>
          <div className="border border-[#1A1613]/10 p-4 lg:p-6 rounded-2xl mt-4">
            <div className="flex flex-col md:flex-row gap-5 items-start">
              <div className="hidden md:block w-70 shrink-0">
                <h1 className="font-['Fraunces',serif] font-bold text-2xl text-[#1A1613]">
                  Change Password
                </h1>
                <p className="text-md text-[#1A1613]/60 mt-0.5">
                  Update your account password regularly to keep your account
                  secure.
                </p>
              </div>

              <main className="w-full flex-1 p-4 md:p-6 bg-white rounded-2xl shadow-sm border border-[#1A1613]/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#E6540B]/10 rounded-full -mr-16 -mt-16" />

                <div className="space-y-1 relative z-10">
                  <form onSubmit={handleSubmit} className="space-y-6 w-full">
                    <div>
                      <label className="block text-sm font-medium text-[#1A1613]/80 mb-1.5">
                        Current Password
                      </label>
                      <div className="relative">
                        <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1613]/40" />
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          id="currentPassword"
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleChange}
                          placeholder="Enter current password"
                          className={`w-full pl-12 pr-12 border rounded-xl px-4 py-3 text-sm text-[#1A1613] placeholder-[#1A1613]/35 focus:outline-none focus:ring-0.5 focus:ring-[#E6540B] focus:border-[#E6540B] transition ${
                            errors.currentPassword
                              ? "border-red-500"
                              : formData.currentPassword && allChecksPassed
                                ? "border-[#E6540B]"
                                : "border-[#1A1613]/20"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                          className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 text-[#1A1613]/40 hover:text-[#1A1613]/70 focus:outline-none"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      {errors.currentPassword && (
                        <p className="mt-1 text-xs text-red-600">{errors.currentPassword}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#1A1613]/80 mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1613]/40" />
                        <input
                          type={showNewPassword ? "text" : "password"}
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleChange}
                          placeholder="Enter new password"
                          className={`w-full pl-12 pr-12 border rounded-xl px-4 py-3 text-sm text-[#1A1613] placeholder-[#1A1613]/35 focus:outline-none focus:ring-0.5 focus:ring-[#E6540B] focus:border-[#E6540B] transition ${
                            errors.newPassword
                              ? "border-red-500"
                              : formData.newPassword && allChecksPassed
                                ? "border-[#E6540B]"
                                : "border-[#1A1613]/20"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 text-[#1A1613]/40 hover:text-[#1A1613]/70 focus:outline-none"
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      {errors.newPassword && (
                        <p className="mt-1 text-xs text-red-600">{errors.newPassword}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#1A1613]/80 mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1613]/40" />
                        <input
                          type={showConfirmNewPassword ? "text" : "password"}
                          id="confirmNewPassword"
                          name="confirmNewPassword"
                          value={formData.confirmNewPassword}
                          onChange={handleChange}
                          placeholder="Confirm new password"
                          className={`w-full pl-12 pr-12 border rounded-xl px-4 py-3 text-sm text-[#1A1613] placeholder-[#1A1613]/35 focus:outline-none focus:ring-0.5 focus:ring-[#E6540B] focus:border-[#E6540B] transition ${
                            errors.confirmNewPassword
                              ? "border-red-500"
                              : formData.confirmNewPassword && allChecksPassed
                                ? "border-[#E6540B]"
                                : "border-[#1A1613]/20"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmNewPassword(!showConfirmNewPassword)
                          }
                          className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 text-[#1A1613]/40 hover:text-[#1A1613]/70 focus:outline-none"
                        >
                          {showConfirmNewPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      {errors.confirmNewPassword && (
                        <p className="mt-1 text-xs text-red-600">{errors.confirmNewPassword}</p>
                      )}
                      {!errors.confirmNewPassword &&
                        formData.confirmNewPassword &&
                        formData.confirmNewPassword === formData.newPassword && (
                          <p className="mt-1 text-xs text-green-600 font-medium">Password is matched</p>
                        )}

                      {formData.newPassword && (
                        <div className="mt-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-[#1A1613]/50">
                              Password Strength
                            </span>
                            <span
                              className={`text-xs font-semibold ${
                                passwordStrength.label === "Strong"
                                  ? "text-green-600"
                                  : passwordStrength.label === "Good"
                                    ? "text-yellow-600"
                                    : passwordStrength.label === "Fair"
                                      ? "text-orange-600"
                                      : "text-red-600"
                              }`}
                            >
                              {passwordStrength.label}
                            </span>
                          </div>
                          <div className="h-1 bg-[#1A1613]/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${passwordStrength.color} transition-all duration-300`}
                              style={{ width: passwordStrength.width }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {formData.newPassword && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-[#1A1613]/60">
                            Password Requirements:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <ValidationCheck
                              passed={passwordChecks.minLength}
                              label="At least 8 characters"
                            />
                            <ValidationCheck
                              passed={
                                passwordChecks.hasUppercase &&
                                passwordChecks.hasLowercase
                              }
                              label="One uppercase and lowercase letter"
                            />
                            <ValidationCheck
                              passed={passwordChecks.hasSpecialCharacter}
                              label="One special character"
                            />
                            <ValidationCheck
                              passed={passwordChecks.hasNumber}
                              label="One number"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isChanging}
                        className={`flex items-center gap-2 cursor-pointer px-5 py-2.5 rounded-lg text-sm font-semibold text-[#FDF8ED] transition-colors shadow-sm ${
                          isChanging
                            ? "bg-[#E6540B]/50 cursor-not-allowed"
                            : "bg-[#E6540B] hover:bg-[#c94806] cursor-pointer"
                        }`}
                      >
                        {isChanging && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        {isChanging ? "Changing..." : "Change Password"}
                      </button>
                    </div>
                  </form>
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Setting;