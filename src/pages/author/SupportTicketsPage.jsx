import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  MessageSquare,
  Clock3,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  SlidersHorizontal,
  LifeBuoy,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

import { ticketsApi, getErrorMessage } from "../../lib/api";

const PAGE_SIZE = 10;

const categories = [
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry",
];

const statusStyles = {
  Open: "bg-blue-50 text-blue-700 ring-blue-200",
  "In Progress": "bg-amber-50 text-amber-700 ring-amber-200",
  Resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Closed: "bg-gray-100 text-gray-600 ring-gray-200",
};

const priorityStyles = {
  Critical: "bg-red-100 text-red-800",
  High: "bg-red-50 text-red-700",
  Medium: "bg-amber-50 text-amber-700",
  Normal: "bg-gray-100 text-gray-600",
  Low: "bg-green-50 text-green-700",
};

function normalizeTicket(ticket) {
  const status =
    ticket.status ??
    ticket.status_name ??
    ticket.current_status ??
    "Open";

  const priority =
    ticket.priority ??
    ticket.priority_name ??
    ticket.current_priority ??
    "Medium";

  const ticketNumber =
    ticket.ticket_number ??
    ticket.ticketNumber ??
    ticket.reference ??
    ticket.id;

  return {
    ...ticket,
    id: ticket.id,
    reference: String(ticketNumber),
    subject: ticket.subject || "Untitled ticket",
    category:
      ticket.category ??
      ticket.category_name ??
      ticket.current_category ??
      "General Inquiry",
    book:
      ticket.book_title ??
      ticket.bookTitle ??
      ticket.book?.title ??
      "",
    status,
    priority,
    updatedAt:
      ticket.updated_at ??
      ticket.updatedAt ??
      ticket.last_activity_at ??
      ticket.created_at ??
      ticket.createdAt ??
      null,
  };
}

function getPayload(response) {
  const body = response?.data ?? {};

  // Support either { tickets, pagination } or { data: { tickets, pagination } }.
  const payload = body.data ?? body;

  return {
    tickets: Array.isArray(payload.tickets)
      ? payload.tickets.map(normalizeTicket)
      : [],
    pagination: payload.pagination ?? {},
  };
}

