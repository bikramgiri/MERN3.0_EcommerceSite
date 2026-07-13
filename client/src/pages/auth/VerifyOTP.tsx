import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { KeyRound, Loader2, ShieldCheck, RotateCw } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { forgotPassword, resetAuthStatus, verifyOTP } from "../../store/auth/authSlice";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";

interface ApiErrorPayload {
  field?: string;
  message?: string;
}

interface LocationState {
  email?: string;
}

const RESEND_SECONDS = 30;
const OTP_LENGTH = 6;

const TruvoraLogo = () => (
  <Link
    to="/"
    className="font-['Fraunces',serif] text-2xl italic font-semibold tracking-tight text-[#1A1613]"
  >
    Truvora<span className="text-[#E6540B]">.</span>
  </Link>
);

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { email: emailFromStore } = useAppSelector((state) => state.auth);

  const emailFromState = (location.state as LocationState | null)?.email || "";

  const [email] = useState(emailFromState || emailFromStore || "");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));

  const [errors, setErrors] = useState({
    email: "",
    otp: "",
    general: "",
  });

  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown ticker
  useEffect(() => {
    if (secondsLeft === 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const focusBox = (index: number) => {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  };

  const handleOtpChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setErrors((prev) => ({ ...prev, otp: "", general: "" }));

    // Handle a full paste landing in one box
    if (raw.length > 1) {
      const pasted = raw.replace(/\D/g, "").slice(0, OTP_LENGTH);
      if (!pasted) return;
      setOtpDigits((prev) => {
        const next = [...prev];
        pasted.split("").forEach((d, i) => {
          if (index + i < OTP_LENGTH) next[index + i] = d;
        });
        return next;
      });
      const nextIndex = Math.min(index + pasted.length, OTP_LENGTH - 1);
      focusBox(nextIndex);
      return;
    }

    const digit = raw.replace(/\D/g, "");
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    if (digit && index < OTP_LENGTH - 1) {
      focusBox(index + 1);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        e.preventDefault();
        setOtpDigits((prev) => {
          const next = [...prev];
          next[index - 1] = "";
          return next;
        });
        focusBox(index - 1);
      }
      return;
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusBox(index - 1);
    }
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      e.preventDefault();
      focusBox(index + 1);
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    setOtpDigits(() => {
      const next = Array(OTP_LENGTH).fill("");
      pasted.split("").forEach((d, i) => (next[i] = d));
      return next;
    });
    focusBox(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isVerifying) return;
    setErrors({ email: "", otp: "", general: "" });

    const newErrors = { email: "", otp: "", general: "" };
    let hasError = false;

    if (!email) {
      newErrors.email = "Email is missing — please restart the reset process";
      hasError = true;
    }

    const code = otpDigits.join("");
    if (!code) {
      newErrors.otp = "OTP is required";
      hasError = true;
    } else if (!/^\d{6}$/.test(code)) {
      newErrors.otp = "Enter all 6 digits";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      Object.values(newErrors).filter(Boolean).forEach((msg) => toast.error(msg));
      return;
    }

    setIsVerifying(true);
    try {
      const response = await dispatch(verifyOTP({ email, otp: code }));
      toast.success("OTP verified successfully!");
      dispatch(resetAuthStatus());
      const resetPasswordToken = response?.data?.token;
      setTimeout(() => {
        navigate("/reset-password", { state: { resetPasswordToken } });
      }, 1500);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errData = error.response?.data as ApiErrorPayload | undefined;
        const httpStatus = error.response?.status;

        if (errData && httpStatus !== undefined && httpStatus >= 400 && httpStatus < 500) {
          const field = errData.field;
          const msg = errData.message || "OTP verification failed";

          if (field && ["email", "otp", "general"].includes(field)) {
            setErrors((prev) => ({ ...prev, [field]: msg }));
          } else {
            setErrors((prev) => ({ ...prev, general: msg }));
          }
          toast.error(msg);
          dispatch(resetAuthStatus());
          setIsVerifying(false);
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
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || isResending) return;

    if (!email) {
      setErrors((prev) => ({ ...prev, general: "Email is missing — please restart the reset process" }));
      toast.error("Email is missing — please restart the reset process");
      return;
    }

    setIsResending(true);
    try {
      await dispatch(forgotPassword({ email }));
      toast.success("A new OTP has been sent to your email.");
      dispatch(resetAuthStatus());
      setSecondsLeft(RESEND_SECONDS);
      setOtpDigits(Array(OTP_LENGTH).fill(""));
      focusBox(0);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errData = error.response?.data as ApiErrorPayload | undefined;
        toast.error(errData?.message || "Failed to resend OTP");
      } else {
        toast.error("Failed to resend OTP");
      }
      dispatch(resetAuthStatus());
    } finally {
      setIsResending(false);
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
              <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-[#E6540B]/15 flex items-center justify-center">
                <KeyRound className="text-[#E6540B]" size={26} strokeWidth={1.8} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-['Fraunces',serif] font-semibold text-[#1A1613] mb-2">
                Verify OTP
              </h1>
              <p className="text-[#1A1613]/60 text-sm sm:text-base">
                {email ? (
                  <>
                    Enter the 6-digit code sent to <span className="font-medium text-[#1A1613]">{email}</span>
                  </>
                ) : (
                  "Enter the 6-digit code sent to your email."
                )}
              </p>
            </div>

            {errors.general && (
              <p className="text-sm text-red-600 text-center mb-4 bg-red-50 py-2.5 rounded-lg">
                {errors.general}
              </p>
            )}
            {errors.email && (
              <p className="text-sm text-red-600 text-center mb-4 bg-red-50 py-2.5 rounded-lg">
                {errors.email}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#1A1613]/80 mb-2 text-center">
                  One-Time Password
                </label>
                <div className="flex justify-between gap-2 sm:gap-3">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      className={`w-10 h-12 sm:w-11 sm:h-13 text-center text-xl font-semibold border rounded-lg outline-none transition-all text-[#1A1613] focus:ring-0.5 focus:ring-[#E6540B] focus:border-[#E6540B] ${
                        errors.otp ? "border-red-500" : "border-[#1A1613]/20"
                      }`}
                    />
                  ))}
                </div>
                {errors.otp && (
                  <p className="mt-2 text-xs text-red-600 text-center">{errors.otp}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className={`cursor-pointer w-full py-3 text-[#FDF8ED] rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed ${
                  isVerifying ? "bg-[#E6540B]/50" : "bg-[#E6540B] hover:bg-[#c94806] active:scale-[0.98]"
                }`}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-5 w-5" />
                    Verify OTP
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              {secondsLeft > 0 ? (
                <p className="text-sm text-[#1A1613]/50">
                  Resend OTP in{" "}
                  <span className="font-semibold text-[#1A1613]">
                    0:{secondsLeft.toString().padStart(2, "0")}
                  </span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="cursor-pointer inline-flex items-center gap-2 text-sm font-medium text-[#E6540B] hover:text-[#c94806] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" />
                      Resending...
                    </>
                  ) : (
                    <>
                      <RotateCw className="h-4 w-4" />
                      Resend OTP
                    </>
                  )}
                </button>
              )}
            </div>

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

export default VerifyOTP;