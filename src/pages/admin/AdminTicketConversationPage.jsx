import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  UserRound,
  MessageCircle,
  Send,
  ShieldCheck,
  Clock3,
  BookOpen,
  AlertCircle,
  RefreshCw,
  StickyNote,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import {
  adminTicketsApi,
  ticketsApi,
  getErrorMessage,
} from "../../lib/api";

function getPayload(response) {
  return response?.data?.data ?? response?.data;
}

function getMessageRows(response) {
  const payload = getPayload(response);

  if (Array.isArray(payload)) return payload;

  return payload?.messages ?? payload?.items ?? [];
}

function normalizeStatus(value) {
  const status = String(value ?? "Open").toLowerCase();

  return status
    .split(/[\s_-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizePriority(value) {
  const priority = String(value ?? "Medium").toLowerCase();

  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function normalizeMessage(message, index, authorId) {
  const senderId =
    message.user_id ??
    message.author_id ??
    message.sender_id ??
    message.created_by;

  const role = String(
    message.sender_role ??
      message.sender_type ??
      message.role ??
      message.sender ??
      ""
  ).toLowerCase();

  const isAuthor =
    ["author", "user", "customer"].includes(role) ||
    (authorId != null &&
      senderId != null &&
      String(senderId) === String(authorId));

  const createdAt =
    message.created_at ??
    message.createdAt ??
    message.sent_at ??
    message.timestamp;

  return {
    id: message.id ?? message.message_id ?? `${createdAt ?? "message"}-${index}`,
    isAuthor,
    name:
      message.sender_name ??
      message.full_name ??
      message.name ??
      (isAuthor ? "Author" : "BookLeaf Support"),
    message:
      message.message ??
      message.content ??
      message.body ??
      message.text ??
      "",
    createdAt,
  };
}

function StatusBadge({ children }) {
  const styles = {
    Open: "bg-blue-50 text-blue-700",
    "In Progress": "bg-amber-50 text-amber-700",
    Resolved: "bg-green-50 text-green-700",
    Closed: "bg-gray-100 text-gray-600",
    Critical: "bg-red-100 text-red-700",
    Urgent: "bg-red-100 text-red-700",
    High: "bg-orange-100 text-orange-700",
    Medium: "bg-amber-50 text-amber-700",
    Low: "bg-green-50 text-green-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[children] ?? "bg-[#F5EFE6] text-[#6B2D3C]"
      }`}
    >
      {children}
    </span>
  );
}

export default function AdminTicketConversationPage() {
  const { ticketId } = useParams();

  const [ticket, setTicket] = useState(null);
  const [aiAssessment, setAiAssessment] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [activeTab, setActiveTab] = useState("reply");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadConversation = useCallback(async (showLoader = true) => {
    if (!ticketId) return;

    if (showLoader) setLoading(true);

    setError("");

    try {
      const [ticketResponse, messagesResponse] = await Promise.all([
        adminTicketsApi.getTicket(ticketId),
        ticketsApi.getMessages(ticketId, { page: 1, limit: 50 }),
      ]);

      const payload = getPayload(ticketResponse);
      const rawTicket = payload?.ticket ?? payload;

      if (!rawTicket?.id && !rawTicket?.ticket_id) {
        throw new Error("The server did not return ticket details.");
      }

      const authorId =
        rawTicket.author_id ??
        rawTicket.author?.id ??
        rawTicket.user_id;

      setTicket({
        ...rawTicket,
        id: rawTicket.id ?? rawTicket.ticket_id,
        reference:
          rawTicket.ticket_number ??
          rawTicket.reference ??
          rawTicket.id ??
          ticketId,
        authorName:
          rawTicket.author_name ??
          rawTicket.author?.full_name ??
          rawTicket.author?.name ??
          "Author",
        authorEmail:
          rawTicket.author_email ??
          rawTicket.author?.email ??
          "",
        bookTitle:
          rawTicket.book_title ??
          rawTicket.book?.title ??
          "",
        status: normalizeStatus(rawTicket.status),
        priority: normalizePriority(rawTicket.priority),
        category:
          rawTicket.category ??
          rawTicket.category_name ??
          "General Inquiry",
        authorId,
        assigneeName:
          rawTicket.assignee_name ??
          rawTicket.assigned_to_name ??
          "",
        description: rawTicket.description ?? "",
        createdAt: rawTicket.created_at ?? rawTicket.createdAt,
        updatedAt: rawTicket.updated_at ?? rawTicket.updatedAt,
      });

      setMessages(
        getMessageRows(messagesResponse).map((message, index) =>
          normalizeMessage(message, index, authorId)
        )
      );
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load this ticket."));
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  useEffect(() => {
    if (!ticketId || loading || !ticket) return undefined;

    const intervalId = window.setInterval(async () => {
      try {
        const response = await ticketsApi.getMessages(ticketId, {
          page: 1,
          limit: 50,
        });

        setMessages(
          getMessageRows(response).map((message, index) =>
            normalizeMessage(message, index, ticket.authorId)
          )
        );
      } catch {
        return;
      }
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [ticketId, loading, ticket?.id, ticket?.authorId]);

  async function handleAssignToMe() {
    setAssigning(true);
    setError("");
    setSuccess("");

    try {
      await adminTicketsApi.assignTicket(ticket.id, {
        assignedTo: "me",
      });

      await loadConversation(false);
      setSuccess("Ticket assignment updated.");
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to assign this ticket. Check the backend assignment requirements."
        )
      );
    } finally {
      setAssigning(false);
    }
  }

  async function handleReply(event) {
    event.preventDefault();

    const trimmedMessage = reply.trim();

    if (!trimmedMessage) {
      setError("Enter a reply before sending.");
      return;
    }

    if (trimmedMessage.length > 3000) {
      setError("Your reply cannot exceed 3,000 characters.");
      return;
    }

    if (["Resolved", "Closed"].includes(ticket.status)) {
      setError("This ticket is resolved or closed.");
      return;
    }

    setSending(true);
    setError("");
    setSuccess("");

    try {
      await adminTicketsApi.replyToTicket(ticket.id, {
  body: trimmedMessage,
});

      setReply("");
      setSuccess("Reply sent successfully.");
      await loadConversation(false);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to send your reply."));
    } finally {
      setSending(false);
    }
  }

async function handleAddNote() {
  const trimmedNote = internalNote.trim();

  if (!trimmedNote) {
    setError("Please enter an internal note.");
    return;
  }

  setSending(true);
  setError("");
  setSuccess("");

  try {
    await adminTicketsApi.addInternalNote(ticket.id, {
      body: trimmedNote,
    });

    setInternalNote("");
    setSuccess("Internal note saved.");
    await loadConversation(false);
  } catch (err) {
    setError(getErrorMessage(err, "Unable to save the internal note."));
  } finally {
    setSending(false);
  }
}


  async function handleClassify() {
  setClassifying(true);
  setError("");
  setSuccess("");

  try {
    const response = await adminTicketsApi.classifyWithAI(ticket.id);

    const payload = response.data?.data ?? response.data;
    const assessment = payload?.assessment;

    if (!assessment) {
      throw new Error(
        "Classification completed, but no assessment was returned."
      );
    }

    setAiAssessment(assessment);
    setSuccess("AI classification completed. Review the suggestions below.");
  } catch (err) {
    setError(
      getErrorMessage(err, "Unable to classify this ticket.")
    );
  } finally {
    setClassifying(false);
  }
}

  
async function handleGenerateDraft() {
  setDrafting(true);
  setError("");
  setSuccess("");

  try {
    const response = await adminTicketsApi.generateAIDraft(ticket.id);
    const payload = getPayload(response);

    const generatedDraft =
      payload?.assessment?.response_draft ??
      payload?.draft ??
      payload?.reply ??
      payload?.content;

    if (
      typeof generatedDraft !== "string" ||
      !generatedDraft.trim()
    ) {
      throw new Error(
        payload?.message || "The AI did not return a reply draft."
      );
    }

    setActiveTab("reply");
    setReply(generatedDraft);
    setSuccess("AI draft generated. Review it before sending.");
  } catch (err) {
    

    setError(
      getErrorMessage(err, "Unable to generate an AI draft.")
    );
  } finally {
    setDrafting(false);
  }
}


  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-2xl border border-[#2B2B2B]/10 bg-white">
        <RefreshCw className="animate-spin text-[#6B2D3C]" size={24} />
        <span className="ml-3 text-sm text-[#82756B]">
          Loading ticket conversation...
        </span>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
        <AlertCircle className="mx-auto text-red-500" size={32} />
        <h1 className="mt-4 text-xl font-semibold text-[#2B2B2B]">
          Unable to load ticket
        </h1>
        <p className="mt-2 text-sm text-red-600">
          {error || "This ticket could not be found."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => loadConversation()}
            className="rounded-xl bg-[#6B2D3C] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Try again
          </button>
          <Link
            to="/admin/tickets"
            className="rounded-xl border border-[#2B2B2B]/10 px-4 py-2.5 text-sm font-semibold text-[#2B2B2B]"
          >
            Back to tickets
          </Link>
        </div>
      </div>
    );
  }

  const canReply = !["Resolved", "Closed"].includes(ticket.status);

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/admin/tickets"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#6B2D3C] hover:underline"
        >
          <ArrowLeft size={16} />
          Back to tickets
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-[#F5EFE6] px-2.5 py-1 text-xs font-bold text-[#6B2D3C]">
                #{ticket.reference}
              </span>
              <StatusBadge>{ticket.status}</StatusBadge>
              <StatusBadge>{ticket.priority}</StatusBadge>
            </div>

            <h1 className="break-words font-serif text-3xl font-semibold text-[#2B2B2B]">
              {ticket.subject || "Support request"}
            </h1>

            <p className="mt-2 text-sm text-[#82756B]">
              {ticket.category}
              {ticket.bookTitle ? ` · ${ticket.bookTitle}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAssignToMe}
              disabled={assigning}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#6B2D3C]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#6B2D3C] hover:bg-[#F5EFE6] disabled:opacity-60"
            >
              <UserRound size={16} />
              {assigning ? "Assigning..." : "Assign to me"}
            </button>

            <button
              type="button"
              onClick={handleClassify}
              disabled={classifying}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6B2D3C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#582431] disabled:opacity-60"
            >
              <Sparkles size={16} />
              {classifying ? "Classifying..." : "AI Classify"}
            </button>
          </div>
        </div>
      </div>

      {aiAssessment && (
  <section className="mt-5 rounded-2xl border border-purple-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-purple-600" />

          <h3 className="text-base font-bold text-gray-900">
            AI Classification
          </h3>
        </div>

        <p className="mt-1 text-sm text-gray-500">
          AI-generated suggestions for this support ticket.
        </p>
      </div>

      <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
        Assessment ready
      </span>
    </div>

    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl bg-gray-50 p-4">
        <p className="text-xs font-medium text-gray-500">
          Suggested category
        </p>

        <p className="mt-2 text-base font-bold text-gray-900">
          {aiAssessment.suggested_category ?? "Not available"}
        </p>

        <p className="mt-1 text-xs text-gray-500">
          Confidence:{" "}
          {Number.isFinite(Number(aiAssessment.category_confidence))
            ? `${(Number(aiAssessment.category_confidence) * 100).toFixed(1)}%`
            : "N/A"}
        </p>
      </div>

      <div className="rounded-xl bg-gray-50 p-4">
        <p className="text-xs font-medium text-gray-500">
          Suggested priority
        </p>

        <p className="mt-2 text-base font-bold text-gray-900">
          {aiAssessment.suggested_priority ?? "Not available"}
        </p>

        <p className="mt-1 text-xs text-gray-500">
          Confidence:{" "}
          {Number.isFinite(Number(aiAssessment.priority_confidence))
            ? `${(Number(aiAssessment.priority_confidence) * 100).toFixed(1)}%`
            : "N/A"}
        </p>
      </div>
    </div>

    <div className="mt-4 rounded-xl border border-purple-100 bg-purple-50/50 p-4">
      <p className="text-sm font-semibold text-gray-800">
        AI reasoning
      </p>

      <p className="mt-2 text-sm leading-6 text-gray-600">
        {aiAssessment.reasoning || "No explanation was provided."}
      </p>
    </div>

    <p className="mt-4 text-xs leading-5 text-gray-500">
      These are AI recommendations. Review them before changing the
      ticket's actual category or priority.
    </p>
  </section>
)}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 shrink-0" size={17} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          <CheckCircle2 className="mt-0.5 shrink-0" size={17} />
          <span>{success}</span>
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-[#2B2B2B]/10 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#2B2B2B]/10 px-5 py-4 sm:px-6">
            <div>
              <h2 className="flex items-center gap-2 font-semibold text-[#2B2B2B]">
                <MessageCircle size={18} className="text-[#6B2D3C]" />
                Conversation
              </h2>
              <p className="mt-1 text-xs text-[#82756B]">
                Messages refresh automatically.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadConversation(false)}
              className="rounded-lg p-2 text-[#82756B] hover:bg-[#F5EFE6] hover:text-[#6B2D3C]"
              aria-label="Refresh conversation"
            >
              <RefreshCw size={17} />
            </button>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            <article className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5EFE6] text-[#6B2D3C]">
                <UserRound size={19} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-[#2B2B2B]">
                    {ticket.authorName}
                  </p>
                  <span className="rounded-md bg-[#F5EFE6] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6B2D3C]">
                    Author
                  </span>
                </div>

                <p className="mt-1 text-xs text-[#82756B]">
                  {formatDate(ticket.createdAt)}
                </p>

                <div className="mt-3 whitespace-pre-wrap break-words rounded-2xl rounded-tl-sm bg-[#FAF7F2] p-4 text-sm leading-7 text-[#2B2B2B]">
                  {ticket.description || "No initial description provided."}
                </div>
              </div>
            </article>

            {messages.map((message) => (
              <article key={message.id} className="flex gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    message.isAuthor
                      ? "bg-[#F5EFE6] text-[#6B2D3C]"
                      : "bg-[#EAF1EA] text-[#3D6B4F]"
                  }`}
                >
                  {message.isAuthor ? (
                    <UserRound size={18} />
                  ) : (
                    <ShieldCheck size={18} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-[#2B2B2B]">
                      {message.name}
                    </p>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        message.isAuthor
                          ? "bg-[#F5EFE6] text-[#6B2D3C]"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      {message.isAuthor ? "Author" : "Support"}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-[#82756B]">
                    {formatDate(message.createdAt)}
                  </p>

                  <div
                    className={`mt-3 whitespace-pre-wrap break-words rounded-2xl p-4 text-sm leading-7 ${
                      message.isAuthor
                        ? "rounded-tl-sm bg-[#FAF7F2] text-[#2B2B2B]"
                        : "rounded-tl-sm bg-[#EAF1EA]/70 text-[#2B2B2B]"
                    }`}
                  >
                    {message.message}
                  </div>
                </div>
              </article>
            ))}

            {messages.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#2B2B2B]/15 py-6 text-center">
                <MessageCircle
                  size={23}
                  className="mx-auto text-[#82756B]"
                />
                <p className="mt-2 text-sm text-[#82756B]">
                  No additional messages yet.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-[#2B2B2B]/10 bg-[#FAF7F2]/60 p-5 sm:p-6">
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("reply")}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                  activeTab === "reply"
                    ? "bg-[#6B2D3C] text-white"
                    : "bg-white text-[#82756B] hover:bg-[#F5EFE6]"
                }`}
              >
                <Send size={15} />
                Reply to author
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("note")}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                  activeTab === "note"
                    ? "bg-[#6B2D3C] text-white"
                    : "bg-white text-[#82756B] hover:bg-[#F5EFE6]"
                }`}
              >
                <StickyNote size={15} />
                Internal note
              </button>
            </div>

            {activeTab === "reply" ? (
              <form onSubmit={handleReply} className="space-y-3">
                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  rows={5}
                  maxLength={3000}
                  disabled={!canReply || sending}
                  placeholder={
                    canReply
                      ? "Write a helpful response to the author..."
                      : "This ticket is resolved or closed."
                  }
                  className="w-full resize-y rounded-xl border border-[#2B2B2B]/15 bg-white p-4 text-sm leading-6 text-[#2B2B2B] outline-none placeholder:text-[#82756B]/70 focus:border-[#6B2D3C] focus:ring-1 focus:ring-[#6B2D3C] disabled:bg-gray-100"
                />

                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <span className="text-xs text-[#82756B]">
                    {reply.length}/3000 characters
                  </span>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateDraft}
                      disabled={drafting || !canReply}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#6B2D3C]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#6B2D3C] hover:bg-[#F5EFE6] disabled:opacity-50"
                    >
                      <Sparkles size={16} />
                      {drafting ? "Generating..." : "AI Draft"}
                    </button>

                    <button
                      type="submit"
                      disabled={sending || !canReply || !reply.trim()}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6B2D3C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#582431] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send size={15} />
                      {sending ? "Sending..." : "Send Reply"}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddNote} className="space-y-3">
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                  Internal notes are intended for the support team, not the author.
                </div>

                <textarea
                  value={internalNote}
                  onChange={(event) => setInternalNote(event.target.value)}
                  rows={4}
                  maxLength={3000}
                  disabled={sending}
                  placeholder="Add an internal note for the support team..."
                  className="w-full resize-y rounded-xl border border-[#2B2B2B]/15 bg-white p-4 text-sm leading-6 text-[#2B2B2B] outline-none placeholder:text-[#82756B]/70 focus:border-[#6B2D3C] focus:ring-1 focus:ring-[#6B2D3C] disabled:bg-gray-100"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={sending || !internalNote.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6B2D3C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#582431] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <StickyNote size={15} />
                    {sending ? "Saving..." : "Save Internal Note"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-[#2B2B2B]/10 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-[#2B2B2B]">
              Ticket Information
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs font-medium text-[#82756B]">Reference</p>
                <p className="mt-1 text-sm font-semibold text-[#2B2B2B]">
                  #{ticket.reference}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-[#82756B]">Category</p>
                <p className="mt-1 text-sm text-[#2B2B2B]">
                  {ticket.category}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-[#82756B]">Status</p>
                <div className="mt-1">
                  <StatusBadge>{ticket.status}</StatusBadge>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-[#82756B]">Priority</p>
                <div className="mt-1">
                  <StatusBadge>{ticket.priority}</StatusBadge>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-[#82756B]">
                  <Clock3 className="mr-1 inline" size={13} />
                  Created
                </p>
                <p className="mt-1 text-sm text-[#2B2B2B]">
                  {formatDate(ticket.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-[#82756B]">
                  Last Updated
                </p>
                <p className="mt-1 text-sm text-[#2B2B2B]">
                  {formatDate(ticket.updatedAt)}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#2B2B2B]/10 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold text-[#2B2B2B]">
              <UserRound size={17} className="text-[#6B2D3C]" />
              Author Details
            </h2>

            <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5EFE6] font-serif text-lg font-semibold text-[#6B2D3C]">
              {ticket.authorName
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase()}
            </div>

            <p className="mt-3 break-words text-sm font-semibold text-[#2B2B2B]">
              {ticket.authorName}
            </p>

            <p className="mt-1 break-all text-xs leading-5 text-[#82756B]">
              {ticket.authorEmail || "No email available"}
            </p>

            {ticket.bookTitle && (
              <div className="mt-4 border-t border-[#2B2B2B]/10 pt-4">
                <p className="text-xs font-medium text-[#82756B]">Related Book</p>
                <p className="mt-2 flex items-start gap-2 text-sm text-[#2B2B2B]">
                  <BookOpen
                    size={16}
                    className="mt-0.5 shrink-0 text-[#6B2D3C]"
                  />
                  <span>{ticket.bookTitle}</span>
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#C9A227]/30 bg-[#C9A227]/5 p-5">
            <div className="flex items-center gap-2 font-semibold text-[#6B2D3C]">
              <Sparkles size={17} />
              AI Assistance
            </div>

            <p className="mt-2 text-xs leading-5 text-[#82756B]">
              Classify the ticket or generate a reply draft for review before sending it to the author.
            </p>

            <button
              type="button"
              onClick={handleGenerateDraft}
              disabled={drafting || !canReply}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#C9A227]/40 bg-white px-3 py-2.5 text-sm font-semibold text-[#6B2D3C] hover:bg-[#F5EFE6] disabled:opacity-50"
            >
              <Sparkles size={15} />
              {drafting ? "Generating draft..." : "Generate Reply Draft"}
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}