import type { ScholarArticle } from "./scholar";

/** JSON-LD ScholarlyArticle structured data for regular Google rich results. */
export function scholarlyArticleJsonLd(
  a: ScholarArticle & { abstract: string }
): object {
  return {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: a.title,
    name: a.title,
    abstract: a.abstract,
    author: a.authors.map((x) => ({
      "@type": "Person",
      name: `${x.firstName} ${x.lastName}`,
      familyName: x.lastName,
      givenName: x.firstName,
    })),
    datePublished: a.publishedOnline
      ? a.publishedOnline.toISOString().slice(0, 10)
      : undefined,
    isPartOf: {
      "@type": "PublicationIssue",
      issueNumber: a.issue ?? undefined,
      isPartOf: {
        "@type": "PublicationVolume",
        volumeNumber: a.volume ?? undefined,
        isPartOf: {
          "@type": "Periodical",
          name: a.journalTitle,
          issn: a.issn,
        },
      },
    },
    pageStart: a.firstPage ?? undefined,
    pageEnd: a.lastPage ?? undefined,
    sameAs: a.doi ? `https://doi.org/${a.doi}` : undefined,
    url: a.abstractUrl,
    keywords: a.keywords.join(", ") || undefined,
    isAccessibleForFree: true,
    license: "https://creativecommons.org/licenses/by/4.0/",
  };
}
