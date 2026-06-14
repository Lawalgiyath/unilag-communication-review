import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CurrentIssuePage() {
  const issue = await db.issue.findFirst({
    where: { isCurrent: true, publishedAt: { not: null } },
    include: { volume: true },
  });

  const latest = issue ?? await db.issue.findFirst({
    where: { publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    include: { volume: true },
  });

  if (!latest) redirect("/archives");
  redirect(`/issues/${latest.volume.number}/${latest.number}`);
}
