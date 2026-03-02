import { Routes, Route } from "react-router-dom";
import { LoginPage } from "../../modules/auth/LoginPage";
import DashboardPage from "../../modules/dashboard/DashboardPage";
import { RegisterInstitutionPage } from "../../modules/institution/RegisterInstitutionPage";
import { VerifyPage } from "../../modules/auth/VerifyPage";
import { ProtectedRoute } from "./ProtectedRoute";

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterInstitutionPage />} />
      <Route path="/verify" element={<VerifyPage />} />

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