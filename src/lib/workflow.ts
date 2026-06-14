import type { SubmissionStatus } from "./types";

/**
 * Editorial workflow state machine. The single source of truth for which
 * status transitions are legal. Every mutating server action must call
 * assertTransition before writing a new status.
 */
export const TRANSITIONS: Record<SubmissionStatus, SubmissionStatus[]> = {
  SUBMITTED: ["UNDER_REVIEW", "DESK_REJECTED", "WITHDRAWN"],
  UNDER_REVIEW: ["REVISIONS_REQUESTED", "ACCEPTED", "REJECTED", "WITHDRAWN"],
  REVISIONS_REQUESTED: ["RESUBMITTED", "WITHDRAWN"],
  RESUBMITTED: ["UNDER_REVIEW", "ACCEPTED", "REJECTED", "WITHDRAWN"],
  ACCEPTED: ["IN_PRODUCTION"],
  IN_PRODUCTION: ["PUBLISHED"],
  PUBLISHED: [],
  DESK_REJECTED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

export class WorkflowError extends Error {
  constructor(from: string, to: string) {
    super(`Illegal status transition: ${from} -> ${to}`);
    this.name = "WorkflowError";
  }
}

export function canTransition(
  from: SubmissionStatus,
  to: SubmissionStatus
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(
  from: SubmissionStatus,
  to: SubmissionStatus
): void {
  if (!canTransition(from, to)) {
    throw new WorkflowError(from, to);
  }
}

/** Statuses that count as "open" (still in the editorial pipeline). */
export const OPEN_STATUSES: SubmissionStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "REVISIONS_REQUESTED",
  "RESUBMITTED",
  "ACCEPTED",
  "IN_PRODUCTION",
];

/** Statuses that are terminal. */
export const TERMINAL_STATUSES: SubmissionStatus[] = [
  "PUBLISHED",
  "DESK_REJECTED",
  "REJECTED",
  "WITHDRAWN",
];
