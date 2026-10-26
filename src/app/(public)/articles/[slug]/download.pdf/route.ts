import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { fileResponse } from "@/lib/files";
import type { FileKind } from "@/lib/types";
import { getArticleBySlug } from "@/lib/demo-data";
import { generateArticlePdf } from "@/lib/pdf-generator";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // 1. Query database for published article
  try {
    const article = await db.article.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: {
        pdfFile: true,
        authors: { orderBy: { order: "asc" } },
        issue: { include: { volume: true } },
        keywords: { include: { keyword: true } },
        submission: {
          include: {
            versions: {
              orderBy: { versionNumber: "desc" },
              include: { anonymizedFile: true, titlePageFile: true },
              take: 1,
            },
          },
        },
      },
    });

    if (article) {
      // Priority A: Associated TYPESET_PDF
      let fileToServe = article.pdfFile;

      // Priority B: Fallback to submission manuscript file
      if (!fileToServe && article.submission?.versions?.[0]) {
        fileToServe =
          article.submission.versions[0].anonymizedFile ??
          article.submission.versions[0].titlePageFile;
      }

      if (fileToServe) {
        const response = await fileResponse({
          kind: fileToServe.kind as FileKind,
          filename: fileToServe.filename,
          mimeType: fileToServe.mimeType || "application/pdf",
          downloadName: `${slug}.pdf`,
          inline: true,
          cacheControl: "public, max-age=86400, stale-while-revalidate=3600",
        });

        if (response) {
          return response;
        }
      }

      // Priority C: Generate authentic academic PDF dynamically in-memory
      const year =
        article.issue?.volume?.year ??
        article.publishedOnline?.getFullYear() ??
        new Date().getFullYear();
      const volNum = article.issue?.volume?.number ?? 1;
      const issueNum = article.issue?.number ?? 1;

      const keywordsList: string[] =
        article.keywords && article.keywords.length > 0
          ? article.keywords.map((k) => k.keyword.label)
          : (article.submission?.keywordsCsv || "")
              .split(",")
              .map((k: string) => k.trim())
              .filter(Boolean);

      const pdfBytes = await generateArticlePdf({
        title: article.title,
        authors: article.authors.map((a) => ({
          name: a.name,
          affiliation: a.affiliation || undefined,
          orcid: a.orcid || undefined,
        })),
        volume: volNum,
        issue: issueNum,
        year,
        firstPage: article.firstPage || undefined,
        lastPage: article.lastPage || undefined,
        doi: article.doi || undefined,
        abstract: article.abstract,
        keywords: keywordsList,
        bodyParagraphs: [article.abstract],
        references: [],
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
    }
  } catch (err) {
    console.error("Error retrieving database article PDF:", err);
  }

  // 2. Fallback to demo article
  const demoArticle = getArticleBySlug(slug);
  if (demoArticle) {
    try {
      // Check if file exists on disk
      const response = await fileResponse({
        kind: "TYPESET_PDF",
        filename: `${slug}.pdf`,
        mimeType: "application/pdf",
        downloadName: `${slug}.pdf`,
        inline: true,
        cacheControl: "public, max-age=86400, stale-while-revalidate=3600",
      });

      if (response) {
        return response;
      }

      // Generate in-memory
      const pdfBytes = await generateArticlePdf({
        title: demoArticle.title,
        authors: demoArticle.authors.map((a) => ({
          name: a.name || `${a.firstName} ${a.lastName}`.trim(),
          affiliation: a.affiliation,
          orcid: a.orcid,
        })),
        volume: demoArticle.volumeNumber,
        issue: demoArticle.issueNumber,
        year: demoArticle.volumeYear,
        firstPage: demoArticle.firstPage,
        lastPage: demoArticle.lastPage,
        doi: demoArticle.doi,
        abstract: demoArticle.abstract,
        keywords: demoArticle.keywords.map((k) => k.label),
        bodyParagraphs: demoArticle.bodyParagraphs,
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
      console.error("Failed to generate fallback PDF for demo article:", err);
    }
  }

  notFound();
}
