"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { saveUpload, FileValidationError } from "@/lib/files";
import { sendEmail } from "@/lib/email";
import { JOURNAL } from "@/lib/constants";

const ReviseSchema = z.object({
  authorNote: z.string().min(50, "Please provide a response to reviewers (min 50 characters)"),
});

export type ReviseState = { errors?: Record<string, string[]> };

export async function reviseAction(_prev: ReviseState, formData: FormData): Promise<ReviseState> {
  const user = await requireSession();
  const submissionId = formData.get("submissionId") as string;

  const sub = await db.submission.findFirst({
    where: { id: submissionId, correspondingAuthorId: user.id, status: "REVISIONS_REQUESTED" },
  });
  if (!sub) return { errors: { form: ["Submission not found or not eligible for revision"] } };

  const raw = { authorNote: formData.get("authorNote") };
  const parsed = ReviseSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const manuscriptFile = formData.get("manuscript") as File | null;
  if (!manuscriptFile || manuscriptFile.size === 0) {
    return { errors: { manuscript: ["Please upload the revised manuscript"] } };
  }

  try {
    const { id: anonymizedFileId } = await saveUpload({
      file: manuscriptFile,
      kind: "ANONYMIZED_MANUSCRIPT",
      uploadedById: user.id,
    });

    let titlePageFileId: string | undefined;
    const tpf = formData.get("titlePage") as File | null;
    if (tpf && tpf.size > 0) {
      const { id } = await saveUpload({ file: tpf, kind: "TITLE_PAGE", uploadedById: user.id });
      titlePageFileId = id;
    }

    const count = await db.submissionVersion.count({ where: { submissionId } });
    await db.submissionVersion.create({
      data: {
        submissionId,
        versionNumber: count + 1,
        anonymizedFileId,
        titlePageFileId: titlePageFileId ?? null,
        authorNote: parsed.data.authorNote,
      },
    });

    await db.submission.update({ where: { id: submissionId }, data: { status: "RESUBMITTED" } });

    await db.submissionEvent.create({
      data: { submissionId, type: "RESUBMITTED", actorId: user.id },
    });

    await sendEmail({
      to: user.email,
      subject: `Revision received: ${sub.title.slice(0, 60)}`,
      text: `Dear ${user.name},\n\nYour revised manuscript has been received and will be reviewed by the editorial team.\n\nWarm regards,\n${JOURNAL.title} Editorial Office`,
      template: "revision_received",
    });

  } catch (e) {
    if (e instanceof FileValidationError) return { errors: { manuscript: [e.message] } };
    throw e;
  }

  redirect(`/dashboard/submissions/${submissionId}`);
}
