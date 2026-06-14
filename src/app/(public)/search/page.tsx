import type { Metadata } from "next";
import { ArticleListItem } from "@/components/article/ArticleListItem";
import { searchArticles } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "Search",
  description: "Search articles in UNILAG Communication Review.",
};

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? searchArticles(query) : [];

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
        Search
      </h1>

      <form method="get" action="/search" className="mt-6">
        <div className="flex gap-2">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search articles, authors, keywords…"
            className="flex-1 border border-hairline bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-secondary focus:border-maroon focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            className="bg-maroon px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-paper hover:bg-oxblood"
          >
            Search
          </button>
        </div>
      </form>

      {query && (
        <div className="mt-8">
          <p className="mb-4 text-sm text-secondary">
            {results.length === 0
              ? `No results for "${query}"`
              : `${results.length} result${results.length === 1 ? "" : "s"} for "${query}"`}
          </p>
          {results.map((a) => (
            <ArticleListItem
              key={a.id}
              article={{
                slug: a.slug,
                title: a.title,
                articleType: a.articleType,
                authorNames: a.authors.map((x) => x.name),
                firstPage: a.firstPage,
                lastPage: a.lastPage,
                volume: a.volumeNumber,
                issue: a.issueNumber,
                year: a.volumeYear,
              }}
              showIssue
            />
          ))}
        </div>
      )}
    </div>
  );
}
