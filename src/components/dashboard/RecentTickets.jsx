import { Link } from "react-router-dom";
import { ArrowRight, Clock3, MessageSquareText } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusStyles = {
  Open: "border-[#C9A227]/30 bg-[#C9A227]/10 text-[#8C6D14]",
  "In Progress": "border-[#6B2D3C]/30 bg-[#6B2D3C]/10 text-[#6B2D3C]",
  Resolved: "border-[#3D6B4F]/30 bg-[#3D6B4F]/10 text-[#3D6B4F]",
  Closed: "border-[#2B2B2B]/20 bg-[#2B2B2B]/5 text-[#2B2B2B]/60",
};

function formatRelativeTime(value) {
  if (!value) return "recently";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "recently";

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function RecentTickets({
  tickets = [],
  loading = false,
  error = "",
}) {
  return (
    <Card className="rounded-xl border border-[#2B2B2B]/10 bg-white shadow-none">
      <CardHeader className="flex flex-row items-center justify-between border-b border-[#2B2B2B]/10 px-6 py-5">
        <div>
          <CardTitle className="font-serif text-lg font-normal tracking-tight text-[#2B2B2B]">
            Recent Inquiries
          </CardTitle>
          <CardDescription className="text-xs text-[#2B2B2B]/60">
            Your latest support conversations
          </CardDescription>
        </div>

        <Link
          to="/author/tickets"
          className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-[#6B2D3C] transition-colors hover:text-[#54212D]"
        >
          View All
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </CardHeader>

      <CardContent className="divide-y divide-[#2B2B2B]/10 p-0">
        {loading ? (
          <div className="space-y-3 px-6 py-6" aria-live="polite">
            {[1, 2, 3].map((item) => (
              <div key={item} className="animate-pulse">
                <div className="h-4 w-2/3 rounded bg-[#2B2B2B]/10" />
                <div className="mt-2 h-3 w-1/3 rounded bg-[#2B2B2B]/5" />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="px-6 py-8 text-sm text-[#82756B]">
            Recent inquiries couldn't be loaded.
          </p>
        ) : tickets.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <MessageSquareText
              size={25}
              className="mx-auto text-[#2B2B2B]/30"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm font-medium text-[#2B2B2B]">
              No inquiries yet
            </p>
            <p className="mt-1 text-xs text-[#2B2B2B]/60">
              Your support conversations will appear here.
            </p>
          </div>
        ) : (
          tickets.map((ticket) => {
            const ticketId = ticket.id;
            const ticketNumber =
              ticket.ticketNumber ?? ticket.ticket_number ?? ticket.id;
            const status = ticket.status ?? "Open";
            const category = ticket.category ?? ticket.categoryName ?? "General Inquiry";
            const updated =
              ticket.updatedAt ??
              ticket.updated_at ??
              ticket.lastMessageAt ??
              ticket.last_message_at ??
              ticket.createdAt ??
              ticket.created_at;

            return (
              <Link
                key={ticketId}
                to={`/author/tickets/${ticketId}`}
                className="flex cursor-pointer flex-col gap-2.5 px-6 py-4 transition-colors hover:bg-[#FAF7F2]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3.5">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#2B2B2B]/10 bg-[#F5EFE6] text-[#6B2D3C]">
                      <MessageSquareText size={17} aria-hidden="true" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#2B2B2B]">
                        {ticket.subject}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-[#2B2B2B]/55">
                        {ticketNumber} · {category}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={`shrink-0 rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                      statusStyles[status] ??
                      "border-[#2B2B2B]/20 bg-[#2B2B2B]/5 text-[#2B2B2B]/70"
                    }`}
                  >
                    {status}
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5 pl-11 text-xs text-[#2B2B2B]/50">
                  <Clock3 size={13} aria-hidden="true" />
                  <span>Updated {formatRelativeTime(updated)}</span>
                </div>
              </Link>
            );
          })
        )}
      </CardContent>

      <CardFooter className="border-t border-[#2B2B2B]/10 bg-[#FAF7F2]/50 px-6 py-3.5">
        <p className="text-xs text-[#2B2B2B]/60">
          Need assistance with another matter?{" "}
          <Link
            to="/author/tickets/new"
            className="cursor-pointer font-semibold text-[#6B2D3C] underline decoration-[#C9A227] underline-offset-4 hover:text-[#54212D]"
          >
            Create an inquiry
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}