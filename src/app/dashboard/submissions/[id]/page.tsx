import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { SUBMISSION_STATUS_LABELS, formatSubmissionNumber } from "@/lib/types";
import { ARTICLE_TYPES } from "@/lib/constants";
import { ConfirmSubmitButton } from "@/components/common/ConfirmSubmitButton";

export const metadata: Metadata = { title: "Submission Detail" };
export const dynamic = "force-dynamic";

export default async function SubmissionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const user = await requireSession();
  const { id } = await params;
  const { submitted } = await searchParams;

  const sub = await db.submission.findFirst({
    where: { id, correspondingAuthorId: user.id },
    include: {
      authors: { orderBy: { order: "asc" } },
      versions: {
        orderBy: { versionNumber: "desc" },
        include: { anonymizedFile: true, titlePageFile: true },
      },
      decisions: { orderBy: { createdAt: "desc" } },
      events: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!sub) notFound();

  const submissionRef = formatSubmissionNumber(sub.number, sub.submittedAt.getFullYear());
  const statusLabel = SUBMISSION_STATUS_LABELS[sub.status as keyof typeof SUBMISSION_STATUS_LABELS] ?? sub.status;
  const articleTypeLabel = ARTICLE_TYPES[sub.articleType as keyof typeof ARTICLE_TYPES] ?? sub.articleType;
  const canRevise = sub.status === "REVISIONS_REQUESTED";
  const canWithdraw = !["PUBLISHED", "DESK_REJECTED", "REJECTED", "WITHDRAWN"].includes(sub.status);
  const latestDecision = sub.decisions[0];

  return (
    <div className="mx-auto max-w-3xl">
      {submitted === "1" && (
        <div className="alert alert-success mb-6">
          ✓ Your manuscript has been received. A confirmation has been sent to your email address.
        </div>
      )}

      <div className="page-header">
        <div>
          <p className="text-xs font-mono text-secondary">{submissionRef}</p>
          <h1 className="page-title mt-1">{sub.title}</h1>
        </div>
        <span className={`status-badge status-${sub.status} mt-1`}>{statusLabel}</span>
      </div>

      {/* Status explanation */}
      <div className="alert alert-info mb-8">
        {sub.status === "SUBMITTED" && "Your manuscript has been received and is awaiting editorial screening."}
        {sub.status === "UNDER_REVIEW" && "Your manuscript is currently undergoing peer review. We will notify you when the review is complete."}
        {sub.status === "REVISIONS_REQUESTED" && "The editor has requested revisions. Please review the decision letter below and upload a revised manuscript."}
        {sub.status === "RESUBMITTED" && "Your revised manuscript has been received and is under re-review."}
        {sub.status === "ACCEPTED" && "Congratulations! Your manuscript has been accepted for publication. It is now in production."}
        {sub.status === "IN_PRODUCTION" && "Your manuscript is being typeset. It will be published shortly."}
        {sub.status === "PUBLISHED" && "Your article has been published. Thank you for contributing to UNILAG Communication Review."}
        {sub.status === "DESK_REJECTED" && "Your manuscript has not proceeded to peer review. Please see the decision letter for details."}
        {sub.status === "REJECTED" && "After peer review, the editor has decided not to accept this manuscript. Please see the decision letter."}
        {sub.status === "WITHDRAWN" && "This submission was withdrawn."}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_240px]">
        <div>
          {/* Decision letter */}
          {latestDecision && (
            <section aria-labelledby="decision-heading" className="mb-8">
              <h2 id="decision-heading" className="section-label border-b border-hairline pb-2">
                Decision Letter
              </h2>
              <div className="mt-4 border border-hairline bg-paper-dark p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-secondary">
                  {latestDecision.decision.replace(/_/g, " ")} ·{" "}
                  {format(latestDecision.createdAt, "d MMMM yyyy")}
                </p>
                <p className="prose-journal mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                  {latestDecision.letterToAuthor}
                </p>
              </div>
              {canRevise && (
                <div className="mt-4">
                  <Link href={`/dashboard/submissions/${sub.id}/revise`} className="btn btn-primary">
                    Upload Revised Manuscript →
                  </Link>
                </div>
              )}
            </section>
          )}

          {/* Events timeline */}
          <section aria-labelledby="history-heading">
            <h2 id="history-heading" className="section-label border-b border-hairline pb-2">
              History
            </h2>
            <div className="timeline mt-4">
              {sub.events.map((ev, i) => (
                <div key={ev.id} className={`timeline-item ${i === sub.events.length - 1 ? "highlight" : ""}`}>
                  <p className="timeline-time">{format(ev.createdAt, "d MMM yyyy, HH:mm")}</p>
                  <p className="timeline-text">{ev.type.replace(/_/g, " ").toLowerCase().replace(/^\w/, c => c.toUpperCase())}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Details */}
          <div className="border border-hairline p-4">
            <p className="section-label mb-3">Manuscript details</p>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-secondary">Type</dt>
                <dd className="text-ink">{articleTypeLabel}</dd>
              </div>
              <div>
                <dt className="text-secondary">Submitted</dt>
                <dd className="text-ink">{format(sub.submittedAt, "d MMM yyyy")}</dd>
              </div>
              {sub.wordCount && (
                <div>
                  <dt className="text-secondary">Word count</dt>
                  <dd className="text-ink">{sub.wordCount.toLocaleString()}</dd>
                </div>
              )}
              <div>
                <dt className="text-secondary">Keywords</dt>
                <dd className="text-ink">{sub.keywordsCsv}</dd>
              </div>
            </dl>
          </div>

          {/* Authors */}
          <div className="border border-hairline p-4">
            <p className="section-label mb-3">Authors</p>
            <ul className="space-y-2 text-sm">
              {sub.authors.map((a) => (
                <li key={a.id}>
                  <span className="font-medium text-ink">{a.name}</span>
                  {a.isCorresponding && (
                    <span className="ml-1 text-xs text-secondary">(corresponding)</span>
                  )}
                  {a.affiliation && <p className="text-secondary">{a.affiliation}</p>}
                </li>
              ))}
            </ul>
          </div>

          {/* Files */}
          {sub.versions.length > 0 && (
            <div className="border border-hairline p-4">
              <p className="section-label mb-3">Uploaded files</p>
              <ul className="space-y-1 text-sm">
                {sub.versions.map((v) => (
                  <li key={v.id}>
                    <span className="text-secondary">v{v.versionNumber}:</span>{" "}
                    <span className="text-ink">{v.anonymizedFile.originalName}</span>
                    {v.titlePageFile && (
                      <>
                        {" "}+ <span className="text-ink">{v.titlePageFile.originalName}</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          {canWithdraw && (
            <form
              action={async () => {
                "use server";
                const { db: prisma } = await import("@/lib/db");
                const { requireSession: rs } = await import("@/lib/auth");
                const u = await rs();
                await prisma.submission.update({
                  where: { id: sub.id, correspondingAuthorId: u.id },
                  data: { status: "WITHDRAWN", withdrawnAt: new Date() },
                });
                await prisma.submissionEvent.create({
                  data: { submissionId: sub.id, type: "WITHDRAWN", actorId: u.id },
                });
                const { revalidatePath } = await import("next/cache");
                revalidatePath(`/dashboard/submissions/${sub.id}`);
              }}
            >
              <ConfirmSubmitButton
                confirmMessage="Withdraw this submission? This cannot be undone."
                className="btn btn-secondary w-full text-error"
              >
                Withdraw submission
              </ConfirmSubmitButton>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
