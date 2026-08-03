import { Navigate } from "react-router-dom"
import { useAppSelector } from "../hooks/hooks";
import { UserRole } from "../types/customer/authTypes";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, token } = useAppSelector((state) => state.auth)
 
      // Persistent login state
  const storedToken = localStorage.getItem("token");
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  
  const effectiveToken = token || storedToken;
  const effectiveUser = user || storedUser;

  const isLoggedIn = !!effectiveToken && !!effectiveUser;

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }
  if (!allowedRoles.includes(effectiveUser.role as UserRole)) {
    return (
      <>
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <h1 className="text-4xl font-bold mb-4">403 Forbidden</h1>
        <p className="text-lg text-gray-600 mb-8">You do not have permission to access this page.</p>
        <Navigate to="/" replace />
      </div>
      </>
    )
      // *OR
    // return <Navigate to="/" replace />
  }
  return children
}

export default ProtectedRoute