"use client";

import { useActionState } from "react";
import { respondToInvitationAction, submitReviewAction } from "./actions";
import type { RespondState, SubmitReviewState } from "./actions";

type Props =
  | { assignmentId: string; mode: "invitation" }
  | {
      assignmentId: string;
      mode: "review";
      manuscriptFileId?: string;
      submissionId?: string;
    };

export default function ReviewForm(props: Props) {
  const [respondState, respondAction, respondPending] = useActionState<RespondState, FormData>(
    respondToInvitationAction, {}
  );
  const [reviewState, reviewAction, reviewPending] = useActionState<SubmitReviewState, FormData>(
    submitReviewAction, {}
  );

  if (props.mode === "invitation") {
    return (
      <div className="border border-hairline p-6">
        <h2 className="font-display text-xl font-semibold text-ink">
          Review invitation
        </h2>
        <p className="mt-2 text-sm text-secondary">
          You have been invited to review a manuscript for UNILAG Communication Review. Please accept or decline the invitation below. If you have a conflict of interest, please decline.
        </p>

        {respondState.errors?.form && (
          <div className="alert alert-error mt-4">{respondState.errors.form[0]}</div>
        )}

        <div className="mt-5 flex gap-3">
          <form action={respondAction}>
            <input type="hidden" name="assignmentId" value={props.assignmentId} />
            <input type="hidden" name="response" value="ACCEPTED" />
            <button type="submit" disabled={respondPending} className="btn btn-primary" aria-busy={respondPending}>
              {respondPending ? "…" : "Accept invitation"}
            </button>
          </form>
          <form action={respondAction}>
            <input type="hidden" name="assignmentId" value={props.assignmentId} />
            <input type="hidden" name="response" value="DECLINED" />
            <button type="submit" disabled={respondPending} className="btn btn-secondary" aria-busy={respondPending}>
              Decline
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Review mode
  return (
    <section aria-labelledby="review-form-heading" className="mt-6">
      <h2 id="review-form-heading" className="section-label border-b border-hairline pb-2 mb-5">
        Submit your review
      </h2>

      {props.manuscriptFileId && (
        <div className="mb-5">
          <a
            href={`/api/files/${props.manuscriptFileId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            ↓ Download anonymized manuscript
          </a>
        </div>
      )}

      {reviewState.errors?.form && (
        <div className="alert alert-error mb-4">{reviewState.errors.form[0]}</div>
      )}

      <form action={reviewAction} className="space-y-5">
        <input type="hidden" name="assignmentId" value={props.assignmentId} />

        <div className="field">
          <label htmlFor="recommendation" className="field-label">
            Recommendation <span aria-hidden="true" className="text-error">*</span>
          </label>
          <select id="recommendation" name="recommendation" required aria-invalid={!!reviewState.errors?.recommendation}>
            <option value="">Select…</option>
            <option value="ACCEPT">Accept</option>
            <option value="MINOR_REVISIONS">Minor revisions</option>
            <option value="MAJOR_REVISIONS">Major revisions</option>
            <option value="REJECT">Reject</option>
          </select>
          {reviewState.errors?.recommendation && (
            <span className="field-error">{reviewState.errors.recommendation[0]}</span>
          )}
        </div>

        <div className="field">
          <label htmlFor="commentsToAuthor" className="field-label">
            Comments to author <span aria-hidden="true" className="text-error">*</span>
          </label>
          <span className="field-hint">
            These comments will be shared with the author. Be constructive and specific. Minimum 100 characters.
          </span>
          <textarea
            id="commentsToAuthor"
            name="commentsToAuthor"
            rows={12}
            required
            aria-invalid={!!reviewState.errors?.commentsToAuthor}
            style={{ minHeight: "280px" }}
          />
          {reviewState.errors?.commentsToAuthor && (
            <span className="field-error">{reviewState.errors.commentsToAuthor[0]}</span>
          )}
        </div>

        <div className="field">
          <label htmlFor="commentsToEditor" className="field-label">
            Confidential comments to editor{" "}
            <span className="font-normal text-secondary">(optional)</span>
          </label>
          <span className="field-hint">These comments will NOT be shared with the author.</span>
          <textarea
            id="commentsToEditor"
            name="commentsToEditor"
            rows={5}
            style={{ minHeight: "120px" }}
          />
        </div>

        <button
          type="submit"
          disabled={reviewPending}
          className="btn btn-primary"
          aria-busy={reviewPending}
        >
          {reviewPending ? "Submitting…" : "Submit review"}
        </button>
      </form>
    </section>
  );
}
