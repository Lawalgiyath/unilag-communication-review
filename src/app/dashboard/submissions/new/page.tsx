"use client";

import { useActionState, use } from "react";
import Link from "next/link";
import { ARTICLE_TYPES } from "@/lib/constants";
import { JOURNAL } from "@/lib/constants";
import {
  step1Action, type Step1State,
  step2Action, type Step2State,
  step3Action, type Step3State,
  step4Action, type Step4State,
} from "./actions";

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { num: 1, label: "Details" },
  { num: 2, label: "Authors" },
  { num: 3, label: "Files" },
  { num: 4, label: "Submit" },
];

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="step-indicator" aria-label="Submission progress">
      {STEPS.map((s, i) => (
        <span key={s.num} className="contents">
          <span className={`step-item ${current === s.num ? "active" : current > s.num ? "done" : ""}`}>
            <span className="step-num" aria-current={current === s.num ? "step" : undefined}>
              {current > s.num ? "✓" : s.num}
            </span>
            <span className="step-label">{s.label}</span>
          </span>
          {i < STEPS.length - 1 && <span className="step-connector" aria-hidden="true" />}
        </span>
      ))}
    </div>
  );
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────

function Step1Form({ submissionId }: { submissionId?: string }) {
  const [state, formAction, pending] = useActionState<Step1State, FormData>(step1Action, {});

  return (
    <form action={formAction} className="space-y-5">
      {submissionId && <input type="hidden" name="submissionId" value={submissionId} />}

      <div className="field">
        <label htmlFor="title" className="field-label">
          Manuscript title <span aria-hidden="true" className="text-error">*</span>
        </label>
        <input id="title" name="title" type="text" required aria-invalid={!!state.errors?.title}
          aria-describedby={state.errors?.title ? "title-err" : undefined} />
        {state.errors?.title && <span id="title-err" className="field-error">{state.errors.title[0]}</span>}
      </div>

      <div className="field">
        <label htmlFor="abstract" className="field-label">
          Abstract <span aria-hidden="true" className="text-error">*</span>
        </label>
        <span className="field-hint">Minimum 150 words. Do not include author names.</span>
        <textarea id="abstract" name="abstract" rows={8} required
          aria-invalid={!!state.errors?.abstract}
          style={{ minHeight: "200px" }} />
        {state.errors?.abstract && <span className="field-error">{state.errors.abstract[0]}</span>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="articleType" className="field-label">
            Article type <span aria-hidden="true" className="text-error">*</span>
          </label>
          <select id="articleType" name="articleType" required aria-invalid={!!state.errors?.articleType}>
            <option value="">Select…</option>
            {Object.entries(ARTICLE_TYPES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {state.errors?.articleType && <span className="field-error">{state.errors.articleType[0]}</span>}
        </div>
        <div className="field">
          <label htmlFor="wordCount" className="field-label">Word count</label>
          <input id="wordCount" name="wordCount" type="number" min={1000} placeholder="e.g. 6500" />
        </div>
      </div>

      <div className="field">
        <label htmlFor="keywordsCsv" className="field-label">
          Keywords <span aria-hidden="true" className="text-error">*</span>
        </label>
        <span className="field-hint">Separate keywords with commas. 4–8 keywords recommended.</span>
        <input id="keywordsCsv" name="keywordsCsv" type="text" required
          placeholder="e.g. media framing, agenda setting, political communication"
          aria-invalid={!!state.errors?.keywordsCsv} />
        {state.errors?.keywordsCsv && <span className="field-error">{state.errors.keywordsCsv[0]}</span>}
      </div>

      <div className="border border-hairline bg-paper-dark p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" name="guidelinesConfirmed" className="mt-0.5 w-auto"
            aria-invalid={!!state.errors?.guidelinesConfirmed} aria-describedby="guide-err" />
          <span className="text-sm text-ink">
            I confirm that I have read the{" "}
            <Link href="/submission-guidelines" target="_blank" className="text-maroon underline">
              submission guidelines
            </Link>{" "}
            and this manuscript has not been published elsewhere or submitted simultaneously to another journal.
          </span>
        </label>
        {state.errors?.guidelinesConfirmed && (
          <span id="guide-err" className="field-error mt-2 block">{state.errors.guidelinesConfirmed[0]}</span>
        )}
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="btn btn-primary" aria-busy={pending}>
          {pending ? "Saving…" : "Continue to Authors →"}
        </button>
      </div>
    </form>
  );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────

function Step2Form({ submissionId }: { submissionId: string }) {
  const [state, formAction, pending] = useActionState<Step2State, FormData>(step2Action, {});

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="submissionId" value={submissionId} />

      <div className="alert alert-info">
        You (the corresponding author) are already listed as Author 1. Add co-authors below. Leave all fields empty if there are no co-authors.
      </div>

      {[0, 1, 2, 3, 4].map((i) => (
        <fieldset key={i} className="border border-hairline p-4">
          <legend className="px-1 text-sm font-semibold text-secondary">
            Co-author {i + 2}
          </legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="field">
              <label htmlFor={`aname-${i}`} className="field-label">Full name</label>
              <input id={`aname-${i}`} type="text" name="authorName" placeholder="First Last" />
            </div>
            <div className="field">
              <label htmlFor={`aemail-${i}`} className="field-label">Email</label>
              <input id={`aemail-${i}`} type="email" name="authorEmail" />
            </div>
            <div className="field">
              <label htmlFor={`aaff-${i}`} className="field-label">Affiliation</label>
              <input id={`aaff-${i}`} type="text" name="authorAffiliation" />
            </div>
            <div className="field">
              <label htmlFor={`aorcid-${i}`} className="field-label">ORCID</label>
              <input id={`aorcid-${i}`} type="text" name="authorOrcid" placeholder="0000-0000-0000-0000" />
            </div>
          </div>
        </fieldset>
      ))}

      <div className="flex justify-between">
        <Link href={`/dashboard/submissions/new?step=1&id=${submissionId}`} className="btn btn-secondary">
          ← Back
        </Link>
        <button type="submit" disabled={pending} className="btn btn-primary" aria-busy={pending}>
          {pending ? "Saving…" : "Continue to Files →"}
        </button>
      </div>
    </form>
  );
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────

function Step3Form({ submissionId }: { submissionId: string }) {
  const [state, formAction, pending] = useActionState<Step3State, FormData>(step3Action, {});

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-5">
      <input type="hidden" name="submissionId" value={submissionId} />

      <div className="field">
        <label htmlFor="manuscript" className="field-label">
          Anonymized manuscript <span aria-hidden="true" className="text-error">*</span>
        </label>
        <span className="field-hint">
          PDF or Word (.docx) file, max 10 MB. Remove all author names, affiliations, and self-identifying references.
        </span>
        <input id="manuscript" type="file" name="manuscript" accept=".pdf,.doc,.docx" required
          aria-invalid={!!state.errors?.manuscript} className="w-auto" />
        {state.errors?.manuscript && <span className="field-error">{state.errors.manuscript[0]}</span>}
      </div>

      <div className="field">
        <label htmlFor="titlePage" className="field-label">
          Title page <span className="font-normal text-secondary">(optional)</span>
        </label>
        <span className="field-hint">
          Separate PDF with full author details, affiliations, acknowledgements. Max 10 MB.
        </span>
        <input id="titlePage" type="file" name="titlePage" accept=".pdf,.doc,.docx" className="w-auto" />
      </div>

      <div className="flex justify-between">
        <Link href={`/dashboard/submissions/new?step=2&id=${submissionId}`} className="btn btn-secondary">
          ← Back
        </Link>
        <button type="submit" disabled={pending} className="btn btn-primary" aria-busy={pending}>
          {pending ? "Uploading…" : "Continue to Review →"}
        </button>
      </div>
    </form>
  );
}

// ─── Step 4 ───────────────────────────────────────────────────────────────────

function Step4Form({ submissionId, submissionTitle }: { submissionId: string; submissionTitle?: string }) {
  const [state, formAction, pending] = useActionState<Step4State, FormData>(step4Action, {});

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="submissionId" value={submissionId} />

      <div className="border border-hairline bg-paper-dark p-5">
        <p className="section-label">Ready to submit</p>
        {submissionTitle && (
          <p className="mt-3 font-display text-lg font-semibold text-ink">{submissionTitle}</p>
        )}
        <ul className="mt-4 space-y-1 text-sm text-secondary">
          <li>✓ Manuscript details saved</li>
          <li>✓ Author list saved</li>
          <li>✓ Manuscript file uploaded</li>
        </ul>
      </div>

      <div className="border border-hairline bg-paper-dark p-5">
        <p className="font-display text-base font-semibold text-ink">Publication fee</p>
        <p className="mt-2 text-sm text-secondary">
          UNILAG Communication Review charges a processing fee of{" "}
          <strong className="text-ink">₦{JOURNAL.feeNaira}</strong> upon acceptance of your
          manuscript. You will not be charged until your manuscript has been accepted for
          publication. Payment details will be communicated by the editorial office.
        </p>
        <label className="mt-4 flex items-start gap-3 cursor-pointer">
          <input type="checkbox" name="feeAcknowledged" className="mt-0.5 w-auto"
            aria-invalid={!!state.errors?.feeAcknowledged} />
          <span className="text-sm text-ink">
            I acknowledge the publication fee of ₦{JOURNAL.feeNaira} payable upon acceptance.
          </span>
        </label>
        {state.errors?.feeAcknowledged && (
          <span className="field-error mt-2 block">{state.errors.feeAcknowledged[0]}</span>
        )}
      </div>

      <div className="flex justify-between">
        <Link href={`/dashboard/submissions/new?step=3&id=${submissionId}`} className="btn btn-secondary">
          ← Back
        </Link>
        <button type="submit" disabled={pending} className="btn btn-primary" aria-busy={pending}>
          {pending ? "Submitting…" : "Submit Manuscript"}
        </button>
      </div>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewSubmissionPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; id?: string }>;
}) {
  const sp = use(searchParams);
  const step = (Number(sp?.step ?? "1") as Step) || 1;
  const validStep = ([1, 2, 3, 4].includes(step) ? step : 1) as Step;
  const submissionId = sp?.id;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">New Submission</h1>
          <p className="page-subtitle">Submit your manuscript to UNILAG Communication Review</p>
        </div>
        <Link href="/dashboard" className="btn btn-ghost btn-sm">
          Cancel
        </Link>
      </div>

      <StepIndicator current={validStep} />

      {validStep === 1 && <Step1Form submissionId={submissionId} />}
      {validStep === 2 && submissionId && <Step2Form submissionId={submissionId} />}
      {validStep === 3 && submissionId && <Step3Form submissionId={submissionId} />}
      {validStep === 4 && submissionId && (
        <Step4Form submissionId={submissionId} />
      )}

      {(validStep === 2 || validStep === 3 || validStep === 4) && !submissionId && (
        <div className="alert alert-error">
          Invalid session. Please <Link href="/dashboard/submissions/new">start over</Link>.
        </div>
      )}
    </div>
  );
}
