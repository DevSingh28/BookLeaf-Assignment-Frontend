import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  BookOpen,
  LibraryBig,
  CheckCircle2,
  Clock3,
  CircleDollarSign,
  ArrowUpDown,
  ArrowUpRight,
  SlidersHorizontal,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import StatCard from "../../components/dashboard/StatCard";
import {
  booksApi,
  dashboardApi,
  getErrorMessage,
} from "../../lib/api";

const PAGE_SIZE = 10;

const statusStyles = {
  Published:
    "border-[#C9DEC9] bg-[#EAF3E9] text-[#3D6B4F]",
  "In Production":
    "border-[#E8DDBF] bg-[#F8F0D7] text-[#876916]",
  Draft:
    "border-[#E9E1D7] bg-[#F5EFE6] text-[#82756B]",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "Not published";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not published";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
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

function getBookStatus(book) {
  return formatStatus(
    book.production_status ?? book.productionStatus ?? book.status
  );
}

function getBookRoyalties(book) {
  return Number(
    book.total_royalty_earned ??
      book.totalRoyaltyEarned ??
      book.royaltiesEarned ??
      0
  );
}

function getCopiesSold(book) {
  return Number(
    book.total_copies_sold ??
      book.totalCopiesSold ??
      book.copiesSold ??
      0
  );
}

function getPublishedDate(book) {
  return (
    book.publication_date ??
    book.publicationDate ??
    book.publishedDate ??
    null
  );
}

function getBookId(book) {
  return book.id ?? book.external_id ?? book.externalId;
}

function getStatusStyle(status) {
  return (
    statusStyles[status] ??
    "border-[#E9E1D7] bg-[#F5EFE6] text-[#82756B]"
  );
}

export default function BooksPage() {
  const [books, setBooks] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Avoid making an API request for every keystroke.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  // Reset pagination when filters change.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await booksApi.getBooks({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        status:
          statusFilter === "All" ? undefined : statusFilter,
      });

      const payload = response.data?.data ?? response.data ?? {};
      const fetchedBooks = Array.isArray(payload.books)
        ? payload.books
        : [];

      setBooks(fetchedBooks);

      setPagination(
        payload.pagination ?? {
          page,
          limit: PAGE_SIZE,
          total: fetchedBooks.length,
          totalPages: fetchedBooks.length > 0 ? 1 : 0,
        }
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Unable to load your books. Please try again."
        )
      );
      setBooks([]);
      setPagination({
        page: 1,
        limit: PAGE_SIZE,
        total: 0,
        totalPages: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Dashboard API provides account-wide totals. The books endpoint
  // currently returns paginated records, so those records alone
  // should not be used to calculate account-wide statistics.
  useEffect(() => {
    let cancelled = false;

    async function fetchDashboardStats() {
      try {
        const response = await dashboardApi.getDashboard();
        const payload = response.data?.data ?? response.data ?? {};

        if (!cancelled) {
          setDashboardStats(payload.stats ?? null);
        }
      } catch {
        // The books page remains usable if dashboard statistics fail.
        if (!cancelled) {
          setDashboardStats(null);
        }
      }
    }

    fetchDashboardStats();

    return () => {
      cancelled = true;
    };
  }, []);

  const sortedBooks = useMemo(() => {
    const result = [...books];

    if (sortOrder === "title") {
      result.sort((a, b) =>
        String(a.title ?? "").localeCompare(String(b.title ?? ""))
      );
    }

    return result;
  }, [books, sortOrder]);

  const stats = useMemo(() => {
    const productionCount = books.filter((book) =>
      ["in production", "in progress", "production"].includes(
        String(
          book.production_status ??
            book.productionStatus ??
            book.status ??
            ""
        )
          .trim()
          .toLowerCase()
      )
    ).length;

    return {
      total:
        dashboardStats?.totalBooks ??
        dashboardStats?.total_books ??
        pagination.total,
      published:
        dashboardStats?.publishedBooks ??
        dashboardStats?.published_books ??
        null,
      inProduction: productionCount,
      royalties:
        dashboardStats?.totalRoyalties ??
        dashboardStats?.total_royalties ??
        null,
    };
  }, [books, dashboardStats, pagination.total]);

  const totalPages = Number(pagination.totalPages) || 0;

  function handleClearFilters() {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("All");
    setPage(1);
  }

  return (
    <div className="space-y-8">
      {/* Page introduction */}
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-[#82756B]">
            <LibraryBig size={16} />
            Your library
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#2B2B2B]">
            My Books
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-[#82756B]">
            View your book details, publishing progress, sales,
            and royalty information.
          </p>
        </div>

        <Link
          to="/author/tickets/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6B2D3C] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#542330]"
        >
          <Plus size={17} />
          Get publishing support
        </Link>
      </section>

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total books"
          value={stats.total}
          description="Registered titles"
          icon={LibraryBig}
          tone="burgundy"
        />

        <StatCard
          title="Published"
          value={stats.published ?? "—"}
          description="Available titles"
          icon={CheckCircle2}
          tone="green"
        />

        <StatCard
          title="In production"
          value={stats.inProduction}
          description="On this page"
          icon={Clock3}
          tone="gold"
        />

        <StatCard
          title="Royalties earned"
          value={
            stats.royalties === null
              ? "—"
              : formatCurrency(stats.royalties)
          }
          description="Recorded earnings"
          icon={CircleDollarSign}
          tone="cream"
        />
      </section>

      {/* Books list */}
      <section className="overflow-hidden rounded-2xl border border-[#E9E1D7] bg-white shadow-sm">
        {/* Filters */}
        <div className="border-b border-[#F0E8DF] p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-bold text-[#2B2B2B]">
                Your collection
              </h2>

              <p className="mt-1 text-xs text-[#96877B]">
                {isLoading
                  ? "Loading books..."
                  : `${pagination.total} ${
                      pagination.total === 1 ? "book" : "books"
                    } found`}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex items-center gap-2 rounded-xl border border-[#E9E1D7] px-3.5 py-2.5 focus-within:border-[#6B2D3C]">
                <Search
                  size={17}
                  className="shrink-0 text-[#96877B]"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search books..."
                  aria-label="Search books"
                  className="min-w-0 bg-transparent text-sm outline-none placeholder:text-[#A89B90] sm:w-44"
                />
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-[#E9E1D7] px-3">
                <SlidersHorizontal
                  size={16}
                  className="text-[#82756B]"
                />

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                  aria-label="Filter by publishing status"
                  className="min-w-0 bg-transparent py-2.5 text-sm text-[#655750] outline-none"
                >
                  <option value="All">All statuses</option>
                  <option value="Published">Published</option>
                  <option value="In Production">In Production</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSortOrder((previous) =>
                    previous === "newest" ? "title" : "newest"
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E9E1D7] px-3.5 py-2.5 text-sm font-medium text-[#655750] transition hover:bg-[#FAF7F2]"
              >
                <ArrowUpDown size={16} />
                {sortOrder === "newest" ? "Newest" : "Title"}
              </button>

              <button
                type="button"
                onClick={fetchBooks}
                disabled={isLoading}
                aria-label="Refresh books"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E9E1D7] px-3.5 py-2.5 text-sm font-medium text-[#655750] transition hover:bg-[#FAF7F2] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={isLoading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div
            role="alert"
            className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <p>{error}</p>

            <button
              type="button"
              onClick={fetchBooks}
              className="mt-2 font-semibold underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        )}

        {/* Responsive table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] border-collapse text-left">
            <thead>
              <tr className="bg-[#FAF7F2]">
                {[
                  "Book",
                  "ISBN",
                  "Genre",
                  "Published",
                  "Status",
                  "MRP",
                  "Copies sold",
                  "Royalties",
                  "",
                ].map((heading, index) => (
                  <th
                    key={`${heading}-${index}`}
                    className="whitespace-nowrap px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-[#82756B]"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F3EDE6]">
              {isLoading &&
                books.length === 0 &&
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={`loading-${index}`}>
                    <td colSpan={9} className="px-5 py-5">
                      <div className="h-5 animate-pulse rounded-lg bg-[#F5EFE6]" />
                    </td>
                  </tr>
                ))}

              {!isLoading &&
                !error &&
                sortedBooks.map((book) => {
                  const id = getBookId(book);
                  const status = getBookStatus(book);

                  return (
                    <tr
                      key={id}
                      className="transition hover:bg-[#FAF7F2]/60"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F5EFE6] text-[#6B2D3C]">
                            <BookOpen size={20} />
                          </div>

                          <div>
                            <p className="max-w-[180px] truncate text-sm font-semibold text-[#2B2B2B]">
                              {book.title || "Untitled book"}
                            </p>

                            <p className="mt-1 text-[10px] text-[#96877B]">
                              {id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs text-[#655750]">
                        {book.isbn || "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-[#655750]">
                        {book.genre || "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-[#655750]">
                        {formatDate(getPublishedDate(book))}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusStyle(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-[#2B2B2B]">
                        {formatCurrency(book.mrp)}
                      </td>

                      <td className="px-5 py-4 text-sm text-[#655750]">
                        {getCopiesSold(book).toLocaleString("en-IN")}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-[#3D6B4F]">
                        {formatCurrency(getBookRoyalties(book))}
                      </td>

                      <td className="px-5 py-4">
                        {id ? (
                          <Link
                            to={`/author/books/${id}`}
                            aria-label={`View ${book.title || "book"}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E9E1D7] text-[#6B2D3C] transition hover:border-[#6B2D3C] hover:bg-[#F5EFE6]"
                          >
                            <ArrowUpRight size={17} />
                          </Link>
                        ) : (
                          <span className="text-xs text-[#96877B]">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

              {!isLoading && !error && sortedBooks.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5EFE6] text-[#6B2D3C]">
                      <BookOpen size={22} />
                    </div>

                    <h3 className="mt-4 font-semibold text-[#2B2B2B]">
                      No books found
                    </h3>

                    <p className="mt-1 text-sm text-[#82756B]">
                      Try changing your search or filters.
                    </p>

                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="mt-4 text-sm font-semibold text-[#6B2D3C] hover:underline"
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!error && pagination.total > 0 && (
          <div className="flex flex-col gap-3 border-t border-[#F0E8DF] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-[#96877B]">
              Page {page} of {Math.max(totalPages, 1)} ·{" "}
              {pagination.total} total books
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={isLoading || page <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-[#E9E1D7] px-3 py-2 text-sm text-[#655750] transition hover:bg-[#FAF7F2] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button
                type="button"
                onClick={() =>
                  setPage((current) =>
                    Math.min(totalPages, current + 1)
                  )
                }
                disabled={
                  isLoading || totalPages === 0 || page >= totalPages
                }
                className="inline-flex items-center gap-1 rounded-lg border border-[#E9E1D7] px-3 py-2 text-sm text-[#655750] transition hover:bg-[#FAF7F2] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}