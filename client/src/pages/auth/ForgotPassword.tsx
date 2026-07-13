import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Loader2, SendHorizontal } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { forgotPassword, resetAuthStatus } from "../../store/auth/authSlice";
import { useAppDispatch } from "../../hooks/hooks";

interface ApiErrorPayload {
  field?: string;
  message?: string;
}

const RESEND_SECONDS = 30;

const TruvoraLogo = () => (
  <Link
    to="/"
    className="font-['Fraunces',serif] text-2xl italic font-semibold tracking-tight text-[#1A1613]"
  >
    Truvora<span className="text-[#E6540B]">.</span>
  </Link>
);

const ForgotPassword = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({
    email: "",
    general: "",
  });

  const [isSending, setIsSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  // Countdown ticker — only runs once an OTP has been sent
  useEffect(() => {
    if (!otpSent || secondsLeft === 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpSent, secondsLeft]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setErrors((prev) => ({ ...prev, email: "", general: "" }));
  };

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const sendOtp = async () => {
    if (isSending) return; // Prevent multiple submissions
    setErrors({ email: "", general: "" });

    if (!email) {
      setErrors((prev) => ({ ...prev, email: "Email is required" }));
      toast.error("Email is required");
      return;
    }
    if (!validateEmail(email)) {
      setErrors((prev) => ({ ...prev, email: "Invalid email format" }));
      toast.error("Invalid email format");
      return;
    }
    
    setIsSending(true);
    try {
      await dispatch(forgotPassword({ email }));
      toast.success("OTP sent to your email successfully!");
      dispatch(resetAuthStatus());
      setOtpSent(true);
      navigate("/verify-otp", { state: { email } });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errData = error.response?.data as ApiErrorPayload | undefined;
        const httpStatus = error.response?.status;

        if (errData && httpStatus !== undefined && httpStatus >= 400 && httpStatus < 500) {
          const field = errData.field;
          const msg = errData.message || "Failed to send OTP";

          if (field && ["email", "general"].includes(field)) {
            setErrors((prev) => ({ ...prev, [field]: msg }));
          } else {
            setErrors((prev) => ({ ...prev, general: msg }));
          }
          toast.error(msg);
          dispatch(resetAuthStatus());
          setIsSending(false);
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
      setIsSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendOtp();
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
              <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-[#E6540B]/15 flex items-center justify-center">
                <Mail className="text-[#E6540B]" size={26} strokeWidth={1.8} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-['Fraunces',serif] font-semibold text-[#1A1613] mb-2">
                {otpSent ? "Check your email" : "Forgot password?"}
              </h1>
              <p className="text-[#1A1613]/60 text-sm sm:text-base">
                {otpSent
                  ? "We've sent a password reset OTP to your inbox. Enter it on the next screen to continue."
                  : "Enter your registered email and we'll send you an OTP to reset your password."}
              </p>
            </div>

            {errors.general && (
              <p className="text-sm text-red-600 text-center mb-4 bg-red-50 py-2.5 rounded-lg">
                {errors.general}
              </p>
            )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#1A1613]/80 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1613]/40 pointer-events-none"
                      size={18}
                    />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={handleChange}
                      className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-0.5 focus:ring-[#E6540B] focus:border-[#E6540B] outline-none transition-all placeholder-[#1A1613]/30 text-[#1A1613] ${
                        errors.email ? "border-red-500" : "border-[#1A1613]/20"
                      }`}
                      placeholder="jane@example.com"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSending}
                  className={`cursor-pointer w-full py-3 text-[#FDF8ED] rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed ${
                    isSending ? "bg-[#E6540B]/50" : "bg-[#E6540B] hover:bg-[#c94806] active:scale-[0.98]"
                  }`}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <SendHorizontal className="h-5 w-5" />
                      Send OTP
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

export default ForgotPassword;