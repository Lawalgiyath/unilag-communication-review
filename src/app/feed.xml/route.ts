import { db } from "@/lib/db";
import { JOURNAL, siteUrl } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = siteUrl();

  const articles = await db.article.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedOnline: "desc" },
    take: 20,
    include: {
      authors: { orderBy: { order: "asc" } },
      issue: { include: { volume: true } },
    },
  });

  function xmlEscape(s: string): string {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const items = articles
    .map((a) => {
      const authorList = a.authors.map((au) => au.name).join(", ");
      const pubDate = a.publishedOnline
        ? a.publishedOnline.toUTCString()
        : new Date().toUTCString();
      const link = `${base}/articles/${a.slug}`;

      return `    <item>
      <title>${xmlEscape(a.title)}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="true">${xmlEscape(link)}</guid>
      <author>${xmlEscape(authorList)}</author>
      <description>${xmlEscape(a.abstract.slice(0, 400))}${a.abstract.length > 400 ? "…" : ""}</description>
      <pubDate>${pubDate}</pubDate>
      ${a.doi ? `<category domain="doi">https://doi.org/${xmlEscape(a.doi)}</category>` : ""}
    </item>`;
    })
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${xmlEscape(JOURNAL.title)}</title>
    <link>${xmlEscape(base)}</link>
    <description>Latest articles from ${xmlEscape(JOURNAL.title)}</description>
    <language>en</language>
    <copyright>© ${new Date().getFullYear()} ${xmlEscape(JOURNAL.title)}</copyright>
    <atom:link href="${xmlEscape(base)}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