function formatRelativeTime(value) {
  if (!value) return "No activity recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Recently updated";

  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(Math.max(0, diff) / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);

  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        statusStyles[status] || statusStyles.Open
      }`}
    >
      {status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const style = priorityStyles[priority] || priorityStyles.Medium;

  const dotStyle =
    priority === "Critical" || priority === "High"
      ? "bg-red-500"
      : priority === "Low"
        ? "bg-green-500"
        : priority === "Medium"
          ? "bg-amber-500"
          : "bg-gray-400";

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${style}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyle}`} />
      {priority}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  description,
  iconClass,
}) {
  return (
    <div className="rounded-2xl border border-[#EAE2D8] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>

          <p className="mt-2 text-2xl font-bold text-[#2B2B2B]">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={21} />
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-500">{description}</p>
    </div>
  );
}

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState("recent");

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const page = pagination.page || 1;

  const fetchTickets = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError("");

      try {
        const params = {
          page,
          limit: PAGE_SIZE,
        };

        if (search) {
          params.search = search;
        }

        if (statusFilter !== "All") {
          params.status = statusFilter;
        }

        const response = await ticketsApi.getTickets(params);
        const result = getPayload(response);

        setTickets(result.tickets);

        const serverPagination = result.pagination;

        const total = Number(
          serverPagination.total ?? result.tickets.length,
        );

        const limit = Number(
          serverPagination.limit ?? PAGE_SIZE,
        );

        const currentPage = Number(
          serverPagination.page ?? page,
        );

        setPagination({
          page: currentPage,
          limit,
          total,
          totalPages: Number(
            serverPagination.totalPages ??
              Math.ceil(total / Math.max(1, limit)),
          ),
        });

        // If a filter reduces the number of pages, return to the last
        // available page rather than leaving the user on an empty page.
        const totalPages = Math.ceil(total / Math.max(1, limit));

        if (totalPages > 0 && page > totalPages) {
          setPagination((current) => ({
            ...current,
            page: totalPages,
          }));
        }
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            "Unable to load your support tickets.",
          ),
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [page, search, statusFilter],
  );

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Debounce search to avoid making an API request on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch((current) => {
        if (current === searchInput.trim()) return current;

        setPagination((paginationState) => ({
          ...paginationState,
          page: 1,
        }));

        return searchInput.trim();
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Changing a server-side filter should always start from page 1.
  function handleStatusChange(value) {
    setStatusFilter(value);
    setPagination((current) => ({ ...current, page: 1 }));
  }

  function handlePageChange(nextPage) {
    const totalPages = pagination.totalPages || 1;

    if (nextPage < 1 || nextPage > totalPages) return;

    setPagination((current) => ({
      ...current,
      page: nextPage,
    }));
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setStatusFilter("All");
    setCategoryFilter("All");
    setSortBy("recent");

    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  }

  const filteredTickets = useMemo(() => {
    let result = tickets.filter((ticket) => {
      return (
        categoryFilter === "All" ||
        ticket.category === categoryFilter
      );
    });

    if (sortBy === "priority") {
      const priorityRank = {
        Critical: 4,
        High: 3,
        Medium: 2,
        Normal: 2,
        Low: 1,
      };

      result = [...result].sort(
        (a, b) =>
          (priorityRank[b.priority] || 0) -
          (priorityRank[a.priority] || 0),
      );
    }

    return result;
  }, [tickets, categoryFilter, sortBy]);

  // These figures represent the currently loaded server page.
  // They are not global counts unless the backend supplies aggregate totals.
  const counts = useMemo(
    () => ({
      all: pagination.total,
      open: tickets.filter((ticket) => ticket.status === "Open").length,
      progress: tickets.filter(
        (ticket) => ticket.status === "In Progress",
      ).length,
      resolved: tickets.filter((ticket) =>
        ["Resolved", "Closed"].includes(ticket.status),
      ).length,
    }),
    [tickets, pagination.total],
  );

  const totalPages = pagination.totalPages || 1;

  return (
    <div className="min-h-full space-y-7">
      {/* Page heading */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
            <LifeBuoy size={16} />
            Author Support
            <span>/</span>
            <span className="font-medium text-[#6B2D3C]">
              Support Tickets
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#2B2B2B] sm:text-3xl">
            Support tickets
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Manage your support requests and keep track of conversations
            with the BookLeaf team.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => fetchTickets({ silent: true })}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#EAE2D8] bg-white px-4 py-3 text-sm font-semibold text-[#6B2D3C] transition hover:bg-[#FAF7F2] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={isRefreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <Link
            to="/author/tickets/new"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#6B2D3C] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#552330] focus:outline-none focus:ring-2 focus:ring-[#6B2D3C] focus:ring-offset-2"
          >
            <Plus size={18} />
            Create ticket
          </Link>
        </div>
      </section>

      {/* Summary cards */}
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <SummaryCard
          label="Total tickets"
          value={counts.all}
          icon={MessageSquare}
          description="All matching support requests"
          iconClass="bg-[#F5EFE6] text-[#6B2D3C]"
        />

        <SummaryCard
          label="Open"
          value={counts.open}
          icon={AlertCircle}
          description="On this page"
          iconClass="bg-blue-50 text-blue-700"
        />

        <SummaryCard
          label="In progress"
          value={counts.progress}
          icon={Clock3}
          description="On this page"
          iconClass="bg-amber-50 text-amber-700"
        />

        <SummaryCard
          label="Resolved"
          value={counts.resolved}
          icon={CheckCircle2}
          description="Resolved or closed on this page"
          iconClass="bg-green-50 text-green-700"
        />
      </section>

      {/* Ticket list */}
      <section className="overflow-hidden rounded-2xl border border-[#EAE2D8] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#EEE8E0] p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-[#2B2B2B]">
                Your requests
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                View your support conversations and their latest status.
              </p>
            </div>

            <span className="w-fit rounded-full bg-[#FAF7F2] px-3 py-1.5 text-xs font-semibold text-[#6B2D3C]">
              {pagination.total}{" "}
              {pagination.total === 1 ? "ticket" : "tickets"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {/* Search */}
            <div className="relative md:col-span-2 xl:col-span-2">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search subject, ticket ID, description..."
                aria-label="Search support tickets"
                className="w-full rounded-xl border border-[#E8E1D8] bg-[#FFFEFC] py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#6B2D3C] focus:ring-2 focus:ring-[#6B2D3C]/10"
              />
            </div>

            {/* Status filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) =>
                  handleStatusChange(event.target.value)
                }
                aria-label="Filter by status"
                className="w-full appearance-none rounded-xl border border-[#E8E1D8] bg-[#FFFEFC] px-3.5 py-3 pr-9 text-sm text-gray-700 outline-none focus:border-[#6B2D3C] focus:ring-2 focus:ring-[#6B2D3C]/10"
              >
                <option value="All">All statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>

            {/* Category filter */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                aria-label="Filter by category"
                className="w-full appearance-none rounded-xl border border-[#E8E1D8] bg-[#FFFEFC] px-3.5 py-3 pr-9 text-sm text-gray-700 outline-none focus:border-[#6B2D3C] focus:ring-2 focus:ring-[#6B2D3C]/10"
              >
                <option value="All">All categories</option>

                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <SlidersHorizontal size={14} />
              <span>Sort by</span>

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                aria-label="Sort tickets"
                className="rounded-lg border border-[#E8E1D8] bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 outline-none focus:border-[#6B2D3C]"
              >
                <option value="recent">Recent activity</option>
                <option value="priority">High priority first</option>
              </select>
            </div>

            {(searchInput ||
              statusFilter !== "All" ||
              categoryFilter !== "All" ||
              sortBy !== "recent") && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-[#6B2D3C] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div
            role="alert"
            className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 sm:m-6"
          >
            <p className="text-sm font-semibold text-red-800">
              Unable to load tickets
            </p>

            <p className="mt-1 text-sm text-red-700">{error}</p>

            <button
              type="button"
              onClick={() => fetchTickets()}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-red-800 hover:underline"
            >
              <RefreshCw size={14} />
              Try again
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && !error && (
          <div className="space-y-4 p-6">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-xl border border-[#EEE8E0] p-5"
              >
                <div className="h-4 w-2/5 rounded bg-gray-100" />
                <div className="mt-3 h-3 w-1/4 rounded bg-gray-100" />
                <div className="mt-4 h-3 w-1/3 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        )}

        {/* Desktop table */}
        {!isLoading && !error && filteredTickets.length > 0 && (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-212.5 text-left">
                <thead className="bg-[#FAF7F2]">
                  <tr className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <th className="px-6 py-4">Ticket</th>
                    <th className="px-4 py-4">Category</th>
                    <th className="px-4 py-4">Priority</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Last activity</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#F0EBE4]">
                  {filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="transition hover:bg-[#FFFEFC]"
                    >
                      <td className="px-6 py-5">
                        <Link
                          to={`/author/tickets/${ticket.id}`}
                          className="group block"
                        >
                          <p className="max-w-75 truncate text-sm font-semibold text-[#2B2B2B] group-hover:text-[#6B2D3C]">
                            {ticket.subject}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {ticket.reference}
                          </p>

                          {ticket.book && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                              <BookOpen size={13} />
                              <span className="max-w-60 truncate">
                                {ticket.book}
                              </span>
                            </div>
                          )}
                        </Link>
                      </td>

                      <td className="px-4 py-5">
                        <span className="text-sm text-gray-600">
                          {ticket.category}
                        </span>
                      </td>

                      <td className="px-4 py-5">
                        <PriorityBadge priority={ticket.priority} />
                      </td>

                      <td className="px-4 py-5">
                        <StatusBadge status={ticket.status} />
                      </td>

                      <td className="px-4 py-5">
                        <span className="whitespace-nowrap text-sm text-gray-500">
                          {formatRelativeTime(ticket.updatedAt)}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <Link
                          to={`/author/tickets/${ticket.id}`}
                          aria-label={`View ticket ${ticket.reference}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#EAE2D8] text-gray-500 transition hover:border-[#6B2D3C] hover:bg-[#F5EFE6] hover:text-[#6B2D3C]"
                        >
                          <ArrowUpRight size={17} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile ticket cards */}
            <div className="divide-y divide-[#F0EBE4] md:hidden">
              {filteredTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  to={`/author/tickets/${ticket.id}`}
                  className="block p-5 transition hover:bg-[#FFFEFC]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-5 text-[#2B2B2B]">
                        {ticket.subject}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {ticket.reference}
                      </p>
                    </div>

                    <ArrowUpRight
                      size={17}
                      className="shrink-0 text-gray-400"
                    />
                  </div>

                  <p className="mt-3 text-xs text-gray-500">
                    {ticket.category}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-gray-500">
                    <span className="truncate">
                      {ticket.book || "General inquiry"}
                    </span>

                    <span className="shrink-0">
                      {formatRelativeTime(ticket.updatedAt)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {!isLoading && !error && filteredTickets.length === 0 && (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5EFE6] text-[#6B2D3C]">
              <Search size={24} />
            </div>

            <h3 className="mt-4 text-base font-semibold text-[#2B2B2B]">
              {pagination.total === 0
                ? "No support tickets yet"
                : "No tickets found"}
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
              {pagination.total === 0
                ? "When you create a support request, it will appear here."
                : "Try a different search term or change your filters."}
            </p>

            {pagination.total === 0 ? (
              <Link
                to="/author/tickets/new"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#6B2D3C] px-5 py-3 text-sm font-semibold text-white hover:bg-[#552330]"
              >
                <Plus size={17} />
                Create your first ticket
              </Link>
            ) : (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-[#6B2D3C] hover:bg-[#F5EFE6]"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && pagination.total > 0 && (
          <div className="flex flex-col gap-3 border-t border-[#EEE8E0] bg-[#FFFEFC] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-gray-500">
              Page {page} of {totalPages}
              <span className="mx-2">·</span>
              {pagination.total} total tickets
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-[#EAE2D8] bg-white px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-[#F5EFE6] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button
                type="button"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-[#EAE2D8] bg-white px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-[#F5EFE6] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      <p className="text-center text-xs leading-5 text-gray-400">
        Need help with something new?{" "}
        <Link
          to="/author/tickets/new"
          className="font-semibold text-[#6B2D3C] hover:underline"
        >
          Create a support ticket
        </Link>
      </p>
    </div>
  );
}