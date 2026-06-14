"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { JOURNAL } from "@/lib/constants";
import { RECOMMENDATIONS } from "@/lib/types";

// ─── Accept / Decline invitation ─────────────────────────────────────────────

export type RespondState = { errors?: Record<string, string[]> };

export async function respondToInvitationAction(
  _prev: RespondState,
  formData: FormData
): Promise<RespondState> {
  const user = await requireSession();
  const assignmentId = formData.get("assignmentId") as string;
  const response = formData.get("response") as string;

  if (!["ACCEPTED", "DECLINED"].includes(response)) {
    return { errors: { form: ["Invalid response"] } };
  }

  const assignment = await db.reviewAssignment.findFirst({
    where: { id: assignmentId, reviewerId: user.id, status: "INVITED" },
    include: { submission: { select: { id: true, title: true, correspondingAuthor: { select: { email: true } } } } },
  });
  if (!assignment) return { errors: { form: ["Assignment not found or already responded"] } };

  await db.reviewAssignment.update({
    where: { id: assignmentId },
    data: {
      status: response as "ACCEPTED" | "DECLINED",
      respondedAt: new Date(),
    },
  });

  // Notify editor
  const editors = await db.userRole.findMany({
    where: { role: "EDITOR" },
    include: { user: { select: { email: true, name: true } } },
  });
  for (const ed of editors) {
    await sendEmail({
      to: ed.user.email,
      subject: `Reviewer ${response.toLowerCase()} invitation: ${assignment.submission.title.slice(0, 50)}`,
      text: `${user.name} has ${response.toLowerCase()} the review invitation.\n\nManuscript: ${assignment.submission.title}\n\n${JOURNAL.title} system`,
      template: "reviewer_responded",
    });
  }

  redirect(`/dashboard/reviews/${assignmentId}`);
}

// ─── Submit review ────────────────────────────────────────────────────────────

const ReviewSchema = z.object({
  recommendation: z.enum(["ACCEPT", "MINOR_REVISIONS", "MAJOR_REVISIONS", "REJECT"], {
    errorMap: () => ({ message: "Select a recommendation" }),
  }),
  commentsToAuthor: z.string().min(100, "Comments to author must be at least 100 characters"),
  commentsToEditor: z.string().optional(),
});

export type SubmitReviewState = { errors?: Record<string, string[]> };

export async function submitReviewAction(
  _prev: SubmitReviewState,
  formData: FormData
): Promise<SubmitReviewState> {
  const user = await requireSession();
  const assignmentId = formData.get("assignmentId") as string;

  const assignment = await db.reviewAssignment.findFirst({
    where: { id: assignmentId, reviewerId: user.id, status: "ACCEPTED" },
    include: {
      submission: { select: { id: true, title: true, correspondingAuthorId: true } },
    },
  });
  if (!assignment) {
    return { errors: { form: ["Assignment not found or not eligible for review submission"] } };
  }

  const raw = {
    recommendation: formData.get("recommendation"),
    commentsToAuthor: formData.get("commentsToAuthor"),
    commentsToEditor: formData.get("commentsToEditor"),
  };
  const parsed = ReviewSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;

  await db.review.create({
    data: {
      assignmentId,
      recommendation: d.recommendation,
      commentsToAuthor: d.commentsToAuthor,
      commentsToEditor: d.commentsToEditor || null,
    },
  });

  await db.reviewAssignment.update({
    where: { id: assignmentId },
    data: { status: "SUBMITTED" },
  });

  await db.submissionEvent.create({
    data: {
      submissionId: assignment.submission.id,
      type: "REVIEW_SUBMITTED",
      actorId: user.id,
    },
  });

  // Notify editor
  const editors = await db.userRole.findMany({
    where: { role: "EDITOR" },
    include: { user: { select: { email: true } } },
  });
  for (const ed of editors) {
    await sendEmail({
      to: ed.user.email,
      subject: `Review submitted: ${assignment.submission.title.slice(0, 50)}`,
      text: `A review has been submitted for "${assignment.submission.title}".\n\nRecommendation: ${d.recommendation.replace(/_/g, " ")}\n\n${JOURNAL.title} system`,
      template: "review_submitted",
    });
  }

  // Confirm to reviewer
  await sendEmail({
    to: user.email,
    subject: "Thank you for your review",
    text: `Dear ${user.name},\n\nThank you for submitting your peer review. Your contribution is greatly appreciated.\n\nWarm regards,\n${JOURNAL.title} Editorial Office`,
    template: "review_received_confirmation",
  });

  redirect(`/dashboard/reviews/${assignmentId}?submitted=1`);
}
