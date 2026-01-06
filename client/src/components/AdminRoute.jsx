import { Navigate } from "react-router-dom";
import { getAuth } from "../api/authStorage";

export default function AdminRoute({ children }) {
  const auth = getAuth();
  const role = auth?.user?.role;

  if (!auth?.token) return <Navigate to="/" replace />;
  if (role !== "admin") return <Navigate to="/dashboard" replace />;

  return children;
}
