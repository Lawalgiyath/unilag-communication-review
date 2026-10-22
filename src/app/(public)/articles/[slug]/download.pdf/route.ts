import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { fileResponse } from "@/lib/files";

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

  if (!response) notFound();
  return response;
}
