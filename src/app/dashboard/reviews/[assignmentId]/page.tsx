import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format, isPast, differenceInDays } from "date-fns";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { RECOMMENDATION_LABELS } from "@/lib/types";
import ReviewForm from "./ReviewForm";

export const metadata: Metadata = { title: "Review Assignment" };
export const dynamic = "force-dynamic";

export default async function ReviewAssignmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ assignmentId: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const user = await requireSession();
  const { assignmentId } = await params;
  const { submitted } = await searchParams;

  const assignment = await db.reviewAssignment.findFirst({
    where: { id: assignmentId, reviewerId: user.id },
    include: {
      submission: {
        select: {
          title: true,
          articleType: true,
          id: true,
          versions: {
            orderBy: { versionNumber: "desc" },
            take: 1,
            include: { anonymizedFile: true },
          },
        },
      },
      review: true,
    },
  });

  if (!assignment) notFound();

  const overdue = isPast(assignment.dueDate) && assignment.status === "ACCEPTED";
  const daysLeft = differenceInDays(assignment.dueDate, new Date());
  const isInvited = assignment.status === "INVITED";
  const isAccepted = assignment.status === "ACCEPTED";
  const isCompleted = assignment.status === "SUBMITTED";
  const isDeclined = assignment.status === "DECLINED";

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard/reviews" className="text-sm text-secondary hover:text-maroon">
        ← All reviews
      </Link>

      {submitted === "1" && (
        <div className="alert alert-success mt-4">
          ✓ Your review has been submitted. Thank you for your contribution.
        </div>
      )}

      <div className="page-header mt-4">
        <div>
          <h1 className="page-title">[Anonymized Manuscript]</h1>
          <p className="page-subtitle">{assignment.submission.articleType.replace(/_/g, " ")}</p>
        </div>
        <span className={`status-badge assignment-${assignment.status}`}>{assignment.status}</span>
      </div>

      {/* Due date banner */}
      {isAccepted && (
        <div className={`alert ${overdue ? "alert-error" : daysLeft <= 7 ? "alert-warning" : "alert-info"} mb-6`}>
          {overdue
            ? `⚠️ This review is ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? "s" : ""} overdue. Please submit as soon as possible.`
            : `Review due: ${format(assignment.dueDate, "d MMMM yyyy")} (${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining)`}
        </div>
      )}

      {/* Invitation response */}
      {isInvited && (
        <ReviewForm assignmentId={assignmentId} mode="invitation" />
      )}

      {/* Review form */}
      {isAccepted && !isCompleted && (
        <ReviewForm
          assignmentId={assignmentId}
          mode="review"
          manuscriptFileId={assignment.submission.versions[0]?.anonymizedFile?.id}
          submissionId={assignment.submission.id}
        />
      )}

      {/* Submitted review read-only */}
      {isCompleted && assignment.review && (
        <section aria-labelledby="review-heading" className="mt-6">
          <h2 id="review-heading" className="section-label border-b border-hairline pb-2 mb-5">
            Your submitted review
          </h2>
          <div className="space-y-4">
            <div className="border border-hairline p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-secondary">Recommendation</p>
              <p className="mt-1 font-display text-lg font-semibold text-ink">
                {RECOMMENDATION_LABELS[assignment.review.recommendation as keyof typeof RECOMMENDATION_LABELS]}
              </p>
            </div>
            <div className="border border-hairline p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-secondary">Comments to author</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                {assignment.review.commentsToAuthor}
              </p>
            </div>
            {assignment.review.commentsToEditor && (
              <div className="border border-hairline p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-secondary">
                  Confidential comments to editor
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                  {assignment.review.commentsToEditor}
                </p>
              </div>
            )}
            <p className="text-xs text-secondary">
              Submitted: {assignment.review?.submittedAt ? format(assignment.review.submittedAt, "d MMMM yyyy, HH:mm") : "—"}
            </p>
          </div>
        </section>
      )}

      {isDeclined && (
        <div className="alert alert-info mt-6">
          You declined this review invitation on{" "}
          {assignment.respondedAt ? format(assignment.respondedAt, "d MMMM yyyy") : "—"}.
        </div>
      )}
    </div>
  );
}
