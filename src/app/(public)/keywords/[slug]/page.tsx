import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleListItem } from "@/components/article/ArticleListItem";
import { getArticlesByKeyword, DEMO_ARTICLES } from "@/lib/demo-data";

// Collect all unique keywords across all articles
const ALL_KEYWORDS = Array.from(
  new Map(
    DEMO_ARTICLES.flatMap((a) => a.keywords).map((k) => [k.slug, k])
  ).values()
);

export function generateStaticParams() {
  return ALL_KEYWORDS.map((k) => ({ slug: k.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const kw = ALL_KEYWORDS.find((k) => k.slug === slug);
  if (!kw) return { title: "Keyword not found" };
  return {
    title: `Articles tagged: ${kw.label}`,
    description: `Browse articles tagged with "${kw.label}" in UNILAG Communication Review.`,
  };
}

export default async function KeywordPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const kw = ALL_KEYWORDS.find((k) => k.slug === slug);
  if (!kw) notFound();

  const articles = getArticlesByKeyword(slug);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
        Keyword
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink sm:text-4xl">
        {kw.label}
      </h1>
      <p className="mt-2 text-sm text-secondary">
        {articles.length} article{articles.length === 1 ? "" : "s"}
      </p>

      <div className="mt-8">
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
              volume: a.volumeNumber,
              issue: a.issueNumber,
              year: a.volumeYear,
            }}
            showIssue
          />
        ))}
      </div>
    </div>
  );
}
