"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { JOURNAL } from "@/lib/constants";

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

  await sendEmail({
    to: reviewer.email,
    subject: `Invitation to review: ${JOURNAL.shortTitle}`,
    text: `Dear ${reviewer.name},\n\nYou have been invited to review a manuscript submitted to ${JOURNAL.title}.\n\nPlease log in to respond to this invitation: ${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/dashboard/reviews/${assignment.id}\n\nDue date: ${new Date(dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}\n${note ? `\nNote from editor: ${note}\n` : ""}\nWarm regards,\n${JOURNAL.title} Editorial Office`,
    template: "reviewer_invited",
  });

  redirect(`/dashboard/editor/submissions/${submissionId}`);
}
