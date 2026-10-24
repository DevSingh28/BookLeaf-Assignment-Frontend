
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { booksApi, ticketsApi, getErrorMessage } from "../../lib/api";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  LifeBuoy,
  Paperclip,
  Send,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";


const categories = [
  {
    value: "Royalty & Payments",
    description: "Royalty statements, payment status, or payout questions",
  },
  {
    value: "ISBN & Metadata Issues",
    description: "ISBN, author details, title, or metadata corrections",
  },
  {
    value: "Printing & Quality",
    description: "Printing, binding, delivery, or production quality issues",
  },
  {
    value: "Distribution & Availability",
    description: "Store listings, availability, or distribution concerns",
  },
  {
    value: "Book Status & Production Updates",
    description: "Book progress, production status, or publishing updates",
  },
  {
    value: "General Inquiry",
    description: "Account access or other questions",
  },
];


export default function CreateTicketPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    category: "",
    book: "",
    subject: "",
    description: "",
  });

  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [books, setBooks] = useState([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadBooks() {
      try {
        const response = await booksApi.getBooks({ page: 1, limit: 50 });
        const payload = response.data?.data ?? response.data;
        const list = Array.isArray(payload) ? payload : payload?.books ?? payload?.items ?? [];
        if (active) setBooks(list);
      } catch (error) {
        if (active) setErrors((current) => ({ ...current, books: getErrorMessage(error, "Unable to load your books.") }));
      } finally {
        if (active) setIsLoadingBooks(false);
      }
    }
    loadBooks();
    return () => { active = false; };
  }, []);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: "",
    }));
  }

  function handleFiles(event) {
    const selectedFiles = Array.from(event.target.files || []);
    const maxFileSize = 10 * 1024 * 1024;
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    const accepted = [];
    const rejected = [];

    selectedFiles.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        rejected.push(`${file.name}: unsupported file type.`);
      } else if (file.size > maxFileSize) {
        rejected.push(`${file.name}: file exceeds 10 MB.`);
      } else {
        accepted.push(file);
      }
    });

    setFiles((current) => {
      const combined = [...current];

      accepted.forEach((file) => {
        const alreadyExists = combined.some(
          (existing) =>
            existing.name === file.name &&
            existing.size === file.size &&
            existing.lastModified === file.lastModified,
        );

        if (!alreadyExists && combined.length < 5) {
          combined.push(file);
        } else if (!alreadyExists) {
          rejected.push(`${file.name}: maximum 5 attachments allowed.`);
        }
      });

      return combined;
    });

    if (rejected.length > 0) {
      setErrors((current) => ({
        ...current,
        files: rejected.join(" "),
      }));
    } else {
      setErrors((current) => ({
        ...current,
        files: "",
      }));
    }
    event.target.value = "";
  }

  function removeFile(index) {
    setFiles((current) => current.filter((_, i) => i !== index));
  }

  function validateForm() {
    const nextErrors = {};

    if (!form.category) {
      nextErrors.category = "Please select a support category.";
    }

    if (!form.subject.trim()) {
      nextErrors.subject = "Please enter a subject.";
    } else if (form.subject.trim().length < 5) {
      nextErrors.subject = "Subject must contain at least 5 characters.";
    } else if (form.subject.trim().length > 120) {
      nextErrors.subject = "Subject cannot exceed 120 characters.";
    }

    if (!form.description.trim()) {
      nextErrors.description = "Please describe the issue.";
    } else if (form.description.trim().length < 20) {
      nextErrors.description =
        "Please provide at least 20 characters so our team can understand the issue.";
    } else if (form.description.trim().length > 5000) {
      nextErrors.description = "Description cannot exceed 5,000 characters.";
    }

    setErrors((current) => ({
      ...current,
      ...nextErrors,
    }));

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    setErrors((current) => ({ ...current, form: "" }));
    try {
      const selectedBook = books.find((book) => String(book.id ?? book.book_id) === String(form.book));
      const payload = {
        category: form.category,
        subject: form.subject.trim(),
        description: form.description.trim(),
        ...(form.book ? { book_id: selectedBook?.id ?? selectedBook?.book_id ?? form.book } : {}),
      };
      const response = await ticketsApi.createTicket(payload);
      const data = response.data?.data ?? response.data;
      const ticket = data?.ticket ?? data;
      setCreatedTicket({
        id: ticket?.ticket_number ?? ticket?.reference ?? ticket?.id ?? ticket?.ticket_id ?? "Created successfully",
        subject: ticket?.subject ?? payload.subject,
        category: ticket?.category ?? payload.category,
        status: ticket?.status ?? "Open",
      });
      setIsSubmitted(true);
    } catch (error) {
      setErrors((current) => ({ ...current, form: getErrorMessage(error, "Unable to create your ticket. Please try again.") }));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    const lastTicket = createdTicket || {};

    return (
      <div className="mx-auto max-w-2xl py-8">
        <div className="rounded-3xl border border-[#EAE2D8] bg-white px-6 py-10 text-center shadow-sm sm:px-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-700">
            <CheckCircle2 size={32} />
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#6B2D3C]">
            Request submitted
          </p>

          <h1 className="mt-3 text-2xl font-bold text-[#2B2B2B] sm:text-3xl">
            Your ticket has been created
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
            Your support request has been submitted to the BookLeaf support team.
          </p>

          <div className="mt-8 rounded-2xl border border-[#EAE2D8] bg-[#FAF7F2] p-5 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Ticket reference
            </p>

            <p className="mt-2 break-all text-lg font-bold text-[#6B2D3C]">
              {lastTicket.id}
            </p>

            <p className="mt-3 text-sm font-semibold text-[#2B2B2B]">
              {lastTicket.subject}
            </p>

            <p className="mt-2 text-sm text-gray-500">
              {lastTicket.category}
            </p>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Open
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate("/author/tickets")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6B2D3C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#552330]"
            >
              View support tickets
              <ArrowRight size={17} />
            </button>

            <button
              type="button"
              onClick={() => {
                setForm({
                  category: "",
                  book: "",
                  subject: "",
                  description: "",
                });
                setFiles([]);
                setErrors({});
                setIsSubmitted(false);
              }}
              className="rounded-xl border border-[#EAE2D8] px-5 py-3 text-sm font-semibold text-[#2B2B2B] transition hover:bg-[#FAF7F2]"
            >
              Create another ticket
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
<section>
        <Link
          to="/author/tickets"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#6B2D3C]"
        >
          <ArrowLeft size={16} />
          Back to support tickets
        </Link>

        <div className="mt-5 flex items-start gap-4">
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F5EFE6] text-[#6B2D3C] sm:flex">
            <LifeBuoy size={23} />
          </div>

          <div>
            <p className="text-sm font-medium text-[#6B2D3C]">
              Author Support
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#2B2B2B] sm:text-3xl">
              Create a support ticket
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Tell us what you need help with. Providing the right details
              helps our team understand your request.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
<form
          onSubmit={handleSubmit}
          noValidate
          className="min-w-0 space-y-6 rounded-2xl border border-[#EAE2D8] bg-white p-5 shadow-sm sm:p-7"
        >
          <div>
            <h2 className="text-lg font-bold text-[#2B2B2B]">
              Request details
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Fields marked with <span className="text-red-600">*</span> are
              required.
            </p>
          </div>

          {errors.form && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {errors.form}
            </div>
          )}
<div>
            <label
              htmlFor="category"
              className="mb-2 block text-sm font-semibold text-[#2B2B2B]"
            >
              Support category <span className="text-red-600">*</span>
            </label>

            <select
              id="category"
              name="category"
              value={form.category}
              onChange={updateField}
              aria-invalid={Boolean(errors.category)}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-[#6B2D3C]/10 ${
                errors.category
                  ? "border-red-400 focus:border-red-500"
                  : "border-[#E8E1D8] focus:border-[#6B2D3C]"
              }`}
            >
              <option value="">Choose a category</option>

              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.value}
                </option>
              ))}
            </select>

            {errors.category && (
              <p className="mt-1.5 text-xs text-red-600">
                {errors.category}
              </p>
            )}

            {form.category && (
              <p className="mt-2 text-xs leading-5 text-gray-500">
                {
                  categories.find((item) => item.value === form.category)
                    ?.description
                }
              </p>
            )}
          </div>
<div>
            <label
              htmlFor="book"
              className="mb-2 block text-sm font-semibold text-[#2B2B2B]"
            >
              Related book{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>

            <div className="relative">
              <BookOpen
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <select
                id="book"
                name="book"
                value={form.book}
                onChange={updateField}
                className="w-full appearance-none rounded-xl border border-[#E8E1D8] bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#6B2D3C] focus:ring-2 focus:ring-[#6B2D3C]/10"
              >
                <option value="">General or account-level issue</option>

                {isLoadingBooks ? (
                  <option value="" disabled>Loading your books...</option>
                ) : books.length ? books.map((book) => {
                  const id = book.id ?? book.book_id;
                  const title = book.title ?? book.book_title ?? book.name ?? "Untitled book";
                  return <option key={id} value={id}>{title}</option>;
                }) : <option value="" disabled>No books found</option>}
              </select>
            </div>

            <p className="mt-2 text-xs leading-5 text-gray-500">
              Choose a book if your request relates to a specific title.
            </p>
            {errors.books && <p className="mt-1.5 text-xs text-amber-700">{errors.books}</p>}
          </div>
<div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label
                htmlFor="subject"
                className="text-sm font-semibold text-[#2B2B2B]"
              >
                Subject <span className="text-red-600">*</span>
              </label>

              <span className="text-xs text-gray-400">
                {form.subject.length}/120
              </span>
            </div>

            <input
              id="subject"
              name="subject"
              type="text"
              maxLength={120}
              value={form.subject}
              onChange={updateField}
              placeholder="Briefly describe your issue"
              aria-invalid={Boolean(errors.subject)}
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-[#6B2D3C]/10 ${
                errors.subject
                  ? "border-red-400 focus:border-red-500"
                  : "border-[#E8E1D8] focus:border-[#6B2D3C]"
              }`}
            />

            {errors.subject && (
              <p className="mt-1.5 text-xs text-red-600">{errors.subject}</p>
            )}
          </div>
<div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label
                htmlFor="description"
                className="text-sm font-semibold text-[#2B2B2B]"
              >
                Description <span className="text-red-600">*</span>
              </label>

              <span className="text-xs text-gray-400">
                {form.description.length}/5000
              </span>
            </div>

            <textarea
              id="description"
              name="description"
              rows={6}
              maxLength={5000}
              value={form.description}
              onChange={updateField}
              placeholder="Explain what happened, what you expected, and any relevant details..."
              aria-invalid={Boolean(errors.description)}
              className={`w-full resize-y rounded-xl border px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-[#6B2D3C]/10 ${
                errors.description
                  ? "border-red-400 focus:border-red-500"
                  : "border-[#E8E1D8] focus:border-[#6B2D3C]"
              }`}
            />

            {errors.description && (
              <p className="mt-1.5 text-xs leading-5 text-red-600">
                {errors.description}
              </p>
            )}

            <p className="mt-2 text-xs leading-5 text-gray-500">
              Please include relevant details, such as the affected book,
              approximate date, or steps to reproduce the issue.
            </p>
          </div>
<div>
            <div className="mb-2 flex items-center gap-2">
              <label className="text-sm font-semibold text-[#2B2B2B]">
                Attachments{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFiles}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-[#D9C9B8] bg-[#FFFEFC] px-4 py-7 text-center transition hover:border-[#6B2D3C] hover:bg-[#FAF7F2]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5EFE6] text-[#6B2D3C]">
                <Upload size={21} />
              </div>

              <p className="mt-3 text-sm font-semibold text-[#2B2B2B]">
                Click to upload files
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                PDF, JPG, PNG or WebP · Up to 10 MB per file · Maximum 5 files
              </p>
            </button>

            {errors.files && (
              <p role="alert" className="mt-2 text-xs leading-5 text-red-600">
                {errors.files}
              </p>
            )}

            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${file.lastModified}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#EAE2D8] p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5EFE6] text-[#6B2D3C]">
                        <FileText size={17} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#2B2B2B]">
                          {file.name}
                        </p>

                        <p className="mt-0.5 text-xs text-gray-500">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      aria-label={`Remove ${file.name}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
<div className="flex items-start gap-3 rounded-xl border border-[#EAE2D8] bg-[#FAF7F2] p-4">
            <ShieldCheck
              size={19}
              className="mt-0.5 shrink-0 text-[#6B2D3C]"
            />

            <p className="text-xs leading-5 text-gray-600">
              Please avoid including passwords, payment card details, or other
              sensitive information in your request or attachments.
            </p>
          </div>
<div className="flex flex-col-reverse gap-3 border-t border-[#EEE8E0] pt-5 sm:flex-row sm:justify-end">
            <Link
              to="/author/tickets"
              className="inline-flex items-center justify-center rounded-xl border border-[#EAE2D8] px-5 py-3 text-sm font-semibold text-[#2B2B2B] transition hover:bg-[#FAF7F2]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6B2D3C] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#552330] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#6B2D3C] focus:ring-offset-2"
            >
              <Send size={16} />
              {isSubmitting ? "Submitting..." : "Submit ticket"}
            </button>
          </div>
        </form>
<aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-[#EAE2D8] bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5EFE6] text-[#6B2D3C]">
              <LifeBuoy size={20} />
            </div>

            <h3 className="mt-4 font-bold text-[#2B2B2B]">
              How can we help?
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Select the category that best describes your issue so the support
              team can direct your request appropriately.
            </p>
          </div>

          <div className="rounded-2xl border border-[#EAE2D8] bg-white p-5 shadow-sm">
            <h3 className="font-bold text-[#2B2B2B]">Before submitting</h3>

            <ul className="mt-4 space-y-3 text-sm leading-5 text-gray-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2
                  size={16}
                  className="mt-0.5 shrink-0 text-[#3D6B4F]"
                />
                Choose the correct category.
              </li>

              <li className="flex items-start gap-2.5">
                <CheckCircle2
                  size={16}
                  className="mt-0.5 shrink-0 text-[#3D6B4F]"
                />
                Include the affected book, if applicable.
              </li>

              <li className="flex items-start gap-2.5">
                <CheckCircle2
                  size={16}
                  className="mt-0.5 shrink-0 text-[#3D6B4F]"
                />
                Explain the issue clearly.
              </li>

              <li className="flex items-start gap-2.5">
                <CheckCircle2
                  size={16}
                  className="mt-0.5 shrink-0 text-[#3D6B4F]"
                />
                Attach relevant screenshots if needed.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[#E9DDB9] bg-[#FFFCF2] p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-[#6B2D3C]">
              <Paperclip size={16} />
              Attachments
            </div>

            <p className="mt-2 text-xs leading-5 text-gray-600">
              Images and PDFs can help the team investigate printing defects,
              book metadata errors, or listing problems.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}