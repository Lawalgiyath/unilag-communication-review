"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession, requireRole } from "@/lib/auth";

const AnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(10, "Body must be at least 10 characters"),
  kind: z.enum(["NEWS", "CALL_FOR_PAPERS"]),
  publishedAt: z.string().optional(),
});

export type AnnouncementState = { errors?: Record<string, string[]> };

export async function saveAnnouncementAction(
  _prev: AnnouncementState,
  formData: FormData
): Promise<AnnouncementState> {
  const user = await requireSession();
  await requireRole(user, ["EDITOR", "ADMIN"]);

  const id = formData.get("id") as string | null;
  const raw = {
    title: formData.get("title"),
    body: formData.get("body"),
    kind: formData.get("kind"),
    publishedAt: formData.get("publishedAt"),
  };

  const parsed = AnnouncementSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  const pubDate = d.publishedAt ? new Date(d.publishedAt) : null;

  if (id) {
    await db.announcement.update({
      where: { id },
      data: {
        title: d.title,
        body: d.body,
        kind: d.kind,
        publishedAt: pubDate,
      },
    });
  } else {
    const slugBase = d.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const slug = `${slugBase}-${Math.random().toString(36).substring(2, 8)}`;
    await db.announcement.create({
      data: {
        slug,
        title: d.title,
        body: d.body,
        kind: d.kind,
        publishedAt: pubDate,
      },
    });
  }

  redirect("/dashboard/editor/announcements");
}
