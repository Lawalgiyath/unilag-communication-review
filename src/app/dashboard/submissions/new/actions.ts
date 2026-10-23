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

import { checkCrossrefDuplicates } from "@/lib/crossref";

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

  const sub = await db.submission.findUnique({
    where: { id: submissionId },
    include: { authors: true },
  });

  if (sub) {
    const subRef = `UCR-${sub.submittedAt.getFullYear()}-${String(sub.number).padStart(4, "0")}`;
    const appUrl = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "https://unilag-communication-review.vercel.app";

    // 1. Email corresponding author
    await sendEmail({
      to: user.email,
      subject: `Submission received: ${sub.title.slice(0, 60)}`,
      text: `Dear ${user.name},\n\nThank you for submitting your manuscript to ${JOURNAL.title}. Your submission has been received and is under editorial review.\n\nSubmission reference: ${subRef}\n\nWe will contact you with updates on the progress of your submission.\n\nWarm regards,\n${JOURNAL.title} Editorial Office`,
      template: "submission_received",
    });

    // 2. Alert all listed non-corresponding co-authors (COPE guidelines)
    const coAuthors = sub.authors.filter((a) => !a.isCorresponding && a.email?.includes("@"));
    for (const ca of coAuthors) {
      const disputeUrl = `${appUrl}/submissions/dispute?id=${sub.id}&email=${encodeURIComponent(ca.email)}`;
      const coAuthorText = `Dear ${ca.name},

You have been listed as a co-author on a newly submitted manuscript to ${JOURNAL.title}:

Title: "${sub.title}"
Corresponding Author: ${user.name} (${user.email})
Submission Reference: ${subRef}

Under Committee on Publication Ethics (COPE) core practices, all contributing authors must approve manuscript submission and agree to the research content and authorship attribution.

- If you approved this submission: No action is required.
- If you did NOT authorize this submission, or if you dispute the authorship or research data: Please register an immediate dispute with our editorial office using the link below:

${disputeUrl}

Registering a dispute will flag the manuscript on the Editor-in-Chief queue and pause review pending investigation.

Warm regards,
Editorial Office
${JOURNAL.title}
University of Lagos`;

      await sendEmail({
        to: ca.email,
        subject: `Co-authorship notification: ${sub.title.slice(0, 50)}`,
        text: coAuthorText,
        template: "coauthor_submission_notification",
      });
    }

    // 3. Automated Crossref duplicate and plagiarism pre-screening
    try {
      const crossrefResult = await checkCrossrefDuplicates(sub.title);
      if (crossrefResult.foundDuplicate && crossrefResult.matches.length > 0) {
        const topMatch = crossrefResult.matches[0];
        await db.submissionEvent.create({
          data: {
            submissionId: sub.id,
            type: "CROSSREF_DUPLICATE_FLAG",
            payload: JSON.stringify({
              matchTitle: topMatch.title,
              doi: topMatch.doi,
              publisher: topMatch.publisher,
              similarity: topMatch.similarity,
              url: topMatch.url,
              flaggedAt: new Date().toISOString(),
            }),
          },
        });
      }
    } catch (crossrefErr) {
      console.warn("[submission:crossref] Duplicate check error:", crossrefErr);
    }
  }

  redirect(`/dashboard/submissions/${submissionId}?submitted=1`);
}

