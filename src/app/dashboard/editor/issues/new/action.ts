"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

const IssueSchema = z.object({
  volumeNumber: z.coerce.number().int().positive("Volume number is required"),
  volumeYear: z.coerce.number().int().min(1990).max(new Date().getFullYear() + 2),
  issueNumber: z.coerce.number().int().positive("Issue number is required"),
  issueTitle: z.string().optional(),
  publishedAt: z.string().optional(),
  isCurrent: z.string().optional(),
});

export type CreateIssueState = { errors?: Record<string, string[]> };

export async function createIssueAction(
  _prev: CreateIssueState,
  formData: FormData
): Promise<CreateIssueState> {
  await requireSession();
  const raw = {
    volumeNumber: formData.get("volumeNumber"),
    volumeYear: formData.get("volumeYear"),
    issueNumber: formData.get("issueNumber"),
    issueTitle: formData.get("issueTitle"),
    publishedAt: formData.get("publishedAt"),
    isCurrent: formData.get("isCurrent"),
  };
  const parsed = IssueSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;

  // Upsert volume
  const volume = await db.volume.upsert({
    where: { number: d.volumeNumber },
    create: { number: d.volumeNumber, year: d.volumeYear },
    update: { year: d.volumeYear },
  });

  // Check if issue exists
  const existing = await db.issue.findFirst({
    where: { volumeId: volume.id, number: d.issueNumber },
  });
  if (existing) {
    return { errors: { issueNumber: [`Vol. ${d.volumeNumber}, Issue ${d.issueNumber} already exists`] } };
  }

  const isCurrent = d.isCurrent === "on";
  if (isCurrent) {
    await db.issue.updateMany({ data: { isCurrent: false } });
  }

  await db.issue.create({
    data: {
      volumeId: volume.id,
      number: d.issueNumber,
      title: d.issueTitle || null,
      publishedAt: d.publishedAt ? new Date(d.publishedAt) : null,
      isCurrent,
    },
  });

  redirect("/dashboard/editor/issues");
}
