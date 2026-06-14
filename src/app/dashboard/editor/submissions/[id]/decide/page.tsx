"use client";

import { useActionState } from "react";
import Link from "next/link";
import { recordDecisionAction } from "./action";
import type { DecideState } from "./action";
import { use } from "react";

const initialState: DecideState = {};

const DECISION_OPTIONS = [
  { value: "ACCEPT", label: "Accept for publication" },
  { value: "MINOR_REVISIONS", label: "Minor revisions required" },
  { value: "MAJOR_REVISIONS", label: "Major revisions required" },
  { value: "REJECT", label: "Reject" },
  { value: "DESK_REJECT", label: "Desk reject (without review)" },
];

const DECISION_TEMPLATES: Record<string, string> = {
  ACCEPT: `Dear Author,\n\nWe are pleased to inform you that your manuscript has been accepted for publication in the UNILAG Communication Review. We congratulate you on this achievement and look forward to publishing your work.\n\nOur production team will be in touch with the next steps.\n\nWarm regards,`,
  MINOR_REVISIONS: `Dear Author,\n\nThank you for submitting your manuscript to the UNILAG Communication Review. Your paper has been reviewed and we are pleased to inform you that, subject to minor revisions, we would like to publish your work.\n\nPlease attend to the reviewer comments below and resubmit within 30 days.\n\n[REVIEWER COMMENTS]\n\nWarm regards,`,
  MAJOR_REVISIONS: `Dear Author,\n\nThank you for your submission to the UNILAG Communication Review. Your paper has undergone peer review and the reviewers have identified areas that require substantial revision before we can consider it further.\n\nPlease carefully address the reviewer comments below and resubmit within 60 days.\n\n[REVIEWER COMMENTS]\n\nWarm regards,`,
  REJECT: `Dear Author,\n\nThank you for submitting your manuscript to the UNILAG Communication Review. After careful review, we regret to inform you that we are unable to accept your paper for publication.\n\nWe appreciate your interest in our journal and encourage you to submit to another venue.\n\nWarm regards,`,
  DESK_REJECT: `Dear Author,\n\nThank you for submitting to the UNILAG Communication Review. After initial editorial review, we regret to inform you that your manuscript has not been forwarded for peer review as it does not meet our current requirements.\n\nWe encourage you to review our submission guidelines before resubmitting.\n\nWarm regards,`,
};

export default function DecidePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ type?: string }>;
}) {
  const { id } = use(params);
  const sp = searchParams ? use(searchParams) : {};
  const preselect = sp.type ?? "";

  const [state, formAction, pending] = useActionState<DecideState, FormData>(recordDecisionAction, initialState);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Record Decision</h1>
          <p className="page-subtitle">This will notify the corresponding author by email</p>
        </div>
        <Link href={`/dashboard/editor/submissions/${id}`} className="btn btn-ghost btn-sm">← Back</Link>
      </div>

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="submissionId" value={id} />

        <div className="field">
          <label htmlFor="decision" className="field-label">
            Decision <span aria-hidden="true" className="text-error">*</span>
          </label>
          <select id="decision" name="decision" defaultValue={preselect} required
            aria-invalid={!!state.errors?.decision}>
            <option value="">Select decision…</option>
            {DECISION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {state.errors?.decision && (
            <span className="field-error">{state.errors.decision[0]}</span>
          )}
        </div>

        <div className="field">
          <label htmlFor="letterToAuthor" className="field-label">
            Letter to author <span aria-hidden="true" className="text-error">*</span>
          </label>
          <span className="field-hint">
            This will be sent to the corresponding author. Select a decision above to load a template.
          </span>
          <textarea
            id="letterToAuthor"
            name="letterToAuthor"
            rows={14}
            required
            aria-invalid={!!state.errors?.letterToAuthor}
            defaultValue={preselect ? DECISION_TEMPLATES[preselect] ?? "" : ""}
            style={{ minHeight: "320px" }}
          />
          {state.errors?.letterToAuthor && (
            <span className="field-error">{state.errors.letterToAuthor[0]}</span>
          )}
        </div>

        <div className="alert alert-warning">
          This action cannot be undone. The author will be notified immediately.
        </div>

        <div className="flex justify-between">
          <Link href={`/dashboard/editor/submissions/${id}`} className="btn btn-secondary">← Cancel</Link>
          <button type="submit" disabled={pending} className="btn btn-primary" aria-busy={pending}>
            {pending ? "Sending…" : "Send Decision"}
          </button>
        </div>
      </form>
    </div>
  );
}
