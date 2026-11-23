import React from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../hooks/hooks";
import { UserRole } from "../types/customer/authTypes";
import { isTokenExpired } from "../utils/token";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

/** The saved user; a damaged saved value counts as logged out instead of crashing the page */
const readStoredUser = (): { id?: string; role?: string } | null => {
  try {
    return typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
  } catch {
    return null;
  }
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, token } = useAppSelector((state) => state.auth);

  // Persistent login state
  const storedToken =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const storedUser = readStoredUser();

  const effectiveToken = token || storedToken;
  const effectiveUser = user?.id ? user : storedUser;

  // If token is missing, expired, or user not found, safely redirect without side effects during render
  if (!effectiveToken || !effectiveUser || isTokenExpired(effectiveToken)) {
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