import { Routes, Route } from "react-router-dom";
import { LoginPage } from "../../modules/auth/LoginPage";
import { DashboardPage } from "../../modules/dashboard/DashboardPage";
import { ProtectedRoute } from "./ProtectedRoute";

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};