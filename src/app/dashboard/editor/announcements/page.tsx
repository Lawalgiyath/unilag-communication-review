import Link from "next/link";
import type { Metadata } from "next";
import { format } from "date-fns";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Announcements" };
export const dynamic = "force-dynamic";

export default async function AnnouncementsIndex() {
  const items = await db.announcement.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="page-subtitle">Manage news and calls for papers</p>
        </div>
        <Link href="/dashboard/editor/announcements/new" className="btn btn-primary">
          + New Announcement
        </Link>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-secondary">No announcements found. Create one to display it on the public site.</p>
      )}

      {items.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Status</th>
              <th>Published Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isPublished = item.publishedAt && item.publishedAt <= new Date();
              return (
                <tr key={item.id}>
                  <td className="font-medium text-ink">{item.title}</td>
                  <td className="text-sm text-secondary">
                    {item.kind === "CALL_FOR_PAPERS" ? "Call for Papers" : "News"}
                  </td>
                  <td>
                    {isPublished ? (
                      <span className="status-badge status-PUBLISHED">Published</span>
                    ) : item.publishedAt ? (
                      <span className="status-badge status-ACCEPTED">Scheduled</span>
                    ) : (
                      <span className="status-badge status-DRAFT">Draft</span>
                    )}
                  </td>
                  <td className="text-sm text-secondary">
                    {item.publishedAt ? format(item.publishedAt, "d MMM yyyy, HH:mm") : "—"}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/editor/announcements/${item.slug}/edit`} className="btn btn-ghost btn-sm">
                        Edit
                      </Link>
                      <form action={async () => {
                        "use server";
                        const { db: p } = await import("@/lib/db");
                        await p.announcement.delete({ where: { id: item.id } });
                      }}>
                        <button type="submit" className="btn btn-ghost btn-sm text-error"
                          onClick={(e) => { if (!confirm("Delete this announcement?")) e.preventDefault(); }}>
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
