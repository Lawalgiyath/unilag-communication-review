import Link from "next/link";
import type { Metadata } from "next";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { InstitutionalBadge } from "@/components/common/InstitutionalBadge";
import { ReviewersSearchFilter } from "./ReviewersSearchFilter";
import { UserRowActions } from "./UserRowActions";

export const metadata: Metadata = { title: "Users & Roles | Administration" };
export const dynamic = "force-dynamic";

export default async function ReviewersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>;
}) {
  const { q, role, page } = await searchParams;
  const searchQuery = q?.trim() ?? "";
  const roleFilter = role?.trim() ?? "ALL";
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const pageSize = 20;

  const where: Prisma.UserWhereInput = {};

  if (searchQuery) {
    where.OR = [
      { name: { contains: searchQuery, mode: "insensitive" } },
      { email: { contains: searchQuery, mode: "insensitive" } },
      { affiliation: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  if (roleFilter && roleFilter !== "ALL") {
    where.roles = {
      some: {
        role: roleFilter,
      },
    };
  }

  const [totalUsersCount, totalFilteredCount, users, totalReviewers, totalEditors] = await Promise.all([
    db.user.count(),
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { name: "asc" },
      include: { roles: true },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    db.userRole.count({ where: { role: "REVIEWER" } }),
    db.userRole.count({ where: { role: "EDITOR" } }),
  ]);

  const totalPages = Math.ceil(totalFilteredCount / pageSize);
  const startItem = totalFilteredCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalFilteredCount);

  // Helper to construct pagination URLs while preserving current filters
  function getPageUrl(targetPage: number) {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (roleFilter && roleFilter !== "ALL") params.set("role", roleFilter);
    if (targetPage > 1) params.set("page", String(targetPage));
    const queryStr = params.toString();
    return `/dashboard/editor/reviewers${queryStr ? `?${queryStr}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users &amp; Roles</h1>
          <p className="page-subtitle">
            Manage reviewer, editorial, and system access across all registered journal members
          </p>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded border border-hairline bg-white p-3.5 shadow-xs">
          <p className="text-xs uppercase tracking-wider text-secondary">Total Users</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-ink">
            {totalUsersCount.toLocaleString()}
          </p>
        </div>
        <div className="rounded border border-hairline bg-white p-3.5 shadow-xs">
          <p className="text-xs uppercase tracking-wider text-secondary">Active Reviewers</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-blue-700">
            {totalReviewers.toLocaleString()}
          </p>
        </div>
        <div className="rounded border border-hairline bg-white p-3.5 shadow-xs">
          <p className="text-xs uppercase tracking-wider text-secondary">Editorial Board</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-maroon">
            {totalEditors.toLocaleString()}
          </p>
        </div>
        <div className="rounded border border-hairline bg-white p-3.5 shadow-xs">
          <p className="text-xs uppercase tracking-wider text-secondary">Filtered Results</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-gray-700">
            {totalFilteredCount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <ReviewersSearchFilter
        initialQuery={searchQuery}
        initialRole={roleFilter}
        totalResults={totalFilteredCount}
      />

      {/* Users Table */}
      {users.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center bg-gray-50">
          <p className="text-base font-semibold text-gray-700">No users found</p>
          <p className="mt-1 text-sm text-gray-500">
            No accounts matched your search criteria {searchQuery ? `"${searchQuery}"` : ""}.
          </p>
          <div className="mt-4">
            <Link href="/dashboard/editor/reviewers" className="btn btn-secondary btn-sm">
              Clear All Filters
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-hairline bg-white shadow-xs">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>User / Name</th>
                <th>Email &amp; Verification</th>
                <th>Affiliation</th>
                <th>Status</th>
                <th>Assigned Roles</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const roles = u.roles.map((r) => r.role);
                const isReviewer = roles.includes("REVIEWER");
                const isEditor = roles.includes("EDITOR");

                return (
                  <tr key={u.id} className={!u.isActive ? "opacity-60 bg-gray-50" : ""}>
                    <td>
                      <div className="font-medium text-ink">
                        {u.title ? `${u.title} ` : ""}
                        {u.name}
                      </div>
                      {u.orcid && (
                        <p className="text-[11px] font-mono text-gray-400">
                          ORCID: {u.orcid}
                        </p>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm text-secondary font-mono text-xs">{u.email}</span>
                        <InstitutionalBadge email={u.email} />
                      </div>
                    </td>
                    <td className="text-sm text-secondary">
                      {u.affiliation || <span className="text-gray-400">—</span>}
                    </td>
                    <td>
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700 border border-green-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 border border-gray-200">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {roles.map((r) => {
                          let badgeClass = "bg-gray-100 text-gray-700 border-gray-200";
                          if (r === "REVIEWER") badgeClass = "bg-blue-50 text-blue-700 border-blue-200";
                          if (r === "EDITOR") badgeClass = "bg-red-50 text-maroon border-red-200";
                          if (r === "ADMIN") badgeClass = "bg-amber-50 text-amber-800 border-amber-200";
                          return (
                            <span
                              key={r}
                              className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badgeClass}`}
                            >
                              {r}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td>
                      <UserRowActions
                        userId={u.id}
                        isReviewer={isReviewer}
                        isEditor={isEditor}
                        isActive={u.isActive}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-hairline pt-4 text-xs text-secondary">
          <p>
            Showing <strong className="text-ink">{startItem}</strong> to{" "}
            <strong className="text-ink">{endItem}</strong> of{" "}
            <strong className="text-ink">{totalFilteredCount.toLocaleString()}</strong> users
          </p>

          <div className="flex items-center gap-2">
            {currentPage > 1 ? (
              <Link href={getPageUrl(currentPage - 1)} className="btn btn-secondary btn-sm text-xs py-1 px-3">
                ← Previous
              </Link>
            ) : (
              <span className="btn btn-secondary btn-sm text-xs py-1 px-3 opacity-40 cursor-not-allowed">
                ← Previous
              </span>
            )}

            <span className="font-mono text-gray-600 px-2">
              Page {currentPage} of {totalPages}
            </span>

            {currentPage < totalPages ? (
              <Link href={getPageUrl(currentPage + 1)} className="btn btn-secondary btn-sm text-xs py-1 px-3">
                Next →
              </Link>
            ) : (
              <span className="btn btn-secondary btn-sm text-xs py-1 px-3 opacity-40 cursor-not-allowed">
                Next →
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
