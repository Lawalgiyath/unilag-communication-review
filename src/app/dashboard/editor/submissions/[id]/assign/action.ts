"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { sendEmail, brandedEmailHtml } from "@/lib/email";
import { JOURNAL, siteUrl } from "@/lib/constants";

const AssignSchema = z.object({
  reviewerEmail: z.string().email("Enter a valid email address"),
  dueDate: z.string().min(1, "Due date is required"),
  note: z.string().optional(),
});

export type AssignState = { errors?: Record<string, string[]>; success?: boolean };

export async function assignReviewerAction(
  _prev: AssignState,
  formData: FormData
): Promise<AssignState> {
  const editor = await requireSession();
  const submissionId = formData.get("submissionId") as string;

  const raw = {
    reviewerEmail: formData.get("reviewerEmail"),
    dueDate: formData.get("dueDate"),
    note: formData.get("note"),
  };
  const parsed = AssignSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const { reviewerEmail, dueDate, note } = parsed.data;

  // Find reviewer user
  const reviewer = await db.user.findUnique({ where: { email: reviewerEmail } });
  if (!reviewer) {
    return { errors: { reviewerEmail: ["No user found with this email address. Ask them to register first."] } };
  }

  const sub = await db.submission.findUnique({
    where: { id: submissionId },
    select: { title: true, status: true },
  });
  if (!sub) return { errors: { reviewerEmail: ["Submission not found"] } };

  // Check for existing active assignment
  const existing = await db.reviewAssignment.findFirst({
    where: {
      submissionId,
      reviewerId: reviewer.id,
      status: { in: ["INVITED", "ACCEPTED"] },
    },
  });
  if (existing) {
    return { errors: { reviewerEmail: ["This reviewer already has an active assignment for this submission"] } };
  }

  const latestVersion = await db.submissionVersion.findFirst({
    where: { submissionId },
    orderBy: { versionNumber: "desc" },
  });
  if (!latestVersion) {
    return { errors: { reviewerEmail: ["Submission has no files to review"] } };
  }

  const assignment = await db.reviewAssignment.create({
    data: {
      submissionId,
      reviewerId: reviewer.id,
      versionNumber: latestVersion.versionNumber,
      invitedById: editor.id,
      dueDate: new Date(dueDate),
      invitedAt: new Date(),
      status: "INVITED",
    },
  });

  // Transition submission to UNDER_REVIEW if needed
  if (sub.status === "SUBMITTED" || sub.status === "RESUBMITTED") {
    await db.submission.update({
      where: { id: submissionId },
      data: { status: "UNDER_REVIEW" },
    });
    await db.submissionEvent.create({
      data: { submissionId, type: "SENT_TO_REVIEW", actorId: editor.id },
    });
  }

  // Ensure reviewer role
  const hasRole = await db.userRole.findFirst({ where: { userId: reviewer.id, role: "REVIEWER" } });
  if (!hasRole) {
    await db.userRole.create({ data: { userId: reviewer.id, role: "REVIEWER" } });
  }

  const inviteUrl = `${siteUrl()}/dashboard/reviews/${assignment.id}`;
  const formattedDueDate = new Date(dueDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  await sendEmail({
    to: reviewer.email,
    subject: `Invitation to review manuscript: ${JOURNAL.shortTitle}`,
    text: `Dear ${reviewer.name},\n\nYou have been invited to review a manuscript submitted to ${JOURNAL.title}.\n\nTitle: "${sub.title}"\nDue date: ${formattedDueDate}\n\nPlease click the link below to respond:\n${inviteUrl}\n\n${note ? `Note from editor:\n${note}\n\n` : ""}Warm regards,\n${JOURNAL.title} Editorial Office`,
    html: brandedEmailHtml({
      title: `Peer Review Invitation - ${JOURNAL.title}`,
      bodyHtml: `
        <h3 style="color: #7b1113; margin-top: 0;">Peer Review Invitation</h3>
        <p>Dear <strong>${reviewer.name}</strong>,</p>
        <p>You have been invited by the Editorial Office to review a manuscript submitted to <strong>${JOURNAL.title}</strong>.</p>
        <div style="background-color: #f7f6f2; border-left: 3px solid #7b1113; padding: 14px 18px; margin: 18px 0; border-radius: 2px;">
          <p style="margin: 0; font-size: 15px; font-weight: 600; color: #1a1a1a;">${sub.title}</p>
          <p style="margin: 8px 0 0 0; font-size: 13px; color: #666666;">Due Date: <strong>${formattedDueDate}</strong></p>
        </div>
        ${note ? `<div style="background-color: #ffffff; border: 1px solid #e5e5e0; padding: 12px 16px; margin: 16px 0; border-radius: 4px;"><p style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; color: #666666; font-weight: 600; letter-spacing: 0.05em;">Note from Editor:</p><p style="margin: 0; font-size: 14px; font-style: italic; color: #333333;">${note}</p></div>` : ""}
        <p>Please click the button below to view the manuscript abstract and respond to this review invitation:</p>
      `,
      ctaText: "Respond to Review Invitation",
      ctaUrl: inviteUrl,
    }),
    template: "reviewer_invited",
  });

  redirect(`/dashboard/editor/submissions/${submissionId}`);
}
