
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ticketsApi, getErrorMessage } from "../../lib/api";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Clock3,
  FileText,
  LifeBuoy,
  MessageCircle,
  MoreHorizontal,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";

const statusClasses = {
  Open: "bg-blue-50 text-blue-700 ring-blue-200",
  "In Progress": "bg-amber-50 text-amber-700 ring-amber-200",
  Resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Closed: "bg-gray-100 text-gray-600 ring-gray-200",
};

function formatMessageTime(date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatFileSize(size) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function normalizeStatus(value) {
  const status = String(value ?? "Open").toLowerCase().replace(/[ _-]/g, "");
  if (status === "inprogress" || status === "processing") return "In Progress";
  if (status === "resolved") return "Resolved";
  if (status === "closed") return "Closed";
  return "Open";
}

function normalizePriority(value) {
  const priority = String(value ?? "Normal").toLowerCase();
  if (priority === "urgent") return "Urgent";
  if (priority === "high") return "High";
  if (priority === "low") return "Low";
  return "Normal";
}

function normalizeMessages(rows, authorId) {
  return rows.map((message, index) => {
    const role = String(
      message.sender_role ??
        message.sender_type ??
        message.role ??
        message.sender ??
        ""
    ).toLowerCase();
    const messageUserId = message.user_id ?? message.author_id ?? message.sender_id;
    const isAuthor =
      ["author", "user", "customer"].includes(role) ||
      (authorId != null && messageUserId != null && String(messageUserId) === String(authorId));
    const date =
      message.created_at ??
      message.createdAt ??
      message.sent_at ??
      message.timestamp;

    return {
      id: message.id ?? message.message_id ?? `${date ?? "message"}-${index}`,
      sender: isAuthor ? "author" : "support",
      name: isAuthor
        ? "You"
        : message.sender_name ?? message.name ?? "BookLeaf Support",
      time: date ? formatMessageTime(new Date(date)) : "",
      text:
        message.message ??
        message.content ??
        message.body ??
        message.text ??
        "",
    };
  });
}

function getMessageRows(response) {
  const payload = response.data?.data ?? response.data;
  return Array.isArray(payload)
    ? payload
    : payload?.messages ?? payload?.items ?? [];
}

function withInitialDescription(messages, ticket) {
  const description = ticket.description ?? "";
  if (!description) return messages;
  const exists = messages.some(
    (message) => message.sender === "author" && message.text === description
  );
  if (exists) return messages;
  return [
    {
      id: `${ticket.id}-initial`,
      sender: "author",
      name: "You",
      time: ticket.createdAtRaw ? formatMessageTime(new Date(ticket.createdAtRaw)) : "",
      text: description,
    },
    ...messages,
  ];
}

export default function TicketConversationPage() {
  const { ticketId } = useParams();

  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reply, setReply] = useState("");
  const [replyError, setReplyError] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadConversation() {
      setIsLoading(true);
      setLoadError("");
      setTicket(null);

      try {
        const [ticketResponse, messagesResponse] = await Promise.all([
          ticketsApi.getTicket(ticketId),
          ticketsApi.getMessages(ticketId, { page: 1, limit: 50 }),
        ]);
        const ticketPayload = ticketResponse.data?.data ?? ticketResponse.data;
        const rawTicket = ticketPayload?.ticket ?? ticketPayload;
        const messages = getMessageRows(messagesResponse);
        const id =
          rawTicket?.ticket_number ??
          rawTicket?.reference ??
          rawTicket?.id ??
          rawTicket?.ticket_id ??
          ticketId;
        const createdAt =
          rawTicket?.created_at ?? rawTicket?.createdAt ?? rawTicket?.created_on;
        const description = rawTicket?.description ?? rawTicket?.message ?? "";
        const ticketData = {
          id,
          databaseId: rawTicket?.id ?? rawTicket?.ticket_id ?? ticketId,
          authorId: rawTicket?.author_id ?? rawTicket?.user_id ?? rawTicket?.author?.id,
          subject: rawTicket?.subject ?? "Support request",
          category: rawTicket?.category ?? rawTicket?.category_name ?? "General",
          book: rawTicket?.book_title ?? rawTicket?.book_name ?? rawTicket?.book?.title ?? "",
          status: normalizeStatus(rawTicket?.status),
          priority: normalizePriority(rawTicket?.priority),
          createdAt: createdAt
            ? new Date(createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "—",
          createdAtRaw: createdAt,
          updatedAt: rawTicket?.updated_at
            ? formatMessageTime(new Date(rawTicket.updated_at))
            : "—",
          description,
          files: rawTicket?.attachments ?? [],
          messages: [],
        };
        ticketData.messages = withInitialDescription(
          normalizeMessages(messages, ticketData.authorId),
          ticketData
        );

        if (active) setTicket(ticketData);
      } catch (error) {
        if (active) setLoadError(getErrorMessage(error, "Unable to load this ticket."));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadConversation();
    return () => {
      active = false;
    };
  }, [ticketId]);

  useEffect(() => {
    if (!ticketId || isLoading || !ticket) return undefined;

    let active = true;
    let timeoutId;

    const pollMessages = async () => {
      try {
        const response = await ticketsApi.getMessages(ticketId, {
          page: 1,
          limit: 50,
        });
        const messages = withInitialDescription(
          normalizeMessages(getMessageRows(response), ticket.authorId),
          ticket
        );

        if (active) {
          setTicket((current) =>
            current && String(current.databaseId) === String(ticket.databaseId)
              ? { ...current, messages }
              : current
          );
        }
      } catch (error) {
        if (active) console.error("Unable to refresh conversation:", error);
      } finally {
        if (active) timeoutId = window.setTimeout(pollMessages, 3000);
      }
    };

    timeoutId = window.setTimeout(pollMessages, 3000);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
 }, [
  ticketId,
  isLoading,
  ticket?.databaseId,
  ticket?.authorId,
  ticket?.description,
  ticket?.createdAtRaw,
  ticket?.id,
]);

  async function handleReply(event) {
    event.preventDefault();
    const trimmedReply = reply.trim();

    if (!trimmedReply) {
      setReplyError("Please enter a message before sending.");
      return;
    }
    if (trimmedReply.length > 3000) {
      setReplyError("Your reply cannot exceed 3,000 characters.");
      return;
    }
    if (["Closed", "Resolved"].includes(ticket.status)) {
      setReplyError("This ticket is not accepting replies. Contact support if you need it reopened.");
      return;
    }

    setReplyError("");
    setIsSending(true);

    try {
      await ticketsApi.sendMessage(ticket.databaseId, {
        message: trimmedReply,
        content: trimmedReply,
      });
      setReply("");
      const response = await ticketsApi.getMessages(ticketId, {
        page: 1,
        limit: 50,
      });
      const messages = withInitialDescription(
        normalizeMessages(getMessageRows(response), ticket.authorId),
        ticket
      );
      setTicket((current) => (current ? { ...current, messages } : current));
    } catch (error) {
      setReplyError(getErrorMessage(error, "Unable to send your reply. Please try again."));
    } finally {
      setIsSending(false);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[#EAE2D8] bg-white p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5EFE6] text-[#6B2D3C]">
          <MessageCircle size={23} />
        </div>

        <p className="mt-4 text-sm text-gray-500">Loading conversation...</p>
      </div>
    );
  }

  if (loadError || !ticket) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-[#EAE2D8] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5EFE6] text-[#6B2D3C]">
          <LifeBuoy size={23} />
        </div>

        <h1 className="mt-4 text-xl font-bold text-[#2B2B2B]">
          Ticket not found
        </h1>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          {loadError || `We could not find a ticket with reference ${ticketId}.`}
        </p>

        <Link
          to="/author/tickets"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#6B2D3C] px-5 py-3 text-sm font-semibold text-white hover:bg-[#552330]"
        >
          <ArrowLeft size={16} />
          Back to tickets
        </Link>
      </div>
    );
  }

  const canReply = !["Closed", "Resolved"].includes(ticket.status);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
<Link
        to="/author/tickets"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#6B2D3C]"
      >
        <ArrowLeft size={16} />
        Back to support tickets
      </Link>
<section className="rounded-2xl border border-[#EAE2D8] bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-[#F5EFE6] px-2.5 py-1.5 text-xs font-bold text-[#6B2D3C]">
                {ticket.id}
              </span>

              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                  statusClasses[ticket.status] || statusClasses.Open
                }`}
              >
                {ticket.status}
              </span>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  ["High", "Urgent"].includes(ticket.priority)
                    ? "bg-red-50 text-red-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    ["High", "Urgent"].includes(ticket.priority) ? "bg-red-500" : "bg-gray-400"
                  }`}
                />
                {ticket.priority} priority
              </span>
            </div>

            <h1 className="mt-4 wrap-break-word text-2xl font-bold tracking-tight text-[#2B2B2B] sm:text-3xl">
              {ticket.subject}
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Created on {ticket.createdAt}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <LifeBuoy size={14} />
                {ticket.category}
              </span>

              {ticket.book && (
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen size={14} />
                  {ticket.book}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
</div>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
<section className="min-w-0 overflow-hidden rounded-2xl border border-[#EAE2D8] bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-[#EEE8E0] px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-bold text-[#2B2B2B]">Conversation</h2>
              <p className="mt-1 text-xs text-gray-500">
                {ticket.messages.length}{" "}
                {ticket.messages.length === 1 ? "message" : "messages"}
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF7F2] text-[#6B2D3C]">
              <MessageCircle size={18} />
            </div>
          </div>
<div className="border-b border-[#EEE8E0] bg-[#FFFEFC] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5EFE6] text-[#6B2D3C]">
                <UserRound size={19} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="text-sm font-bold text-[#2B2B2B]">
                    You <span className="font-normal text-gray-400">· Author</span>
                  </p>

                  <span className="text-xs text-gray-400">
                    <CalendarDays className="mr-1 inline" size={12} />
                    {ticket.createdAt}
                  </span>
                </div>

                <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm leading-7 text-gray-600">
                  {ticket.description}
                </p>

                {ticket.files?.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {ticket.files.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-3 rounded-xl border border-[#EAE2D8] bg-white p-3"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5EFE6] text-[#6B2D3C]">
                          <FileText size={17} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#2B2B2B]">
                            {file.name}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
<div className="space-y-6 p-5 sm:p-6">
            {ticket.messages.slice(1).map((message) => {
              const isAuthor = message.sender === "author";

              return (
                <article
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    isAuthor ? "" : "sm:pr-8"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isAuthor
                        ? "bg-[#F5EFE6] text-[#6B2D3C]"
                        : "bg-[#EAF1EA] text-[#3D6B4F]"
                    }`}
                  >
                    {isAuthor ? (
                      <UserRound size={18} />
                    ) : (
                      <ShieldCheck size={18} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="text-sm font-bold text-[#2B2B2B]">
                        {message.name}
                      </p>

                      {!isAuthor && (
                        <span className="rounded-md bg-green-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700">
                          Support team
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-gray-400">
                      {message.time}
                    </p>

                    <div
                      className={`mt-3 rounded-2xl p-4 ${
                        isAuthor
                          ? "rounded-tl-md bg-[#F5EFE6]/70"
                          : "rounded-tl-md border border-[#EAE2D8] bg-white"
                      }`}
                    >
                      <p className="whitespace-pre-wrap wrap-break-word text-sm leading-7 text-gray-700">
                        {message.text}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
<div className="border-t border-[#EEE8E0] bg-[#FFFEFC] p-5 sm:p-6">
            {canReply ? (
              <form onSubmit={handleReply}>
                <label
                  htmlFor="reply"
                  className="block text-sm font-bold text-[#2B2B2B]"
                >
                  Add a reply
                </label>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Your reply will be added to this ticket's conversation.
                </p>

                <textarea
                  id="reply"
                  rows={4}
                  maxLength={3000}
                  value={reply}
                  onChange={(event) => {
                    setReply(event.target.value);
                    setReplyError("");
                  }}
                  placeholder="Write your message..."
                  className="mt-4 w-full resize-y rounded-xl border border-[#E8E1D8] bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-gray-400 focus:border-[#6B2D3C] focus:ring-2 focus:ring-[#6B2D3C]/10"
                />

                {replyError && (
                  <p role="alert" className="mt-2 text-xs text-red-600">
                    {replyError}
                  </p>
                )}

                <div className="mt-3 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-gray-400">
                    {reply.length}/3000 characters
                  </p>

                  <button
                    type="submit"
                    disabled={isSending}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6B2D3C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#552330] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send size={16} />
                    Send reply
                  </button>
                </div>
              </form>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-[#2B2B2B]">
                  This ticket is closed
                </p>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  This ticket is not accepting replies. Contact the support team if you need it reopened.
                </p>
              </div>
            )}
          </div>
        </section>
<aside className="space-y-4 lg:sticky lg:top-6">
          <div className="rounded-2xl border border-[#EAE2D8] bg-white p-5 shadow-sm">
            <h3 className="font-bold text-[#2B2B2B]">Ticket details</h3>

            <div className="mt-5 space-y-4">
              <DetailRow label="Reference" value={ticket.id} />
              <DetailRow label="Category" value={ticket.category} />
              <DetailRow label="Priority" value={ticket.priority} />
              <DetailRow label="Status" value={ticket.status} />
              <DetailRow label="Last activity" value={ticket.updatedAt} />
            </div>
          </div>

          <div className="rounded-2xl border border-[#EAE2D8] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Clock3 size={17} className="text-[#6B2D3C]" />
              <h3 className="font-bold text-[#2B2B2B]">Helpful reminder</h3>
            </div>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Keep replies in this conversation so the support team has the
              complete context of your request.
            </p>
          </div>

          <div className="rounded-2xl border border-[#E9DDB9] bg-[#FFFCF2] p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-[#6B2D3C]">
              <MoreHorizontal size={17} />
              Need more help?
            </div>

            <p className="mt-2 text-xs leading-5 text-gray-600">
              If you have a different issue, create a separate ticket so it can
              be tracked independently.
            </p>

            <Link
              to="/author/tickets/new"
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#6B2D3C] hover:underline"
            >
              Create another ticket
              <Send size={13} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="max-w-40 wrap-break-word text-right text-xs font-semibold text-[#2B2B2B]">
        {value}
      </span>
    </div>
  );
}