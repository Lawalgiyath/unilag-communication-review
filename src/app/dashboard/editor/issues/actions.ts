"use server";

import { db } from "@/lib/db";
import { requireSession, requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function deleteIssueAction(issueId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await requireSession();
  await requireRole(user, ["EDITOR", "ADMIN"]);

  const issue = await db.issue.findUnique({
    where: { id: issueId },
    include: {
      articles: { select: { id: true, title: true } },
      volume: true,
    },
  });

  if (!issue) {
    return { success: false, error: "Issue not found." };
  }

  if (issue.articles.length > 0) {
    return {
      success: false,
      error: `Cannot delete Vol. ${issue.volume.number}, Issue ${issue.number} because it contains ${issue.articles.length} article(s). Please move or unpublish the articles first.`,
    };
  }

  const volumeId = issue.volumeId;

  await db.issue.delete({
    where: { id: issueId },
  });

  // If the volume has no remaining issues, clean up the empty volume
  const remainingIssues = await db.issue.count({
    where: { volumeId },
  });
  if (remainingIssues === 0) {
    await db.volume.delete({ where: { id: volumeId } }).catch(() => {});
  }

  revalidatePath("/dashboard/editor/issues");
  revalidatePath("/archives");
  revalidatePath("/current");
  revalidatePath("/");

  return { success: true };
}
