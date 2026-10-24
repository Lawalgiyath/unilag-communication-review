/**
 * Display-name formatting for authors.
 *
 * Per faculty resolution and indexing standards (Google Scholar, HighWire Press, Crossref):
 * Post-nominal doctorate degrees (e.g., ", Ph.D.") are omitted because citation parsers
 * mistakenly treat "Ph.D." as the author's surname (e.g. "Adikpo, Ph.D. J. A."), preventing
 * authors from accumulating citations. Honorific prefixes ("Prof." / "Dr.") are preserved
 * where appropriate, or names are displayed plainly.
 */

export interface AuthorNameParts {
  first: string;
  last: string;
  title?: string | null;
}

const DOCTORATE = /^(ph\.?\s?d\.?|d\.?\s?phil\.?|d\.?\s?sc\.?)$/i;
const PROFESSOR = /^prof(essor)?\.?$/i;
const DOCTOR = /^dr\.?$/i;

/** Normalise a raw title string to the form used in display names. */
export function normaliseTitle(
  title?: string | null
): { kind: "prefix"; text: string } | null {
  const t = (title ?? "").trim();
  if (!t) return null;
  // Omit Ph.D. entirely so it does not interfere with citation indices
  if (DOCTORATE.test(t)) return null;
  if (PROFESSOR.test(t)) return { kind: "prefix", text: "Prof." };
  if (DOCTOR.test(t)) return { kind: "prefix", text: "Dr." };
  return { kind: "prefix", text: t };
}

export function formatAuthorName({ first, last, title }: AuthorNameParts): string {
  let base = `${first} ${last}`.replace(/\s+/g, " ").trim();
  // Strip any accidental trailing ", Ph.D." / " Ph.D." in name strings
  base = base.replace(/,?\s+ph\.?d\.?$/i, "").trim();
  const t = normaliseTitle(title);
  if (!t) return base;
  return `${t.text} ${base}`;
}
