import React, { useEffect, useState } from "react";
import AuthForm from "./components/AuthForm";
import { useNavigate } from "react-router-dom";
import { registerUser, resetAuthStatus } from "../../store/auth/authSlice";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { Status } from "../../global/statuses";
import { FaCheck, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import axios from "axios";

interface ApiErrorPayload {
  field?: string;
  message?: string;
}
 
interface ValidationCheckProps {
  passed: boolean;
  label: string;
}

  const ValidationCheck = ({ passed, label }: ValidationCheckProps) => (
    <div
      className={`flex items-center gap-1 text-sm transition-all ${
        passed ? "text-green-600" : "text-gray-400"
      }`}
    >
      {passed ? <FaCheck className="text-green-600 text-sm" /> : <FaTimes className="text-gray-300" />}
      <span className={passed ? "text-sm" : ""}>{label}</span>
    </div>
  );

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { status } = useAppSelector((state) => state.auth);

  const [userData, setUserData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [isRegistering, setIsRegistering] = useState(false); 

  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    general: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData({
      ...userData,
      [name]: value,
    });
    setErrors({
      ...errors,
      [name]: "",
      general: "",
    });
  };
  
    const passwordChecks = {
    minLength: userData.password.length >= 8,
    hasUppercase: /[A-Z]/.test(userData.password),
    hasLowercase: /[a-z]/.test(userData.password),
    hasSpecialCharacter: /[^A-Za-z0-9]/.test(userData.password),
    hasNumber: /\d/.test(userData.password),
  };

  const allChecksPassed = Object.values(passwordChecks).every(Boolean);
  
  const getPasswordStrength = () => {
  const password = userData.password;
  if (!password) return { label: "", color: "", width: "0%"};

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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({ username: "", email: "", password: "", general: "" });

  if (isRegistering) return; 

  if (!allChecksPassed) {
      toast.error("Please meet all password requirements");
      return;
    }

    let hasError = false;
    const newErrors = { username: "", email: "", password: "", general: "" };

    // Basic required field check
    if (!userData.username) {
      newErrors.username = "Username is required";
      hasError = true;
      toast.error(newErrors.username);
    }
    if (!userData.email) {
      newErrors.email = "Email is required";
      hasError = true;
      toast.error(newErrors.email);
    }
    if (!userData.password) {
      newErrors.password = "Password is required";
      hasError = true;
      toast.error(newErrors.password);
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    if (!validateEmail(userData.email)) {
      newErrors.email = "Invalid email format";
      hasError = true;
      toast.error(newErrors.email);
    }

    if (!validatePassword(userData.password)) {
      newErrors.password = "Password must be at least 8 characters long";
      hasError = true;
      toast.error(newErrors.password);
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setIsRegistering(true); 

     try {
      await dispatch(registerUser(userData));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errData = error.response?.data as ApiErrorPayload | undefined;
        const httpStatus = error.response?.status;
 
        if (errData && httpStatus !== undefined && httpStatus >= 400 && httpStatus < 500) {
          const field = errData.field;
          const msg = errData.message || "Validation error";
 
          if (field && ["username", "email", "password", "general"].includes(field)) {
            setErrors((prev) => ({ ...prev, [field]: msg }));
            toast.error(msg);
          } else {
            setErrors((prev) => ({ ...prev, general: msg }));
            toast.error(msg);
          }
          setIsRegistering(false);
          return;
        }
      }
 
      setErrors((prev) => ({
        ...prev,
        general: "Something went wrong. Please try again.",
      }));
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  useEffect(() => {
    if (status === Status.SUCCESS) {
        toast.success("Registration successful!, Please check your email to verify your account.");
        dispatch(resetAuthStatus());
        setTimeout(() => {
         navigate("/verify-email");
        }, 1500);
      return
    }
    if (status === Status.ERROR) {
      dispatch(resetAuthStatus());
    }
  }, [status, navigate, errors, dispatch]);

  return (
    <>
      <AuthForm
        type="register"
        onSubmit={handleSubmit}
        onChange={handleChange}
        isSubmitting={isRegistering}
        values={userData}
        errors={errors}
        allChecksPassed={allChecksPassed}
        passwordChecks={passwordChecks}
        passwordStrength={passwordStrength}
        ValidationCheck={ValidationCheck}
      />
    </>
  );
};

export default Register;
