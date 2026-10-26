import { db } from "@/lib/db";
import { requireSession, requireRole } from "@/lib/auth";
import AssignReviewerClient from "./AssignReviewerClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Assign Reviewer" };
export const dynamic = "force-dynamic";

export default async function AssignReviewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireSession();
  await requireRole(user, ["EDITOR", "ADMIN"]);
  const { id } = await params;

  const [sub, reviewers] = await Promise.all([
    db.submission.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        correspondingAuthorId: true,
        authors: { select: { email: true } },
      },
    }),
    db.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        affiliation: true,
        orcid: true,
        reviewAssignments: {
          where: {
            status: { in: ["PENDING", "ACCEPTED"] },
          },
          select: { id: true },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!sub) {
    return <div className="mx-auto max-w-xl p-8">Submission not found</div>;
  }

  const authorEmails = new Set(
    sub.authors.map((a) => a.email.toLowerCase().trim())
  );

  const availableReviewers = reviewers
    .filter(
      (r) =>
        r.id !== sub.correspondingAuthorId &&
        !authorEmails.has(r.email.toLowerCase().trim())
    )
    .map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      affiliation: r.affiliation ?? "",
      orcid: r.orcid ?? "",
      activeCount: r.reviewAssignments.length,
    }));

  return (
    <AssignReviewerClient
      submissionId={id}
      submissionTitle={sub.title}
      reviewers={availableReviewers}
    />
  );
}
