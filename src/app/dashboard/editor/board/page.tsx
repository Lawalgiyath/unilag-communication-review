import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Editorial Board Management" };
export const dynamic = "force-dynamic";

export default async function BoardManagementPage() {
  const members = await db.boardMember.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Editorial Board</h1>
          <p className="page-subtitle">Manage board members displayed on the public site</p>
        </div>
        <Link href="/dashboard/editor/board/new" className="btn btn-primary">
          + Add Member
        </Link>
      </div>

      {members.length === 0 && (
        <p className="text-sm text-secondary">No board members yet. Add the first member above.</p>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Name</th>
            <th>Role</th>
            <th>Affiliation</th>
            <th>ORCID</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id}>
              <td className="font-mono text-xs text-secondary">{m.order}</td>
              <td className="font-medium text-ink">{m.name}</td>
              <td className="text-sm text-secondary">{m.role}</td>
              <td className="text-sm text-secondary">{m.affiliation}</td>
              <td className="text-sm">
                {m.orcid && (
                  <a href={`https://orcid.org/${m.orcid}`} target="_blank" rel="noopener noreferrer"
                    className="text-maroon hover:underline">{m.orcid}</a>
                )}
              </td>
              <td>
                <div className="flex gap-2">
                  <Link href={`/dashboard/editor/board/${m.id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
                  <form action={async () => {
                    "use server";
                    const { db: p } = await import("@/lib/db");
                    await p.boardMember.delete({ where: { id: m.id } });
                  }}>
                    <button type="submit" className="btn btn-ghost btn-sm text-error"
                      onClick={(e) => { if (!confirm("Delete this member?")) e.preventDefault(); }}>
                      Delete
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-4 text-xs text-secondary">
        Members are sorted by the Order field. Lower numbers appear first.
      </p>
    </div>
  );
}
