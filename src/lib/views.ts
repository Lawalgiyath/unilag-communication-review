import { createHash } from "node:crypto";

/**
 * Daily-deduped view hash: the same visitor (ip+ua) viewing the same article
 * on the same UTC day produces the same hash; the unique constraint on
 * (articleId, dayHash) makes repeat views no-ops.
 */
export function dayHash(
  ip: string,
  userAgent: string,
  articleId: string,
  date: Date = new Date()
): string {
  const day = date.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  return createHash("sha256")
    .update(`${ip}|${userAgent}|${day}|${articleId}`)
    .digest("hex");
}

/** First hop of x-forwarded-for, falling back to a marker. */
export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
