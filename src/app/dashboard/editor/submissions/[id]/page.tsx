import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { db } from "@/lib/db";
import { formatSubmissionNumber, SUBMISSION_STATUS_LABELS, RECOMMENDATION_LABELS, ARTICLE_TYPES } from "@/lib/constants-ext";
import { TRANSITIONS } from "@/lib/workflow";
import type { SubmissionStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Editor: Submission" };
export const dynamic = "force-dynamic";

export default async function EditorSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const sub = await db.submission.findUnique({
    where: { id },
    include: {
      correspondingAuthor: { select: { name: true, email: true } },
      authors: { orderBy: { order: "asc" } },
      versions: {
        orderBy: { versionNumber: "desc" },
        include: { anonymizedFile: true, titlePageFile: true },
      },
      assignments: {
        include: {
          reviewer: { select: { name: true, email: true } },
          review: true,
        },
        orderBy: { invitedAt: "desc" },
      },
      decisions: { orderBy: { createdAt: "desc" } },
      events: { orderBy: { createdAt: "asc" } },
      article: true,
    },
  });

  if (!sub) notFound();

  const status = sub.status as SubmissionStatus;
  const allowedTransitions = TRANSITIONS[status] ?? [];
  const subRef = formatSubmissionNumber(sub.number, sub.submittedAt.getFullYear());

  return (
    <div className="mx-auto max-w-5xl">
      <nav className="text-xs text-secondary">
        <Link href="/dashboard/editor" className="hover:text-maroon">Editorial Inbox</Link>
        {" / "}
        <span className="font-mono">{subRef}</span>
      </nav>

      <div className="page-header mt-3">
        <div className="flex-1">
          <p className="font-mono text-xs text-secondary">{subRef}</p>
          <h1 className="page-title mt-1">{sub.title}</h1>
          <p className="page-subtitle">
            {sub.correspondingAuthor.name} · {sub.correspondingAuthor.email}
          </p>
        </div>
        <span className={`status-badge status-${sub.status} mt-1 shrink-0`}>
          {SUBMISSION_STATUS_LABELS[status]}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Main column */}
        <div className="space-y-8">
          {/* Abstract */}
          <section aria-labelledby="abstract-head">
            <h2 id="abstract-head" className="section-label border-b border-hairline pb-2">Abstract</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink">{sub.abstract}</p>
          </section>

          {/* Reviews */}
          <section aria-labelledby="reviews-head">
            <h2 id="reviews-head" className="section-label border-b border-hairline pb-2">Reviewer Assignments</h2>
            {sub.assignments.length === 0 && (
              <p className="mt-3 text-sm text-secondary">No reviewers assigned.</p>
            )}
            {sub.assignments.map((a) => (
              <div key={a.id} className="mt-3 border border-hairline p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-ink">{a.reviewer.name}</p>
                    <p className="text-xs text-secondary">{a.reviewer.email}</p>
                  </div>
                  <span className={`status-badge assignment-${a.status}`}>{a.status}</span>
                </div>
                <p className="mt-2 text-xs text-secondary">
                  Invited: {format(a.invitedAt, "d MMM yyyy")} · Due: {format(a.dueDate, "d MMM yyyy")}
                </p>
                {a.review && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-secondary">
                      Recommendation:{" "}
                      <span className="text-ink">
                        {RECOMMENDATION_LABELS[a.review.recommendation as keyof typeof RECOMMENDATION_LABELS]}
                      </span>
                    </p>
                    <div className="bg-paper-dark p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-secondary">To Author</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{a.review.commentsToAuthor}</p>
                    </div>
                    {a.review.commentsToEditor && (
                      <div className="border border-hairline bg-paper-dark p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-error">Confidential — Editor only</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{a.review.commentsToEditor}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {allowedTransitions.includes("SEND_TO_REVIEW" as never) && (
              <div className="mt-4">
                <Link href={`/dashboard/editor/submissions/${id}/assign`} className="btn btn-secondary btn-sm">
                  + Assign Reviewer
                </Link>
              </div>
            )}
            {status === "UNDER_REVIEW" && (
              <div className="mt-2">
                <Link href={`/dashboard/editor/submissions/${id}/assign`} className="btn btn-secondary btn-sm">
                  + Assign another Reviewer
                </Link>
              </div>
            )}
          </section>

          {/* Decision history */}
          <section aria-labelledby="decisions-head">
            <h2 id="decisions-head" className="section-label border-b border-hairline pb-2">Decision History</h2>
            {sub.decisions.length === 0 && (
              <p className="mt-3 text-sm text-secondary">No decisions recorded.</p>
            )}
            {sub.decisions.map((d) => (
              <div key={d.id} className="mt-3 border border-hairline p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-secondary">
                  {d.decision.replace(/_/g, " ")} · {format(d.createdAt, "d MMMM yyyy")}
                </p>
                {d.letterToAuthor && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{d.letterToAuthor}</p>
                )}
              </div>
            ))}
          </section>

          {/* Timeline */}
          <section aria-labelledby="timeline-head">
            <h2 id="timeline-head" className="section-label border-b border-hairline pb-2">Event log</h2>
            <div className="timeline mt-4">
              {sub.events.map((ev, i) => (
                <div key={ev.id} className={`timeline-item ${i === sub.events.length - 1 ? "highlight" : ""}`}>
                  <p className="timeline-time">{format(ev.createdAt, "d MMM yyyy, HH:mm")}</p>
                  <p className="timeline-text">
                    {ev.type.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar actions */}
        <aside className="space-y-4">
          {/* Actions */}
          <div className="border border-hairline p-4">
            <p className="section-label mb-3">Actions</p>
            <div className="space-y-2">
              {status === "SUBMITTED" && (
                <>
                  <Link href={`/dashboard/editor/submissions/${id}/assign`} className="btn btn-primary w-full">
                    Send to Review
                  </Link>
                  <Link href={`/dashboard/editor/submissions/${id}/decide?type=DESK_REJECT`} className="btn btn-danger w-full">
                    Desk Reject
                  </Link>
                </>
              )}
              {(status === "UNDER_REVIEW" || status === "RESUBMITTED") && (
                <>
                  <Link href={`/dashboard/editor/submissions/${id}/decide`} className="btn btn-primary w-full">
                    Record Decision
                  </Link>
                  <Link href={`/dashboard/editor/submissions/${id}/assign`} className="btn btn-secondary w-full">
                    Assign Reviewer
                  </Link>
                </>
              )}
              {status === "REVISIONS_REQUESTED" && (
                <p className="text-sm text-secondary">Awaiting author revision.</p>
              )}
              {status === "ACCEPTED" && (
                <Link href={`/dashboard/editor/submissions/${id}/publish`} className="btn btn-primary w-full">
                  Publish Article
                </Link>
              )}
              {status === "IN_PRODUCTION" && (
                <Link href={`/dashboard/editor/submissions/${id}/publish`} className="btn btn-primary w-full">
                  Upload PDF &amp; Publish
                </Link>
              )}
              {!sub.paymentConfirmed && ["ACCEPTED", "IN_PRODUCTION"].includes(status) && (
                <form
                  action={async () => {
                    "use server";
                    const { db: p } = await import("@/lib/db");
                    await p.submission.update({ where: { id }, data: { paymentConfirmed: true } });
                  }}
                >
                  <button type="submit" className="btn btn-secondary w-full">
                    ✓ Confirm Payment Received
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="border border-hairline p-4">
            <p className="section-label mb-3">Details</p>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-secondary">Type</dt><dd className="text-ink">{ARTICLE_TYPES[sub.articleType as keyof typeof ARTICLE_TYPES] ?? sub.articleType}</dd></div>
              <div><dt className="text-secondary">Submitted</dt><dd className="text-ink">{format(sub.submittedAt, "d MMM yyyy")}</dd></div>
              <div><dt className="text-secondary">Word count</dt><dd className="text-ink">{sub.wordCount?.toLocaleString() ?? "—"}</dd></div>
              <div><dt className="text-secondary">Keywords</dt><dd className="text-ink">{sub.keywordsCsv}</dd></div>
              <div><dt className="text-secondary">Payment</dt><dd className={sub.paymentConfirmed ? "text-success font-medium" : "text-secondary"}>
                {sub.paymentConfirmed ? "Confirmed" : "Pending"}
              </dd></div>
            </dl>
          </div>

          {/* Authors */}
          <div className="border border-hairline p-4">
            <p className="section-label mb-3">Authors</p>
            <ul className="space-y-2 text-sm">
              {sub.authors.map((a) => (
                <li key={a.id}>
                  <span className="font-medium text-ink">{a.name}</span>
                  {a.isCorresponding && <span className="ml-1 text-xs text-secondary">(corr.)</span>}
                  {a.affiliation && <p className="text-secondary">{a.affiliation}</p>}
                </li>
              ))}
            </ul>
          </div>

          {/* Files */}
          {sub.versions.length > 0 && (
            <div className="border border-hairline p-4">
              <p className="section-label mb-3">Files</p>
              <ul className="space-y-1 text-sm">
                {sub.versions.map((v) => (
                  <li key={v.id}>
                    <a href={`/api/files/${v.anonymizedFile.id}`} className="text-maroon hover:underline">
                      v{v.versionNumber}: {v.anonymizedFile.originalName}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
