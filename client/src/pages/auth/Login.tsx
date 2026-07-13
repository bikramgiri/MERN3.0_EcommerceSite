import React, { useEffect, useState } from "react";
import AuthForm from "./components/AuthForm";
import { useNavigate } from "react-router-dom";
import { loginUser, resetAuthStatus } from "../../store/auth/authSlice";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../store/store";
import { toast } from "react-toastify";
import axios from "axios";

interface ApiErrorPayload {
  field?: string;
  message?: string;
}

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  // const {status, token} = useAppSelector((state) => state.auth);

  const [isLoggingIn, setIsLoggingIn] = useState(false); 

  const [userData, setUserData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({ email: "", password: "", general: "" });
    
    if (isLoggingIn) return; 

    let hasError = false;
    const newErrors = { username: "", email: "", password: "", general: "" };

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

    if (!validateEmail(userData.email)) {
      newErrors.email = "Invalid email format";
      hasError = true;
      toast.error(newErrors.email);
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setIsLoggingIn(true); 

 try {
      await dispatch(loginUser(userData));
       toast.success("Login successful!");
      dispatch(resetAuthStatus());

      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errData = error.response?.data as ApiErrorPayload | undefined;
        const httpStatus = error.response?.status;
 
        if (errData && httpStatus !== undefined && httpStatus >= 400 && httpStatus < 500) {
          const field = errData.field;
          const msg = errData.message || "Login failed";
 
          if (field && ["email", "password", "general"].includes(field)) {
            setErrors((prev) => ({ ...prev, [field]: msg }));
          } else {
            setErrors((prev) => ({ ...prev, general: msg }));
          }
          toast.error(msg);
          setIsLoggingIn(false);
          return;
        }
      }
 
      setErrors((prev) => ({
        ...prev,
        general: "Something went wrong. Please try again.",
      }));
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    // if (status === Status.SUCCESS && token) {
    //     toast.success("Login successful!");
    //     dispatch(resetAuthStatus());
    //   setTimeout(() => {
    //     navigate("/");
    //   }, 1500);
    // } 
    // if (status === Status.ERROR) {
    //   dispatch(resetAuthStatus());
    // }

    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get("logout") === "true") {
        toast.success("Logout successful", { toastId: "logout-success" });
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 1000);
    }
        // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <AuthForm
        type="login"
        onSubmit={handleSubmit}
        onChange={handleChange}
        isSubmitting={isLoggingIn}
        values={userData}
        errors={errors}
      />
    </>
  );
};

export default Login;
