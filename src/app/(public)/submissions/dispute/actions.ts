"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { JOURNAL } from "@/lib/constants";

const DisputeSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
  reporterName: z.string().min(2, "Please enter your full name"),
  reporterEmail: z.string().email("Please enter a valid email address"),
  reporterAffiliation: z.string().optional(),
  disputeCategory: z.enum([
    "UNAUTHORIZED_SUBMISSION",
    "PLAGIARISM_OR_THEFT",
    "AUTHORSHIP_CONFLICT",
    "OTHER_ETHICAL_VIOLATION",
  ], {
    errorMap: () => ({ message: "Please select a dispute category" }),
  }),
  statement: z.string().min(20, "Please provide at least 20 characters explaining the dispute"),
  confirmAccuracy: z.literal("on", {
    errorMap: () => ({ message: "You must confirm that this information is accurate" }),
  }),
});

export type DisputeActionState = {
  success?: boolean;
  errors?: Record<string, string[]>;
  message?: string;
  referenceNumber?: string;
};

export async function submitDisputeAction(
  _prev: DisputeActionState,
  formData: FormData
): Promise<DisputeActionState> {
  const raw = {
    submissionId: formData.get("submissionId"),
    reporterName: formData.get("reporterName"),
    reporterEmail: formData.get("reporterEmail"),
    reporterAffiliation: formData.get("reporterAffiliation") || undefined,
    disputeCategory: formData.get("disputeCategory"),
    statement: formData.get("statement"),
    confirmAccuracy: formData.get("confirmAccuracy"),
  };

  const parsed = DisputeSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { submissionId, reporterName, reporterEmail, reporterAffiliation, disputeCategory, statement } = parsed.data;

  const sub = await db.submission.findUnique({
    where: { id: submissionId },
    include: { correspondingAuthor: true },
  });

  if (!sub) {
    return { errors: { form: ["Submission record not found. Please verify the link or reference."] } };
  }

  const disputePayload = {
    reporterName,
    reporterEmail,
    reporterAffiliation: reporterAffiliation || "",
    disputeCategory,
    statement,
    reportedAt: new Date().toISOString(),
  };

  // 1. Log formal AUTHORSHIP_DISPUTED event
  await db.submissionEvent.create({
    data: {
      submissionId: sub.id,
      type: "AUTHORSHIP_DISPUTED",
      payload: JSON.stringify(disputePayload),
    },
  });

  const refNumber = `UCR-${sub.submittedAt.getFullYear()}-${String(sub.number).padStart(4, "0")}`;
  const appUrl = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "https://unilag-communication-review.vercel.app";
  const editorUrl = `${appUrl}/dashboard/editor/submissions/${sub.id}`;

  const categoryLabels: Record<string, string> = {
    UNAUTHORIZED_SUBMISSION: "Unauthorized Submission / Lack of Consent",
    PLAGIARISM_OR_THEFT: "Plagiarism or Intellectual Property Theft",
    AUTHORSHIP_CONFLICT: "Authorship Attribution / Order Conflict",
    OTHER_ETHICAL_VIOLATION: "Other Research Ethics Violation",
  };

  const categoryName = categoryLabels[disputeCategory] ?? disputeCategory;

  // 2. Alert Editorial Office / Editor-in-Chief (NO EMOJIS, NO EM DASHES)
  const editorialNotification = `URGENT: AUTHORSHIP DISPUTE LOGGED (COPE PROTOCOL)

A formal authorship objection has been registered for the following manuscript:

Manuscript Reference: ${refNumber}
Title: "${sub.title}"
Corresponding Author: ${sub.correspondingAuthor.name} (${sub.correspondingAuthor.email})

Disputing Party Details:
Name: ${reporterName}
Email: ${reporterEmail}
Affiliation: ${reporterAffiliation || "Not provided"}
Category: ${categoryName}

Statement of Dispute:
${statement}

Action Required:
In accordance with Committee on Publication Ethics (COPE) guidelines, this submission has been flagged on the editorial dashboard. All publication, acceptance, or typesetting decisions should be held pending investigation.

Review manuscript in editor dashboard:
${editorUrl}

UNILAG Communication Review Editorial Office`;

  await sendEmail({
    to: "lawalgiyath200716@gmail.com",
    subject: `URGENT: Authorship Dispute Lodged for Manuscript ${refNumber}`,
    text: editorialNotification,
    template: "authorship_dispute_alert",
  });

  // 3. Send acknowledgment to the reporting co-author / party (NO EMOJIS, NO EM DASHES)
  const acknowledgmentText = `Dear ${reporterName},

Thank you for contacting the editorial office of ${JOURNAL.title}.

This email confirms that your formal authorship objection regarding the manuscript "${sub.title}" (${refNumber}) has been received and logged.

Under the Committee on Publication Ethics (COPE) protocols followed by ${JOURNAL.title}:
1. The submission has been flagged in our editorial system for review by the Editor-in-Chief.
2. The editorial office will initiate a formal inquiry, contacting both the corresponding author and disputing parties for relevant documentation.
3. No further progress toward acceptance or publication will occur until the dispute is formally addressed.

If you have supplementary files or evidence (e.g., prior drafts, email correspondence, institutional disclosures), please reply directly to this email.

Warm regards,
Editorial Office
${JOURNAL.title}
Faculty of Communication and Media Studies, University of Lagos`;

  await sendEmail({
    to: reporterEmail,
    subject: `Formal Dispute Received: ${refNumber}`,
    text: acknowledgmentText,
    template: "authorship_dispute_ack",
  });

  return {
    success: true,
    referenceNumber: refNumber,
    message: "Your authorship dispute has been logged. The editorial office has been notified immediately under COPE guidelines.",
  };
}
