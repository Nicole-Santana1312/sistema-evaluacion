import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../providers/AuthProvider";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};