import axios from "axios";
import { toast } from "react-toastify";
import { isTokenExpired } from "../utils/token";

const SERVER_URL = import.meta.env.VITE_SERVER_URL as string;

let isHandlingExpiry = false;

/**
 * Clears stored credentials and session cookies.
 */
export const clearAuthSession = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.dispatchEvent(new CustomEvent("auth:session-expired"));
  }
};

/**
 * Handles JWT token expiration:
 * Clears session, displays warning notification, and navigates immediately to /login.
 */
export const handleSessionExpiry = (
  message = "Your session has expired. Please log in again."
) => {
  if (isHandlingExpiry) return;
  isHandlingExpiry = true;

  clearAuthSession();

  toast.warn(message, {
    toastId: "session-expired-toast",
    autoClose: 4000,
  });

  const pathname = window.location.pathname;
  const isAuthRoute =
    pathname.includes("/login") ||
    pathname.includes("/register") ||
    pathname.includes("/forgot-password") ||
    pathname.includes("/reset-password");

  if (!isAuthRoute) {
    setTimeout(() => {
      window.location.href = "/login?expired=true";
      isHandlingExpiry = false;
    }, 200);
  } else {
    setTimeout(() => {
      isHandlingExpiry = false;
    }, 1000);
  }
};

// For Unauthenticated Requests
export const API = axios.create({
  baseURL: SERVER_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// For Authenticated Requests
export const APIAuthenticated = axios.create({
  baseURL: SERVER_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor: Attach Token & check preemptive expiration
APIAuthenticated.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== "undefined" && localStorage
        ? localStorage.getItem("token")
        : null;

    if (token) {
      if (isTokenExpired(token)) {
        handleSessionExpiry();
        return Promise.reject(new Error("JWT expired: Session has ended."));
      }
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    // If FormData, let browser set boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Catch 401 TokenExpiredError & Unauthorized responses
const handleResponseError = (error: any) => {
  if (error.response && error.response.status === 401) {
    const data = error.response.data;
    const isTokenError =
      data?.isExpired ||
      data?.errorType === "TokenExpiredError" ||
      data?.name === "TokenExpiredError" ||
      (typeof data?.message === "string" &&
        (data.message.toLowerCase().includes("jwt expired") ||
          data.message.toLowerCase().includes("token expired") ||
          data.message.toLowerCase().includes("invalid token") ||
          data.message.toLowerCase().includes("no token provided")));

    if (isTokenError) {
      handleSessionExpiry();
    }
  }
  return Promise.reject(error);
};

APIAuthenticated.interceptors.response.use(
  (response) => response,
  handleResponseError
);

API.interceptors.response.use(
  (response) => response,
  handleResponseError
);
