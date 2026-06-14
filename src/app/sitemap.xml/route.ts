import { db } from "@/lib/db";
import { siteUrl } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = siteUrl();

  const [articles, pages] = await Promise.all([
    db.article.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      orderBy: { publishedOnline: "desc" },
    }),
    db.page.findMany({ select: { slug: true, updatedAt: true } }),
  ]);

  const staticRoutes = [
    { url: `${base}/`, lastmod: new Date().toISOString().slice(0, 10) },
    { url: `${base}/archives`, lastmod: new Date().toISOString().slice(0, 10) },
    { url: `${base}/search`, lastmod: new Date().toISOString().slice(0, 10) },
    { url: `${base}/editorial-board`, lastmod: new Date().toISOString().slice(0, 10) },
    { url: `${base}/announcements`, lastmod: new Date().toISOString().slice(0, 10) },
  ];

  const articleRoutes = articles.map((a) => ({
    url: `${base}/articles/${a.slug}`,
    lastmod: a.updatedAt.toISOString().slice(0, 10),
  }));

  const pageRoutes = pages.map((p) => ({
    url: `${base}/${p.slug}`,
    lastmod: p.updatedAt.toISOString().slice(0, 10),
  }));

  const all = [...staticRoutes, ...pageRoutes, ...articleRoutes];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all
  .map(
    (r) => `  <url>
    <loc>${r.url.replace(/&/g, "&amp;")}</loc>
    <lastmod>${r.lastmod}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
