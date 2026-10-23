"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";

interface ReviewersSearchFilterProps {
  initialQuery: string;
  initialRole: string;
  totalResults: number;
}

export function ReviewersSearchFilter({
  initialQuery,
  initialRole,
  totalResults,
}: ReviewersSearchFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [role, setRole] = useState(initialRole);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set("q", query.trim());
    } else {
      params.delete("q");
    }

    if (role && role !== "ALL") {
      params.set("role", role);
    } else {
      params.delete("role");
    }

    params.delete("page"); // reset to page 1 on new filter
    startTransition(() => {
      router.push(`/dashboard/editor/reviewers?${params.toString()}`);
    });
  }

  function handleRoleChange(newRole: string) {
    setRole(newRole);
    const params = new URLSearchParams(searchParams.toString());
    if (newRole && newRole !== "ALL") {
      params.set("role", newRole);
    } else {
      params.delete("role");
    }
    if (query.trim()) {
      params.set("q", query.trim());
    }
    params.delete("page");
    startTransition(() => {
      router.push(`/dashboard/editor/reviewers?${params.toString()}`);
    });
  }

  const hasActiveFilters = Boolean(initialQuery || (initialRole && initialRole !== "ALL"));

  return (
    <div className="mb-6 space-y-3">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or institution..."
            className="w-full rounded border border-gray-300 bg-white px-3.5 py-2 pl-9 text-sm text-gray-900 placeholder:text-gray-400 focus:border-maroon focus:outline-none focus:ring-1 focus:ring-maroon"
          />
          <svg
            className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div className="w-full sm:w-44">
          <select
            value={role}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-maroon focus:outline-none focus:ring-1 focus:ring-maroon"
          >
            <option value="ALL">All Roles</option>
            <option value="REVIEWER">Reviewers</option>
            <option value="EDITOR">Editors</option>
            <option value="ADMIN">Administrators</option>
            <option value="AUTHOR">Authors</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="btn btn-primary text-xs shrink-0 py-2 px-4"
        >
          {isPending ? "Filtering..." : "Search Users"}
        </button>

        {hasActiveFilters && (
          <Link
            href="/dashboard/editor/reviewers"
            className="btn btn-secondary text-xs shrink-0 py-2 px-3 text-center"
          >
            Clear
          </Link>
        )}
      </form>

      {hasActiveFilters && (
        <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded border border-gray-200">
          <span>
            Found <strong className="text-gray-900">{totalResults}</strong> user{totalResults === 1 ? "" : "s"}
            {initialQuery && (
              <> matching &ldquo;<span className="text-maroon font-medium">{initialQuery}</span>&rdquo;</>
            )}
            {initialRole && initialRole !== "ALL" && (
              <> with role &ldquo;<span className="text-maroon font-medium">{initialRole}</span>&rdquo;</>
            )}
          </span>
          <Link
            href="/dashboard/editor/reviewers"
            className="text-maroon hover:underline font-medium"
          >
            Reset all filters
          </Link>
        </div>
      )}
    </div>
  );
}
