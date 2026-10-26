"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { assignReviewerAction } from "./action";
import type { AssignState } from "./action";

export interface ReviewerItem {
  id: string;
  name: string;
  email: string;
  affiliation: string;
  orcid: string;
  activeCount: number;
}

function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 21);
  return d.toISOString().slice(0, 10);
}

export default function AssignReviewerClient({
  submissionId,
  submissionTitle,
  reviewers,
}: {
  submissionId: string;
  submissionTitle: string;
  reviewers: ReviewerItem[];
}) {
  const [selectedEmail, setSelectedEmail] = useState("");
  const [state, formAction, pending] = useActionState<AssignState, FormData>(
    assignReviewerAction,
    {}
  );

  const handleSelectReviewer = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEmail(e.target.value);
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Assign Reviewer</h1>
          <p className="page-subtitle">Invite a qualified peer reviewer for this manuscript</p>
        </div>
        <Link href={`/dashboard/editor/submissions/${submissionId}`} className="btn btn-ghost btn-sm">
          ← Back
        </Link>
      </div>

      <div className="mb-6 border-l-2 border-maroon bg-paper-dark p-4">
        <p className="text-xs uppercase tracking-wider text-secondary">Manuscript</p>
        <p className="mt-1 text-sm font-semibold text-ink">{submissionTitle}</p>
      </div>

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="submissionId" value={submissionId} />

        {/* Database Reviewer Quick-Select */}
        {reviewers.length > 0 && (
          <div className="field">
            <label htmlFor="dbReviewer" className="field-label">
              Select Reviewer from Database <span className="font-normal text-secondary">({reviewers.length} registered)</span>
            </label>
            <span className="field-hint">
              Choose an existing peer reviewer or author with their current active review load.
            </span>
            <select
              id="dbReviewer"
              value={selectedEmail}
              onChange={handleSelectReviewer}
            >
              <option value="">-- Choose registered reviewer from database --</option>
              {reviewers.map((r) => (
                <option key={r.id} value={r.email}>
                  {r.name} ({r.email}) {r.affiliation ? `[${r.affiliation}]` : ""} — {r.activeCount} active review(s)
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label htmlFor="reviewerEmail" className="field-label">
            Reviewer Email Address <span aria-hidden="true" className="text-error">*</span>
          </label>
          <span className="field-hint">
            Must be a registered account. Selecting from the dropdown above auto-fills this field.
          </span>
          <input
            id="reviewerEmail"
            type="email"
            name="reviewerEmail"
            value={selectedEmail}
            onChange={(e) => setSelectedEmail(e.target.value)}
            required
            aria-invalid={!!state.errors?.reviewerEmail}
            placeholder="reviewer@unilag.edu.ng"
          />
          {state.errors?.reviewerEmail && (
            <span className="field-error">{state.errors.reviewerEmail[0]}</span>
          )}
        </div>

        <div className="field">
          <label htmlFor="dueDate" className="field-label">
            Review Due Date <span aria-hidden="true" className="text-error">*</span>
          </label>
          <input
            id="dueDate"
            type="date"
            name="dueDate"
            defaultValue={defaultDueDate()}
            min={new Date().toISOString().slice(0, 10)}
            required
            aria-invalid={!!state.errors?.dueDate}
          />
          {state.errors?.dueDate && (
            <span className="field-error">{state.errors.dueDate[0]}</span>
          )}
        </div>

        <div className="field">
          <label htmlFor="note" className="field-label">
            Note to Reviewer <span className="font-normal text-secondary">(optional)</span>
          </label>
          <span className="field-hint">This note will be included directly in the invitation email.</span>
          <textarea
            id="note"
            name="note"
            rows={3}
            placeholder="e.g. Dear Colleague, we would appreciate your critical assessment of the methodology and data analysis in this paper."
          />
        </div>

        <div className="flex justify-between pt-2">
          <Link href={`/dashboard/editor/submissions/${submissionId}`} className="btn btn-secondary">
            ← Cancel
          </Link>
          <button type="submit" disabled={pending} className="btn btn-primary" aria-busy={pending}>
            {pending ? "Sending Invitation…" : "Send Invitation"}
          </button>
        </div>
      </form>
    </div>
  );
}
