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
  /^(emeritus\s+prof(essor)?|prof(essor)?|dr\.?\s*\(mrs\.?\)|dr|rev(erend)?|assoc(\.|\s+)?prof(essor)?|mr|mrs|ms)\.?\s+/i;

const DOCTORATE_SUFFIX_REGEX =
  /,?\s+(ph\.?d\.?|d\.?phil\.?|d\.?sc\.?)$/i;

/**
 * Strips academic/honorific prefixes (Prof., Dr., Mr., etc.) and doctorate suffixes (Ph.D.)
 * from any person's name string for article presentation and citation generation.
 */
export function stripAcademicTitle(name: string): string {
  if (!name) return "";
  let cleaned = name.trim();
  // Strip primary prefix
  cleaned = cleaned.replace(HONORIFIC_PREFIX_REGEX, "");
  // Strip secondary stacked prefix if any (e.g., "Prof. Dr.")
  cleaned = cleaned.replace(HONORIFIC_PREFIX_REGEX, "");
  // Strip doctorate suffix
  cleaned = cleaned.replace(DOCTORATE_SUFFIX_REGEX, "");
  return cleaned.replace(/\s+/g, " ").trim();
}

/**
 * Normalise a raw title string (retained for profile and board references where needed).
 */
export function normaliseTitle(
  title?: string | null
): { kind: "prefix"; text: string } | null {
  const t = (title ?? "").trim();
  if (!t) return null;
  if (/^(ph\.?\s?d\.?|d\.?\s?phil\.?|d\.?\s?sc\.?)$/i.test(t)) return null;
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
