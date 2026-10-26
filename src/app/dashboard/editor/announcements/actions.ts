"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession, requireRole } from "@/lib/auth";

import { revalidatePath } from "next/cache";

const AnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(10, "Body must be at least 10 characters"),
  kind: z.enum(["NEWS", "CALL_FOR_PAPERS"]),
  imageUrl: z.string().optional(),
  linkUrl: z.string().optional(),
  linkText: z.string().optional(),
  publishedAt: z.string().optional(),
});

export type AnnouncementState = { errors?: Record<string, string[]>; success?: boolean };

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
    imageUrl: (formData.get("imageUrl") as string)?.trim() || undefined,
    linkUrl: (formData.get("linkUrl") as string)?.trim() || undefined,
    linkText: (formData.get("linkText") as string)?.trim() || undefined,
    publishedAt: formData.get("publishedAt"),
  };

  const parsed = AnnouncementSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  const pubDate = d.publishedAt ? new Date(d.publishedAt) : null;

  if (id) {
    const existing = await db.announcement.findUnique({ where: { id } });
    if (existing) {
      // Create revision snapshot of the previous state
      await db.announcementRevision.create({
        data: {
          announcementId: id,
          title: existing.title,
          body: existing.body,
          imageUrl: existing.imageUrl,
          linkUrl: existing.linkUrl,
          linkText: existing.linkText,
        },
      });

      // Keep only up to 2 previous revisions
      const revisions = await db.announcementRevision.findMany({
        where: { announcementId: id },
        orderBy: { createdAt: "desc" },
        skip: 2,
      });
      if (revisions.length > 0) {
        await db.announcementRevision.deleteMany({
          where: { id: { in: revisions.map((r) => r.id) } },
        });
      }
    }

    await db.announcement.update({
      where: { id },
      data: {
        title: d.title,
        body: d.body,
        kind: d.kind,
        imageUrl: d.imageUrl || null,
        linkUrl: d.linkUrl || null,
        linkText: d.linkText || null,
        publishedAt: pubDate,
      },
    });

    if (existing) {
      revalidatePath(`/announcements/${existing.slug}`);
    }
  } else {
    const slugBase = d.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const slug = `${slugBase}-${Math.random().toString(36).substring(2, 8)}`;
    await db.announcement.create({
      data: {
        slug,
        title: d.title,
        body: d.body,
        kind: d.kind,
        imageUrl: d.imageUrl || null,
        linkUrl: d.linkUrl || null,
        linkText: d.linkText || null,
        publishedAt: pubDate,
      },
    });
  }

  revalidatePath("/announcements");
  revalidatePath("/dashboard/editor/announcements");
  redirect("/dashboard/editor/announcements");
}

export async function revertAnnouncementAction(
  announcementId: string,
  revisionId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await requireSession();
  await requireRole(user, ["EDITOR", "ADMIN"]);

  const revision = await db.announcementRevision.findUnique({
    where: { id: revisionId },
  });

  if (!revision || revision.announcementId !== announcementId) {
    return { success: false, error: "Revision not found." };
  }

  const current = await db.announcement.findUnique({
    where: { id: announcementId },
  });

  if (!current) {
    return { success: false, error: "Announcement not found." };
  }

  // Snapshot current state as revision
  await db.announcementRevision.create({
    data: {
      announcementId,
      title: current.title,
      body: current.body,
      imageUrl: current.imageUrl,
      linkUrl: current.linkUrl,
      linkText: current.linkText,
    },
  });

  // Keep up to 2 revisions
  const revisions = await db.announcementRevision.findMany({
    where: { announcementId },
    orderBy: { createdAt: "desc" },
    skip: 2,
  });
  if (revisions.length > 0) {
    await db.announcementRevision.deleteMany({
      where: { id: { in: revisions.map((r) => r.id) } },
    });
  }

  // Revert announcement to revision content
  await db.announcement.update({
    where: { id: announcementId },
    data: {
      title: revision.title,
      body: revision.body,
      imageUrl: revision.imageUrl,
      linkUrl: revision.linkUrl,
      linkText: revision.linkText,
    },
  });

  revalidatePath(`/announcements/${current.slug}`);
  revalidatePath("/announcements");
  revalidatePath("/dashboard/editor/announcements");
  revalidatePath(`/dashboard/editor/announcements/${current.slug}/edit`);

  return { success: true };
}
