import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, LayoutDashboard } from "lucide-react";
import { useAuthStore } from "../store/authStore";

export default function LandingPage() {
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const dashboardPath =
    user?.role === "admin" ? "/admin/dashboard" : "/author/dashboard";

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF7F2] text-[#2B2B2B] antialiased selection:bg-[#C9A227]/20 selection:text-[#6B2D3C]">
      <header className="border-b border-[#2B2B2B]/10">
        <nav className="mx-auto flex max-w-8xl items-center justify-between px-6 py-5 lg:px-12">
          <Link
            to="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6B2D3C] text-[#FAF7F2]">
              <BookOpen size={20} aria-hidden="true" />
            </div>
            <div>
              <span className="font-serif text-xl font-semibold tracking-tight text-[#2B2B2B]">
                BookLeaf
              </span>
              <p className="text-xs text-[#2B2B2B]/60">Author Portal</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {isInitializing ? (
              <>
                <div className="hidden h-5 w-14 animate-pulse rounded bg-[#2B2B2B]/10 sm:block" />
                <div className="h-9 w-32 animate-pulse rounded-lg bg-[#6B2D3C]/20" />
              </>
            ) : isAuthenticated ? (
              <Link
                to={dashboardPath}
                className="inline-flex items-center gap-2 rounded-lg bg-[#6B2D3C] px-4 py-2 text-sm font-medium text-[#FAF7F2] transition hover:bg-[#582431]"
              >
                <LayoutDashboard size={15} aria-hidden="true" />
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-[#2B2B2B]/80 transition-colors hover:text-[#6B2D3C]"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#6B2D3C] px-4 py-2 text-sm font-medium text-[#FAF7F2] transition hover:bg-[#582431]"
                >
                  Get Started
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="flex flex-1 items-center">
        <div className="mx-auto grid w-full max-w-8xl items-center gap-12 px-6 py-12 lg:grid-cols-2 lg:gap-16 lg:px-12 lg:py-24">
          <div className="flex flex-col items-start justify-center">
            <span className="mb-4 inline-block font-mono text-xs uppercase tracking-widest text-[#C9A227]">
              Author Workspace
            </span>

            <h1 className="font-serif text-4xl font-normal leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Everything your book needs,{" "}
              <span className="text-[#6B2D3C] italic">all in one place.</span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-[#2B2B2B]/80 sm:text-lg">
              Manage your manuscripts, review royalty reports, and resolve
              inquiries directly with the BookLeaf editorial and support desk.
            </p>

            <div className="mt-8 flex w-full flex-col gap-3.5 sm:w-auto sm:flex-row sm:items-center">
              {isInitializing ? (
                <>
                  <div className="h-12 w-full animate-pulse rounded-lg bg-[#6B2D3C]/20 sm:w-56" />
                  <div className="h-12 w-full animate-pulse rounded-lg bg-[#2B2B2B]/10 sm:w-44" />
                </>
              ) : isAuthenticated ? (
                <Link
                  to={dashboardPath}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#6B2D3C] px-6 py-3.5 text-sm font-medium text-[#FAF7F2] transition-colors hover:bg-[#582431]"
                >
                  <LayoutDashboard size={16} aria-hidden="true" />
                  Go to Dashboard
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#6B2D3C] px-6 py-3.5 text-sm font-medium text-[#FAF7F2] transition-colors hover:bg-[#582431]"
                  >
                    Create Author Account
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>

                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center rounded-lg border border-[#2B2B2B]/20 bg-[#F5EFE6] px-6 py-3.5 text-sm font-medium text-[#2B2B2B] transition-colors hover:border-[#2B2B2B]/40 hover:bg-[#eae3d8]"
                  >
                    Sign In to Portal
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex w-full items-center justify-center">
            <img
              src="/Book.svg"
              alt="BookLeaf Author Workspace Illustration"
              loading="lazy"
              decoding="async"
              width={600}
              height={500}
              className="h-auto max-w-full object-contain"
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-[#2B2B2B]/10 py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-xs text-[#2B2B2B]/60 sm:flex-row lg:px-12">
          <p>© {new Date().getFullYear()} BookLeaf. All rights reserved.</p>
          <p className="text-right">Supporting authors at every step.</p>
        </div>
      </footer>
    </div>
  );
}