import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { JOURNAL, articleTypeLabel } from "@/lib/constants";
import { siteUrl } from "@/lib/constants";
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
import { ArticleListItem } from "@/components/article/ArticleListItem";
import { ArticleBody } from "@/components/article/ArticleBody";
import {
  getArticleBySlug,
  getRelatedArticles,
  DEMO_ARTICLES,
  type DemoArticle,
} from "@/lib/demo-data";
import { getLiveArticle } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return DEMO_ARTICLES.map((a) => ({ slug: a.slug }));
}

function toScholar(article: DemoArticle, baseUrl: string): ScholarArticle {
  return {
    title: article.title,
    authors: article.authors.map((a) => ({
      lastName: a.lastName,
      firstName: a.firstName,
    })),
    publishedOnline: article.publishedOnline,
    journalTitle: JOURNAL.title,
    issn: JOURNAL.issn,
    publisher: JOURNAL.publisher,
    volume: article.volumeNumber,
    issue: article.issueNumber,
    firstPage: article.firstPage,
    lastPage: article.lastPage,
    doi: article.doi,
    keywords: article.keywords.map((k) => k.label),
    abstractUrl: `${baseUrl}/articles/${article.slug}`,
    pdfUrl: `${baseUrl}/articles/${article.slug}/download.pdf`,
    language: "en",
  };
}

function toCitationData(article: DemoArticle, baseUrl: string): CitationData {
  return {
    title: article.title,
    authors: article.authors.map((a) => ({
      firstName: a.firstName,
      lastName: a.lastName,
    })),
    year: article.publishedOnline.getUTCFullYear(),
    journalTitle: JOURNAL.title,
    volume: article.volumeNumber,
    issue: article.issueNumber,
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
  const article = await getLiveArticle(slug);
  if (!article) return { title: "Article not found" };
  const baseUrl = siteUrl();
  const scholar = toScholar(article, baseUrl);
  return {
    title: article.title,
    description: article.abstract.slice(0, 300),
    other: highwireMeta(scholar),
    alternates: { canonical: `${baseUrl}/articles/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.abstract.slice(0, 300),
      type: "article",
      url: `${baseUrl}/articles/${article.slug}`,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getLiveArticle(slug);
  if (!article) notFound();

  const baseUrl = siteUrl();
  const scholar = toScholar(article, baseUrl);
  const jsonLd = scholarlyArticleJsonLd({ ...scholar, abstract: article.abstract });
  const citationData = toCitationData(article, baseUrl);
  const citations = {
    APA: formatAPA(citationData),
    MLA: formatMLA(citationData),
    Chicago: formatChicago(citationData),
    Harvard: formatHarvard(citationData),
  };
  const articleUrl = `${baseUrl}/articles/${article.slug}`;
  const related = getRelatedArticles(article, 3);

  return (
    <div className="mx-auto max-w-[760px]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="no-print text-xs text-secondary">
        <Link href="/archives" className="hover:text-maroon">Archives</Link>{" "}
        /{" "}
        <Link
          href={`/issues/${article.volumeNumber}/${article.issueNumber}`}
          className="hover:text-maroon"
        >
          Vol. {article.volumeNumber}, No. {article.issueNumber} ({article.volumeYear})
        </Link>
      </nav>

      {/* Header */}
      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="gold">Special Issue</Badge>
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
          <div>
            <dt className="text-xs uppercase tracking-[0.1em] text-secondary">Volume / Issue</dt>
            <dd className="mt-0.5 text-ink">
              Vol. {article.volumeNumber}, No. {article.issueNumber} ({article.volumeYear})
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.1em] text-secondary">Pages</dt>
            <dd className="mt-0.5 text-ink">{article.firstPage}–{article.lastPage}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.1em] text-secondary">Published online</dt>
            <dd className="mt-0.5 text-ink">{format(article.publishedOnline, "d MMMM yyyy")}</dd>
          </div>
          {article.doi && (
            <div className="col-span-2 sm:col-span-1">
              <dt className="text-xs uppercase tracking-[0.1em] text-secondary">DOI</dt>
              <dd className="mt-0.5">
                <a
                  href={`https://doi.org/${article.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
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
          <a
            href={`/articles/${article.slug}/download.pdf`}
            download={`${article.slug}.pdf`}
            className="inline-flex items-center gap-2 bg-maroon px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-paper hover:bg-oxblood transition-colors shadow-sm"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download PDF
          </a>
          <CiteModal citations={citations} slug={article.slug} />
        </div>
      </header>

      {/* Abstract */}
      <section aria-labelledby="abstract-heading" className="mt-10">
        <h2 id="abstract-heading" className="section-label border-b border-hairline pb-2">
          Abstract
        </h2>
        <div className="prose-journal mt-4">
          <p>{article.abstract}</p>
        </div>
      </section>

      {/* Keywords */}
      {article.keywords.length > 0 && (
        <section aria-labelledby="keywords-heading" className="mt-8">
          <h2 id="keywords-heading" className="sr-only">Keywords</h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
              Keywords:
            </span>
            {article.keywords.map((k) => (
              <Link
                key={k.slug || k.label}
                href={`/search?q=${encodeURIComponent(k.label || k.slug)}`}
                className="border border-hairline px-2.5 py-1 text-xs text-secondary hover:border-maroon hover:text-maroon"
              >
                {k.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* License + citation string */}
      <section className="mt-8 border border-hairline bg-paper-dark p-4 text-sm">
        <p className="text-secondary">
          © The Author(s). Published by {JOURNAL.publisher}. This is an open
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

      {/* Full-Text Article Body with Tables and Figures */}
      {article.bodyParagraphs && article.bodyParagraphs.length > 0 && (
        <section aria-labelledby="fulltext-heading" className="mt-12">
          <h2 id="fulltext-heading" className="section-label border-b border-hairline pb-2">
            Full Article
          </h2>
          <div className="mt-6">
            <ArticleBody paragraphs={article.bodyParagraphs} />
          </div>
        </section>
      )}

      {/* References */}
      {article.references.length > 0 && (
        <section aria-labelledby="references-heading" className="mt-12">
          <h2 id="references-heading" className="section-label border-b border-hairline pb-2">
            References
          </h2>
          <ol className="mt-4 list-decimal space-y-2 pl-6 font-serif text-[15px] leading-relaxed text-ink">
            {article.references.map((ref, i) => (
              <li key={i} className="pl-1">
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
          <h2 id="related-heading" className="section-label border-b border-hairline pb-2">
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
                  volume: a.volumeNumber,
                  issue: a.issueNumber,
                  year: a.volumeYear,
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
