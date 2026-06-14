import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ArticleListItem } from "@/components/article/ArticleListItem";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const kw = await db.keyword.findUnique({ where: { slug } });
  if (!kw) return { title: "Keyword not found" };
  return {
    title: `Articles tagged "${kw.label}"`,
    description: `Browse all UNILAG Communication Review articles tagged with the keyword "${kw.label}".`,
  };
}

export default async function KeywordPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr ?? "1") || 1);
  const PAGE_SIZE = 20;

  const kw = await db.keyword.findUnique({ where: { slug } });
  if (!kw) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-semibold text-ink">
          Keyword not found
        </h1>
      </div>
    );
  }

  const [articles, total] = await Promise.all([
    db.article.findMany({
      where: {
        status: "PUBLISHED",
        keywords: { some: { keywordId: kw.id } },
      },
      orderBy: { publishedOnline: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        authors: { orderBy: { order: "asc" } },
        issue: { include: { volume: true } },
      },
    }),
    db.article.count({
      where: {
        status: "PUBLISHED",
        keywords: { some: { keywordId: kw.id } },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="mx-auto max-w-3xl">
      <nav aria-label="Breadcrumb" className="text-xs text-secondary">
        <Link href="/search" className="hover:text-maroon">
          Search
        </Link>
      </nav>

      <h1 className="mt-3 font-display text-3xl font-semibold text-ink">
        "{kw.label}"
      </h1>
      <p className="mt-1 text-sm text-secondary">
        {total} article{total !== 1 ? "s" : ""} tagged with this keyword
      </p>

      <section className="mt-8" aria-labelledby="articles-heading">
        <SectionLabel>
          <span id="articles-heading">Articles</span>
        </SectionLabel>
        <div className="mt-3">
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
          {articles.length === 0 && (
            <p className="text-sm text-secondary">No articles found.</p>
          )}
        </div>
      </section>

      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-8 flex items-center justify-between border-t border-hairline pt-5 text-sm"
        >
          {page > 1 ? (
            <Link
              href={`/keywords/${slug}?page=${page - 1}`}
              className="btn btn-secondary btn-sm"
            >
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-secondary">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/keywords/${slug}?page=${page + 1}`}
              className="btn btn-secondary btn-sm"
            >
              Next →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
