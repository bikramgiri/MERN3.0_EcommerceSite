import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Loader2, ShieldCheck, RotateCw } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { verifyEmail, resendVerificationEmail, resetAuthStatus } from "../../store/auth/authSlice";
import { useAppDispatch } from "../../hooks/hooks";

interface ApiErrorPayload {
  field?: string;
  message?: string;
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

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const emailFromUrl = searchParams.get("email") || "";
  const tokenFromUrl = searchParams.get("token") || "";

  const [email, setEmail] = useState(emailFromUrl);
  const [otpDigits, setOtpDigits] = useState<string[]>(() => {
    const initial = Array(OTP_LENGTH).fill("");
    tokenFromUrl.split("").slice(0, OTP_LENGTH).forEach((d, i) => (initial[i] = d));
    return initial;
  });

  const [errors, setErrors] = useState({
    email: "",
    emailVerificationToken: "",
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

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setErrors((prev) => ({ ...prev, email: "", general: "" }));
  };

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const focusBox = (index: number) => {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  };

  const handleOtpChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setErrors((prev) => ({ ...prev, emailVerificationToken: "", general: "" }));

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

  const submitVerification = useCallback(async () => {
    if (isVerifying) return;
    setErrors({ email: "", emailVerificationToken: "", general: "" });

    const newErrors = { email: "", emailVerificationToken: "", general: "" };
    let hasError = false;

    if (!email) {
      newErrors.email = "Email is required";
      hasError = true;
    } else if (!validateEmail(email)) {
      newErrors.email = "Invalid email format";
      hasError = true;
    }

    const code = otpDigits.join("");
    if (!code) {
      newErrors.emailVerificationToken = "Verification code is required";
      hasError = true;
    } else if (!/^\d{6}$/.test(code)) {
      newErrors.emailVerificationToken = "Enter all 6 digits";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      Object.values(newErrors).filter(Boolean).forEach((msg) => toast.error(msg));
      return;
    }

    setIsVerifying(true);
    try {
      await dispatch(verifyEmail({ email, emailVerificationToken: code }));
      toast.success("Email verified successfully!");
      dispatch(resetAuthStatus());
      setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errData = error.response?.data as ApiErrorPayload | undefined;
        const httpStatus = error.response?.status;

        if (errData && httpStatus !== undefined && httpStatus >= 400 && httpStatus < 500) {
          const field = errData.field;
          const msg = errData.message || "Verification failed";

          if (field && ["email", "emailVerificationToken", "general"].includes(field)) {
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
  }, [dispatch, isVerifying, navigate, email, otpDigits]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitVerification();
  };

  // Auto-submit if URL already has both email & token (from email link)
  useEffect(() => {
    if (tokenFromUrl && emailFromUrl && tokenFromUrl.length === OTP_LENGTH) {
      const timer = setTimeout(() => {
        submitVerification();
      }, 800);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenFromUrl, emailFromUrl]);

  const handleResend = async () => {
    if (secondsLeft > 0 || isResending) return;

    if (!email || !validateEmail(email)) {
      setErrors((prev) => ({ ...prev, email: "Enter a valid email to resend the code" }));
      toast.error("Enter a valid email to resend the code");
      return;
    }

    setIsResending(true);
    try {
      const data = await dispatch(resendVerificationEmail({ email }));
      toast.success(data?.message || "Verification code resent.");
      dispatch(resetAuthStatus());
      setSecondsLeft(RESEND_SECONDS);
      setOtpDigits(Array(OTP_LENGTH).fill(""));
      focusBox(0);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errData = error.response?.data as ApiErrorPayload | undefined;
        toast.error(errData?.message || "Failed to resend code");
      } else {
        toast.error("Failed to resend code");
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
                <Mail className="text-[#E6540B]" size={26} strokeWidth={1.8} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-['Fraunces',serif] font-semibold text-[#1A1613] mb-2">
                Verify your email
              </h1>
              <p className="text-[#1A1613]/60 text-sm sm:text-base">
                Enter the 6-digit code we sent to your inbox to activate your Truvora account.
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
                    onChange={handleEmailChange}
                    className="w-full pl-11 pr-4 py-3 border border-[#1A1613]/20 rounded-lg focus:ring-0.5 focus:ring-[#E6540B] focus:border-[#E6540B] outline-none transition-all placeholder-[#1A1613]/30 text-[#1A1613]"
                    placeholder="jane@example.com"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1613]/80 mb-2">
                  Verification code
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
                        errors.emailVerificationToken ? "border-red-500" : "border-[#1A1613]/20"
                      }`}
                    />
                  ))}
                </div>
                {errors.emailVerificationToken && (
                  <p className="mt-2 text-xs text-red-600">{errors.emailVerificationToken}</p>
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
                    Verify Email
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              {secondsLeft > 0 ? (
                <p className="text-sm text-[#1A1613]/50">
                  Resend code in{" "}
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
                      Resend code
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="mt-2 text-center text-sm text-[#1A1613]/60">
              Already verified?{" "}
              <Link to="/login" className="text-[#E6540B] font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;