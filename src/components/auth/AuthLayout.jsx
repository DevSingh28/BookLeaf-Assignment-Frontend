import { BookOpen, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <main className="flex min-h-screen bg-[#FAF7F2] text-[#2B2B2B] antialiased selection:bg-[#C9A227]/20 selection:text-[#6B2D3C]">
      {/* Left Editorial Panel */}
      <section className="relative hidden overflow-hidden border-r border-[#2B2B2B]/10 bg-[#6B2D3C] p-12 text-[#FAF7F2] lg:flex lg:w-5/12 lg:flex-col lg:justify-between xl:w-1/2">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#C9A227]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-black/20 blur-3xl" />

        <Link
          to="/"
          className="relative inline-flex items-center gap-3 transition-opacity hover:opacity-85"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#FAF7F2]/10 text-[#FAF7F2]">
            <BookOpen size={20} aria-hidden="true" />
          </div>
          <div>
            <span className="font-serif text-xl font-semibold tracking-tight text-[#FAF7F2]">
              BookLeaf
            </span>
            <p className="font-mono text-xs text-[#FAF7F2]/70">Publishing Portal</p>
          </div>
        </Link>

        <div className="relative my-auto max-w-md">
          <span className="font-mono text-xs uppercase tracking-widest text-[#C9A227]">
            Management Workspace
          </span>
          <h2 className="mt-4 font-serif text-3xl font-normal leading-tight text-[#FAF7F2] sm:text-4xl">
            Where your manuscripts find their craft and care.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#FAF7F2]/80">
            Access royalties, coordinate publication timelines, and get dedicated editorial assistance in one quiet space.
          </p>
        </div>

        <p className="relative text-xs text-[#FAF7F2]/60">
          © {new Date().getFullYear()} BookLeaf. Crafted for authors and editorial teams.
        </p>
      </section>

      {/* Right Form Panel */}
      <section className="flex flex-1 flex-col justify-between px-6 py-10 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#2B2B2B]/60 transition-colors hover:text-[#6B2D3C]"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to Home
          </Link>
        </div>

        <div className="mx-auto w-full max-w-sm py-8">
          <div className="mb-6">
            <h1 className="font-serif text-3xl font-normal tracking-tight text-[#2B2B2B]">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#2B2B2B]/70">
              {subtitle}
            </p>
          </div>

          {children}
        </div>

        <div className="mx-auto w-full max-w-sm">
          <p className="text-center text-xs text-[#2B2B2B]/40">
            Protected by BookLeaf publishing security protocols.
          </p>
        </div>
      </section>
    </main>
  );
}