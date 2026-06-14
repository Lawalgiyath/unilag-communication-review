"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { saveUpload, FileValidationError } from "@/lib/files";
import { reindexArticle } from "@/lib/search";
import { sendEmail } from "@/lib/email";
import { JOURNAL } from "@/lib/constants";
import { getSettings } from "@/lib/settings";

const PublishSchema = z.object({
  issueId: z.string().min(1, "Select an issue"),
  doi: z.string().optional(),
  firstPage: z.coerce.number().int().positive().optional(),
  lastPage: z.coerce.number().int().positive().optional(),
  receivedDate: z.string().optional(),
  acceptedDate: z.string().optional(),
  publishedDate: z.string().min(1, "Published date is required"),
});

export type PublishState = { errors?: Record<string, string[]> };

export async function publishAction(_prev: PublishState, formData: FormData): Promise<PublishState> {
  const editor = await requireSession();
  const submissionId = formData.get("submissionId") as string;

  const sub = await db.submission.findUnique({
    where: { id: submissionId },
    include: {
      authors: { orderBy: { order: "asc" } },
      correspondingAuthor: { select: { email: true, name: true } },
    },
  });
  if (!sub || !["ACCEPTED", "IN_PRODUCTION"].includes(sub.status)) {
    return { errors: { issueId: ["Submission not found or not in correct state"] } };
  }

  const raw = {
    issueId: formData.get("issueId"),
    doi: formData.get("doi"),
    firstPage: formData.get("firstPage"),
    lastPage: formData.get("lastPage"),
    receivedDate: formData.get("receivedDate"),
    acceptedDate: formData.get("acceptedDate"),
    publishedDate: formData.get("publishedDate"),
  };
  const parsed = PublishSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;

  const pdfFile = formData.get("typesettedPdf") as File | null;
  let pdfFileId: string | undefined;

  if (pdfFile && pdfFile.size > 0) {
    try {
      const { id } = await saveUpload({
        file: pdfFile,
        kind: "TYPESET_PDF",
        uploadedById: editor.id,
        pdfOnly: true,
      });
      pdfFileId = id;
    } catch (e) {
      if (e instanceof FileValidationError) {
        return { errors: { typesettedPdf: [e.message] } };
      }
      throw e;
    }
  }

  // Create or update Article record
  const slugBase = sub.title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
  const slug = `${slugBase}-${Date.now().toString(36)}`;

  const keywords = sub.keywordsCsv
    .split(",")
    .map((k) => k.trim().toLowerCase().replace(/\s+/g, "-"))
    .filter(Boolean);

  const settings = await getSettings();
  const autoDoi = d.doi || `${settings.doiPrefix}/ucr.${new Date(d.publishedDate).getFullYear()}.${slugBase.slice(0, 12)}`;

  const article = await db.article.upsert({
    where: { submissionId },
    create: {
      submissionId,
      slug,
      title: sub.title,
      abstract: sub.abstract,
      articleType: sub.articleType,
      status: "PUBLISHED",
      issueId: d.issueId,
      doi: autoDoi,
      firstPage: d.firstPage ?? null,
      lastPage: d.lastPage ?? null,
      receivedDate: d.receivedDate ? new Date(d.receivedDate) : null,
      acceptedDate: d.acceptedDate ? new Date(d.acceptedDate) : null,
      publishedOnline: new Date(d.publishedDate),
      pdfFileId: pdfFileId ?? null,
    },
    update: {
      issueId: d.issueId,
      doi: autoDoi,
      firstPage: d.firstPage ?? null,
      lastPage: d.lastPage ?? null,
      receivedDate: d.receivedDate ? new Date(d.receivedDate) : null,
      acceptedDate: d.acceptedDate ? new Date(d.acceptedDate) : null,
      publishedOnline: new Date(d.publishedDate),
      status: "PUBLISHED",
      ...(pdfFileId ? { pdfFileId } : {}),
    },
  });

  // Sync article authors
  await db.articleAuthor.deleteMany({ where: { articleId: article.id } });
  await db.articleAuthor.createMany({
    data: sub.authors.map((a) => {
      const parts = a.name.trim().split(" ");
      const lastName = parts.length > 1 ? parts.pop()! : a.name;
      const firstName = parts.length > 0 ? parts.join(" ") : a.name;
      return {
        articleId: article.id,
        name: a.name,
        lastName,
        firstName,
        email: a.email,
        affiliation: a.affiliation,
        orcid: a.orcid,
        isCorresponding: a.isCorresponding,
        order: a.order,
      };
    }),
  });

  // Sync keywords
  await db.articleKeyword.deleteMany({ where: { articleId: article.id } });
  for (const kw of keywords) {
    const keyword = await db.keyword.upsert({
      where: { slug: kw },
      create: { slug: kw, label: kw.replace(/-/g, " ") },
      update: {},
    });
    await db.articleKeyword.create({ data: { articleId: article.id, keywordId: keyword.id } });
  }

  // Transition submission
  await db.submission.update({
    where: { id: submissionId },
    data: { status: "PUBLISHED" },
  });

  await db.submissionEvent.create({
    data: { submissionId, type: "PUBLISHED", actorId: editor.id },
  });

  // Reindex FTS
  await reindexArticle(article.id);

  await sendEmail({
    to: sub.correspondingAuthor.email,
    subject: `Your article is published: ${JOURNAL.shortTitle}`,
    text: `Dear ${sub.correspondingAuthor.name},\n\nWe are delighted to inform you that your article has been published in the UNILAG Communication Review.\n\n"${sub.title}"\n\nPlease allow a few minutes for it to appear at our website.\n\nWarm regards,\n${JOURNAL.title} Editorial Office`,
    template: "article_published",
  });

  redirect(`/dashboard/editor/submissions/${submissionId}`);
}
