import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { db } from "@/lib/db";
import { articleTypeLabel } from "@/lib/constants";
import { getSettings } from "@/lib/settings";
import { highwireMeta, type ScholarArticle } from "@/lib/scholar";
import { scholarlyArticleJsonLd } from "@/lib/jsonld";
import {
  formatAPA,
  formatMLA,
  formatChicago,
  formatHarvard,
  type CitationData,
} from "@/lib/citations";
import { Badge } from "@/components/ui/Badge";
import { AuthorList } from "@/components/article/AuthorList";
import { CiteModal } from "@/components/article/CiteModal";
import { ShareLinks } from "@/components/article/ShareLinks";
import { ViewBeacon } from "@/components/article/ViewBeacon";
import { ArticleListItem } from "@/components/article/ArticleListItem";

export const dynamic = "force-dynamic";

async function getArticle(slug: string) {
  return db.article.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      issue: { include: { volume: true } },
      authors: { orderBy: { order: "asc" } },
      keywords: { include: { keyword: true } },
      references: { orderBy: { order: "asc" } },
      pdfFile: true,
    },
  });
}

type ArticleFull = NonNullable<Awaited<ReturnType<typeof getArticle>>>;

function toScholar(article: ArticleFull, baseUrl: string): ScholarArticle {
  return {
    title: article.title,
    authors: article.authors.map((a) => ({
      lastName: a.lastName,
      firstName: a.firstName,
    })),
    publishedOnline: article.publishedOnline,
    journalTitle: "UNILAG Communication Review",
    issn: "",
    volume: article.issue?.volume.number ?? null,
    issue: article.issue?.number ?? null,
    firstPage: article.firstPage,
    lastPage: article.lastPage,
    doi: article.doi,
    keywords: article.keywords.map((k) => k.keyword.label),
    abstractUrl: `${baseUrl}/articles/${article.slug}`,
    pdfUrl: `${baseUrl}/articles/${article.slug}/download.pdf`,
    language: "en",
  };
}

