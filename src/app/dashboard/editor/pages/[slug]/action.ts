"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession, requireRole } from "@/lib/auth";

const PageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(10, "Body must be at least 10 characters"),
});

export type PageState = { errors?: Record<string, string[]> };

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

  await db.page.update({
    where: { slug },
    data: {
      title: parsed.data.title,
      body: parsed.data.body,
      updatedById: user.id,
    },
  });

  redirect("/dashboard/editor/pages");
}
