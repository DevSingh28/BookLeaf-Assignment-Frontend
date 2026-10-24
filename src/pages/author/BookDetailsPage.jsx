import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Hash,
  IndianRupee,
  LibraryBig,
  MessageCircle,
  Package,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { booksApi, getErrorMessage } from "../../lib/api";

const statusStyles = {
  Published: "border-[#C9DEC9] bg-[#EAF3E9] text-[#3D6B4F]",
  "In Production": "border-[#E8DDBF] bg-[#F8F0D7] text-[#876916]",
  Draft: "border-[#E9E1D7] bg-[#F5EFE6] text-[#82756B]",
};

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatStatus(value) {
  if (!value) return "Unknown";

  return String(value)
    .trim()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getStatusStyle(status) {
  return (
    statusStyles[status] ??
    "border-[#E9E1D7] bg-[#F5EFE6] text-[#82756B]"
  );
}

function getValue(data, ...keys) {
  for (const key of keys) {
    if (data?.[key] !== undefined && data?.[key] !== null) {
      return data[key];
    }
  }

  return null;
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#F0E8DF] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5EFE6] text-[#6B2D3C]">
        <Icon size={19} />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-[#96877B]">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-[#2B2B2B]">
          {value === null || value === undefined || value === ""
            ? "Not available"
            : value}
        </p>
      </div>
    </div>
  );
}

function RoyaltyCard({ icon: Icon, label, value, description, tone }) {
  const tones = {
    burgundy: "bg-[#F8EDF0] text-[#6B2D3C]",
    green: "bg-[#EAF3E9] text-[#3D6B4F]",
    gold: "bg-[#F8F0D7] text-[#876916]",
  };

  return (
    <div className="rounded-2xl border border-[#E9E1D7] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[#82756B]">{label}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-[#2B2B2B]">
            {value}
          </p>
          <p className="mt-2 text-xs leading-5 text-[#96877B]">
            {description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

export default function BookDetailsPage() {
  const { bookId } = useParams();

  const [book, setBook] = useState(null);
  const [royalties, setRoyalties] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBook = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [bookResult, royaltyResult] = await Promise.allSettled([
        booksApi.getBook(bookId),
        booksApi.getBookRoyalties(bookId),
      ]);

      if (bookResult.status === "rejected") {
        throw bookResult.reason;
      }

      const bookResponse = bookResult.value.data;
      const bookPayload = bookResponse?.data ?? bookResponse;
      const bookData = bookPayload?.book ?? bookPayload;

      if (!bookData || !bookData.id) {
        throw new Error("The requested book could not be found.");
      }

      setBook(bookData);

      if (royaltyResult.status === "fulfilled") {
        const royaltyResponse = royaltyResult.value.data;
        const royaltyPayload = royaltyResponse?.data ?? royaltyResponse;

        setRoyalties(royaltyPayload?.royalties ?? null);
      } else {
        setRoyalties(null);
      }
    } catch (requestError) {
      setBook(null);
      setRoyalties(null);
      setError(
        getErrorMessage(
          requestError,
          "Unable to load this book. Please try again."
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    fetchBook();
  }, [fetchBook]);

  if (isLoading) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5EFE6] text-[#6B2D3C]">
          <BookOpen size={27} className="animate-pulse" />
        </div>

        <p className="text-sm font-medium text-[#82756B]">
          Loading book details...
        </p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F8EDF0] text-[#6B2D3C]">
          <BookOpen size={29} />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-[#2B2B2B]">
          Unable to find this book
        </h1>

        <p className="mt-2 text-sm leading-6 text-[#82756B]">
          {error || "This book may not exist or may not belong to your account."}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={fetchBook}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E9E1D7] px-4 py-3 text-sm font-semibold text-[#6B2D3C] transition hover:bg-[#F5EFE6]"
          >
            <RefreshCw size={16} />
            Try again
          </button>

          <Link
            to="/author/books"
            className="inline-flex items-center gap-2 rounded-xl bg-[#6B2D3C] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#542330]"
          >
            <ArrowLeft size={16} />
            Back to My Books
          </Link>
        </div>
      </div>
    );
  }

  const status = formatStatus(
    getValue(book, "production_status", "productionStatus", "status")
  );

  const title = getValue(book, "title") || "Untitled book";

  const copiesSold = getValue(
    royalties,
    "total_copies_sold",
    "totalCopiesSold"
  ) ?? getValue(book, "total_copies_sold", "totalCopiesSold");

  const totalEarned = getValue(
    royalties,
    "total_royalty_earned",
    "totalRoyaltyEarned"
  ) ?? getValue(book, "total_royalty_earned", "totalRoyaltyEarned");

  const royaltyPaid = getValue(
    royalties,
    "royalty_paid",
    "royaltyPaid"
  ) ?? getValue(book, "royalty_paid", "royaltyPaid");

  const royaltyPending = getValue(
    royalties,
    "royalty_pending",
    "royaltyPending"
  ) ?? getValue(book, "royalty_pending", "royaltyPending");

  const lastPayoutDate = getValue(
    royalties,
    "last_royalty_payout_date",
    "lastRoyaltyPayoutDate"
  ) ?? getValue(book, "last_royalty_payout_date", "lastRoyaltyPayoutDate");

  return (
    <div className="space-y-7 pb-8">
      <Link
        to="/author/books"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#6B2D3C] transition hover:text-[#542330]"
      >
        <ArrowLeft size={17} />
        Back to My Books
      </Link>

      <section className="overflow-hidden rounded-2xl border border-[#E9E1D7] bg-white shadow-sm">
        <div className="h-2 bg-gradient-to-r from-[#6B2D3C] via-[#C9A227] to-[#3D6B4F]" />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex h-28 w-24 shrink-0 items-center justify-center rounded-2xl bg-[#F5EFE6] text-[#6B2D3C]">
              <BookOpen size={45} strokeWidth={1.4} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5EFE6] px-3 py-1 text-xs font-semibold text-[#6B2D3C]">
                  <LibraryBig size={13} />
                  Your library
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(status)}`}
                >
                  {status === "Published" ? (
                    <CheckCircle2 size={13} />
                  ) : (
                    <Clock3 size={13} />
                  )}
                  {status}
                </span>
              </div>

              <h1 className="mt-4 break-words text-3xl font-bold tracking-tight text-[#2B2B2B] sm:text-4xl">
                {title}
              </h1>

              <p className="mt-3 text-sm text-[#82756B]">
                {getValue(book, "genre") || "Genre not specified"}
              </p>

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm text-[#82756B]">
                <span className="inline-flex items-center gap-2">
                  <Hash size={16} />
                  ISBN: {getValue(book, "isbn") || "Not assigned"}
                </span>

                <span className="inline-flex items-center gap-2">
                  <CalendarDays size={16} />
                  Published: {formatDate(
                    getValue(book, "publication_date", "publicationDate")
                  )}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/author/tickets/new"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6B2D3C] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#542330]"
                >
                  <MessageCircle size={17} />
                  Get book support
                </Link>

                <button
                  type="button"
                  onClick={fetchBook}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E9E1D7] px-4 py-3 text-sm font-semibold text-[#655750] transition hover:bg-[#FAF7F2]"
                >
                  <RefreshCw size={16} />
                  Refresh details
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[#2B2B2B]">
            Sales and royalties
          </h2>

          <p className="mt-1 text-sm text-[#82756B]">
            An overview of this book's recorded sales and earnings.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <RoyaltyCard
            icon={ShoppingBag}
            label="Copies sold"
            value={copiesSold === null ? "—" : formatNumber(copiesSold)}
            description="Total recorded book sales"
            tone="burgundy"
          />

          <RoyaltyCard
            icon={TrendingUp}
            label="Total royalties"
            value={totalEarned === null ? "—" : formatCurrency(totalEarned)}
            description="Total recorded royalty earnings"
            tone="green"
          />

          <RoyaltyCard
            icon={CheckCircle2}
            label="Royalties paid"
            value={royaltyPaid === null ? "—" : formatCurrency(royaltyPaid)}
            description="Amount recorded as paid"
            tone="gold"
          />

          <RoyaltyCard
            icon={CircleDollarSign}
            label="Royalties pending"
            value={
              royaltyPending === null ? "—" : formatCurrency(royaltyPending)
            }
            description="Amount recorded as pending"
            tone="burgundy"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-[#E9E1D7] bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5EFE6] text-[#6B2D3C]">
              <FileText size={20} />
            </div>

            <div>
              <h2 className="font-bold text-[#2B2B2B]">
                Book information
              </h2>
              <p className="mt-1 text-xs text-[#96877B]">
                Bibliographic and publishing details
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailItem
              icon={BookOpen}
              label="Book title"
              value={title}
            />

            <DetailItem
              icon={Hash}
              label="ISBN"
              value={getValue(book, "isbn")}
            />

            <DetailItem
              icon={LibraryBig}
              label="Genre"
              value={getValue(book, "genre")}
            />

            <DetailItem
              icon={IndianRupee}
              label="Maximum retail price"
              value={
                getValue(book, "mrp") === null
                  ? null
                  : formatCurrency(getValue(book, "mrp"))
              }
            />

            <DetailItem
              icon={CalendarDays}
              label="Publication date"
              value={formatDate(
                getValue(book, "publication_date", "publicationDate")
              )}
            />

            <DetailItem
              icon={Package}
              label="Print partner"
              value={getValue(book, "print_partner", "printPartner")}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-[#E9E1D7] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8F0D7] text-[#876916]">
              <CircleDollarSign size={20} />
            </div>

            <div>
              <h2 className="font-bold text-[#2B2B2B]">
                Royalty information
              </h2>
              <p className="mt-1 text-xs text-[#96877B]">
                Recorded payment details
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-xl bg-[#FAF7F2] p-4">
              <p className="text-xs text-[#82756B]">
                Author royalty per copy
              </p>

              <p className="mt-2 text-xl font-bold text-[#2B2B2B]">
                {getValue(
                  book,
                  "author_royalty_per_copy",
                  "authorRoyaltyPerCopy"
                ) === null
                  ? "—"
                  : formatCurrency(
                      getValue(
                        book,
                        "author_royalty_per_copy",
                        "authorRoyaltyPerCopy"
                      )
                    )}
              </p>
            </div>

            <div className="rounded-xl border border-[#E9E1D7] p-4">
              <p className="text-xs text-[#82756B]">
                Last royalty payout
              </p>

              <p className="mt-2 text-sm font-semibold text-[#2B2B2B]">
                {formatDate(lastPayoutDate)}
              </p>
            </div>

            <div className="rounded-xl border border-[#E8DDBF] bg-[#F8F0D7]/60 p-4">
              <p className="text-sm font-semibold text-[#655750]">
                Need help with your royalties?
              </p>

              <p className="mt-2 text-xs leading-5 text-[#82756B]">
                Contact the support team for questions about sales,
                royalty calculations, or pending payments.
              </p>

              <Link
                to="/author/tickets/new"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#6B2D3C] hover:underline"
              >
                <MessageCircle size={16} />
                Contact support
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-xl border border-[#E9E1D7] bg-[#F5EFE6]/60 px-5 py-4">
        <p className="text-xs leading-6 text-[#82756B]">
          Royalty figures and payment dates reflect the information currently
          recorded in your account. If a value is unavailable, contact support
          for clarification.
        </p>
      </div>
    </div>
  );
}