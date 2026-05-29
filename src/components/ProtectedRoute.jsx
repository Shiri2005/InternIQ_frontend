import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles, redirectTo = "/dashboard" }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!token) {
    return <Navigate to="/" />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}