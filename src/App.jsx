// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider }  from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ErrorBoundary     from "./components/ErrorBoundary";
import ProtectedRoute    from "./components/ProtectedRoute";
import LoginPage         from "./pages/LoginPage";
import DashboardPage     from "./pages/DashboardPage";
import AdminPage         from "./pages/AdminPage";
import SupportPage       from "./pages/SupportPage";
import ProfilePage       from "./pages/ProfilePage";
import WalletPage        from "./pages/WalletPage";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <ErrorBoundary>
              <Routes>
                <Route path="/"          element={<LoginPage />} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/wallet"    element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
                <Route path="/support"   element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
                <Route path="/profile"   element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/admin"     element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
                <Route path="*"          element={<LoginPage />} />
              </Routes>
            </ErrorBoundary>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
