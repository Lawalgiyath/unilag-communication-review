"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { JOURNAL } from "@/lib/constants";
import { DECISION_TYPES } from "@/lib/types";
import { TRANSITIONS } from "@/lib/workflow";
import type { SubmissionStatus, DecisionType } from "@/lib/types";

const DecisionSchema = z.object({
  decision: z.enum(["SEND_TO_REVIEW", "DESK_REJECT", "ACCEPT", "MINOR_REVISIONS", "MAJOR_REVISIONS", "REJECT"]),
  letterToAuthor: z.string().min(50, "Decision letter must be at least 50 characters"),
});

export type DecideState = { errors?: Record<string, string[]> };

const DECISION_TO_STATUS: Record<string, SubmissionStatus> = {
  DESK_REJECT: "DESK_REJECTED",
  ACCEPT: "ACCEPTED",
  MINOR_REVISIONS: "REVISIONS_REQUESTED",
  MAJOR_REVISIONS: "REVISIONS_REQUESTED",
  REJECT: "REJECTED",
  SEND_TO_REVIEW: "UNDER_REVIEW",
};

export async function recordDecisionAction(
  _prev: DecideState,
  formData: FormData
): Promise<DecideState> {
  const editor = await requireSession();
  const submissionId = formData.get("submissionId") as string;

  const raw = {
    decision: formData.get("decision"),
    letterToAuthor: formData.get("letterToAuthor"),
  };
  const parsed = DecisionSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const { decision, letterToAuthor } = parsed.data;

  const sub = await db.submission.findUnique({
    where: { id: submissionId },
    include: {
      correspondingAuthor: { select: { email: true, name: true } },
    },
  });
  if (!sub) return { errors: { decision: ["Submission not found"] } };

  const newStatus = DECISION_TO_STATUS[decision];

  // Validate transition
  const currentStatus = sub.status as SubmissionStatus;
  const allowed = TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(newStatus)) {
    return { errors: { decision: [`Cannot transition from "${currentStatus}" to "${newStatus}"`] } };
  }

  // Find the latest version number
  const latestVersion = await db.submissionVersion.findFirst({
    where: { submissionId },
    orderBy: { versionNumber: "desc" },
  });
  const versionNumber = latestVersion?.versionNumber || 1;

  await db.decision.create({
    data: {
      submissionId,
      versionNumber,
      decision,
      letterToAuthor,
      decidedById: editor.id,
    },
  });

  await db.submission.update({
    where: { id: submissionId },
    data: { status: newStatus },
  });

  await db.submissionEvent.create({
    data: { submissionId, type: `DECISION_${decision}`, actorId: editor.id },
  });

  await sendEmail({
    to: sub.correspondingAuthor.email,
    subject: `Editorial decision: ${sub.title.slice(0, 60)}`,
    text: `Dear ${sub.correspondingAuthor.name},\n\nThank you for submitting your manuscript to ${JOURNAL.title}. We have completed our review process and are pleased to communicate the editorial decision regarding your submission.\n\n${letterToAuthor}\n\nWarm regards,\n${JOURNAL.title} Editorial Office`,
    template: `decision_${decision.toLowerCase()}`,
  });

  redirect(`/dashboard/editor/submissions/${submissionId}`);
}
