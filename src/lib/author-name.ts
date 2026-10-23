/**
 * Display-name formatting for authors.
 *
 * Journal convention: a doctorate is a post-nominal and goes AFTER the name
 * ("Janet Aver Adikpo, Ph.D."). Honorifics such as "Prof." / "Dr." go BEFORE
 * the name ("Prof. Adepoju Tejumaiye"). Authors with no title are shown plain.
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
): { kind: "postnominal" | "prefix"; text: string } | null {
  const t = (title ?? "").trim();
  if (!t) return null;
  if (DOCTORATE.test(t)) return { kind: "postnominal", text: "Ph.D." };
  if (PROFESSOR.test(t)) return { kind: "prefix", text: "Prof." };
  if (DOCTOR.test(t)) return { kind: "prefix", text: "Dr." };
  return { kind: "prefix", text: t };
}

export function formatAuthorName({ first, last, title }: AuthorNameParts): string {
  const base = `${first} ${last}`.replace(/\s+/g, " ").trim();
  const t = normaliseTitle(title);
  if (!t) return base;
  return t.kind === "postnominal" ? `${base}, ${t.text}` : `${t.text} ${base}`;
}
