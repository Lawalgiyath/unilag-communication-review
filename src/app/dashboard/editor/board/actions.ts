"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession, requireRole } from "@/lib/auth";

const BoardMemberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.string().min(2, "Role is required"),
  affiliation: z.string().min(2, "Affiliation is required"),
  orcid: z
    .string()
    .regex(/^(\d{4}-\d{4}-\d{4}-\d{3}[\dX])?$/, "Invalid ORCID format")
    .optional()
    .or(z.literal("")),
  photoUrl: z.string().optional().or(z.literal("")),
  order: z.coerce.number().int().min(0),
});

export type BoardMemberState = { errors?: Record<string, string[]> };

export async function saveBoardMemberAction(
  _prev: BoardMemberState,
  formData: FormData
): Promise<BoardMemberState> {
  const user = await requireSession();
  await requireRole(user, ["EDITOR", "ADMIN"]);

  const id = formData.get("id") as string | null;
  const raw = {
    name: formData.get("name"),
    role: formData.get("role"),
    affiliation: formData.get("affiliation"),
    orcid: formData.get("orcid"),
    photoUrl: formData.get("photoUrl"),
    order: formData.get("order"),
  };

  const parsed = BoardMemberSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;

  if (id) {
    await db.boardMember.update({
      where: { id },
      data: {
        name: d.name,
        role: d.role,
        affiliation: d.affiliation,
        orcid: d.orcid || null,
        photoUrl: d.photoUrl || null,
        order: d.order,
      },
    });
  } else {
    await db.boardMember.create({
      data: {
        name: d.name,
        role: d.role,
        affiliation: d.affiliation,
        orcid: d.orcid || null,
        photoUrl: d.photoUrl || null,
        order: d.order,
      },
    });
  }

  revalidatePath("/dashboard/editor/board");
  revalidatePath("/editorial-board");
  redirect("/dashboard/editor/board");
}
