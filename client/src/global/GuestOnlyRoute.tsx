import React from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../hooks/hooks";
import { Status } from "./statuses";
import { UserRole } from "../types/customer/authTypes";
import { isTokenExpired } from "../utils/token";

/**
 * Login and sign-up pages are for signed-out visitors. Someone who is already signed in
 * goes to the store (customers) or the dashboard (admins) instead of seeing the form.
 */
const GuestOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, status } = useAppSelector((state) => state.auth);

  // Right after a successful sign-in the page shows its own message and redirects itself
  const signedIn = !!token && !isTokenExpired(token) && !!user?.role && status !== Status.SUCCESS;
  if (!signedIn) return <>{children}</>;

  return <Navigate to={user.role === UserRole.Admin ? "/admin-dashboard" : "/"} replace />;
};

export default GuestOnlyRoute;
