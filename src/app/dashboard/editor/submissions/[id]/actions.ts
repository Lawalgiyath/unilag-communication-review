"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession, requireRole } from "@/lib/auth";
import { checkCrossrefDuplicates } from "@/lib/crossref";

export async function runCrossrefScanAction(submissionId: string) {
  const user = await requireSession();
  await requireRole(user, ["EDITOR", "ADMIN"]);

  const sub = await db.submission.findUnique({
    where: { id: submissionId },
  });

  if (!sub) {
    return { success: false, error: "Submission not found" };
  }

  try {
    const result = await checkCrossrefDuplicates(sub.title);

    if (result.foundDuplicate && result.matches.length > 0) {
      const top = result.matches[0];
      await db.submissionEvent.create({
        data: {
          submissionId: sub.id,
          type: "CROSSREF_DUPLICATE_FLAG",
          actorId: user.id,
          payload: JSON.stringify({
            matchTitle: top.title,
            doi: top.doi,
            publisher: top.publisher,
            similarity: top.similarity,
            url: top.url,
            flaggedAt: new Date().toISOString(),
            manualScan: true,
          }),
        },
      });
    } else {
      await db.submissionEvent.create({
        data: {
          submissionId: sub.id,
          type: "CROSSREF_CLEAN_SCAN",
          actorId: user.id,
          payload: JSON.stringify({
            scannedAt: new Date().toISOString(),
            highestSimilarity: result.highestSimilarity,
            manualScan: true,
          }),
        },
      });
    }

    revalidatePath(`/dashboard/editor/submissions/${submissionId}`);
    return {
      success: true,
      foundDuplicate: result.foundDuplicate,
      highestSimilarity: result.highestSimilarity,
    };
  } catch (err) {
    console.error("[crossref:scan:error]", err);
    return { success: false, error: "Failed to scan Crossref" };
  }
}
