import Link from "next/link";
import type { Metadata } from "next";
import { format } from "date-fns";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "My Reviews" };
export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const user = await requireSession();

  const assignments = await db.reviewAssignment.findMany({
    where: { reviewerId: user.id },
    orderBy: { invitedAt: "desc" },
    include: {
      submission: { select: { title: true, articleType: true } },
      review: true,
    },
  });

  const pending = assignments.filter((a) =>
    ["INVITED", "ACCEPTED"].includes(a.status)
  );
  const completed = assignments.filter((a) =>
    !["INVITED", "ACCEPTED"].includes(a.status)
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Reviews</h1>
          <p className="page-subtitle">Peer review assignments</p>
        </div>
      </div>

      {assignments.length === 0 && (
        <div className="border border-hairline p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">No review assignments</p>
          <p className="mt-2 text-sm text-secondary">
            You have no pending or past review assignments. You will be notified by email when you are invited to review a manuscript.
          </p>
        </div>
      )}

      {pending.length > 0 && (
        <section aria-labelledby="pending-heading" className="mb-10">
          <h2 id="pending-heading" className="section-label mb-3">Pending ({pending.length})</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Manuscript (anonymized)</th>
                <th>Invited</th>
                <th>Due date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pending.map((a) => {
                const overdue = new Date(a.dueDate) < new Date() && a.status === "ACCEPTED";
                return (
                  <tr key={a.id}>
                    <td className="max-w-xs">
                      <span className="font-medium text-ink line-clamp-2">
                        [Anonymized Manuscript]
                      </span>
                      <span className="text-xs text-secondary">{a.submission.articleType.replace(/_/g, " ")}</span>
                    </td>
                    <td className="whitespace-nowrap text-sm text-secondary">
                      {format(a.invitedAt, "d MMM yyyy")}
                    </td>
                    <td className={`whitespace-nowrap text-sm ${overdue ? "text-error font-semibold" : "text-secondary"}`}>
                      {format(a.dueDate, "d MMM yyyy")}
                      {overdue && " ⚠️"}
                    </td>
                    <td>
                      <span className={`status-badge assignment-${a.status}`}>
                        {a.status}
                      </span>
                    </td>
                    <td>
                      <Link href={`/dashboard/reviews/${a.id}`} className="btn btn-ghost btn-sm">
                        {a.status === "INVITED" ? "Respond →" : "View →"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {completed.length > 0 && (
        <section aria-labelledby="done-heading">
          <h2 id="done-heading" className="section-label mb-3">Completed & Declined ({completed.length})</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Manuscript (anonymized)</th>
                <th>Invited</th>
                <th>Outcome</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {completed.map((a) => (
                <tr key={a.id}>
                  <td className="max-w-xs">
                    <span className="font-medium text-ink line-clamp-2">[Anonymized Manuscript]</span>
                  </td>
                  <td className="whitespace-nowrap text-sm text-secondary">
                    {format(a.invitedAt, "d MMM yyyy")}
                  </td>
                  <td>
                    <span className={`status-badge assignment-${a.status}`}>{a.status}</span>
                  </td>
                  <td>
                    <Link href={`/dashboard/reviews/${a.id}`} className="btn btn-ghost btn-sm">View →</Link>
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
