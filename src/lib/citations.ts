/**
 * Citation builders. Pure functions over a minimal article shape so they are
 * unit-testable without the database.
 */

export interface CitationAuthor {
  firstName: string;
  lastName: string;
}

export interface CitationData {
  title: string;
  authors: CitationAuthor[];
  year: number | null;
  journalTitle: string;
  volume: number | null;
  issue: number | null;
  firstPage: number | null;
  lastPage: number | null;
  doi: string | null;
  url: string;
}

function initials(firstName: string): string {
  return firstName
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((p) => `${p[0].toUpperCase()}.`)
    .join(" ");
}

function pages(d: CitationData): string {
  if (d.firstPage && d.lastPage) return `${d.firstPage}–${d.lastPage}`;
  if (d.firstPage) return `${d.firstPage}`;
  return "";
}

function doiOrUrl(d: CitationData): string {
  return d.doi ? `https://doi.org/${d.doi}` : d.url;
}

/** APA 7th edition. */
export function formatAPA(d: CitationData): string {
  const names = d.authors.map((a) => `${a.lastName}, ${initials(a.firstName)}`);
  let authorStr: string;
  if (names.length === 0) authorStr = "";
  else if (names.length === 1) authorStr = names[0];
  else if (names.length === 2) authorStr = `${names[0]}, & ${names[1]}`;
  else
    authorStr = `${names.slice(0, -1).join(", ")}, & ${names[names.length - 1]}`;

  const year = d.year ? `(${d.year}).` : "(n.d.).";
  const volIssue =
    d.volume !== null
      ? `${d.journalTitle}, ${d.volume}${d.issue !== null ? `(${d.issue})` : ""}`
      : d.journalTitle;
  const pg = pages(d);
  return [
    authorStr ? `${authorStr} ${year}` : year,
    `${d.title}.`,
    `${volIssue}${pg ? `, ${pg}` : ""}.`,
    doiOrUrl(d),
  ]
    .filter(Boolean)
    .join(" ");
}

/** MLA 9th edition. */
export function formatMLA(d: CitationData): string {
  const names = d.authors.map((a) => `${a.firstName} ${a.lastName}`);
  let authorStr: string;
  if (names.length === 0) authorStr = "";
  else if (names.length === 1)
    authorStr = `${d.authors[0].lastName}, ${d.authors[0].firstName}.`;
  else if (names.length === 2)
    authorStr = `${d.authors[0].lastName}, ${d.authors[0].firstName}, and ${names[1]}.`;
  else authorStr = `${d.authors[0].lastName}, ${d.authors[0].firstName}, et al.`;

  const vol = d.volume !== null ? `vol. ${d.volume}` : "";
  const iss = d.issue !== null ? `no. ${d.issue}` : "";
  const yr = d.year ? `${d.year}` : "";
  const pg = pages(d) ? `pp. ${pages(d)}` : "";
  const tail = [vol, iss, yr, pg].filter(Boolean).join(", ");
  return [
    authorStr,
    `"${d.title}."`,
    `${d.journalTitle},`,
    tail ? `${tail}.` : "",
    doiOrUrl(d) + ".",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Chicago author-date. */
export function formatChicago(d: CitationData): string {
  const names = d.authors.map(
    (a, i) =>
      i === 0 ? `${a.lastName}, ${a.firstName}` : `${a.firstName} ${a.lastName}`
  );
  let authorStr: string;
  if (names.length === 0) authorStr = "";
  else if (names.length === 1) authorStr = `${names[0]}.`;
  else if (names.length === 2) authorStr = `${names[0]}, and ${names[1]}.`;
  else
    authorStr = `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}.`;

  const yr = d.year ? `${d.year}.` : "n.d.";
  const volIssue =
    d.volume !== null
      ? `${d.volume}${d.issue !== null ? `, no. ${d.issue}` : ""}`
      : "";
  const pg = pages(d) ? `: ${pages(d)}` : "";
  return [
    authorStr,
    yr,
    `"${d.title}."`,
    `${d.journalTitle}${volIssue ? ` ${volIssue}` : ""}${pg}.`,
    doiOrUrl(d) + ".",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Harvard. */
export function formatHarvard(d: CitationData): string {
  const names = d.authors.map((a) => `${a.lastName}, ${initials(a.firstName)}`);
  let authorStr: string;
  if (names.length === 0) authorStr = "";
  else if (names.length === 1) authorStr = names[0];
  else if (names.length === 2) authorStr = `${names[0]} and ${names[1]}`;
  else
    authorStr = `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

  const yr = d.year ? `(${d.year})` : "(n.d.)";
  const volIssue =
    d.volume !== null
      ? `${d.volume}${d.issue !== null ? `(${d.issue})` : ""}`
      : "";
  const pg = pages(d) ? `, pp. ${pages(d)}` : "";
  return [
    `${authorStr} ${yr}`,
    `'${d.title}',`,
    `${d.journalTitle}${volIssue ? `, ${volIssue}` : ""}${pg}.`,
    `Available at: ${doiOrUrl(d)}.`,
  ]
    .filter(Boolean)
    .join(" ");
}

/** BibTeX @article entry. */
export function formatBibTeX(d: CitationData, citeKey?: string): string {
  const key =
    citeKey ??
    `${(d.authors[0]?.lastName ?? "anon").toLowerCase().replace(/[^a-z]/g, "")}${d.year ?? ""}`;
  const authorField = d.authors
    .map((a) => `${a.lastName}, ${a.firstName}`)
    .join(" and ");
  const lines = [
    `@article{${key},`,
    `  title   = {${d.title}},`,
    authorField ? `  author  = {${authorField}},` : null,
    `  journal = {${d.journalTitle}},`,
    d.year !== null ? `  year    = {${d.year}},` : null,
    d.volume !== null ? `  volume  = {${d.volume}},` : null,
    d.issue !== null ? `  number  = {${d.issue}},` : null,
    pages(d) ? `  pages   = {${d.firstPage}--${d.lastPage ?? d.firstPage}},` : null,
    d.doi ? `  doi     = {${d.doi}},` : null,
    `  url     = {${d.url}}`,
    `}`,
  ].filter((l): l is string => l !== null);
  return lines.join("\n");
}

/** RIS export (EndNote / Zotero / Mendeley). */
export function formatRIS(d: CitationData): string {
  const lines: string[] = ["TY  - JOUR"];
  for (const a of d.authors) lines.push(`AU  - ${a.lastName}, ${a.firstName}`);
  lines.push(`TI  - ${d.title}`);
  lines.push(`JO  - ${d.journalTitle}`);
  if (d.year !== null) lines.push(`PY  - ${d.year}`);
  if (d.volume !== null) lines.push(`VL  - ${d.volume}`);
  if (d.issue !== null) lines.push(`IS  - ${d.issue}`);
  if (d.firstPage !== null) lines.push(`SP  - ${d.firstPage}`);
  if (d.lastPage !== null) lines.push(`EP  - ${d.lastPage}`);
  if (d.doi) lines.push(`DO  - ${d.doi}`);
  lines.push(`UR  - ${d.url}`);
  lines.push("ER  - ");
  return lines.join("\r\n");
}
