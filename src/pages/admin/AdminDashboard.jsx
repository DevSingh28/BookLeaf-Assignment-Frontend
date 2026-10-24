
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminDashboardApi, adminTicketsApi, getErrorMessage } from "../../lib/api";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LifeBuoy,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react";


const statusClasses = {
  Open: "bg-blue-50 text-blue-700 ring-blue-200",
  "In Progress": "bg-amber-50 text-amber-700 ring-amber-200",
  Resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Closed: "bg-gray-100 text-gray-600 ring-gray-200",
};

const priorityClasses = {
  Urgent: "bg-red-50 text-red-700",
  High: "bg-orange-50 text-orange-700",
  Normal: "bg-gray-100 text-gray-600",
  Low: "bg-green-50 text-green-700",
};

function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <Badge
      className={`ring-1 ring-inset ${
        statusClasses[status] || statusClasses.Open
      }`}
    >
      {status}
    </Badge>
  );
}

function PriorityBadge({ priority }) {
  const dotClasses = {
    Urgent: "bg-red-500",
    High: "bg-orange-500",
    Normal: "bg-gray-400",
    Low: "bg-green-500",
  };

  return (
    <Badge className={priorityClasses[priority] || priorityClasses.Normal}>
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          dotClasses[priority] || dotClasses.Normal
        }`}
      />
      {priority}
    </Badge>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
  trend,
  trendDirection = "up",
  href,
}) {
  const content = (
    <div className="h-full rounded-2xl border border-[#EAE2D8] bg-white p-5 shadow-sm transition duration-200 hover:border-[#D8C7B8] hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-[#2B2B2B]">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={21} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {trend && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold ${
              trendDirection === "down"
                ? "text-[#3D6B4F]"
                : trendDirection === "warning"
                  ? "text-orange-600"
                  : "text-[#3D6B4F]"
            }`}
          >
            {trendDirection === "down" ? (
              <ArrowDownRight size={14} />
            ) : (
              <ArrowUpRight size={14} />
            )}
            {trend}
          </span>
        )}

        <span className="text-xs text-gray-400">{description}</span>
      </div>
    </div>
  );

  return href ? (
    <Link to={href} className="block h-full">
      {content}
    </Link>
  ) : (
    content
  );
}

