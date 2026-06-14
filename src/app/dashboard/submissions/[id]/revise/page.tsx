"use client";

import { useActionState } from "react";
import Link from "next/link";
import { reviseAction } from "./action";
import type { ReviseState } from "./action";
import { use } from "react";

const initialState: ReviseState = {};

export default function RevisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [state, formAction, pending] = useActionState<ReviseState, FormData>(reviseAction, initialState);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Upload Revision</h1>
          <p className="page-subtitle">Respond to reviewer comments and upload your revised manuscript</p>
        </div>
        <Link href={`/dashboard/submissions/${id}`} className="btn btn-ghost btn-sm">← Back</Link>
      </div>

      <div className="alert alert-warning mb-6">
        Ensure all author identifying information is removed from the anonymized manuscript file.
      </div>

      <form action={formAction} encType="multipart/form-data" className="space-y-6">
        <input type="hidden" name="submissionId" value={id} />

        <div className="field">
          <label htmlFor="authorNote" className="field-label">
            Response to reviewers <span aria-hidden="true" className="text-error">*</span>
          </label>
          <span className="field-hint">
            Describe how you addressed each reviewer comment. Minimum 50 characters.
          </span>
          <textarea
            id="authorNote"
            name="authorNote"
            rows={10}
            required
            aria-invalid={!!state.errors?.authorNote}
            style={{ minHeight: "240px" }}
            placeholder="Point-by-point responses to reviewer 1 and reviewer 2 comments…"
          />
          {state.errors?.authorNote && (
            <span className="field-error">{state.errors.authorNote[0]}</span>
          )}
        </div>

        <div className="field">
          <label htmlFor="manuscript" className="field-label">
            Revised anonymized manuscript <span aria-hidden="true" className="text-error">*</span>
          </label>
          <span className="field-hint">PDF or Word (.docx), max 10 MB. No author names.</span>
          <input
            id="manuscript"
            type="file"
            name="manuscript"
            accept=".pdf,.doc,.docx"
            required
            aria-invalid={!!state.errors?.manuscript}
            className="w-auto"
          />
          {state.errors?.manuscript && (
            <span className="field-error">{state.errors.manuscript[0]}</span>
          )}
        </div>

        <div className="field">
          <label htmlFor="titlePage" className="field-label">
            Updated title page <span className="font-normal text-secondary">(optional)</span>
          </label>
          <input id="titlePage" type="file" name="titlePage" accept=".pdf,.doc,.docx" className="w-auto" />
        </div>

        {state.errors?.form && (
          <div className="alert alert-error">{state.errors.form[0]}</div>
        )}

        <div className="flex justify-between">
          <Link href={`/dashboard/submissions/${id}`} className="btn btn-secondary">← Cancel</Link>
          <button type="submit" disabled={pending} className="btn btn-primary" aria-busy={pending}>
            {pending ? "Uploading revision…" : "Submit Revision"}
          </button>
        </div>
      </form>
    </div>
  );
}
