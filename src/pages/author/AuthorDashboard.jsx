import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CircleDollarSign,
  LibraryBig,
  MessageCircle,
  Plus,
} from "lucide-react";

import StatCard from "../../components/dashboard/StatCard";
import RecentTickets from "../../components/dashboard/RecentTickets";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { dashboardApi, getErrorMessage } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";



function formatCurrency(value) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export default function AuthorDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = useAuthStore((state) => state.user);

const authorName =
  user?.full_name ||
  user?.fullName ||
  "Author";

  useEffect(() => {
    let active = true;

    async function fetchDashboard() {
      try {
        setLoading(true);
        setError("");

        const { data } = await dashboardApi.getDashboard();

        if (active) {
          // Supports either a direct response or { data: dashboard }.
          setDashboard(data?.data ?? data);
        }
      } catch (err) {
        if (active) {
          setError(
            getErrorMessage(err, "Unable to load your dashboard.")
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => {
      active = false;
    };
  }, []);

  const stats = dashboard?.stats ?? dashboard ?? {};
  const recentTickets = dashboard?.recentTickets ?? [];


  return (
    <div className="space-y-8">
      {/* Editorial Overview Banner */}
      <section className="relative overflow-hidden rounded-xl border border-[#2B2B2B]/15 bg-[#6B2D3C] p-6 text-[#FAF7F2] sm:p-8 lg:p-10">
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-widest text-[#C9A227]">
              Author Workspace
            </span>

            <h1 className="mt-3 font-serif text-3xl font-normal tracking-tight text-[#FAF7F2] sm:text-4xl">
              Welcome back, {authorName}.
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#FAF7F2]/80">
              Review your publication milestones, track royalties, and access
              direct support from the editorial desk.
            </p>
          </div>

          <Button
            asChild
            className="h-11 cursor-pointer self-start rounded-lg bg-[#FAF7F2] px-5 text-xs font-semibold uppercase tracking-wider text-[#6B2D3C] hover:bg-[#F5EFE6] md:self-center"
          >
            <Link to="/author/tickets/new">
              <Plus size={16} className="mr-1.5" aria-hidden="true" />
              New Inquiry
            </Link>
          </Button>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#FAF7F2]/15 pt-4 font-mono text-xs text-[#FAF7F2]/65">
          <span>Production &amp; Distribution Operations</span>
          <span className="text-[#C9A227]">·</span>
          <span>
            {loading ? "Refreshing records..." : "Author records"}
          </span>
        </div>
      </section>

      {/* Dashboard Error */}
      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="self-start font-semibold underline underline-offset-4 sm:self-auto"
          >
            Retry
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-normal tracking-tight text-[#2B2B2B]">
              Publishing Metrics
            </h2>
            <p className="text-xs text-[#2B2B2B]/60">
              Snapshot of your titles and recorded earnings
            </p>
          </div>

          <Link
            to="/author/books"
            className="hidden cursor-pointer items-center gap-1 text-xs font-semibold text-[#6B2D3C] hover:underline sm:flex"
          >
            View Library
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Titles"
            value={loading ? "…" : String(stats.totalBooks ?? 0)}
            description="Books in your catalog"
            icon={LibraryBig}
            tone="burgundy"
          />

          <StatCard
            title="Published Titles"
            value={loading ? "…" : String(stats.publishedBooks ?? 0)}
            description="Books marked as published"
            icon={BookOpen}
            tone="green"
          />

          <StatCard
            title="Royalties Earned"
            value={
              loading
                ? "…"
                : formatCurrency(stats.totalRoyalties)
            }
            description="Total recorded royalties"
            icon={CircleDollarSign}
            tone="gold"
          />

          <StatCard
            title="Open Inquiries"
            value={loading ? "…" : String(stats.openTickets ?? 0)}
            description="Open or in-progress tickets"
            icon={MessageCircle}
            tone="charcoal"
          />
        </div>

        {!loading && !error && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[#2B2B2B]/10 bg-white px-4 py-3">
              <p className="text-xs text-[#2B2B2B]/60">Copies Sold</p>
              <p className="mt-1 text-lg font-semibold text-[#2B2B2B]">
                {Number(stats.totalCopiesSold ?? 0).toLocaleString("en-IN")}
              </p>
            </div>

            <div className="rounded-lg border border-[#2B2B2B]/10 bg-white px-4 py-3">
              <p className="text-xs text-[#2B2B2B]/60">Royalties Paid</p>
              <p className="mt-1 text-lg font-semibold text-[#3D6B4F]">
                {formatCurrency(stats.royaltiesPaid)}
              </p>
            </div>

            <div className="rounded-lg border border-[#2B2B2B]/10 bg-white px-4 py-3">
              <p className="text-xs text-[#2B2B2B]/60">Royalties Pending</p>
              <p className="mt-1 text-lg font-semibold text-[#8C6D14]">
                {formatCurrency(stats.royaltiesPending)}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Main Workspace Split */}
      <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]">
        <RecentTickets
          tickets={recentTickets}
          loading={loading}
          error={error}
        />

        {/* Quick Navigation Sidebar */}
        <div className="space-y-5">
          <Card className="rounded-xl border border-[#2B2B2B]/10 bg-white p-5 shadow-none sm:p-6">
            <CardHeader className="p-0">
              <CardTitle className="font-serif text-base font-normal tracking-tight text-[#2B2B2B]">
                Quick Navigation
              </CardTitle>
              <CardDescription className="text-xs text-[#2B2B2B]/60">
                Direct access to core workspaces
              </CardDescription>
            </CardHeader>

            <CardContent className="mt-4 space-y-2 p-0">
              <Link
                to="/author/books"
                className="group flex cursor-pointer items-center gap-3.5 rounded-lg border border-[#2B2B2B]/10 bg-[#FAF7F2]/40 p-3 transition-colors hover:border-[#6B2D3C]/30 hover:bg-[#FAF7F2]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#2B2B2B]/10 bg-[#6B2D3C]/5 text-[#6B2D3C]">
                  <LibraryBig size={17} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#2B2B2B]">
                    Title Catalog
                  </p>
                  <p className="text-[11px] text-[#2B2B2B]/55">
                    Metadata, formats &amp; print runs
                  </p>
                </div>
                <ArrowRight
                  size={14}
                  className="text-[#2B2B2B]/40 transition-transform group-hover:translate-x-0.5 group-hover:text-[#6B2D3C]"
                  aria-hidden="true"
                />
              </Link>

              <Link
                to="/author/tickets"
                className="group flex cursor-pointer items-center gap-3.5 rounded-lg border border-[#2B2B2B]/10 bg-[#FAF7F2]/40 p-3 transition-colors hover:border-[#6B2D3C]/30 hover:bg-[#FAF7F2]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#2B2B2B]/10 bg-[#C9A227]/10 text-[#8C6D14]">
                  <MessageCircle size={17} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#2B2B2B]">
                    Support Archive
                  </p>
                  <p className="text-[11px] text-[#2B2B2B]/55">
                    Review support conversations
                  </p>
                </div>
                <ArrowRight
                  size={14}
                  className="text-[#2B2B2B]/40 transition-transform group-hover:translate-x-0.5 group-hover:text-[#6B2D3C]"
                  aria-hidden="true"
                />
              </Link>

              <Link
                to="/author/tickets/new"
                className="group flex cursor-pointer items-center gap-3.5 rounded-lg border border-[#2B2B2B]/10 bg-[#FAF7F2]/40 p-3 transition-colors hover:border-[#6B2D3C]/30 hover:bg-[#FAF7F2]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#2B2B2B]/10 bg-[#3D6B4F]/10 text-[#3D6B4F]">
                  <Plus size={17} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#2B2B2B]">
                    Create Inquiry
                  </p>
                  <p className="text-[11px] text-[#2B2B2B]/55">
                    Open a ticket with editorial
                  </p>
                </div>
                <ArrowRight
                  size={14}
                  className="text-[#2B2B2B]/40 transition-transform group-hover:translate-x-0.5 group-hover:text-[#6B2D3C]"
                  aria-hidden="true"
                />
              </Link>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-[#2B2B2B]/10 bg-[#F5EFE6] p-5 shadow-none">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#2B2B2B]/60">
              Editorial Notice
            </span>
            <h3 className="mt-1 font-serif text-sm font-normal text-[#2B2B2B]">
              Distribution Schedules
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[#2B2B2B]/70">
              Monthly sales reconcile on the 25th. Queries raised after cut-off
              process in the subsequent production cycle.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}