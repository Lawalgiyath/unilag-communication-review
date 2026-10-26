import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatRIS } from "@/lib/citations";
import { getArticleBySlug } from "@/lib/demo-data";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const [article, settings] = await Promise.all([
    db.article.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: {
        authors: { orderBy: { order: "asc" } },
        issue: { include: { volume: true } },
      },
    }),
    getSettings(),
  ]);

  if (!article) {
    const demo = getArticleBySlug(slug);
    if (!demo) return new Response("Not found", { status: 404 });
    const ris = formatRIS({
      title: demo.title,
      authors: demo.authors.map((a) => ({
        firstName: a.firstName,
        lastName: a.lastName,
      })),
      year: demo.publishedOnline?.getUTCFullYear() ?? null,
      journalTitle: settings.journalTitle,
      volume: demo.volumeNumber ?? null,
      issue: demo.issueNumber ?? null,
      firstPage: demo.firstPage,
      lastPage: demo.lastPage,
      doi: demo.doi,
      url: `${settings.baseUrl}/articles/${demo.slug}`,
    });
    return new Response(ris, {
      headers: {
        "Content-Type": "application/x-research-info-systems; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug}.ris"`,
      },
    });
  }

  const ris = formatRIS({
    title: article.title,
    authors: article.authors.map((a) => ({
      firstName: a.firstName,
      lastName: a.lastName,
    })),
    year: article.publishedOnline?.getUTCFullYear() ?? null,
    journalTitle: settings.journalTitle,
    volume: article.issue?.volume.number ?? null,
    issue: article.issue?.number ?? null,
    firstPage: article.firstPage,
    lastPage: article.lastPage,
    doi: article.doi,
    url: `${settings.baseUrl}/articles/${article.slug}`,
  });

  return new Response(ris, {
    headers: {
      "Content-Type": "application/x-research-info-systems; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.ris"`,
    },
  });
}
