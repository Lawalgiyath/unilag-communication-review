"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession, requireRole } from "@/lib/auth";

export async function toggleUserRoleAction(userId: string, role: string, currentHasRole: boolean) {
  const currentUser = await requireSession();
  await requireRole(currentUser, ["EDITOR", "ADMIN"]);

  if (currentHasRole) {
    await db.userRole.deleteMany({
      where: { userId, role },
    });
  } else {
    await db.userRole.create({
      data: { userId, role },
    });
  }

  revalidatePath("/dashboard/editor/reviewers");
}

export async function toggleUserActiveAction(userId: string, currentIsActive: boolean) {
  const currentUser = await requireSession();
  await requireRole(currentUser, ["EDITOR", "ADMIN"]);

  // Prevent self-deactivation
  if (currentUser.id === userId && currentIsActive) {
    throw new Error("You cannot deactivate your own account.");
  }

  await db.user.update({
    where: { id: userId },
    data: { isActive: !currentIsActive },
  });

  revalidatePath("/dashboard/editor/reviewers");
}
