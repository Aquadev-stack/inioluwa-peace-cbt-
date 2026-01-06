import { Navigate } from "react-router-dom";
import { getAuth } from "../api/authStorage";

export default function ProtectedRoute({ children }) {
  const auth = getAuth();
  if (!auth?.token) return <Navigate to="/" replace />;
  return children;
}
