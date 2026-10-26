"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession, requireRole } from "@/lib/auth";

const PageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(10, "Body must be at least 10 characters"),
});

export type PageState = { errors?: Record<string, string[]>; success?: boolean };

export async function updatePageAction(
  _prev: PageState,
  formData: FormData
): Promise<PageState> {
  const user = await requireSession();
  await requireRole(user, ["EDITOR", "ADMIN"]);

  const slug = formData.get("slug") as string;
  const raw = {
    title: formData.get("title"),
    body: formData.get("body"),
  };

  const parsed = PageSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const existing = await db.page.findUnique({ where: { slug } });
  if (existing) {
    // Snapshot previous version as revision
    await db.pageRevision.create({
      data: {
        pageId: existing.id,
        title: existing.title,
        body: existing.body,
      },
    });

    // Retain only up to 2 previous revisions
    const oldRevs = await db.pageRevision.findMany({
      where: { pageId: existing.id },
      orderBy: { createdAt: "desc" },
      skip: 2,
    });
    if (oldRevs.length > 0) {
      await db.pageRevision.deleteMany({
        where: { id: { in: oldRevs.map((r) => r.id) } },
      });
    }

    await db.page.update({
      where: { slug },
      data: {
        title: parsed.data.title,
        body: parsed.data.body,
        updatedById: user.id,
      },
    });

    revalidatePath(`/${slug}`);
    revalidatePath(`/dashboard/editor/pages/${slug}`);
  }

  revalidatePath("/dashboard/editor/pages");
  redirect("/dashboard/editor/pages");
}

export async function revertPageAction(
  pageId: string,
  revisionId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await requireSession();
  await requireRole(user, ["EDITOR", "ADMIN"]);

  const revision = await db.pageRevision.findUnique({
    where: { id: revisionId },
  });

  if (!revision || revision.pageId !== pageId) {
    return { success: false, error: "Revision not found." };
  }

  const current = await db.page.findUnique({
    where: { id: pageId },
  });

  if (!current) {
    return { success: false, error: "Page not found." };
  }

  // Snapshot current state as revision
  await db.pageRevision.create({
    data: {
      pageId: current.id,
      title: current.title,
      body: current.body,
    },
  });

  // Keep up to 2 revisions
  const oldRevs = await db.pageRevision.findMany({
    where: { pageId: current.id },
    orderBy: { createdAt: "desc" },
    skip: 2,
  });
  if (oldRevs.length > 0) {
    await db.pageRevision.deleteMany({
      where: { id: { in: oldRevs.map((r) => r.id) } },
    });
  }

  // Restore revision
  await db.page.update({
    where: { id: pageId },
    data: {
      title: revision.title,
      body: revision.body,
      updatedById: user.id,
    },
  });

  revalidatePath(`/${current.slug}`);
  revalidatePath(`/dashboard/editor/pages/${current.slug}`);
  revalidatePath("/dashboard/editor/pages");

  return { success: true };
}
