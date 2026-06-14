"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { saveUpload, FileValidationError } from "@/lib/files";
import { JOURNAL } from "@/lib/constants";
import { sendEmail } from "@/lib/email";

// ─── Step 1: Manuscript details ──────────────────────────────────────────────

const Step1Schema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters"),
  abstract: z.string().min(150, "Abstract must be at least 150 words"),
  articleType: z.enum(["RESEARCH_ARTICLE", "REVIEW_ARTICLE", "COMMENTARY", "BOOK_REVIEW"], {
    errorMap: () => ({ message: "Select an article type" }),
  }),
  keywordsCsv: z.string().min(3, "Enter at least one keyword"),
  wordCount: z.coerce.number().int().min(1000, "Word count must be at least 1000").optional(),
  guidelinesConfirmed: z.literal("on", { errorMap: () => ({ message: "You must confirm you have read the guidelines" }) }),
});

export type Step1State = {
  errors?: Record<string, string[]>;
  submissionId?: string;
};

export async function step1Action(_prev: Step1State, formData: FormData): Promise<Step1State> {
  const user = await requireSession();

  const raw = {
    title: formData.get("title"),
    abstract: formData.get("abstract"),
    articleType: formData.get("articleType"),
    keywordsCsv: formData.get("keywordsCsv"),
    wordCount: formData.get("wordCount"),
    guidelinesConfirmed: formData.get("guidelinesConfirmed"),
  };

  const parsed = Step1Schema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  const submissionId = formData.get("submissionId") as string | null;

  // Get next sequential number
  const count = await db.submission.count();
  const number = count + 1;

  let sub;
  if (submissionId) {
    sub = await db.submission.update({
      where: { id: submissionId },
      data: {
        title: d.title,
        abstract: d.abstract,
        articleType: d.articleType,
        keywordsCsv: d.keywordsCsv,
        wordCount: d.wordCount ?? null,
        guidelinesConfirmed: true,
      },
    });
  } else {
    sub = await db.submission.create({
      data: {
        number,
        title: d.title,
        abstract: d.abstract,
        articleType: d.articleType,
        keywordsCsv: d.keywordsCsv,
        wordCount: d.wordCount ?? null,
        status: "SUBMITTED",
        correspondingAuthorId: user.id,
        guidelinesConfirmed: true,
      },
    });

    // Create corresponding author entry
    await db.submissionAuthor.create({
      data: {
        submissionId: sub.id,
        name: user.name,
        email: user.email,
        affiliation: user.affiliation ?? "",
        orcid: user.orcid ?? null,
        isCorresponding: true,
        order: 1,
      },
    });
  }

  redirect(`/dashboard/submissions/new?step=2&id=${sub.id}`);
}

// ─── Step 2: Authors ──────────────────────────────────────────────────────────

export type Step2State = { errors?: Record<string, string[]> };

export async function step2Action(_prev: Step2State, formData: FormData): Promise<Step2State> {
  await requireSession();
  const submissionId = formData.get("submissionId") as string;
  if (!submissionId) return { errors: { form: ["Submission ID missing"] } };

  // Clear existing non-corresponding authors
  await db.submissionAuthor.deleteMany({
    where: { submissionId, isCorresponding: false },
  });

  const names = formData.getAll("authorName") as string[];
  const emails = formData.getAll("authorEmail") as string[];
  const affiliations = formData.getAll("authorAffiliation") as string[];
  const orcids = formData.getAll("authorOrcid") as string[];

  for (let i = 0; i < names.length; i++) {
    const name = names[i]?.trim();
    if (!name) continue;
    await db.submissionAuthor.create({
      data: {
        submissionId,
        name,
        email: emails[i]?.trim() ?? "",
        affiliation: affiliations[i]?.trim() ?? "",
        orcid: orcids[i]?.trim() || null,
        isCorresponding: false,
        order: i + 2, // 1 = corresponding author
      },
    });
  }

  redirect(`/dashboard/submissions/new?step=3&id=${submissionId}`);
}

// ─── Step 3: File upload ──────────────────────────────────────────────────────

export type Step3State = { errors?: Record<string, string[]> };

export async function step3Action(_prev: Step3State, formData: FormData): Promise<Step3State> {
  const user = await requireSession();
  const submissionId = formData.get("submissionId") as string;
  if (!submissionId) return { errors: { form: ["Submission ID missing"] } };

  const manuscriptFile = formData.get("manuscript") as File | null;
  const titlePageFile = formData.get("titlePage") as File | null;

  if (!manuscriptFile || manuscriptFile.size === 0) {
    return { errors: { manuscript: ["Please upload your anonymized manuscript"] } };
  }

  try {
    const { id: anonymizedFileId } = await saveUpload({
      file: manuscriptFile,
      kind: "ANONYMIZED_MANUSCRIPT",
      uploadedById: user.id,
    });

    let titlePageFileId: string | undefined;
    if (titlePageFile && titlePageFile.size > 0) {
      const { id } = await saveUpload({
        file: titlePageFile,
        kind: "TITLE_PAGE",
        uploadedById: user.id,
      });
      titlePageFileId = id;
    }

    const sub = await db.submission.findUnique({ where: { id: submissionId } });
    const versionCount = await db.submissionVersion.count({ where: { submissionId } });

    await db.submissionVersion.create({
      data: {
        submissionId,
        versionNumber: versionCount + 1,
        anonymizedFileId,
        titlePageFileId: titlePageFileId ?? null,
      },
    });

    // Log event
    await db.submissionEvent.create({
      data: {
        submissionId,
        type: "VERSION_UPLOADED",
        payload: JSON.stringify({ version: versionCount + 1 }),
        actorId: user.id,
      },
    });

    redirect(`/dashboard/submissions/new?step=4&id=${submissionId}`);
  } catch (e) {
    if (e instanceof FileValidationError) {
      return { errors: { manuscript: [e.message] } };
    }
    throw e;
  }
}

// ─── Step 4: Finalise ─────────────────────────────────────────────────────────

export type Step4State = { errors?: Record<string, string[]> };

export async function step4Action(_prev: Step4State, formData: FormData): Promise<Step4State> {
  const user = await requireSession();
  const submissionId = formData.get("submissionId") as string;
  if (!submissionId) return { errors: { form: ["Submission ID missing"] } };

  const feeAcknowledged = formData.get("feeAcknowledged") === "on";
  if (!feeAcknowledged) {
    return { errors: { feeAcknowledged: ["You must acknowledge the publication fee"] } };
  }

  await db.submission.update({
    where: { id: submissionId },
    data: { feeAcknowledged: true, status: "SUBMITTED" },
  });

  await db.submissionEvent.create({
    data: {
      submissionId,
      type: "SUBMITTED",
      actorId: user.id,
    },
  });

  const sub = await db.submission.findUnique({ where: { id: submissionId } });
  if (sub) {
    await sendEmail({
      to: user.email,
      subject: `Submission received: ${sub.title.slice(0, 60)}`,
      text: `Dear ${user.name},\n\nThank you for submitting your manuscript to ${JOURNAL.title}. Your submission has been received and is under editorial review.\n\nSubmission reference: UCR-${sub.submittedAt.getFullYear()}-${String(sub.number).padStart(4, "0")}\n\nWe will contact you with updates on the progress of your submission.\n\nWarm regards,\n${JOURNAL.title} Editorial Office`,
      template: "submission_received",
    });
  }

  redirect(`/dashboard/submissions/${submissionId}?submitted=1`);
}
