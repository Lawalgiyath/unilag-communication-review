import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { fileResponse } from "@/lib/files";
import type { FileKind } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const file = await db.storedFile.findUnique({
    where: { id },
    include: {
      anonymizedVersions: { include: { submission: true } },
      titlePageVersions: { include: { submission: true } },
      articles: true,
    },
  });

  if (!file) {
    return new NextResponse("File not found", { status: 404 });
  }

  // TYPESET_PDF is public if the article is published
  if (file.kind === "TYPESET_PDF") {
    const isPublic = file.articles.some(a => a.status === "PUBLISHED");
    if (isPublic) {
      const { articles, anonymizedVersions, titlePageVersions, ...fd } = file;
      const res = await fileResponse({ ...fd, kind: fd.kind as FileKind, downloadName: fd.originalName });
      return res ?? new NextResponse("File not found on disk", { status: 404 });
    }
  }

  // For all other files (or unpublished PDFs), require authentication
  const user = await getSessionUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const isEditor = user.roles.some((r: any) => r.role === "EDITOR" || r.role === "ADMIN");

  const { articles, anonymizedVersions, titlePageVersions, ...fd } = file;
  const fileData = { ...fd, kind: fd.kind as FileKind, downloadName: fd.originalName };

  if (isEditor) {
    const res = await fileResponse(fileData);
    return res ?? new NextResponse("File not found on disk", { status: 404 });
  }

  // Check authorship or reviewer assignment
  let submissionId: string | undefined;

  if (file.anonymizedVersions.length > 0) {
    submissionId = file.anonymizedVersions[0].submission.id;
  } else if (file.titlePageVersions.length > 0) {
    submissionId = file.titlePageVersions[0].submission.id;
  } else if (file.articles.length > 0 && file.articles[0].submissionId) {
    submissionId = file.articles[0].submissionId;
  }

  if (submissionId) {
    // Is author?
    const isAuthor = await db.submission.findFirst({
      where: { id: submissionId, correspondingAuthorId: user.id },
    });
    if (isAuthor) {
      const res = await fileResponse(fileData);
      return res ?? new NextResponse("File not found on disk", { status: 404 });
    }

    // Is reviewer? (Can only access anonymized manuscripts)
    if (file.kind === "ANONYMIZED_MANUSCRIPT") {
      const isReviewer = await db.reviewAssignment.findFirst({
        where: {
          submissionId,
          reviewerId: user.id,
          status: { in: ["INVITED", "ACCEPTED", "SUBMITTED"] },
        },
      });
      if (isReviewer) {
        const res = await fileResponse(fileData);
        return res ?? new NextResponse("File not found on disk", { status: 404 });
      }
    }
  }

  return new NextResponse("Forbidden", { status: 403 });
}
