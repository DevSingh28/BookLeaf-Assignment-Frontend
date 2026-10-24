import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { X } from "lucide-react";

import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";
import { Button } from "@/components/ui/button";
import { authApi, getErrorMessage } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";

export default function PortalLayout({ role = "author" }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const navigate = useNavigate();
  const clearUser = useAuthStore((state) => state.clearUser);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  async function handleLogout() {
    if (logoutLoading) return;

    setLogoutLoading(true);
    setLogoutError("");

    try {
      await authApi.logout();
    } catch (error) {
      // Still clear local authentication if the server request fails.
      // The server-side cookie may remain valid until it expires.
      setLogoutError(
        getErrorMessage(error, "Unable to log out from the server.")
      );
    } finally {
      clearUser();
      setLogoutLoading(false);
      setMobileMenuOpen(false);

      navigate("/login", {
        replace: true,
        state: {
          message: "You have been logged out.",
        },
      });
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2B2B2B] antialiased selection:bg-[#C9A227]/20 selection:text-[#6B2D3C]">
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <AppSidebar role={role} />
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={closeMobileMenu}
              className="absolute inset-0 bg-[#2B2B2B]/40 backdrop-blur-[2px]"
            />

            <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col shadow-xl">
              <div className="absolute right-3 top-5 z-10">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={closeMobileMenu}
                  aria-label="Close navigation"
                  className="h-9 w-9 cursor-pointer rounded-lg border-[#2B2B2B]/20 bg-white text-[#2B2B2B] hover:text-[#6B2D3C]"
                >
                  <X size={16} />
                </Button>
              </div>

              <AppSidebar
                role={role}
                onNavigate={closeMobileMenu}
              />
            </div>
          </div>
        )}

        {/* Main Workspace */}
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader
            role={role}
            onMenuClick={() => setMobileMenuOpen(true)}
            onLogout={handleLogout}
            logoutLoading={logoutLoading}
            logoutError={logoutError}
          />

          <main className="flex-1 px-6 py-8 sm:px-8 sm:py-10 lg:px-12">
            <div className="mx-auto w-full max-w-7xl">
              <Outlet />
            </div>
          </main>

          <footer className="border-t border-[#2B2B2B]/10 px-6 py-5 text-center text-xs text-[#2B2B2B]/60 sm:px-8">
            © {new Date().getFullYear()} BookLeaf. Author Support & Publishing Infrastructure.
          </footer>
        </div>
      </div>
    </div>
  );
}