function SectionHeader({
  title,
  description,
  action,
  icon: Icon,
}) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <div className="flex items-center gap-2">
          {Icon && <Icon size={18} className="text-[#6B2D3C]" />}
          <h2 className="text-base font-bold text-[#2B2B2B] sm:text-lg">
            {title}
          </h2>
        </div>

        {description && (
          <p className="mt-1.5 text-sm leading-5 text-gray-500">
            {description}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}

function TicketTable({ tickets }) {
  if (tickets.length === 0) {
    return (
      <div className="px-5 py-12 text-center">
        <CheckCircle2
          size={28}
          className="mx-auto text-[#3D6B4F]"
        />
        <p className="mt-3 text-sm font-semibold text-[#2B2B2B]">
          No tickets match this filter
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Try another filter or return to the full ticket queue.
        </p>
      </div>
    );
  }

  return (
    <>
      {}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[850px] text-left">
          <thead className="bg-[#FAF7F2]">
            <tr className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              <th className="px-5 py-4">Ticket / Author</th>
              <th className="px-4 py-4">Category</th>
              <th className="px-4 py-4">Priority</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Age</th>
              <th className="px-5 py-4 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F0EBE4]">
            {tickets.map((ticket) => (
              <tr
                key={ticket.id}
                className="transition hover:bg-[#FFFEFC]"
              >
                <td className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5EFE6] text-[#6B2D3C]">
                      <MessageSquare size={17} />
                    </div>

                    <div className="min-w-0">
                      <p className="max-w-[270px] truncate text-sm font-semibold text-[#2B2B2B]">
                        {ticket.subject}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {ticket.id} · {ticket.author}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <span className="text-xs text-gray-600">
                    {ticket.category}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <PriorityBadge priority={ticket.priority} />
                </td>

                <td className="px-4 py-4">
                  <StatusBadge status={ticket.status} />
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`whitespace-nowrap text-xs font-medium ${
                      ticket.ageHours >= 24
                        ? "text-red-600"
                        : "text-gray-500"
                    }`}
                  >
                    {ticket.ageHours >= 24
                      ? `${Math.floor(ticket.ageHours / 24)}d ${ticket.ageHours % 24}h`
                      : `${ticket.ageHours}h`}
                  </span>
                </td>

                <td className="px-5 py-4 text-right">
                  <Link
                    to={`/admin/tickets/${ticket.databaseId}`}
                    aria-label={`Open ticket ${ticket.id}`}
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

      {}
      <div className="divide-y divide-[#F0EBE4] lg:hidden">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5EFE6] text-[#6B2D3C]">
                <MessageSquare size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="break-words text-sm font-semibold text-[#2B2B2B]">
                    {ticket.subject}
                  </p>
                </div>

                <p className="mt-1 text-xs text-gray-500">
                  {ticket.id} · {ticket.author}
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  {ticket.category}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <PriorityBadge priority={ticket.priority} />
                  <StatusBadge status={ticket.status} />
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-500">
                    Open for {ticket.ageHours}h
                  </span>

                  <Link
                    to={`/admin/tickets/${ticket.databaseId}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B2D3C]"
                  >
                    Review ticket
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ActivityChart({ weeklyActivity }) {
  const maxValue = Math.max(
    ...weeklyActivity.flatMap((day) => [day.created, day.resolved]),
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="inline-flex items-center gap-2 text-xs text-gray-500">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#6B2D3C]" />
          Created
        </span>

        <span className="inline-flex items-center gap-2 text-xs text-gray-500">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#C9A227]" />
          Resolved
        </span>
      </div>

      <div className="flex h-48 items-end justify-between gap-2 sm:gap-4">
        {weeklyActivity.map((day) => (
          <div
            key={day.day}
            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
          >
            <div className="mb-2 text-[10px] font-medium text-gray-400 sm:text-xs">
              {day.created}
            </div>

            <div className="flex h-36 w-full max-w-12 items-end justify-center gap-1">
              <div
                title={`${day.created} tickets created`}
                className="w-1/2 max-w-5 rounded-t-md bg-[#6B2D3C] transition-all hover:opacity-80"
                style={{
                  height: `${(day.created / maxValue) * 100}%`,
                  minHeight: "4px",
                }}
              />

              <div
                title={`${day.resolved} tickets resolved`}
                className="w-1/2 max-w-5 rounded-t-md bg-[#C9A227] transition-all hover:opacity-80"
                style={{
                  height: `${(day.resolved / maxValue) * 100}%`,
                  minHeight: "4px",
                }}
              />
            </div>

            <span className="mt-3 text-[11px] font-medium text-gray-500 sm:text-xs">
              {day.day}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-xl bg-[#FAF7F2] p-3">
        <Activity size={16} className="shrink-0 text-[#6B2D3C]" />
        <p className="text-xs leading-5 text-gray-600">
          Sample activity for the last seven days. Replace with database-backed
          daily ticket counts before production.
        </p>
      </div>
    </div>
  );
}

function CategoryBreakdown({ categoryData }) {
  const total = categoryData.reduce((sum, category) => sum + category.count, 0);

  return (
    <div className="space-y-5">
      <div className="flex h-3 overflow-hidden rounded-full bg-[#F0EBE4]">
        {categoryData.map((category) => (
          <div
            key={category.name}
            title={`${category.name}: ${category.count}`}
            style={{
              width: `${(category.count / total) * 100}%`,
              backgroundColor: category.color,
            }}
          />
        ))}
      </div>

      <div className="space-y-4">
        {categoryData.map((category) => (
          <div key={category.name}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: category.color }}
                />

                <span className="truncate text-xs font-medium text-gray-600 sm:text-sm">
                  {category.name}
                </span>
              </div>

              <span className="shrink-0 text-sm font-bold text-[#2B2B2B]">
                {category.count}
              </span>
            </div>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#F0EBE4]">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(category.count / total) * 100}%`,
                  backgroundColor: category.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs leading-5 text-gray-400">
        Illustrative distribution across {total} categorized tickets.
      </p>
    </div>
  );
}

function PriorityBreakdown({ tickets }) {
  const priorities = [
    {
      label: "Urgent",
      color: "bg-red-500",
      text: "text-red-700",
      background: "bg-red-50",
    },
    {
      label: "High",
      color: "bg-orange-500",
      text: "text-orange-700",
      background: "bg-orange-50",
    },
    {
      label: "Normal",
      color: "bg-gray-400",
      text: "text-gray-700",
      background: "bg-gray-100",
    },
    {
      label: "Low",
      color: "bg-green-500",
      text: "text-green-700",
      background: "bg-green-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {priorities.map((priority) => {
        const count = tickets.filter(
          (ticket) => ticket.priority === priority.label,
        ).length;

        return (
          <div
            key={priority.label}
            className={`rounded-xl p-4 ${priority.background}`}
          >
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${priority.color}`} />
              <span className={`text-xs font-semibold ${priority.text}`}>
                {priority.label}
              </span>
            </div>

            <p className={`mt-3 text-2xl font-bold ${priority.text}`}>
              {count}
            </p>

            <p className="mt-1 text-[11px] text-gray-500">
              In recent tickets
            </p>
          </div>
        );
      })}
    </div>
  );
}

function AttentionItem({ ticket, reason }) {
  const urgent = ticket.priority === "Urgent";

  return (
    <Link
      to={`/admin/tickets/${ticket.databaseId}`}
      className="flex items-start gap-3 rounded-xl border border-[#EAE2D8] p-4 transition hover:border-[#D7C4B5] hover:bg-[#FFFEFC]"
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          urgent
            ? "bg-red-50 text-red-600"
            : "bg-amber-50 text-amber-700"
        }`}
      >
        {urgent ? (
          <AlertTriangle size={17} />
        ) : (
          <Clock3 size={17} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-[#2B2B2B]">
            {ticket.id}
          </p>
          <PriorityBadge priority={ticket.priority} />
        </div>

        <p className="mt-1 break-words text-xs leading-5 text-gray-600">
          {ticket.subject}
        </p>

        <p className="mt-2 text-xs font-medium text-gray-400">{reason}</p>
      </div>

      <ArrowUpRight size={16} className="mt-1 shrink-0 text-gray-400" />
    </Link>
  );
}

export default function AdminDashboard() {
  const [tickets, setTickets] = useState([]);
  const [dashboard, setDashboard] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tableFilter, setTableFilter] = useState("All");
  const [period, setPeriod] = useState("7 days");

  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const [dashboardResponse, ticketsResponse] = await Promise.all([
          adminDashboardApi.getDashboard(),
          adminTicketsApi.getTickets({ page: 1, limit: 50 }),
        ]);
        if (!active) return;
        const dashboardPayload = dashboardResponse.data?.data ?? dashboardResponse.data ?? {};
        const ticketPayload = ticketsResponse.data?.data ?? ticketsResponse.data ?? {};
        const rows = Array.isArray(ticketPayload) ? ticketPayload : ticketPayload.tickets ?? ticketPayload.items ?? [];
        setDashboard(dashboardPayload.dashboard ?? dashboardPayload.stats ?? dashboardPayload);
        setTickets(rows.map((ticket) => {
          const created = ticket.created_at ?? ticket.createdAt ?? ticket.created_on;
          const priorityRaw = ticket.priority ?? "normal";
          const priority = String(priorityRaw).toLowerCase();
          const assigned = ticket.assigned_to ?? ticket.assignedTo ?? ticket.assignee_name ?? ticket.assignee?.name ?? null;
          return {
            id: ticket.ticket_number ?? ticket.reference ?? ticket.ticket_id ?? ticket.id,
            databaseId: ticket.id ?? ticket.ticket_id,
            subject: ticket.subject ?? ticket.title ?? "Untitled ticket",
            author: ticket.author_name ?? ticket.author?.name ?? ticket.user_name ?? ticket.user?.name ?? "Author",
            email: ticket.author_email ?? ticket.author?.email ?? ticket.user_email ?? ticket.user?.email ?? "",
            category: ticket.category_name ?? ticket.category ?? "Uncategorized",
            priority: priority.charAt(0).toUpperCase() + priority.slice(1),
            status: String(ticket.status ?? "Open").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            ageHours: created ? Math.max(0, Math.floor((Date.now() - new Date(created).getTime()) / 3600000)) : 0,
            createdAt: created ? new Date(created).toLocaleDateString("en-IN") : "—",
            assignedTo: assigned ? (typeof assigned === "object" ? assigned.name ?? assigned.email ?? "Assigned" : assigned) : "Unassigned",
            createdRaw: created,
          };
        }));
      } catch (err) {
        if (active) setError(getErrorMessage(err, "Unable to load the admin dashboard."));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadDashboard();
    return () => { active = false; };
  }, []);

  const metrics = {
    total: dashboard.total ?? dashboard.totalTickets ?? dashboard.total_tickets ?? tickets.length,
    open: dashboard.open ?? dashboard.openTickets ?? dashboard.open_tickets ?? tickets.filter((ticket) => ticket.status === "Open").length,
    inProgress: dashboard.inProgress ?? dashboard.in_progress ?? tickets.filter((ticket) => ticket.status === "In Progress").length,
    resolved: dashboard.resolved ?? dashboard.resolvedTickets ?? dashboard.resolved_tickets ?? tickets.filter((ticket) => ticket.status === "Resolved" || ticket.status === "Closed").length,
    overdue: dashboard.overdue ?? dashboard.overdueTickets ?? dashboard.overdue_tickets ?? tickets.filter((ticket) => ticket.ageHours >= 24 && ticket.status !== "Resolved" && ticket.status !== "Closed").length,
    avgResponse: dashboard.avgResponse ?? dashboard.averageResponseTime ?? dashboard.average_response_time ?? "—",
    resolutionRate: dashboard.resolutionRate ?? dashboard.resolution_rate ?? 0,
  };
  const weeklyActivity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const key = date.toLocaleDateString("en-CA");
    return {
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      created: tickets.filter((ticket) => ticket.createdRaw && new Date(ticket.createdRaw).toLocaleDateString("en-CA") === key).length,
      resolved: tickets.filter((ticket) => (ticket.status === "Resolved" || ticket.status === "Closed") && ticket.createdRaw && new Date(ticket.createdRaw).toLocaleDateString("en-CA") === key).length,
    };
  });
  const palette = ["#6B2D3C", "#C9A227", "#3D6B4F", "#7188A8", "#A77C91", "#B0A69A"];
  const categoryTotals = tickets.reduce((acc, ticket) => {
    acc[ticket.category] = (acc[ticket.category] || 0) + 1;
    return acc;
  }, {});
  const categoryData = Object.entries(categoryTotals).map(([name, count], index) => ({ name, count, color: palette[index % palette.length] }));

  const openTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status === "Open"),
    [tickets],
  );

  const attentionTickets = useMemo(
    () =>
      tickets
        .filter(
          (ticket) =>
            ticket.priority === "Urgent" ||
            ticket.ageHours >= 24,
        )
        .sort((a, b) => {
          if (a.priority === "Urgent" && b.priority !== "Urgent") return -1;
          if (b.priority === "Urgent" && a.priority !== "Urgent") return 1;
          return b.ageHours - a.ageHours;
        })
        .slice(0, 4),
    [tickets],
  );

  const filteredTickets = useMemo(() => {
    if (tableFilter === "All") return tickets;

    return tickets.filter((ticket) => {
      if (tableFilter === "Urgent") return ticket.priority === "Urgent";
      if (tableFilter === "Open") return ticket.status === "Open";
      if (tableFilter === "Unassigned")
        return ticket.assignedTo === "Unassigned";

      return true;
    });
  }, [tickets, tableFilter]);

  const currentOpenCount = openTickets.length;
  const urgentCount = tickets.filter(
    (ticket) => ticket.priority === "Urgent",
  ).length;

  return (
    <div className="min-h-full space-y-7">
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {loading && <div className="rounded-xl border border-[#EAE2D8] bg-white px-4 py-3 text-sm text-gray-500">Loading dashboard data…</div>}
      {}
      <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
            <ShieldCheck size={16} />
            Administration
            <span>/</span>
            <span className="font-medium text-[#6B2D3C]">Overview</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#2B2B2B] sm:text-3xl">
            Support overview
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Monitor author requests, prioritize urgent issues, and keep the
            support queue moving.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          

          <Link
            to="/admin/tickets"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6B2D3C] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#552330]"
          >
            <Ticket size={17} />
            Open ticket queue
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {}
      <section className="relative overflow-hidden rounded-2xl bg-[#6B2D3C] p-5 text-white sm:p-7">
        <div className="pointer-events-none absolute -right-8 -top-16 h-56 w-56 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-1 -top-8 h-40 w-40 rounded-full border border-white/10" />

        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#F5EFE6]">
              <Sparkles size={14} />
              Your support workspace
            </div>

            <h2 className="mt-4 text-xl font-bold leading-snug sm:text-2xl">
              Every author deserves a timely answer.
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">
              Start with the highest-priority issues, review tickets waiting
              for a response, and keep authors informed at every step.
            </p>
          </div>

          <Link
            to="/admin/tickets"
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-[#F5EFE6] px-5 py-3 text-sm font-bold text-[#6B2D3C] transition hover:bg-white md:self-center"
          >
            Review tickets
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {}
      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-[#2B2B2B]">
            Key performance indicators
          </h2>

          <span className="text-xs text-gray-400">
            Illustrative figures
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total tickets"
            value={metrics.total}
            description="vs previous period"
            trend="+12.5%"
            icon={Ticket}
            iconClass="bg-[#F5EFE6] text-[#6B2D3C]"
            href="/admin/tickets"
          />

          <MetricCard
            title="Open tickets"
            value={metrics.open}
            description={`${currentOpenCount} in this sample list`}
            trend={`${metrics.open} pending`}
            trendDirection="warning"
            icon={MessageSquare}
            iconClass="bg-blue-50 text-blue-700"
            href="/admin/tickets?status=Open"
          />

          <MetricCard
            title="In progress"
            value={metrics.inProgress}
            description="Currently being handled"
            icon={RefreshCw}
            iconClass="bg-amber-50 text-amber-700"
            href="/admin/tickets?status=In%20Progress"
          />

          <MetricCard
            title="Overdue tickets"
            value={metrics.overdue}
            description="Need timely follow-up"
            trend="Needs attention"
            trendDirection="warning"
            icon={AlertCircle}
            iconClass="bg-red-50 text-red-700"
            href="/admin/tickets?overdue=true"
          />
        </div>
      </section>

      {}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,1fr)]">
        <div className="rounded-2xl border border-[#EAE2D8] bg-white p-5 shadow-sm sm:p-6">
          <SectionHeader
            title="Ticket activity"
            description="Tickets created compared with tickets resolved."
            icon={BarChart3}
            action={
              <div className="relative">
                <select
                  value={period}
                  onChange={(event) => setPeriod(event.target.value)}
                  aria-label="Select chart period"
                  className="rounded-lg border border-[#EAE2D8] bg-white px-3 py-2 text-xs font-medium text-gray-600 outline-none focus:border-[#6B2D3C]"
                >
                  <option value="7 days">Last 7 days</option>
                  <option value="30 days">Last 30 days</option>
                  <option value="90 days">Last 90 days</option>
                </select>
              </div>
            }
          />

          <div className="mt-7">
            <ActivityChart weeklyActivity={weeklyActivity} />
          </div>

        </div>

        <div className="rounded-2xl border border-[#EAE2D8] bg-white p-5 shadow-sm sm:p-6">
          <SectionHeader
            title="Recent ticket priorities"
            description="Priority distribution within the sample queue."
            icon={AlertTriangle}
          />

          <div className="mt-6">
            <PriorityBreakdown tickets={tickets} />
          </div>

          <div className="mt-5 rounded-xl border border-[#EAE2D8] bg-[#FAF7F2] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#2B2B2B]">
                  Urgent tickets
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  In the recent ticket sample
                </p>
              </div>

              <span className="text-2xl font-bold text-red-600">
                {urgentCount}
              </span>
            </div>

            <Link
              to="/admin/tickets?priority=Urgent"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#6B2D3C] hover:underline"
            >
              Review urgent queue
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {}
      <section className="grid grid-cols-1 items-start gap-6 2xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-[#EAE2D8] bg-white shadow-sm">
          <div className="border-b border-[#EEE8E0] p-5 sm:p-6">
            <SectionHeader
              title="Recent support tickets"
              description="Review the latest author requests and their current status."
              icon={LifeBuoy}
              action={
                <Link
                  to="/admin/tickets"
                  className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-[#6B2D3C] hover:underline"
                >
                  View all
                  <ArrowRight size={14} />
                </Link>
              }
            />

            <div className="mt-5 flex flex-wrap gap-2">
              {["All", "Urgent", "Open", "Unassigned"].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setTableFilter(filter)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    tableFilter === filter
                      ? "bg-[#6B2D3C] text-white"
                      : "border border-[#EAE2D8] bg-white text-gray-600 hover:bg-[#FAF7F2]"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <TicketTable tickets={filteredTickets} />

          <div className="border-t border-[#EEE8E0] bg-[#FFFEFC] px-5 py-4 text-xs text-gray-500">
            Showing {filteredTickets.length} of {tickets.length} sample tickets.
          </div>
        </div>

        <div className="space-y-6">
          {}
          <div className="rounded-2xl border border-[#EAE2D8] bg-white p-5 shadow-sm sm:p-6">
            <SectionHeader
              title="Needs attention"
              description="Urgent or older tickets to review first."
              icon={AlertTriangle}
              action={
                <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-red-50 px-2 text-xs font-bold text-red-700">
                  {attentionTickets.length}
                </span>
              }
            />

            <div className="mt-5 space-y-3">
              {attentionTickets.map((ticket) => (
                <AttentionItem
                  key={ticket.id}
                  ticket={ticket}
                  reason={
                    ticket.priority === "Urgent"
                      ? `Urgent · ${ticket.ageHours}h old`
                      : `Waiting ${ticket.ageHours}h`
                  }
                />
              ))}
            </div>

            <Link
              to="/admin/tickets"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-[#EAE2D8] px-4 py-3 text-xs font-semibold text-[#6B2D3C] transition hover:bg-[#FAF7F2]"
            >
              Open full queue
              <ArrowRight size={15} />
            </Link>
          </div>

          {}
          <div className="rounded-2xl border border-[#EAE2D8] bg-white p-5 shadow-sm sm:p-6">
            <SectionHeader
              title="Tickets by category"
              description="Understand the most common support topics."
              icon={BookOpen}
            />

            <div className="mt-6">
              <CategoryBreakdown categoryData={categoryData} />
            </div>
          </div>

          {}
          <div className="rounded-2xl border border-[#EAE2D8] bg-white p-5 shadow-sm sm:p-6">
            <SectionHeader
              title="Support performance"
              description="Sample service indicators."
              icon={TrendingUp}
            />

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F5EFE6] text-[#6B2D3C]">
                    <Clock3 size={17} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#2B2B2B]">
                      Average first response
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Time until first reply
                    </p>
                  </div>
                </div>

                <span className="text-lg font-bold text-[#2B2B2B]">
                  {metrics.avgResponse}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-700">
                    <CheckCircle2 size={17} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#2B2B2B]">
                      Resolution rate
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Tickets resolved
                    </p>
                  </div>
                </div>

                <span className="text-lg font-bold text-[#3D6B4F]">
                  {metrics.resolutionRate}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-[#F0EBE4]">
                <div
                  className="h-full rounded-full bg-[#3D6B4F]"
                  style={{ width: `${metrics.resolutionRate}%` }}
                />
              </div>

              <p className="text-xs leading-5 text-gray-400">
                These metrics are placeholders, not measured performance.
                Calculate them from actual ticket timestamps and status
                history in production.
              </p>
            </div>
          </div>

          {}
          <div className="rounded-2xl border border-[#E9DDB9] bg-[#FFFCF2] p-5">
            <div className="flex items-center gap-2 text-[#6B2D3C]">
              <Sparkles size={18} />
              <h3 className="text-sm font-bold">Admin shortcuts</h3>
            </div>

            <div className="mt-4 space-y-2">
              <Link
                to="/admin/tickets"
                className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:text-[#6B2D3C]"
              >
                <span className="flex items-center gap-2">
                  <Ticket size={16} />
                  Manage all tickets
                </span>
                <ArrowRight size={15} />
              </Link>

              <Link
                to="/admin/tickets?unassigned=true"
                className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:text-[#6B2D3C]"
              >
                <span className="flex items-center gap-2">
                  <Users size={16} />
                  Unassigned requests
                </span>
                <ArrowRight size={15} />
              </Link>

              <Link
                to="/admin/tickets?priority=Urgent"
                className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:text-[#6B2D3C]"
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle size={16} />
                  High-priority queue
                </span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {}
      <footer className="flex flex-col justify-between gap-2 border-t border-[#EAE2D8] py-4 text-xs text-gray-400 sm:flex-row sm:items-center">
        <p>BookLeaf Author Support Portal · Admin Workspace</p>

        <p className="inline-flex items-center gap-1.5">
          <CalendarDays size={13} />
          Dashboard UI preview · October 2026
        </p>
      </footer>
    </div>
  );
}