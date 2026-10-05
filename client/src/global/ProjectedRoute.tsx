import React from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../hooks/hooks";
import { UserRole } from "../types/customer/authTypes";
import { isTokenExpired } from "../utils/token";
import { handleSessionExpiry, clearAuthSession } from "../http";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, token } = useAppSelector((state) => state.auth);

  // Persistent login state
  const storedToken =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const storedUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;

  const effectiveToken = token || storedToken;
  const effectiveUser = user && (user as any).id ? user : storedUser;

  // If token is missing or expired, clear session and send to login immediately
  if (!effectiveToken || isTokenExpired(effectiveToken)) {
    if (effectiveToken && isTokenExpired(effectiveToken)) {
      handleSessionExpiry();
    } else {
      clearAuthSession();
    }
    return <Navigate to="/login" replace />;
  }

  if (!effectiveUser) {
    clearAuthSession();
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(effectiveUser.role as UserRole)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <h1 className="text-4xl font-bold mb-4">403 Forbidden</h1>
        <p className="text-lg text-gray-600 mb-8">
          You do not have permission to access this page.
        </p>
        <Navigate to="/" replace />
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;