import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // Pas connecté
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Connecté mais pas admin
  if (user.role !== "ADMIN") {
    return <Navigate to="/passager" replace />;
  }

  // Si ADMIN → autorisé
  return children;
}