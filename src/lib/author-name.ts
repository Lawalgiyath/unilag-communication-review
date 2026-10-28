/**
 * Display-name formatting for authors in articles and citations.
 *
 * Per journal resolution and international indexing standards (Crossref, Google Scholar, Scopus):
 * All academic and honorific titles (e.g., "Prof.", "Dr.", "Mr.", "Mrs.", "Emeritus Prof.")
 * and post-nominal degree abbreviations (e.g., "Ph.D.", "D.Phil.") are omitted from article
 * author listings and citation indexes to ensure citations resolve accurately to authors' surnames.
 */

export interface AuthorNameParts {
  first: string;
  last: string;
  title?: string | null;
}

const HONORIFIC_PREFIX_REGEX =
  /^(emeritus\s+prof(essor)?|prof(essor)?|dr\.?\s*\(mrs\.?\)|dr|rev(erend)?|assoc(\.|\s+)?prof(essor)?|asst(\.|\s+)?prof(essor)?|mr|mrs|ms|engr|barr(ister)?)\.?\s+/i;

const DOCTORATE_SUFFIX_REGEX =
  /,?\s+(ph\.?d\.?|phd|d\.?phil\.?|d\.?sc\.?|m\.?sc\.?|b\.?sc\.?|mbbs|fwacp|fnae|oon|con)\.?$/i;

const EMBEDDED_TITLE_REGEX =
  /\b(ph\.?d\.?|phd|d\.?phil\.?|prof(essor)?|dr|engr|barr(ister)?)\b\.?/gi;

/**
 * Strips academic/honorific prefixes (Prof., Dr., Mr., etc.) and doctorate suffixes (Ph.D.)
 * from any person's name string for article presentation, citation generation, and DOI minting.
 */
export function stripAcademicTitle(name: string): string {
  if (!name) return "";
  let cleaned = name.trim();
  // Strip primary prefix
  cleaned = cleaned.replace(HONORIFIC_PREFIX_REGEX, "");
  // Strip secondary stacked prefix if any (e.g., "Prof. Dr.")
  cleaned = cleaned.replace(HONORIFIC_PREFIX_REGEX, "");
  // Strip doctorate/degree suffix
  cleaned = cleaned.replace(DOCTORATE_SUFFIX_REGEX, "");
  // Remove any remaining standalone title tokens (e.g. "Adikpo, Ph.D. Janet Aver" -> "Adikpo, Janet Aver")
  cleaned = cleaned.replace(EMBEDDED_TITLE_REGEX, "");
  // Clean multiple spaces and trailing/leading punctuation
  cleaned = cleaned.replace(/\s+/g, " ").replace(/^[,\s]+|[,\s]+$/g, "").trim();
  return cleaned;
}

/**
 * Format author name into standard "Family, Given" for Zenodo, Datacite, and Crossref.
 * Ensures zero academic titles or degree abbreviations remain in family or given names.
 */
export function formatAuthorForZenodo(name: string): string {
  if (!name) return "";
  const cleaned = stripAcademicTitle(name);
  if (cleaned.includes(",")) {
    const parts = cleaned.split(",").map((p) => stripAcademicTitle(p).trim()).filter(Boolean);
    if (parts.length >= 2) {
      const last = parts[0];
      const first = parts.slice(1).join(" ");
      return `${last}, ${first}`;
    }
    return parts[0] || "";
  }
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return cleaned;
  const last = parts.pop()!;
  const first = parts.join(" ");
  return `${last}, ${first}`;
}

/**
 * Normalise a raw title string (retained for profile and board references where needed).
 */
export function normaliseTitle(
  title?: string | null
): { kind: "prefix"; text: string } | null {
  const t = (title ?? "").trim();
  if (!t) return null;
  if (/^(ph\.?\s?d\.?|phd|d\.?\s?phil\.?|d\.?\s?sc\.?)$/i.test(t)) return null;
  if (/^prof(essor)?\.?$/i.test(t)) return { kind: "prefix", text: "Prof." };
  if (/^dr\.?$/i.test(t)) return { kind: "prefix", text: "Dr." };
  return { kind: "prefix", text: t };
}

/**
 * Formats an author's name cleanly for articles, article lists, and citations.
 * Strips any title prefixes and doctorate suffixes so citations index directly under surname.
 */
export function formatAuthorName({ first, last }: AuthorNameParts): string {
  const cleanFirst = stripAcademicTitle(first);
  const cleanLast = stripAcademicTitle(last);
  return `${cleanFirst} ${cleanLast}`.replace(/\s+/g, " ").trim();
}
