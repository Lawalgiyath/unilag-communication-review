import { cache } from "react";
import { db } from "./db";
import { JOURNAL, siteUrl } from "./constants";

/**
 * Journal settings stored in the Setting table, with fallbacks to constants.
 * Wrapped in React cache() so a single request reads the table at most once.
 */
export const getSettings = cache(async () => {
  const rows = await db.setting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const rawBaseUrl = map.get("base_url")?.trim();
  const isLocalHost =
    rawBaseUrl &&
    (rawBaseUrl.includes("localhost") || rawBaseUrl.includes("127.0.0.1"));
  const effectiveBaseUrl =
    rawBaseUrl && !(process.env.NODE_ENV === "production" && isLocalHost)
      ? rawBaseUrl.replace(/\/+$/, "")
      : siteUrl();

  return {
    journalTitle: map.get("journal_title") ?? JOURNAL.title,
    publisher: map.get("publisher") ?? JOURNAL.publisher,
    address: map.get("address") ?? JOURNAL.address,
    issn: map.get("issn") ?? JOURNAL.issn,
    eissn: map.get("eissn") ?? JOURNAL.eissn,
    contactEmail: map.get("contact_email") ?? JOURNAL.contactEmail,
    feeText:
      map.get("fee_text") ??
      `To support the peer review and online publication process, authors are required to pay a non-refundable fee of thirty thousand Naira (₦${JOURNAL.feeNaira}) per article.`,
    baseUrl: effectiveBaseUrl,
    doiPrefix: map.get("doiPrefix") ?? JOURNAL.doiPrefix,
  };
});

export type Settings = Awaited<ReturnType<typeof getSettings>>;
