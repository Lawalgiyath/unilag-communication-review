import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatBibTeX } from "@/lib/citations";

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
  if (!article) return new Response("Not found", { status: 404 });

  const bib = formatBibTeX({
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

  return new Response(bib, {
    headers: {
      "Content-Type": "application/x-bibtex; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.bib"`,
    },
  });
}
