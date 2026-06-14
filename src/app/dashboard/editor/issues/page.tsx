import Link from "next/link";
import type { Metadata } from "next";
import { format } from "date-fns";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Issues" };
export const dynamic = "force-dynamic";

export default async function IssuesPage() {
  const volumes = await db.volume.findMany({
    orderBy: { number: "desc" },
    include: { issues: { orderBy: { number: "asc" } } },
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Volumes & Issues</h1>
          <p className="page-subtitle">Manage journal volumes and issues</p>
        </div>
        <Link href="/dashboard/editor/issues/new" className="btn btn-primary">
          + New Issue
        </Link>
      </div>

      {volumes.length === 0 && (
        <p className="text-sm text-secondary">No volumes yet. Create the first issue to get started.</p>
      )}

      {volumes.map((vol) => (
        <section key={vol.id} aria-labelledby={`vol-${vol.id}`} className="mb-8">
          <h2 id={`vol-${vol.id}`} className="section-label mb-3">
            Volume {vol.number} ({vol.year})
          </h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Issue</th>
                <th>Title</th>
                <th>Published</th>
                <th>Articles</th>
                <th>Current?</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {vol.issues.map((issue) => (
                <tr key={issue.id}>
                  <td className="font-mono text-sm">No. {issue.number}</td>
                  <td className="text-sm text-ink">{issue.title ?? "—"}</td>
                  <td className="whitespace-nowrap text-sm text-secondary">
                    {issue.publishedAt ? format(issue.publishedAt, "d MMM yyyy") : "Unpublished"}
                  </td>
                  <td className="text-sm text-secondary">—</td>
                  <td>
                    {issue.isCurrent && (
                      <span className="status-badge status-PUBLISHED">Current</span>
                    )}
                  </td>
                  <td>
                    <Link href={`/issues/${vol.number}/${issue.number}`} className="btn btn-ghost btn-sm" target="_blank">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
