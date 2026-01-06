import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import DashboardLayout from "./components/DashboardLayout";

import DashboardHome from "./pages/DashboardHome";
import CbtPage from "./pages/CbtPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import SettingsPage from "./pages/SettingsPage";
import PdfStorePage from "./pages/PdfStorePage";

import CbtExamPage from "./pages/CbtExamPage";

import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminInbox from "./pages/AdminInbox";

import { getAuth } from "./api/authStorage";
import { setAuthToken } from "./api/http";
import { applyTheme, getTheme } from "./api/theme";

export default function App() {
  useEffect(() => {
    const auth = getAuth();
    setAuthToken(auth?.token);
    applyTheme(getTheme());
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Student Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardHome />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/pdfs"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <PdfStorePage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/cbt"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <CbtPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* ✅ EXAM ROUTE (standard) */}
        <Route
          path="/dashboard/cbt/exam/:course"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <CbtExamPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/leaderboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <LeaderboardPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/settings"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <SettingsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard */}
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <DashboardLayout>
                  <AdminDashboardPage />
                </DashboardLayout>
              </AdminRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/admin/inbox"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <DashboardLayout>
                  <AdminInbox />
                </DashboardLayout>
              </AdminRoute>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
