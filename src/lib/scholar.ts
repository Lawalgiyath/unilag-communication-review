/**
 * Highwire Press citation_* meta tags for Google Scholar.
 * Returned as the `other` field of a Next.js Metadata object — array values
 * render as repeated <meta> tags (required for citation_author).
 *
 * Per Google Scholar inclusion guidelines:
 * - citation_title, citation_author (repeated), citation_publication_date
 *   are mandatory.
 * - citation_pdf_url must be absolute and point into the same subdirectory
 *   tree as the abstract page; ours is /articles/[slug]/download.pdf which
 *   sits under /articles/[slug].
 */

export interface ScholarArticle {
  title: string;
  authors: { lastName: string; firstName: string }[];
  publishedOnline: Date | null;
  journalTitle: string;
  issn: string;
  volume: number | null;
  issue: number | null;
  firstPage: number | null;
  lastPage: number | null;
  doi: string | null;
  keywords: string[];
  abstractUrl: string; // absolute
  pdfUrl: string; // absolute, ends in .pdf
  language?: string;
  publisher?: string;
}

export function scholarPublicationDate(date: Date): string {
  // Y/M/D without zero padding, e.g. 2026/6/5
  return `${date.getUTCFullYear()}/${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}

export function highwireMeta(
  a: ScholarArticle
): Record<string, string | string[]> {
  const meta: Record<string, string | string[]> = {
    citation_title: a.title,
    citation_author: a.authors.map((x) => `${x.lastName}, ${x.firstName}`),
    citation_journal_title: a.journalTitle,
    citation_issn: a.issn,
    citation_abstract_html_url: a.abstractUrl,
    citation_pdf_url: a.pdfUrl,
  };
  if (a.publishedOnline) {
    meta.citation_publication_date = scholarPublicationDate(a.publishedOnline);
    meta.citation_online_date = scholarPublicationDate(a.publishedOnline);
  }
  if (a.volume !== null) meta.citation_volume = String(a.volume);
  if (a.issue !== null) meta.citation_issue = String(a.issue);
  if (a.firstPage !== null) meta.citation_firstpage = String(a.firstPage);
  if (a.lastPage !== null) meta.citation_lastpage = String(a.lastPage);
  if (a.doi) meta.citation_doi = a.doi;
  if (a.keywords.length > 0) meta.citation_keywords = a.keywords.join("; ");
  if (a.language) meta.citation_language = a.language;
  if (a.publisher) meta.citation_publisher = a.publisher;
  return meta;
}
