import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { resetPassword, resetAuthStatus } from "../../store/auth/authSlice";
import { useAppDispatch } from "../../hooks/hooks";

interface ApiErrorPayload {
  field?: string;
  message?: string;
}

interface LocationState {
  resetPasswordToken?: string;
}

const TruvoraLogo = () => (
  <Link
    to="/"
    className="font-['Fraunces',serif] text-2xl italic font-semibold tracking-tight text-[#1A1613]"
  >
    Truvora<span className="text-[#E6540B]">.</span>
  </Link>
);

const ValidationCheck = ({ passed, label }: { passed: boolean; label: string }) => (
  <div
    className={`flex items-center gap-2 text-sm transition-all ${
      passed ? "text-[#E6540B]" : "text-[#1A1613]/35"
    }`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${passed ? "bg-[#E6540B]" : "bg-[#1A1613]/25"}`} />
    <span className={passed ? "font-medium" : ""}>{label}</span>
  </div>
);

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const resetPasswordToken = (location.state as LocationState | null)?.resetPasswordToken || "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmNewPassword: "",
  });

  const [errors, setErrors] = useState({
    newPassword: "",
    confirmNewPassword: "",
    resetPasswordToken: "",
    general: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bail out early if there's no token to work with — nothing to reset
  useEffect(() => {
    if (!resetPasswordToken) {
     setTimeout(() => {
       setErrors((prev) => ({
        ...prev,
        resetPasswordToken: "Your reset link is invalid or has expired. Please request a new one.",
      }));
      toast.error("Your reset link is invalid or has expired. Please request a new one.");
      navigate("/forgot-password");
     }, 1000);
    }
  }, [resetPasswordToken, navigate]);

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
    const criteriaMet = [
      passwordChecks.hasUppercase,
      passwordChecks.hasLowercase,
      passwordChecks.hasNumber,
      passwordChecks.hasSpecialCharacter,
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrors({ newPassword: "", confirmNewPassword: "", resetPasswordToken: "", general: "" });

    if (!resetPasswordToken) {
      const msg = "Your reset link is invalid or has expired. Please request a new one.";
      setErrors((prev) => ({ ...prev, resetPasswordToken: msg }));
      toast.error(msg);
      return;
    }

    if (!allChecksPassed) {
      toast.error("Please meet all password requirements");
      return;
    }

    if (!formData.confirmNewPassword) {
      setErrors((prev) => ({ ...prev, confirmNewPassword: "Please confirm your new password" }));
      toast.error("Please confirm your new password");
      return;
    }

    if (formData.newPassword !== formData.confirmNewPassword) {
      setErrors((prev) => ({ ...prev, confirmNewPassword: "Passwords do not match" }));
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(
        resetPassword({
          resetPasswordToken,
          newPassword: formData.newPassword,
          confirmNewPassword: formData.confirmNewPassword,
        })
      );
      toast.success("Password reset successful!");
      dispatch(resetAuthStatus());
      setTimeout(() => navigate("/login"), 1800);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errData = error.response?.data as ApiErrorPayload | undefined;
        const httpStatus = error.response?.status;

        if (errData && httpStatus !== undefined && httpStatus >= 400 && httpStatus < 500) {
          const field = errData.field;
          const msg = errData.message || "Password reset failed";

          if (field && ["newPassword", "confirmNewPassword", "resetPasswordToken", "general"].includes(field)) {
            setErrors((prev) => ({ ...prev, [field]: msg }));
          } else {
            setErrors((prev) => ({ ...prev, general: msg }));
          }
          toast.error(msg);
          dispatch(resetAuthStatus());
          setIsSubmitting(false);
          return;
        }
      }

      setErrors((prev) => ({
        ...prev,
        general: "Something went wrong. Please try again.",
      }));
      toast.error("Something went wrong. Please try again.");
      dispatch(resetAuthStatus());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF8ED] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#E6540B]/10 rounded-full -mr-20 -mt-20" />

          <div className="relative z-10 p-8 sm:p-8">
            <div className="text-center mb-5">
              <div className="inline-flex mb-2">
                <TruvoraLogo />
              </div>
            </div>

            {errors.general && (
              <p className="text-sm text-red-600 text-center mb-4 bg-red-50 py-2.5 rounded-lg">
                {errors.general}
              </p>
            )}
            {errors.resetPasswordToken && (
              <p className="text-sm text-red-600 text-center mb-4 bg-red-50 py-2.5 rounded-lg">
                {errors.resetPasswordToken}
              </p>
            )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-[#1A1613]/80 mb-1.5">
                    New password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1613]/40 pointer-events-none" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full pl-11 pr-12 py-3 border rounded-xl focus:ring-0.5 focus:ring-[#E6540B] focus:border-[#E6540B] outline-none transition-all text-[#1A1613] ${
                        errors.newPassword
                          ? "border-red-500"
                          : formData.newPassword && allChecksPassed
                            ? "border-[#E6540B]"
                            : "border-[#1A1613]/20"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 text-[#1A1613]/40 hover:text-[#1A1613]/70 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.newPassword && <p className="mt-1 text-xs text-red-600">{errors.newPassword}</p>}

                  {formData.newPassword && (
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-[#1A1613]/50">Password Strength</span>
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
                        />
                      </div>
                    </div>
                  )}

                  {formData.newPassword && (
                    <div className="mt-2 bg-[#1A1613]/3">
                      <p className="text-xs text-[#1A1613]/60">Password Requirements:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2">
                        <ValidationCheck passed={passwordChecks.minLength} label="At least 8 characters" />
                        <ValidationCheck
                          passed={passwordChecks.hasUppercase && passwordChecks.hasLowercase}
                          label="One uppercase and lowercase letter"
                        />
                        <ValidationCheck passed={passwordChecks.hasSpecialCharacter} label="One special character" />
                        <ValidationCheck passed={passwordChecks.hasNumber} label="One number" />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-[#1A1613]/80 mb-1.5">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1613]/40 pointer-events-none" size={18} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmNewPassword"
                      name="confirmNewPassword"
                      value={formData.confirmNewPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full pl-11 pr-12 py-3 border rounded-xl focus:ring-0.5 focus:ring-[#E6540B] focus:border-[#E6540B] outline-none transition-all text-[#1A1613] ${
                        errors.confirmNewPassword ? "border-red-500" : "border-[#1A1613]/20"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 text-[#1A1613]/40 hover:text-[#1A1613]/70 focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !resetPasswordToken}
                  className={`cursor-pointer w-full py-3 text-[#FDF8ED] rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed ${
                    isSubmitting || !resetPasswordToken ? "bg-[#E6540B]/50" : "bg-[#E6540B] hover:bg-[#c94806] active:scale-[0.98]"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <Lock className="h-5 w-5" />
                      Reset Password
                    </>
                  )}
                </button>
              </form>

            <p className="mt-6 text-center text-sm text-[#1A1613]/60">
              Remember your password?{" "}
              <Link to="/login" className="text-[#E6540B] font-medium hover:underline">
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;