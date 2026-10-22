import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { fileResponse } from "@/lib/files";
import { getArticleBySlug } from "@/lib/demo-data";
import { generateArticlePdf } from "@/lib/pdf-generator";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let filename = `${slug}.pdf`;

  try {
    const article = await db.article.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: { pdfFile: true },
    });

    if (article?.pdfFile?.filename) {
      filename = article.pdfFile.filename;
    }
  } catch {
    // Fall back to filename on disk
  }

  const response = await fileResponse({
    kind: "TYPESET_PDF",
    filename,
    mimeType: "application/pdf",
    downloadName: `${slug}.pdf`,
    inline: true,
    cacheControl: "public, max-age=86400, stale-while-revalidate=3600",
  });

  if (response) {
    return response;
  }

  // Fallback: Generate the PDF in-memory if file is not found on disk (e.g. serverless Vercel)
  const demoArticle = getArticleBySlug(slug);
  if (demoArticle) {
    try {
      const pdfBytes = await generateArticlePdf({
        title: demoArticle.title,
        authors: demoArticle.authors.map((a) => ({
          name: a.name || `${a.firstName} ${a.lastName}`.trim(),
          affiliation: a.affiliation,
        })),
        volume: demoArticle.volumeNumber,
        issue: demoArticle.issueNumber,
        year: demoArticle.volumeYear,
        firstPage: demoArticle.firstPage,
        lastPage: demoArticle.lastPage,
        doi: demoArticle.doi,
        abstract: demoArticle.abstract,
        keywords: demoArticle.keywords.map((k) => k.label),
        references: demoArticle.references.map((r) => r.text),
      });

      return new Response(Buffer.from(pdfBytes), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Length": String(pdfBytes.byteLength),
          "Content-Disposition": `inline; filename="${slug}.pdf"`,
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
        },
      });
    } catch (err) {
      console.error("Failed to generate fallback PDF:", err);
    }
  }

  notFound();
}

