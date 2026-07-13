import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaEnvelope, FaFacebook, FaLock, FaUser } from "react-icons/fa";
import { Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  UserPlus,
  Truck,
  ShieldCheck,
  Heart,
  Sparkles,
} from "lucide-react";
import type { AuthFormProps } from "../../../types/authTypes";

const DefaultValidationCheck = ({ passed, label }: { passed: boolean; label: string }) => (
  <div
    className={`flex items-center gap-2 text-sm transition-all ${
      passed ? "text-[#E6540B]" : "text-[#1A1613]/35"
    }`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${passed ? "bg-[#E6540B]" : "bg-[#1A1613]/25"}`} />
    <span className={passed ? "font-medium" : ""}>{label}</span>
  </div>
);

const FEATURES = {
  login: [
    { icon: Truck, label: "Real-time order tracking" },
    { icon: ShieldCheck, label: "Secure, encrypted checkout" },
    { icon: Heart, label: "Wishlist saved across devices" },
    { icon: Sparkles, label: "Early access to new drops" },
  ],
  register: [
    { icon: Truck, label: "Free shipping over $75" },
    { icon: ShieldCheck, label: "30-day, no-questions returns" },
    { icon: Heart, label: "Save favorites to your wishlist" },
    { icon: Sparkles, label: "First access to weekly drops" },
  ],
};

const TruvoraLogo = ({ dark = false }: { dark?: boolean }) => (
  <Link
    to="/"
    className={`font-['Fraunces',serif] text-2xl italic font-semibold tracking-tight ${
      dark ? "text-[#FDF8ED]" : "text-[#1A1613]"
    }`}
  >
    Truvora<span className="text-[#E6540B]">.</span>
  </Link>
);

const AuthForm = ({
  type = "login",
  onSubmit,
  onChange,
  isSubmitting,
  values,
  errors,
  passwordStrength = { label: "", color: "", width: "0%" },
  passwordChecks,
  allChecksPassed,
  ValidationCheck = DefaultValidationCheck,
}: AuthFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const isDisabled = isSubmitting;
  const features = type === "login" ? FEATURES.login : FEATURES.register;

  return (
    <div className="min-h-screen bg-[#FDF8ED] flex items-center justify-center py-5 md:py-3 px-4">
      <div className="w-full max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-0 bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Left Panel */}
          <div className="hidden lg:flex flex-col justify-center p-6 bg-[#1A1613] text-[#FDF8ED] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#E6540B]/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#E6540B]/10 rounded-full -ml-48 -mb-48"></div>

            <div className="relative z-10">
              <div className="mb-5">
                <TruvoraLogo dark />
              </div>

              <h1 className="text-4xl lg:text-5xl font-['Fraunces',serif] font-semibold mb-4 leading-tight">
                {type === "login" ? (
                  "Welcome back."
                ) : (
                  <>
                    Fewer things.
                    <br />
                    Held onto <span className="italic text-[#E6540B]">longer.</span>
                  </>
                )}
              </h1>
              <p className="text-[#FDF8ED]/70 text-lg mb-8">
                {type === "login"
                  ? "Sign in to pick up right where you left off — your cart, your wishlist, your orders."
                  : "Create your Truvora account and start building a collection worth keeping."}
              </p>

              <div className="space-y-3">
                {features.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 bg-[#FDF8ED]/5 border border-[#FDF8ED]/10 backdrop-blur-sm rounded-xl p-3"
                  >
                    <div className="w-10 h-10 shrink-0 bg-[#E6540B]/15 rounded-lg flex items-center justify-center">
                      <Icon size={18} className="text-[#E6540B]" strokeWidth={1.8} />
                    </div>
                    <span className="font-medium text-sm">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Form Section */}
          <div className="p-6 sm:p-8 lg:p-6 flex flex-col justify-center overflow-y-auto">

            {/* Mobile Logo */}
            <div className="lg:hidden mb-6">
              <TruvoraLogo />
            </div>

            <div className="mb-5 text-center">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-['Fraunces',serif] font-semibold text-[#1A1613] mb-2">
                {type === "login" ? "Sign in to Truvora" : "Create your account"}
              </h2>
              <p className="text-[#1A1613]/60 text-sm sm:text-base">
                {type === "login"
                  ? "Enter your details to continue."
                  : "Join Truvora and start collecting pieces worth keeping."}
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              {type !== "login" && (
                <div>
                  <label className="block text-sm font-medium text-[#1A1613]/80 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1613]/40 pointer-events-none" />
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={values.username}
                      onChange={onChange}
                      className="w-full pl-12 pr-4 py-3 border border-[#1A1613]/20 rounded-lg focus:ring-0.5 focus:ring-[#E6540B] focus:border-[#E6540B] outline-none transition-all placeholder-[#1A1613]/30 text-[#1A1613]"
                      placeholder="janedoe"
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-1 text-xs text-red-600">{errors.username}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#1A1613]/80 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1613]/40 pointer-events-none" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={values.email}
                    onChange={onChange}
                    className="w-full pl-12 pr-4 py-3 border border-[#1A1613]/20 rounded-lg focus:ring-0.5 focus:ring-[#E6540B] focus:border-[#E6540B] outline-none transition-all placeholder-[#1A1613]/30 text-[#1A1613]"
                    placeholder="jane@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1613]/80 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1613]/40 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={values.password}
                    onChange={onChange}
                    placeholder="••••••••"
                    className={`w-full pl-12 pr-12 py-3 border rounded-xl focus:ring-0.5 focus:ring-[#E6540B] focus:border-[#E6540B] outline-none transition-all text-[#1A1613] ${
                      errors.password
                        ? "border-red-500"
                        : values.password && allChecksPassed
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
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                )}

                {type !== "login" && (
                  <>
                    {values.password && (
                      <div className="mt-1">
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

                    {values.password && passwordChecks && (
                      <div className="mt-1 bg-[#1A1613]/3">
                        <p className="text-xs text-[#1A1613]/60">
                          Password Requirements:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2">
                          <ValidationCheck
                            passed={passwordChecks.minLength}
                            label="At least 8 characters"
                          />
                          <ValidationCheck
                            passed={passwordChecks.hasUppercase && passwordChecks.hasLowercase}
                            label="One uppercase and lowercase letter"
                          />
                          <ValidationCheck
                            passed={passwordChecks.hasSpecialCharacter}
                            label="One special character"
                          />
                          <ValidationCheck passed={passwordChecks.hasNumber} label="One number" />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div
                className={`${
                  type === "login"
                    ? "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    : "flex justify-start"
                }`}
              >
                <div className="flex items-start mb-1">
                  <input
                    type="checkbox"
                    id="rememberandterms"
                    required
                    className="mt-1.5 h-4 w-4 text-[#E6540B] focus:ring-[#E6540B] border-[#1A1613]/30 rounded cursor-pointer"
                  />
                  <label htmlFor="rememberandterms" className="ml-2 block text-sm text-[#1A1613]/60">
                    {type === "login" ? (
                      <>Remember me</>
                    ) : (
                      <>
                        I agree to the
                        <Link
                          to="/terms"
                          className="text-[#E6540B] hover:text-[#c94806] hover:underline font-medium"
                        >
                          {" "}
                          Terms of Service{" "}
                        </Link>
                        and{" "}
                        <Link
                          to="/privacy"
                          className="text-[#E6540B] hover:text-[#c94806] hover:underline font-medium"
                        >
                          Privacy Policy
                        </Link>
                      </>
                    )}
                  </label>
                </div>
                {type === "login" && (
                  <Link
                    to="/forgot-password"
                    className="hover:underline text-sm font-medium text-[#E6540B] hover:text-[#c94806] whitespace-nowrap"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>

              {errors.general && (
                <p className="text-sm text-red-600 text-center">{errors.general}</p>
              )}

              <button
                type="submit"
                disabled={isDisabled}
                className={`cursor-pointer w-full py-3 text-[#FDF8ED] rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed ${
                  isDisabled ? "bg-[#E6540B]/50" : "bg-[#E6540B] hover:bg-[#c94806] active:scale-[0.98]"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" />
                    {type === "login" ? "Signing in..." : "Creating account..."}
                  </>
                ) : (
                  <>
                    {type === "login" ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                    {type === "login" ? "Sign In" : "Create Account"}
                  </>
                )}
              </button>
            </form>

            <p className="mt-3 text-center text-sm text-[#1A1613]/60">
              {type === "login" ? "Don't have an account? " : "Already have an account? "}
              <Link
                to={type === "login" ? "/register" : "/login"}
                className="text-[#E6540B] font-medium hover:underline"
              >
                {type === "login" ? "Sign up" : "Sign in"}
              </Link>
            </p>

            <div className="mt-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#1A1613]/10" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-[#1A1613]/50">
                    Or {type === "login" ? "sign in" : "sign up"} with
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button className="cursor-pointer flex items-center justify-center gap-2 bg-white border border-[#1A1613]/15 rounded-lg py-2.5 px-4 hover:bg-[#1A1613]/5 transition-colors text-sm font-medium text-[#1A1613]/80">
                  <FcGoogle className="h-5 w-5 flex-shrink-0" />
                  Google
                </button>
                <button className="cursor-pointer flex items-center justify-center gap-2 bg-white border border-[#1A1613]/15 rounded-lg py-2.5 px-4 hover:bg-[#1A1613]/5 transition-colors text-sm font-medium text-[#1A1613]/80">
                  <FaFacebook className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  Facebook
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthForm;