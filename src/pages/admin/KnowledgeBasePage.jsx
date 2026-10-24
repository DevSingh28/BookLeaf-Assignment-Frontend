import { useEffect, useMemo, useState } from "react";
import { knowledgeBaseApi, getErrorMessage } from "../../lib/api";
import {
  Search,
  BookOpen,
  Wallet,
  Barcode,
  Truck,
  Printer,
  Package,
  CircleHelp,
  ArrowUpRight,
  Clock3,
  CheckCircle2,
  LibraryBig,
} from "lucide-react";

const categoryIcons = {
  "Royalties & Payments": Wallet,
  "ISBN & Publishing": Barcode,
  Distribution: Truck,
  "Printing & Production": Printer,
  "Publishing Packages": Package,
  "Publishing Process": LibraryBig,
  "Support Guidelines": CircleHelp,
};

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState([]);
  const [allCategories, setAllCategories] = useState(["All"]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  useEffect(() => {
    let active = true;
    async function loadArticles() {
      setLoading(true);
      setError("");
      try {
        const response = await knowledgeBaseApi.getArticles({
          page,
          limit: 10,
          search: search.trim() || undefined,
          category: activeCategory === "All" ? undefined : activeCategory,
        });
        if (!active) return;
        const payload = response.data?.data ?? response.data ?? {};
        const rows = Array.isArray(payload) ? payload : payload.articles ?? payload.items ?? [];
        const mapped = rows.map((article) => {
          const category = article.category_name ?? article.category ?? "General";
          const rawContent = article.content ?? article.body ?? article.sections ?? [];
          const content = Array.isArray(rawContent)
            ? rawContent.map((item) =>
                typeof item === "string"
                  ? { heading: "", text: item }
                  : {
                      heading: item.heading ?? item.title ?? "",
                      text: item.text ?? item.content ?? item.body ?? "",
                    }
              )
            : [{ heading: "", text: String(rawContent ?? "") }];
          const tags = Array.isArray(article.tags)
            ? article.tags
            : typeof article.tags === "string"
            ? article.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
            : [];
          return {
            id: article.id ?? article.article_id,
            category,
            title: article.title ?? article.name ?? "Untitled article",
            description: article.description ?? article.summary ?? "",
            icon: categoryIcons[category] ?? BookOpen,
            readTime: article.read_time ?? article.readTime ?? "",
            tags,
            content,
          };
        });
        setArticles(mapped);
        setAllCategories((prev) => {
          const next = new Set(prev);
          mapped.forEach((article) => next.add(article.category));
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
        if (active) setError(getErrorMessage(err, "Unable to load knowledge base articles."));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadArticles();
    return () => {
      active = false;
    };
  }, [page, search, activeCategory]);

  const filteredArticles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return articles.filter((article) => {
      const matchesCategory =
        activeCategory === "All" || article.category === activeCategory;

      const searchableText = [
        article.title,
        article.description,
        article.category,
        ...article.tags,
        ...article.content.flatMap((item) => [item.heading, item.text]),
      ]
        .join(" ")
        .toLowerCase();

      return matchesCategory && searchableText.includes(query);
    });
  }, [articles, search, activeCategory]);

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
          Loading knowledge base…
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center gap-2 text-xs text-[#82756B]">
          <span>Admin</span>
          <span>/</span>
          <span>Resources</span>
        </div>

        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#2B2B2B] sm:text-4xl">
          Knowledge Base
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#82756B]">
          Find trusted publishing policies and support guidance to help
          authors with accurate, consistent answers.
        </p>
      </section>

      <section className="relative overflow-hidden rounded-2xl bg-[#6B2D3C] p-6 text-white sm:p-9">
        <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-8 h-48 w-48 rounded-full border border-white/10" />

        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-medium uppercase tracking-widest text-white/80">
            <BookOpen size={13} />
            BookLeaf reference library
          </span>

          <h2 className="mt-5 font-serif text-2xl font-semibold sm:text-3xl">
            Find the right answer.
          </h2>

          <p className="mt-2 text-sm leading-6 text-white/75">
            Search publishing policies, royalty rules, production timelines,
            and support procedures.
          </p>

          <div className="relative mt-6">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#82756B]"
            />

            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
                setSelectedArticle(null);
              }}
              placeholder="Search royalties, ISBN, printing, distribution..."
              className="h-12 w-full rounded-xl border border-white/20 bg-white pl-11 pr-4 text-sm text-[#2B2B2B] outline-none placeholder:text-[#82756B] focus:ring-2 focus:ring-[#C9A227]"
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-[#2B2B2B]/10 bg-white p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#6B2D3C]/10 text-[#6B2D3C]">
            <BookOpen size={20} />
          </div>

          <div>
            <p className="text-2xl font-semibold text-[#2B2B2B]">
              {pagination.total ?? articles.length}
            </p>
            <p className="text-xs text-[#82756B]">Reference articles</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-[#2B2B2B]/10 bg-white p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#C9A227]/15 text-[#8A6B10]">
            <LibraryBig size={20} />
          </div>

          <div>
            <p className="text-2xl font-semibold text-[#2B2B2B]">
              {allCategories.length - 1}
            </p>
            <p className="text-xs text-[#82756B]">Policy categories</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-[#2B2B2B]/10 bg-white p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#3D6B4F]/10 text-[#3D6B4F]">
            <CheckCircle2 size={20} />
          </div>

          <div>
            <p className="text-sm font-semibold text-[#2B2B2B]">
              Curated guidance
            </p>
            <p className="mt-1 text-xs text-[#82756B]">
              Use verified records for case-specific answers.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#2B2B2B]">
              Browse by topic
            </h2>
            <p className="mt-1 text-xs text-[#82756B]">
              Select a category or open an article.
            </p>
          </div>

          <p className="text-xs text-[#82756B]">
            {filteredArticles.length} articles found
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {allCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => {
                setActiveCategory(category);
                setPage(1);
                setSelectedArticle(null);
              }}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition ${
                activeCategory === category
                  ? "border-[#6B2D3C] bg-[#6B2D3C] text-white"
                  : "border-[#2B2B2B]/10 bg-white text-[#82756B] hover:border-[#6B2D3C]/40 hover:text-[#6B2D3C]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {selectedArticle && (
          <article className="rounded-2xl border border-[#C9A227]/30 bg-white p-6 sm:p-8">
            <button
              type="button"
              onClick={() => setSelectedArticle(null)}
              className="mb-5 text-xs font-medium text-[#6B2D3C] hover:underline"
            >
              ← Back to articles
            </button>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F5EFE6] text-[#6B2D3C]">
                <selectedArticle.icon size={22} />
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8A6B10]">
                  {selectedArticle.category}
                </span>

                <h2 className="mt-1 font-serif text-2xl font-semibold text-[#2B2B2B]">
                  {selectedArticle.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#82756B]">
                  {selectedArticle.description}
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-6">
              {selectedArticle.content.map((section, index) => (
                <div
                  key={`${section.heading}-${index}`}
                  className="border-t border-[#2B2B2B]/10 pt-5"
                >
                  <h3 className="text-sm font-semibold text-[#2B2B2B]">
                    {section.heading}
                  </h3>

                  <p className="mt-2 text-sm leading-7 text-[#655B54]">
                    {section.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-7 flex items-start gap-3 rounded-xl bg-[#FAF7F2] p-4">
              <CircleHelp
                size={17}
                className="mt-0.5 shrink-0 text-[#6B2D3C]"
              />

              <p className="text-xs leading-5 text-[#82756B]">
                Use these guidelines alongside the actual author, book,
                ticket, and payment records. Do not promise an outcome or
                timeline that has not been verified.
              </p>
            </div>
          </article>
        )}

        {!selectedArticle && (
          <>
            {filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredArticles.map((article) => {
                  const Icon = article.icon;

                  return (
                    <button
                      key={article.id}
                      type="button"
                      onClick={() => setSelectedArticle(article)}
                      className="group flex h-full flex-col rounded-2xl border border-[#2B2B2B]/10 bg-white p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-[#6B2D3C]/30 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5EFE6] text-[#6B2D3C] transition group-hover:bg-[#6B2D3C] group-hover:text-white">
                          <Icon size={20} />
                        </div>

                        <ArrowUpRight
                          size={17}
                          className="text-[#82756B] transition group-hover:text-[#6B2D3C]"
                        />
                      </div>

                      <p className="mt-5 text-[10px] font-semibold uppercase tracking-wider text-[#8A6B10]">
                        {article.category}
                      </p>

                      <h3 className="mt-2 font-serif text-lg font-semibold leading-snug text-[#2B2B2B]">
                        {article.title}
                      </h3>

                      <p className="mt-2 flex-1 text-xs leading-6 text-[#82756B]">
                        {article.description}
                      </p>

                      <div className="mt-5 flex items-center justify-between border-t border-[#2B2B2B]/10 pt-4">
                        <span className="flex items-center gap-1.5 text-[10px] text-[#82756B]">
                          <Clock3 size={12} />
                          {article.readTime}
                        </span>

                        <span className="text-xs font-semibold text-[#6B2D3C]">
                          Read article
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : !loading ? (
              <div className="rounded-2xl border border-[#2B2B2B]/10 bg-white px-6 py-16 text-center">
                <Search size={25} className="mx-auto text-[#82756B]" />

                <h3 className="mt-4 font-serif text-lg font-semibold text-[#2B2B2B]">
                  No articles found
                </h3>

                <p className="mt-2 text-sm text-[#82756B]">
                  Try another search term or select a different category.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setActiveCategory("All");
                    setPage(1);
                  }}
                  className="mt-4 text-xs font-semibold text-[#6B2D3C] hover:underline"
                >
                  Reset search
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-[#C9A227]/30 bg-[#C9A227]/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#8A6B10]">
            <BookOpen size={19} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#2B2B2B]">
              Knowledge-grounded AI responses
            </h3>

            <p className="mt-1 max-w-2xl text-xs leading-6 text-[#82756B]">
              These articles can serve as reference material for generating
              support drafts. The AI should use relevant policies together
              with verified ticket data, and admins must review drafts before
              sending them.
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded-full border border-[#C9A227]/30 bg-white px-3 py-1.5 text-[10px] font-medium text-[#8A6B10]">
          Reference library
        </span>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#2B2B2B]/10 bg-white px-4 py-3">
        <p className="text-xs text-[#82756B]">
          Page {pagination.page ?? page} of {Math.max(1, pagination.totalPages ?? 1)} · {pagination.total ?? articles.length} articles
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