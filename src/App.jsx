import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuthStore } from "./store/authStore";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";

import PortalLayout from "./components/layout/PortalLayout";

import AuthorDashboard from "./pages/author/AuthorDashboard";
import BooksPage from "./pages/author/BooksPage";
import SupportTicketsPage from "./pages/author/SupportTicketsPage";
import TicketConversationPage from "./pages/author/TicketConversationPage";
import CreateTicketPage from "./pages/author/CreateTicketPage";
import BookDetailsPage from "./pages/author/BookDetailsPage";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTicketsPage from "./pages/admin/AdminTicketsPage";
import KnowledgeBasePage from "./pages/admin/KnowledgeBasePage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import AdminTicketConversationPage from "./pages/admin/AdminTicketConversationPage";

function AuthInitializer({ children }) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return children;
}

function SessionLoader({ message }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF7F2]">
      <p className="animate-pulse text-sm text-[#6B2D3C]">{message}</p>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (isInitializing) {
    return <SessionLoader message="Restoring your session..." />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
          message: "Please sign in to continue.",
        }}
      />
    );
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (isInitializing) {
    return <SessionLoader message="Checking your session..." />;
  }

  if (isAuthenticated && user) {
    return (
      <Navigate
        to={user.role === "admin" ? "/admin/dashboard" : "/author/dashboard"}
        replace
      />
    );
  }

  return children;
}

function RoleRoute({ role, children }) {
  const user = useAuthStore((state) => state.user);

  if (user?.role !== role) {
    return (
      <Navigate
        to={user?.role === "admin" ? "/admin/dashboard" : "/author/dashboard"}
        replace
      />
    );
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthInitializer>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicOnlyRoute>
                <SignupPage />
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/author"
            element={
              <ProtectedRoute>
                <RoleRoute role="author">
                  <PortalLayout role="author" />
                </RoleRoute>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/author/dashboard" replace />} />
            <Route path="dashboard" element={<AuthorDashboard />} />
            <Route path="books" element={<BooksPage />} />
            <Route path="books/:bookId" element={<BookDetailsPage />} />
            <Route path="tickets" element={<SupportTicketsPage />} />
            <Route path="tickets/new" element={<CreateTicketPage />} />
            <Route path="tickets/:ticketId" element={<TicketConversationPage />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <RoleRoute role="admin">
                  <PortalLayout role="admin" />
                </RoleRoute>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="tickets" element={<AdminTicketsPage />} />
            <Route path="tickets/:ticketId" element={<AdminTicketConversationPage />} />
            <Route path="knowledge-base" element={<KnowledgeBasePage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          <Route
            path="*"
            element={
              <main className="flex min-h-screen items-center justify-center bg-[#FAF7F2] px-6">
                <div className="text-center">
                  <h1 className="text-5xl font-bold text-[#6B2D3C]">404</h1>

                  <p className="mt-3 text-[#82756B]">
                    The page you're looking for doesn't exist.
                  </p>

                  <a
                    href="/"
                    className="mt-6 inline-flex rounded-xl bg-[#6B2D3C] px-5 py-3 font-semibold text-white transition hover:bg-[#542330]"
                  >
                    Back to home
                  </a>
                </div>
              </main>
            }
          />
        </Routes>
      </AuthInitializer>
    </BrowserRouter>
  );
}