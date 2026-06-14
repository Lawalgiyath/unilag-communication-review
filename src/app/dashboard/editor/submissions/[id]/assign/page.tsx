"use client";

import { useActionState } from "react";
import Link from "next/link";
import { assignReviewerAction } from "./action";
import type { AssignState } from "./action";
import { use } from "react";

const initialState: AssignState = {};

// Default due date: 21 days from today
function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 21);
  return d.toISOString().slice(0, 10);
}

export default function AssignReviewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [state, formAction, pending] = useActionState<AssignState, FormData>(assignReviewerAction, initialState);

  return (
    <div className="mx-auto max-w-xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Assign Reviewer</h1>
          <p className="page-subtitle">Invite a registered user to review this manuscript</p>
        </div>
        <Link href={`/dashboard/editor/submissions/${id}`} className="btn btn-ghost btn-sm">← Back</Link>
      </div>

      <div className="alert alert-info mb-6">
        The reviewer must already have an account. They will receive an email invitation and can accept or decline.
      </div>

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="submissionId" value={id} />

        <div className="field">
          <label htmlFor="reviewerEmail" className="field-label">
            Reviewer email address <span aria-hidden="true" className="text-error">*</span>
          </label>
          <input id="reviewerEmail" type="email" name="reviewerEmail" required
            aria-invalid={!!state.errors?.reviewerEmail}
            placeholder="reviewer@institution.edu.ng"
          />
          {state.errors?.reviewerEmail && (
            <span className="field-error">{state.errors.reviewerEmail[0]}</span>
          )}
        </div>

        <div className="field">
          <label htmlFor="dueDate" className="field-label">
            Review due date <span aria-hidden="true" className="text-error">*</span>
          </label>
          <input id="dueDate" type="date" name="dueDate"
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
            Note to reviewer <span className="font-normal text-secondary">(optional)</span>
          </label>
          <span className="field-hint">This note will be included in the invitation email.</span>
          <textarea id="note" name="note" rows={3} />
        </div>

        <div className="flex justify-between">
          <Link href={`/dashboard/editor/submissions/${id}`} className="btn btn-secondary">← Cancel</Link>
          <button type="submit" disabled={pending} className="btn btn-primary" aria-busy={pending}>
            {pending ? "Sending invitation…" : "Send Invitation"}
          </button>
        </div>
      </form>
    </div>
  );
}
