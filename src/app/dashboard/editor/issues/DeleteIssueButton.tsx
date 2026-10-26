"use client";

import { useTransition, useState } from "react";
import { deleteIssueAction } from "./actions";

export function DeleteIssueButton({
  issueId,
  issueLabel,
  articleCount,
}: {
  issueId: string;
  issueLabel: string;
  articleCount: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDelete = () => {
    if (articleCount > 0) {
      alert(
        `Cannot delete ${issueLabel}: It contains ${articleCount} article(s). Please move or delete the articles before deleting the issue.`
      );
      return;
    }

    if (!confirm(`Are you sure you want to delete ${issueLabel}? This action cannot be undone.`)) {
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const res = await deleteIssueAction(issueId);
      if (!res.success && res.error) {
        setErrorMsg(res.error);
        alert(res.error);
      }
    });
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="btn btn-ghost btn-sm text-red-600 hover:text-red-800 hover:bg-red-50"
        title={articleCount > 0 ? "Cannot delete issue containing articles" : "Delete issue"}
      >
        {isPending ? "Deleting…" : "Delete"}
      </button>
      {errorMsg && (
        <span className="text-[11px] text-error" title={errorMsg}>
          Error
        </span>
      )}
    </div>
  );
}
