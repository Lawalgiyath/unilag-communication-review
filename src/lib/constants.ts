/**
 * Journal metadata defaults. Values stored in the Setting table override these
 * at runtime (see src/lib/settings.ts); these constants are the canonical
 * fallbacks so the site renders correctly even on a fresh database.
 */
export const JOURNAL = {
  title: "UNILAG Communication Review",
  shortTitle: "Communication Review",
  publisher:
    "Faculty of Communication and Media Studies, University of Lagos",
  publisherShort: "University of Lagos",
  address: "Akoka-Lagos, Nigeria",
  issn: "1597-0299",
  eissn: "3027-1851",
  contactEmail: "unilagcommunicationreview@gmail.com",
  tagline: "Where Excellence Meets Impact",
  feeNaira: "30,000",
  doiPrefix: "10.5281/zenodo",
} as const;

export function siteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  // Allow localhost only when explicitly in local development mode
  if (
    process.env.NODE_ENV === "development" &&
    envUrl &&
    (envUrl.includes("localhost") || envUrl.includes("127.0.0.1"))
  ) {
    return envUrl.replace(/\/+$/, "");
  }
  if (
    envUrl &&
    !envUrl.includes("localhost") &&
    !envUrl.includes("127.0.0.1")
  ) {
    return envUrl.replace(/\/+$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(
      /\/+$/,
      ""
    );
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/+$/, "");
  }
  return "https://unilag-communication-review.vercel.app";
}

export const ARTICLE_TYPES = {
  RESEARCH_ARTICLE: "Research Article",
  REVIEW_ARTICLE: "Review Article",
  COMMENTARY: "Commentary",
  BOOK_REVIEW: "Book Review",
} as const;

export type ArticleType = keyof typeof ARTICLE_TYPES;

export function articleTypeLabel(type: string): string {
  return ARTICLE_TYPES[type as ArticleType] ?? "Article";
}
