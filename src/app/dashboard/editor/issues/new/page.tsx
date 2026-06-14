"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createIssueAction } from "./action";
import type { CreateIssueState } from "./action";

const initialState: CreateIssueState = {};
const thisYear = new Date().getFullYear();

export default function NewIssuePage() {
  const [state, formAction, pending] = useActionState<CreateIssueState, FormData>(createIssueAction, initialState);

  return (
    <div className="mx-auto max-w-xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">New Issue</h1>
        </div>
        <Link href="/dashboard/editor/issues" className="btn btn-ghost btn-sm">← Back</Link>
      </div>

      <form action={formAction} className="space-y-5">
        <fieldset className="border border-hairline p-4">
          <legend className="px-1 text-sm font-semibold text-secondary">Volume</legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="volumeNumber" className="field-label">Volume number</label>
              <input id="volumeNumber" type="number" name="volumeNumber" min={1} required aria-invalid={!!state.errors?.volumeNumber} />
              {state.errors?.volumeNumber && <span className="field-error">{state.errors.volumeNumber[0]}</span>}
            </div>
            <div className="field">
              <label htmlFor="volumeYear" className="field-label">Year</label>
              <input id="volumeYear" type="number" name="volumeYear" min={1990} max={thisYear + 2} defaultValue={thisYear} required />
            </div>
          </div>
        </fieldset>

        <fieldset className="border border-hairline p-4">
          <legend className="px-1 text-sm font-semibold text-secondary">Issue</legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="issueNumber" className="field-label">Issue number</label>
              <input id="issueNumber" type="number" name="issueNumber" min={1} required aria-invalid={!!state.errors?.issueNumber} />
              {state.errors?.issueNumber && <span className="field-error">{state.errors.issueNumber[0]}</span>}
            </div>
            <div className="field">
              <label htmlFor="publishedAt" className="field-label">Published date</label>
              <input id="publishedAt" type="date" name="publishedAt" />
            </div>
          </div>
          <div className="field mt-3">
            <label htmlFor="issueTitle" className="field-label">Issue title <span className="font-normal text-secondary">(optional)</span></label>
            <input id="issueTitle" type="text" name="issueTitle" placeholder="Special issue on…" />
          </div>
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" name="isCurrent" className="w-auto" />
            Mark as current issue
          </label>
        </fieldset>

        <div className="flex justify-between">
          <Link href="/dashboard/editor/issues" className="btn btn-secondary">← Cancel</Link>
          <button type="submit" disabled={pending} className="btn btn-primary" aria-busy={pending}>
            {pending ? "Creating…" : "Create Issue"}
          </button>
        </div>
      </form>
    </div>
  );
}
