"use client";

import { useActionState } from "react";
import Link from "next/link";
import { submitDisputeAction } from "./actions";
import type { DisputeActionState } from "./actions";

interface DisputeFormProps {
  submissionId: string;
  submissionRef: string;
  title: string;
  correspondingAuthorName: string;
  defaultEmail: string;
}

export function DisputeForm({
  submissionId,
  submissionRef,
  title,
  correspondingAuthorName,
  defaultEmail,
}: DisputeFormProps) {
  const [state, formAction, isPending] = useActionState<DisputeActionState, FormData>(
    submitDisputeAction,
    {}
  );

  if (state.success) {
    return (
      <div className="rounded-lg border border-[#a7f3d0] bg-[#f0fdf4] p-6 text-[#166534] shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#16a34a] text-white font-bold">
            ✓
          </span>
          <div>
            <h3 className="text-lg font-bold text-[#14532d]">
              Authorship Dispute Formally Registered
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#166534]">
              Your dispute for manuscript{" "}
              <strong className="font-semibold">{state.referenceNumber ?? submissionRef}</strong> has been
              safely logged in the editorial tracking system.
            </p>
            <div className="mt-4 rounded bg-white p-4 border border-[#bbf7d0] text-xs space-y-2 text-[#1f2937]">
              <p className="font-semibold text-[#14532d] uppercase tracking-wider">
                Next Steps under COPE (Committee on Publication Ethics) Guidelines:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-gray-700">
                <li>The manuscript has been flagged on the Editor-in-Chief review queue.</li>
                <li>Editorial processing and publication decisions are suspended during investigation.</li>
                <li>An official inquiry will be conducted with the corresponding author ({correspondingAuthorName}).</li>
                <li>A written acknowledgment has been dispatched to your email address.</li>
              </ul>
            </div>
            <div className="mt-6">
              <Link href="/" className="btn btn-primary btn-sm">
                Return to Journal Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="submissionId" value={submissionId} />

      {state.errors?.form && (
        <div className="alert alert-error">
          {state.errors.form.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </div>
      )}

      {/* Manuscript summary card */}
      <div className="rounded border border-gray-200 bg-gray-50 p-4 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Target Manuscript
        </p>
        <p className="mt-1 font-semibold text-gray-900">{title}</p>
        <p className="mt-1 text-xs text-gray-600">
          Reference: <span className="font-mono">{submissionRef}</span> · Corresponding Author:{" "}
          <span className="font-medium">{correspondingAuthorName}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="reporterName" className="field-label">
            Your Full Name <span className="text-red-600">*</span>
          </label>
          <input
            id="reporterName"
            name="reporterName"
            type="text"
            required
            className="input"
            placeholder="e.g. Dr. Jane Doe"
          />
          {state.errors?.reporterName && (
            <p className="field-error">{state.errors.reporterName[0]}</p>
          )}
        </div>

        <div className="field">
          <label htmlFor="reporterEmail" className="field-label">
            Your Email Address <span className="text-red-600">*</span>
          </label>
          <input
            id="reporterEmail"
            name="reporterEmail"
            type="email"
            defaultValue={defaultEmail}
            required
            className="input"
            placeholder="name@university.edu.ng"
          />
          {state.errors?.reporterEmail && (
            <p className="field-error">{state.errors.reporterEmail[0]}</p>
          )}
        </div>
      </div>

      <div className="field">
        <label htmlFor="reporterAffiliation" className="field-label">
          Institutional Affiliation (Optional)
        </label>
        <input
          id="reporterAffiliation"
          name="reporterAffiliation"
          type="text"
          className="input"
          placeholder="e.g. Department of Mass Communication, University of Lagos"
        />
      </div>

      <div className="field">
        <label htmlFor="disputeCategory" className="field-label">
          Nature of Objection / Dispute <span className="text-red-600">*</span>
        </label>
        <select
          id="disputeCategory"
          name="disputeCategory"
          required
          className="input"
          defaultValue=""
        >
          <option value="" disabled>
            Select dispute category...
          </option>
          <option value="UNAUTHORIZED_SUBMISSION">
            I did not authorize or consent to this manuscript submission
          </option>
          <option value="PLAGIARISM_OR_THEFT">
            Plagiarism or unauthorized use of intellectual property/data
          </option>
          <option value="AUTHORSHIP_CONFLICT">
            Authorship attribution conflict (omitted co-author or improper order)
          </option>
          <option value="OTHER_ETHICAL_VIOLATION">
            Other research ethics or publication violation
          </option>
        </select>
        {state.errors?.disputeCategory && (
          <p className="field-error">{state.errors.disputeCategory[0]}</p>
        )}
      </div>

      <div className="field">
        <label htmlFor="statement" className="field-label">
          Statement &amp; Explanation <span className="text-red-600">*</span>
        </label>
        <p className="mb-2 text-xs text-gray-500">
          Provide specific details regarding your dispute (e.g. your role in the research, lack of prior approval, stolen data or draft, etc.).
        </p>
        <textarea
          id="statement"
          name="statement"
          rows={5}
          required
          minLength={20}
          className="input"
          placeholder="Describe the nature of your dispute in detail..."
        />
        {state.errors?.statement && (
          <p className="field-error">{state.errors.statement[0]}</p>
        )}
      </div>

      <div className="field flex items-start gap-2 pt-2">
        <input
          type="checkbox"
          id="confirmAccuracy"
          name="confirmAccuracy"
          required
          className="mt-1 h-4 w-4 rounded border-gray-300 text-maroon focus:ring-maroon"
        />
        <label htmlFor="confirmAccuracy" className="text-xs leading-relaxed text-gray-700">
          I certify that the information provided in this dispute is accurate, truthful, and submitted in good faith under Committee on Publication Ethics (COPE) principles.
        </label>
      </div>
      {state.errors?.confirmAccuracy && (
        <p className="field-error">{state.errors.confirmAccuracy[0]}</p>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="btn btn-danger w-full sm:w-auto"
        >
          {isPending ? "Submitting Dispute..." : "Submit Formal Dispute (COPE Protocol)"}
        </button>
      </div>
    </form>
  );
}
