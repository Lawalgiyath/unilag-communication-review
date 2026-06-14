import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { searchArticles } from "@/lib/search";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ArticleListItem } from "@/components/article/ArticleListItem";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search the UNILAG Communication Review article database by keyword, author, volume, or year.",
};

const PAGE_SIZE = 20;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    volume?: string;
    year?: string;
    keyword?: string;
    author?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const volumeNum = Number(sp.volume) || undefined;
  const yearNum = Number(sp.year) || undefined;
  const keywordSlug = sp.keyword?.trim() || undefined;
  const authorStr = sp.author?.trim() || undefined;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const hasFilters = q || volumeNum || yearNum || keywordSlug || authorStr;

  let articleIds: string[] = [];
  let total = 0;

  if (hasFilters) {
    const result = await searchArticles({
      query: q || undefined,
      volume: volumeNum,
      year: yearNum,
      keyword: keywordSlug,
      author: authorStr,
      page,
      pageSize: PAGE_SIZE,
    });
    articleIds = result.articleIds;
    total = result.total;
  }

  const articles =
    articleIds.length > 0
      ? await db.article.findMany({
          where: { id: { in: articleIds } },
          include: {
            authors: { orderBy: { order: "asc" } },
            issue: { include: { volume: true } },
          },
        }).then((rows) =>
          // preserve search relevance order
          articleIds.map((id) => rows.find((a) => a.id === id)!).filter(Boolean)
        )
      : [];

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Volume list for filter dropdown
  const volumes = await db.volume.findMany({ orderBy: { number: "desc" } });

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { q, volume: sp.volume, year: sp.year, keyword: sp.keyword, author: sp.author, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    return `/search?${params.toString()}`;
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
        Search
      </h1>

      {/* Search form */}
      <form
        method="GET"
        action="/search"
        className="mt-6 border border-hairline bg-paper-dark p-5"
        role="search"
        aria-label="Article search"
      >
        <div className="flex gap-2">
          <div className="field flex-1">
            <label htmlFor="search-q" className="field-label">
              Keywords / Title / Abstract
            </label>
            <input
              id="search-q"
              type="text"
              name="q"
              defaultValue={q}
              placeholder="e.g. media framing, agenda setting…"
              autoComplete="off"
            />
          </div>
        </div>

        <details className="mt-4">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.1em] text-maroon hover:text-oxblood">
            Advanced filters ▸
          </summary>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="field">
              <label htmlFor="search-volume" className="field-label">Volume</label>
              <select id="search-volume" name="volume" defaultValue={sp.volume ?? ""}>
                <option value="">All volumes</option>
                {volumes.map((v) => (
                  <option key={v.id} value={String(v.number)}>
                    Vol. {v.number} ({v.year})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="search-year" className="field-label">Year</label>
              <input
                id="search-year"
                type="number"
                name="year"
                defaultValue={sp.year ?? ""}
                placeholder="e.g. 2023"
                min={1990}
                max={new Date().getFullYear()}
              />
            </div>
            <div className="field">
              <label htmlFor="search-author" className="field-label">Author</label>
              <input
                id="search-author"
                type="text"
                name="author"
                defaultValue={sp.author ?? ""}
                placeholder="Last name"
              />
            </div>
            <div className="field">
              <label htmlFor="search-keyword" className="field-label">Keyword slug</label>
              <input
                id="search-keyword"
                type="text"
                name="keyword"
                defaultValue={sp.keyword ?? ""}
                placeholder="e.g. media-framing"
              />
            </div>
          </div>
        </details>

        <div className="mt-4 flex gap-2">
          <button type="submit" className="btn btn-primary">
            Search
          </button>
          {hasFilters && (
            <Link href="/search" className="btn btn-secondary">
              Clear
            </Link>
          )}
        </div>
      </form>

      {/* Results */}
      {hasFilters && (
        <section className="mt-8" aria-live="polite" aria-atomic="true">
          <SectionLabel>
            {total === 0
              ? "No results found"
              : `${total} result${total !== 1 ? "s" : ""}${q ? ` for "${q}"` : ""}`}
          </SectionLabel>

          <div className="mt-4">
            {articles.map((a) => (
              <ArticleListItem
                key={a.id}
                article={{
                  slug: a.slug,
                  title: a.title,
                  articleType: a.articleType,
                  authorNames: a.authors.map((x) => x.name),
                  firstPage: a.firstPage,
                  lastPage: a.lastPage,
                  volume: a.issue?.volume.number,
                  issue: a.issue?.number,
                  year: a.issue?.volume.year,
                }}
                showIssue
              />
            ))}
          </div>

          {totalPages > 1 && (
            <nav
              aria-label="Pagination"
              className="mt-8 flex items-center justify-between border-t border-hairline pt-5 text-sm"
            >
              {page > 1 ? (
                <Link href={buildUrl({ page: String(page - 1) })} className="btn btn-secondary btn-sm">
                  ← Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="text-secondary">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link href={buildUrl({ page: String(page + 1) })} className="btn btn-secondary btn-sm">
                  Next →
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </section>
      )}

      {!hasFilters && (
        <p className="mt-8 text-sm text-secondary">
          Enter a search term above to find articles in the UNILAG Communication
          Review. You can search by title, abstract, author name, keyword, or
          volume.
        </p>
      )}
    </div>
  );
}