function toCitationData(article: ArticleFull, baseUrl: string): CitationData {
  return {
    title: article.title,
    authors: article.authors.map((a) => ({
      firstName: a.firstName,
      lastName: a.lastName,
    })),
    year: article.publishedOnline?.getUTCFullYear() ?? null,
    journalTitle: "UNILAG Communication Review",
    volume: article.issue?.volume.number ?? null,
    issue: article.issue?.number ?? null,
    firstPage: article.firstPage,
    lastPage: article.lastPage,
    doi: article.doi,
    url: `${baseUrl}/articles/${article.slug}`,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [article, settings] = await Promise.all([
    getArticle(slug),
    getSettings(),
  ]);
  if (!article) return { title: "Article not found" };

  const scholar = toScholar(article, settings.baseUrl);
  scholar.journalTitle = settings.journalTitle;
  scholar.issn = settings.issn;
  scholar.publisher = settings.publisher;

  return {
    title: article.title,
    description: article.abstract.slice(0, 300),
    // Highwire Press tags for Google Scholar — arrays render repeated tags
    other: highwireMeta(scholar),
    alternates: {
      canonical: `${settings.baseUrl}/articles/${article.slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.abstract.slice(0, 300),
      type: "article",
      url: `${settings.baseUrl}/articles/${article.slug}`,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [article, settings] = await Promise.all([
    getArticle(slug),
    getSettings(),
  ]);
  if (!article) notFound();

  const scholar = toScholar(article, settings.baseUrl);
  scholar.journalTitle = settings.journalTitle;
  scholar.issn = settings.issn;
  const jsonLd = scholarlyArticleJsonLd({
    ...scholar,
    abstract: article.abstract,
  });

  const citationData = toCitationData(article, settings.baseUrl);
  citationData.journalTitle = settings.journalTitle;
  const citations = {
    APA: formatAPA(citationData),
    MLA: formatMLA(citationData),
    Chicago: formatChicago(citationData),
    Harvard: formatHarvard(citationData),
  };

  const articleUrl = `${settings.baseUrl}/articles/${article.slug}`;

  // Related articles by shared keyword
  const keywordIds = article.keywords.map((k) => k.keywordId);
  const related =
    keywordIds.length > 0
      ? await db.article.findMany({
          where: {
            status: "PUBLISHED",
            id: { not: article.id },
            keywords: { some: { keywordId: { in: keywordIds } } },
          },
          orderBy: { publishedOnline: "desc" },
          take: 3,
          include: {
            authors: { orderBy: { order: "asc" } },
            issue: { include: { volume: true } },
          },
        })
      : [];

  return (
    <div className="mx-auto max-w-[760px]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ViewBeacon articleId={article.id} />

      {/* Breadcrumb */}
      {article.issue && (
        <nav aria-label="Breadcrumb" className="no-print text-xs text-secondary">
          <Link href="/archives" className="hover:text-maroon">
            Archives
          </Link>{" "}
          /{" "}
          <Link
            href={`/issues/${article.issue.volume.number}/${article.issue.number}`}
            className="hover:text-maroon"
          >
            Vol. {article.issue.volume.number}, No. {article.issue.number} (
            {article.issue.volume.year})
          </Link>
        </nav>
      )}

      {/* Header */}
      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="maroon">{articleTypeLabel(article.articleType)}</Badge>
          <Badge variant="gold">Open Access</Badge>
          <Badge variant="neutral">Peer-Reviewed</Badge>
        </div>

        <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
          {article.title}
        </h1>

        <div className="mt-5">
          <AuthorList
            authors={article.authors.map((a) => ({
              name: a.name,
              affiliation: a.affiliation,
              orcid: a.orcid,
              email: a.email,
              isCorresponding: a.isCorresponding,
            }))}
          />
        </div>

        {/* Meta rows */}
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 border-y border-hairline py-4 text-sm sm:grid-cols-3">
          {article.issue && (
            <div>
              <dt className="text-xs uppercase tracking-[0.1em] text-secondary">
                Volume / Issue
              </dt>
              <dd className="mt-0.5 text-ink">
                Vol. {article.issue.volume.number}, No. {article.issue.number} (
                {article.issue.volume.year})
              </dd>
            </div>
          )}
          {article.firstPage && (
            <div>
              <dt className="text-xs uppercase tracking-[0.1em] text-secondary">
                Pages
              </dt>
              <dd className="mt-0.5 text-ink">
                {article.firstPage}–{article.lastPage}
              </dd>
            </div>
          )}
          {article.publishedOnline && (
            <div>
              <dt className="text-xs uppercase tracking-[0.1em] text-secondary">
                Published online
              </dt>
              <dd className="mt-0.5 text-ink">
                {format(article.publishedOnline, "d MMMM yyyy")}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs uppercase tracking-[0.1em] text-secondary">
              Views
            </dt>
            <dd className="mt-0.5 text-ink">
              {article.viewsCount.toLocaleString()}
            </dd>
          </div>
          {(article.receivedDate || article.acceptedDate) && (
            <div>
              <dt className="text-xs uppercase tracking-[0.1em] text-secondary">
                History
              </dt>
              <dd className="mt-0.5 text-ink">
                {article.receivedDate &&
                  `Received ${format(article.receivedDate, "d MMM yyyy")}`}
                {article.receivedDate && article.acceptedDate && "; "}
                {article.acceptedDate &&
                  `accepted ${format(article.acceptedDate, "d MMM yyyy")}`}
              </dd>
            </div>
          )}
          {article.doi && (
            <div className="col-span-2 sm:col-span-1">
              <dt className="text-xs uppercase tracking-[0.1em] text-secondary">
                DOI
              </dt>
              <dd className="mt-0.5">
                <a
                  href={`https://doi.org/${article.doi}`}
                  className="print-doi break-all text-maroon underline decoration-hairline underline-offset-2 hover:decoration-maroon"
                >
                  {article.doi}
                </a>
              </dd>
            </div>
          )}
        </dl>

        {/* Actions */}
        <div className="no-print mt-5 flex flex-wrap items-center gap-3">
          {article.pdfFile && (
            <a
              href={`/articles/${article.slug}/download.pdf`}
              className="bg-maroon px-4 py-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-paper hover:bg-oxblood"
            >
              Download PDF
            </a>
          )}
          <CiteModal citations={citations} slug={article.slug} />
        </div>
      </header>

      {/* Abstract — must be visible without JS for Google Scholar */}
      <section aria-labelledby="abstract-heading" className="mt-10">
        <h2
          id="abstract-heading"
          className="section-label border-b border-hairline pb-2"
        >
          Abstract
        </h2>
        <div className="prose-journal mt-4">
          <p>{article.abstract}</p>
        </div>
      </section>

      {/* Keywords */}
      {article.keywords.length > 0 && (
        <section aria-labelledby="keywords-heading" className="mt-8">
          <h2 id="keywords-heading" className="sr-only">
            Keywords
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
              Keywords:
            </span>
            {article.keywords.map((k) => (
              <Link
                key={k.keywordId}
                href={`/keywords/${k.keyword.slug}`}
                className="border border-hairline px-2.5 py-1 text-xs text-secondary hover:border-maroon hover:text-maroon"
              >
                {k.keyword.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* License + citation string */}
      <section className="mt-8 border border-hairline bg-paper-dark p-4 text-sm">
        <p className="text-secondary">
          © The Author(s). Published by {settings.publisher}. This is an open
          access article distributed under the terms of the{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            className="text-maroon underline decoration-hairline underline-offset-2"
          >
            Creative Commons Attribution 4.0 License
          </a>
          .
        </p>
        <p className="mt-3 font-serif text-ink">
          <span className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
            Cite:{" "}
          </span>
          {citations.APA}
        </p>
      </section>

      {/* References */}
      {article.references.length > 0 && (
        <section aria-labelledby="references-heading" className="mt-10">
          <h2
            id="references-heading"
            className="section-label border-b border-hairline pb-2"
          >
            References
          </h2>
          <ol className="mt-4 list-decimal space-y-2 pl-6 font-serif text-[15px] leading-relaxed text-ink">
            {article.references.map((ref) => (
              <li key={ref.id} className="pl-1">
                {ref.text}{" "}
                <a
                  href={`https://scholar.google.com/scholar?q=${encodeURIComponent(ref.text.slice(0, 120))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-print whitespace-nowrap text-xs text-maroon hover:underline"
                >
                  [Google Scholar]
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Share */}
      <div className="no-print mt-10 border-t border-hairline pt-5">
        <ShareLinks url={articleUrl} title={article.title} />
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="no-print mt-12">
          <h2
            id="related-heading"
            className="section-label border-b border-hairline pb-2"
          >
            Related Articles
          </h2>
          <div>
            {related.map((a) => (
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
        </section>
      )}
    </div>
  );
}
