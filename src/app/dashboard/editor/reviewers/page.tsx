import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatSubmissionNumber } from "@/lib/types";

export const metadata: Metadata = { title: "Users & Roles" };
export const dynamic = "force-dynamic";

export default async function ReviewersPage() {
  const users = await db.user.findMany({
    orderBy: { name: "asc" },
    include: { roles: true },
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Users & Roles</h1>
          <p className="page-subtitle">Manage reviewer and editor access</p>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Affiliation</th>
            <th>Roles</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const roles = u.roles.map((r) => r.role);
            const isReviewer = roles.includes("REVIEWER");
            const isEditor = roles.includes("EDITOR");

            return (
              <tr key={u.id}>
                <td className="font-medium text-ink">{u.name}</td>
                <td className="text-sm text-secondary">{u.email}</td>
                <td className="text-sm text-secondary">{u.affiliation ?? "—"}</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {roles.map((r) => (
                      <span key={r} className="status-badge assignment-ACCEPTED text-[10px]">{r}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <form action={async () => {
                      "use server";
                      const { db: p } = await import("@/lib/db");
                      if (isReviewer) {
                        await p.userRole.deleteMany({ where: { userId: u.id, role: "REVIEWER" } });
                      } else {
                        await p.userRole.create({ data: { userId: u.id, role: "REVIEWER" } });
                      }
                    }}>
                      <button type="submit" className={`btn btn-sm ${isReviewer ? "btn-ghost text-error" : "btn-secondary"}`}>
                        {isReviewer ? "Remove Reviewer" : "Make Reviewer"}
                      </button>
                    </form>
                    <form action={async () => {
                      "use server";
                      const { db: p } = await import("@/lib/db");
                      if (isEditor) {
                        await p.userRole.deleteMany({ where: { userId: u.id, role: "EDITOR" } });
                      } else {
                        await p.userRole.create({ data: { userId: u.id, role: "EDITOR" } });
                      }
                    }}>
                      <button type="submit" className={`btn btn-sm ${isEditor ? "btn-ghost text-error" : "btn-secondary"}`}>
                        {isEditor ? "Remove Editor" : "Make Editor"}
                      </button>
                    </form>
                    <form action={async () => {
                      "use server";
                      const { db: p } = await import("@/lib/db");
                      await p.user.update({ where: { id: u.id }, data: { isActive: !u.isActive } });
                    }}>
                      <button type="submit" className={`btn btn-sm ${u.isActive ? "btn-ghost text-secondary" : "btn-ghost text-success"}`}>
                        {u.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
