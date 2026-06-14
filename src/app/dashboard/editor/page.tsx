import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { SUBMISSION_STATUS_LABELS } from "@/lib/types";
import { format } from "date-fns";
import { formatSubmissionNumber } from "@/lib/types";

export const metadata: Metadata = { title: "Editorial Inbox" };
export const dynamic = "force-dynamic";

const ACTION_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "REVISIONS_REQUESTED",
  "RESUBMITTED",
] as const;

const ALL_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "REVISIONS_REQUESTED",
  "RESUBMITTED",
  "ACCEPTED",
  "IN_PRODUCTION",
  "PUBLISHED",
  "DESK_REJECTED",
  "REJECTED",
  "WITHDRAWN",
] as const;

export default async function EditorInboxPage() {
  const [counts, recent] = await Promise.all([
    // Count by status
    Promise.all(
      ALL_STATUSES.map(async (status) => ({
        status,
        count: await db.submission.count({ where: { status } }),
      }))
    ),
    // Recent submissions needing action
    db.submission.findMany({
      where: { status: { in: ACTION_STATUSES as unknown as string[] } },
      orderBy: { updatedAt: "asc" }, // oldest first — need attention
      take: 30,
      include: {
        correspondingAuthor: { select: { name: true } },
        assignments: {
          where: { status: { in: ["INVITED", "ACCEPTED"] } },
          select: { id: true },
        },
      },
    }),
  ]);

  const actionable = counts.filter((c) =>
    ACTION_STATUSES.includes(c.status as typeof ACTION_STATUSES[number])
  );
  const total = actionable.reduce((n, c) => n + c.count, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Editorial Inbox</h1>
          <p className="page-subtitle">Submissions requiring action</p>
        </div>
        <span className="font-display text-3xl font-bold text-maroon">{total}</span>
      </div>

      {/* Pipeline counts */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {counts.map((c) => (
          <Link
            key={c.status}
            href={`/dashboard/editor/submissions?status=${c.status}`}
            className="stat-card block hover:border-maroon transition-colors"
          >
            <p className="stat-value">{c.count}</p>
            <p className="stat-label">{SUBMISSION_STATUS_LABELS[c.status as keyof typeof SUBMISSION_STATUS_LABELS]}</p>
          </Link>
        ))}
      </div>

      {/* Action queue */}
      <section aria-labelledby="queue-heading">
        <h2 id="queue-heading" className="section-label mb-3">Needs action</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-secondary">No submissions currently require action.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Title</th>
                <th>Corresponding author</th>
                <th>Status</th>
                <th>Last updated</th>
                <th>Reviewers</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recent.map((s) => (
                <tr key={s.id}>
                  <td className="whitespace-nowrap font-mono text-xs text-secondary">
                    {formatSubmissionNumber(s.number, s.submittedAt.getFullYear())}
                  </td>
                  <td className="max-w-[240px]">
                    <span className="font-medium text-ink line-clamp-2">{s.title}</span>
                  </td>
                  <td className="text-sm text-secondary">{s.correspondingAuthor.name}</td>
                  <td>
                    <span className={`status-badge status-${s.status}`}>
                      {SUBMISSION_STATUS_LABELS[s.status as keyof typeof SUBMISSION_STATUS_LABELS]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-sm text-secondary">
                    {format(s.updatedAt, "d MMM yyyy")}
                  </td>
                  <td className="text-sm text-secondary">
                    {s.assignments.length > 0 ? `${s.assignments.length} active` : "—"}
                  </td>
                  <td>
                    <Link
                      href={`/dashboard/editor/submissions/${s.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
