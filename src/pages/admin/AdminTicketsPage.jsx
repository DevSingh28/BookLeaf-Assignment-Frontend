import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { adminTicketsApi, getErrorMessage } from "../../lib/api";
import {
  Search,
  SlidersHorizontal,
  ArrowUpRight,
  Clock3,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  UserRound,
  CalendarDays,
  Inbox,
  X,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const priorityStyles = {
  urgent: "border-red-200 bg-red-50 text-red-700",
  high: "border-orange-200 bg-orange-50 text-orange-700",
  medium: "border-[#C9A227]/30 bg-[#C9A227]/10 text-[#8A6B10]",
  low: "border-[#3D6B4F]/20 bg-[#3D6B4F]/10 text-[#3D6B4F]",
};

const statusStyles = {
  Open: "bg-blue-50 text-blue-700",
  "In Progress": "bg-amber-50 text-amber-700",
  Resolved: "bg-emerald-50 text-emerald-700",
  Closed: "bg-stone-100 text-stone-600",
};

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getAgeInDays(date) {
  return Math.floor(
    (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function mapTicket(ticket) {
  const assigned =
    ticket.assigned_to ??
    ticket.assignedTo ??
    ticket.assignee_name ??
    ticket.assignee?.name ??
    null;

  return {
    id: ticket.id,
    databaseId: ticket.id,
    ticketNumber: ticket.ticket_number ?? ticket.reference ?? ticket.id,
    subject: ticket.subject ?? ticket.title ?? "Untitled ticket",
    author:
      ticket.author_name ??
      ticket.author?.name ??
      ticket.user_name ??
      ticket.user?.name ??
      "Author",
    email:
      ticket.author_email ??
      ticket.author?.email ??
      ticket.user_email ??
      ticket.user?.email ??
      "",
    category: ticket.category_name ?? ticket.category ?? "Uncategorized",
    priority: String(ticket.priority ?? "medium").toLowerCase(),
    status: String(ticket.status ?? "Open")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    assignedTo: assigned
      ? typeof assigned === "object"
        ? assigned.name ?? assigned.email ?? "Assigned"
        : assigned
      : null,
    createdAt:
      ticket.created_at ?? ticket.createdAt ?? ticket.created_on ?? null,
    description: ticket.description ?? "",
  };
}

function buildParams({
  page,
  statusFilter,
  priorityFilter,
  prioritySelect,
  categoryFilter,
  search,
  isUnassignedView,
}) {
  const params = { page, limit: 10 };
  if (statusFilter !== "All") params.status = statusFilter;

  const selectedPriority =
    priorityFilter ?? (prioritySelect !== "All" ? prioritySelect : null);
  if (selectedPriority) {
    params.priority =
      selectedPriority.charAt(0).toUpperCase() + selectedPriority.slice(1);
  }

  if (categoryFilter !== "All") params.category = categoryFilter;
  if (search.trim()) params.search = search.trim();
  if (isUnassignedView) params.assigned = "unassigned";
  return params;
}

export default function AdminTicketsPage() {
  const [searchParams] = useSearchParams();

  const priorityFilter = searchParams.get("priority");
  const assignmentFilter = searchParams.get("assigned");

  const [tickets, setTickets] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [prioritySelect, setPrioritySelect] = useState("All");

  const isUrgentView = priorityFilter === "urgent";
  const isUnassignedView = assignmentFilter === "unassigned";

  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    let active = true;
    async function loadTickets() {
      setLoading(true);
      setError("");
      try {
        const params = buildParams({
          page,
          statusFilter,
          priorityFilter,
          prioritySelect,
          categoryFilter,
          search,
          isUnassignedView,
        });
        const response = await adminTicketsApi.getTickets(params);
        if (!active) return;
        const payload = response.data?.data ?? response.data ?? {};
        const rows = Array.isArray(payload) ? payload : payload.tickets ?? payload.items ?? [];
        const mapped = rows.map(mapTicket);
        setTickets(mapped);
        setAllCategories((prev) => {
          const next = new Set(prev);
          mapped.forEach((ticket) => next.add(ticket.category));
          return [...next];
        });
        setPagination(
          payload.pagination ?? {
            page,
            limit: 10,
            total: payload.total ?? rows.length,
            totalPages: payload.totalPages ?? 1,
          }
        );
      } catch (err) {
        if (active) setError(getErrorMessage(err, "Unable to load support tickets."));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadTickets();
    return () => {
      active = false;
    };
  }, [page, statusFilter, categoryFilter, prioritySelect, priorityFilter, search, isUnassignedView]);

  const pageTitle = isUrgentView
    ? "Urgent Tickets"
    : isUnassignedView
      ? "Unassigned Tickets"
      : "All Support Tickets";

  const pageDescription = isUrgentView
    ? "Prioritize urgent author issues that require immediate attention."
    : isUnassignedView
      ? "Review incoming tickets that still need an owner."
      : "Review, filter, and manage author support requests.";

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch = [
        ticket.id,
        ticket.subject,
        ticket.author,
        ticket.email,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || ticket.status === statusFilter;

      const matchesCategory =
        categoryFilter === "All" || ticket.category === categoryFilter;

      const matchesPriority = priorityFilter
        ? ticket.priority === priorityFilter
        : prioritySelect === "All" || ticket.priority === prioritySelect;

      const matchesAssignment =
        assignmentFilter === "unassigned" ? !ticket.assignedTo : true;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesPriority &&
        matchesAssignment
      );
    });
  }, [
    tickets,
    search,
    statusFilter,
    categoryFilter,
    prioritySelect,
    priorityFilter,
    assignmentFilter,
  ]);

  const stats = [
    {
      label: "Total Tickets",
      value: pagination.total ?? tickets.length,
      icon: Inbox,
      color: "text-[#6B2D3C]",
      background: "bg-[#6B2D3C]/10",
    },
    {
      label: "Urgent",
      value: tickets.filter((ticket) => ticket.priority === "urgent").length,
      icon: AlertTriangle,
      color: "text-red-600",
      background: "bg-red-50",
    },
    {
      label: "Unassigned",
      value: tickets.filter((ticket) => !ticket.assignedTo).length,
      icon: UserRound,
      color: "text-orange-600",
      background: "bg-orange-50",
    },
    {
      label: "Resolved",
      value: tickets.filter((ticket) => ticket.status === "Resolved").length,
      icon: CheckCircle2,
      color: "text-[#3D6B4F]",
      background: "bg-[#3D6B4F]/10",
    },
  ];

  async function assignToMe(ticketId) {
    if (!ticketId || !user?.id) {
      setError("Unable to identify the ticket or logged-in admin.");
      return;
    }

    setError("");

    try {
      await adminTicketsApi.assignTicket(ticketId, {
        assigneeId: user.id,
      });

      const response = await adminTicketsApi.getTickets(
        buildParams({
          page,
          statusFilter,
          priorityFilter,
          prioritySelect,
          categoryFilter,
          search,
          isUnassignedView,
        })
      );

      const payload = response.data?.data ?? response.data ?? {};
      const rows = Array.isArray(payload)
        ? payload
        : payload.tickets ?? payload.items ?? [];

      setTickets(rows.map(mapTicket));

      setPagination(
        payload.pagination ?? {
          page,
          limit: 10,
          total: payload.total ?? rows.length,
          totalPages: payload.totalPages ?? 1,
        }
      );
    } catch (err) {
      setError(getErrorMessage(err, "Unable to assign this ticket to you."));
    }
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    setCategoryFilter("All");
    setPrioritySelect("All");
    setPage(1);
  }

  return (
    <div className="space-y-8">
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}
      {loading && (
        <div className="rounded-xl border border-[#2B2B2B]/10 bg-white px-4 py-3 text-sm text-[#82756B]">
          Loading tickets…
        </div>
      )}

      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs text-[#82756B]">
            <span>Admin</span>
            <span>/</span>
            <span>Ticket Management</span>
          </div>

          <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#2B2B2B] sm:text-4xl">
            {pageTitle}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#82756B]">
            {pageDescription}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-xl border border-[#2B2B2B]/10 bg-white px-4 py-3 text-xs text-[#82756B] sm:self-auto">
          <CalendarDays size={15} />
          {new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-[#2B2B2B]/10 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.background} ${stat.color}`}
                >
                  <Icon size={19} />
                </div>
              </div>

              <p className="mt-5 text-2xl font-semibold text-[#2B2B2B]">
                {stat.value}
              </p>

              <p className="mt-1 text-xs text-[#82756B]">{stat.label}</p>
            </div>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#2B2B2B]/10 bg-white shadow-sm">
        <div className="border-b border-[#2B2B2B]/10 p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#2B2B2B]">
                Ticket Queue
              </h2>

              <p className="mt-1 text-xs text-[#82756B]">
                {filteredTickets.length} tickets match your filters
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 sm:w-64">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#82756B]"
                />

                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search tickets..."
                  className="h-10 w-full rounded-lg border border-[#2B2B2B]/15 bg-[#FAF7F2] pl-9 pr-3 text-sm outline-none transition focus:border-[#6B2D3C]"
                />
              </div>

              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#2B2B2B]/15 px-3 text-xs font-medium text-[#2B2B2B] transition hover:border-[#6B2D3C] hover:text-[#6B2D3C]"
              >
                <X size={14} />
                Clear filters
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 text-xs text-[#82756B]">
              <SlidersHorizontal size={14} />
              Filters
            </span>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-[#2B2B2B]/15 bg-white px-3 text-xs outline-none focus:border-[#6B2D3C]"
            >
              <option value="All">All statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>

            <select
              value={prioritySelect}
              onChange={(event) => {
                setPrioritySelect(event.target.value);
                setPage(1);
              }}
              disabled={Boolean(priorityFilter)}
              className="h-9 rounded-lg border border-[#2B2B2B]/15 bg-white px-3 text-xs outline-none focus:border-[#6B2D3C] disabled:bg-stone-100"
            >
              <option value="All">All priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-[#2B2B2B]/15 bg-white px-3 text-xs outline-none focus:border-[#6B2D3C]"
            >
              <option value="All">All categories</option>
              {allCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {(priorityFilter || assignmentFilter) && (
              <Link
                to="/admin/tickets"
                className="text-xs font-medium text-[#6B2D3C] underline underline-offset-4"
              >
                View all tickets
              </Link>
            )}
          </div>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-[#FAF7F2]">
              <tr className="text-[10px] font-semibold uppercase tracking-wider text-[#82756B]">
                <th className="px-6 py-4">Ticket</th>
                <th className="px-5 py-4">Author</th>
                <th className="px-5 py-4">Priority</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Assignee</th>
                <th className="px-5 py-4">Created</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#2B2B2B]/[0.06]">
              {filteredTickets.map((ticket) => {
                const age = getAgeInDays(ticket.createdAt);

                return (
                  <tr
                    key={ticket.id}
                    className="transition hover:bg-[#FAF7F2]/70"
                  >
                    <td className="max-w-xs px-6 py-5">
                      <p className="font-mono text-[10px] text-[#82756B]">
                        {ticket.id}
                      </p>

                      <p className="mt-1 truncate text-sm font-semibold text-[#2B2B2B]">
                        {ticket.subject}
                      </p>

                      <p className="mt-1 text-[11px] text-[#82756B]">
                        {ticket.category}
                      </p>
                    </td>

                    <td className="px-5 py-5">
                      <p className="text-xs font-medium text-[#2B2B2B]">
                        {ticket.author}
                      </p>

                      <p className="mt-1 text-[10px] text-[#82756B]">
                        {ticket.email}
                      </p>
                    </td>

                    <td className="px-5 py-5">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold capitalize ${priorityStyles[ticket.priority]}`}
                      >
                        {ticket.priority}
                      </span>
                    </td>

                    <td className="px-5 py-5">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium ${statusStyles[ticket.status]}`}
                      >
                        {ticket.status}
                      </span>
                    </td>

                    <td className="px-5 py-5">
                      {ticket.assignedTo ? (
                        <span className="text-xs text-[#2B2B2B]">
                          {ticket.assignedTo}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => assignToMe(ticket.databaseId)}
                          className="cursor-pointer whitespace-nowrap text-xs font-medium text-[#6B2D3C] hover:underline"
                        >
                          + Assign to me
                        </button>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-5">
                      <p className="text-xs text-[#2B2B2B]">
                        {formatDate(ticket.createdAt)}
                      </p>

                      <p className="mt-1 flex items-center gap-1 text-[10px] text-[#82756B]">
                        <Clock3 size={11} />
                        {age === 0 ? "Today" : `${age} days ago`}
                      </p>
                    </td>

                    <td className="px-5 py-5">
                      <Link
                        to={`/admin/tickets/${ticket.id}`}
                        state={{ ticket }}
                        aria-label={`Open ${ticket.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#2B2B2B]/10 text-[#6B2D3C] transition hover:border-[#6B2D3C]/30 hover:bg-[#6B2D3C]/5"
                      >
                        <ArrowUpRight size={15} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-[#2B2B2B]/10 lg:hidden">
          {filteredTickets.map((ticket) => (
            <article key={ticket.id} className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] text-[#82756B]">
                    {ticket.id}
                  </p>

                  <h3 className="mt-1 break-words text-sm font-semibold text-[#2B2B2B]">
                    {ticket.subject}
                  </h3>

                  <p className="mt-1 text-xs text-[#82756B]">
                    {ticket.author}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold capitalize ${priorityStyles[ticket.priority]}`}
                >
                  {ticket.priority}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${statusStyles[ticket.status]}`}
                >
                  {ticket.status}
                </span>

                <span className="text-[10px] text-[#82756B]">
                  {ticket.category}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] text-[#82756B]">Assignee</p>

                  {ticket.assignedTo ? (
                    <p className="mt-1 text-xs text-[#2B2B2B]">
                      {ticket.assignedTo}
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => assignToMe(ticket.databaseId)}
                      className="mt-1 text-xs font-medium text-[#6B2D3C]"
                    >
                      + Assign to me
                    </button>
                  )}
                </div>

                <Link
                  to={`/admin/tickets/${ticket.id}`}
                  state={{ ticket }}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#6B2D3C] px-3 py-2 text-xs font-medium text-white"
                >
                  View ticket
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {filteredTickets.length === 0 && !loading && (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5EFE6] text-[#6B2D3C]">
              <CircleDot size={22} />
            </div>

            <h3 className="mt-4 font-serif text-lg font-semibold text-[#2B2B2B]">
              No tickets found
            </h3>

            <p className="mt-2 text-sm text-[#82756B]">
              Try changing your search or filters.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 text-xs font-semibold text-[#6B2D3C] hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-[#2B2B2B]/10 bg-[#FAF7F2]/50 px-5 py-4 text-[11px] text-[#82756B] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>
            Showing {filteredTickets.length} of {tickets.length} tickets
          </span>

          <span>BookLeaf Support Operations</span>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#2B2B2B]/10 bg-white px-4 py-3">
        <p className="text-xs text-[#82756B]">
          Page {pagination.page ?? page} of {Math.max(1, pagination.totalPages ?? 1)} · {pagination.total ?? tickets.length} tickets
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-lg border border-[#2B2B2B]/15 px-3 py-2 text-xs disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= (pagination.totalPages ?? 1) || loading}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-lg border border-[#2B2B2B]/15 px-3 py-2 text-xs disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}