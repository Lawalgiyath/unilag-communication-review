import Link from "next/link";
import type { Metadata } from "next";
import { format } from "date-fns";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { SUBMISSION_STATUS_LABELS } from "@/lib/types";
import { formatSubmissionNumber } from "@/lib/types";

export const metadata: Metadata = { title: "My Submissions" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireSession();

  const submissions = await db.submission.findMany({
    where: { correspondingAuthorId: user.id },
    orderBy: { submittedAt: "desc" },
    include: {
      decisions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const open = submissions.filter(
    (s) =>
      !["PUBLISHED", "DESK_REJECTED", "REJECTED", "WITHDRAWN"].includes(s.status)
  );
  const closed = submissions.filter(
    (s) =>
      ["PUBLISHED", "DESK_REJECTED", "REJECTED", "WITHDRAWN"].includes(s.status)
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Submissions</h1>
          <p className="page-subtitle">Track and manage your manuscript submissions</p>
        </div>
        <Link href="/dashboard/submissions/new" className="btn btn-primary">
          + New Submission
        </Link>
      </div>

      {submissions.length === 0 && (
        <div className="border border-hairline p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">
            No submissions yet
          </p>
          <p className="mt-2 text-sm text-secondary">
            Ready to share your research? Submit your first manuscript to
            UNILAG Communication Review.
          </p>
          <Link href="/dashboard/submissions/new" className="btn btn-primary mt-4 inline-flex">
            Submit a Manuscript
          </Link>
        </div>
      )}

      {open.length > 0 && (
        <section aria-labelledby="active-heading" className="mb-10">
          <h2 id="active-heading" className="section-label mb-3">
            Active ({open.length})
          </h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Last updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {open.map((s) => (
                <tr key={s.id}>
                  <td className="whitespace-nowrap font-mono text-xs text-secondary">
                    {formatSubmissionNumber(s.number, s.submittedAt.getFullYear())}
                  </td>
                  <td className="max-w-xs">
                    <span className="font-medium text-ink line-clamp-2">{s.title}</span>
                  </td>
                  <td>
                    <span className={`status-badge status-${s.status}`}>
                      {SUBMISSION_STATUS_LABELS[s.status as keyof typeof SUBMISSION_STATUS_LABELS]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-sm text-secondary">
                    {format(s.submittedAt, "d MMM yyyy")}
                  </td>
                  <td className="whitespace-nowrap text-sm text-secondary">
                    {format(s.updatedAt, "d MMM yyyy")}
                  </td>
                  <td>
                    <Link href={`/dashboard/submissions/${s.id}`} className="btn btn-ghost btn-sm">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {closed.length > 0 && (
        <section aria-labelledby="closed-heading">
          <h2 id="closed-heading" className="section-label mb-3">
            Closed ({closed.length})
          </h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Outcome</th>
                <th>Submitted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {closed.map((s) => (
                <tr key={s.id}>
                  <td className="font-mono text-xs text-secondary">
                    {formatSubmissionNumber(s.number, s.submittedAt.getFullYear())}
                  </td>
                  <td className="max-w-xs">
                    <span className="font-medium text-ink line-clamp-2">{s.title}</span>
                  </td>
                  <td>
                    <span className={`status-badge status-${s.status}`}>
                      {SUBMISSION_STATUS_LABELS[s.status as keyof typeof SUBMISSION_STATUS_LABELS]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-sm text-secondary">
                    {format(s.submittedAt, "d MMM yyyy")}
                  </td>
                  <td>
                    <Link href={`/dashboard/submissions/${s.id}`} className="btn btn-ghost btn-sm">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
