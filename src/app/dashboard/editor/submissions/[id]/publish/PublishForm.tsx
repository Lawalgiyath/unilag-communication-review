"use client";

import { useActionState } from "react";
import { publishAction } from "./action";
import type { PublishState } from "./action";

const initialState: PublishState = {};

const today = new Date().toISOString().slice(0, 10);

export default function PublishForm({
  submissionId,
  issues,
}: {
  submissionId: string;
  issues: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState<PublishState, FormData>(publishAction, initialState);

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-5">
      <input type="hidden" name="submissionId" value={submissionId} />

      <div className="field">
        <label htmlFor="pub-issue" className="field-label">
          Issue <span aria-hidden="true" className="text-error">*</span>
        </label>
        <select id="pub-issue" name="issueId" required aria-invalid={!!state.errors?.issueId}>
          <option value="">Select issue…</option>
          {issues.map((i) => (
            <option key={i.id} value={i.id}>{i.label}</option>
          ))}
        </select>
        {state.errors?.issueId && <span className="field-error">{state.errors.issueId[0]}</span>}
      </div>

      <div className="field">
        <label htmlFor="pub-doi" className="field-label">DOI <span className="font-normal text-secondary">(auto-generated if left blank)</span></label>
        <input id="pub-doi" type="text" name="doi" placeholder="Auto-generated based on DOI Prefix" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="pub-fp" className="field-label">First page</label>
          <input id="pub-fp" type="number" name="firstPage" min={1} />
        </div>
        <div className="field">
          <label htmlFor="pub-lp" className="field-label">Last page</label>
          <input id="pub-lp" type="number" name="lastPage" min={1} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="field">
          <label htmlFor="pub-received" className="field-label">Received date</label>
          <input id="pub-received" type="date" name="receivedDate" />
        </div>
        <div className="field">
          <label htmlFor="pub-accepted" className="field-label">Accepted date</label>
          <input id="pub-accepted" type="date" name="acceptedDate" />
        </div>
        <div className="field">
          <label htmlFor="pub-date" className="field-label">
            Published date <span aria-hidden="true" className="text-error">*</span>
          </label>
          <input id="pub-date" type="date" name="publishedDate" defaultValue={today} required aria-invalid={!!state.errors?.publishedDate} />
          {state.errors?.publishedDate && <span className="field-error">{state.errors.publishedDate[0]}</span>}
        </div>
      </div>

      <div className="field">
        <label htmlFor="pub-pdf" className="field-label">
          Typeset PDF <span className="font-normal text-secondary">(optional)</span>
        </label>
        <span className="field-hint">PDF only, max 5 MB.</span>
        <input id="pub-pdf" type="file" name="typesettedPdf" accept=".pdf" className="w-auto" />
        {state.errors?.typesettedPdf && <span className="field-error">{state.errors.typesettedPdf[0]}</span>}
      </div>

      <div className="alert alert-warning">
        Publishing will create a publicly accessible article and notify the corresponding author.
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary" aria-busy={pending}>
        {pending ? "Publishing…" : "Publish Article"}
      </button>
    </form>
  );
}
