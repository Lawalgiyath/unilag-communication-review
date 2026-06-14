// Central union types for all String "enums" stored in SQLite.

export const ROLES = ["AUTHOR", "REVIEWER", "EDITOR", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const SUBMISSION_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "REVISIONS_REQUESTED",
  "RESUBMITTED",
  "ACCEPTED",
  "IN_PRODUCTION",
  "PUBLISHED",
  "DESK_REJECTED",
  "REJECTED",
  "WITHDRAWN",
] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  REVISIONS_REQUESTED: "Revisions Requested",
  RESUBMITTED: "Resubmitted",
  ACCEPTED: "Accepted",
  IN_PRODUCTION: "In Production",
  PUBLISHED: "Published",
  DESK_REJECTED: "Desk Rejected",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export const ASSIGNMENT_STATUSES = [
  "INVITED",
  "ACCEPTED",
  "DECLINED",
  "SUBMITTED",
  "CANCELLED",
] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export const RECOMMENDATIONS = [
  "ACCEPT",
  "MINOR_REVISIONS",
  "MAJOR_REVISIONS",
  "REJECT",
] as const;
export type Recommendation = (typeof RECOMMENDATIONS)[number];

export const RECOMMENDATION_LABELS: Record<Recommendation, string> = {
  ACCEPT: "Accept",
  MINOR_REVISIONS: "Minor Revisions",
  MAJOR_REVISIONS: "Major Revisions",
  REJECT: "Reject",
};

export const DECISION_TYPES = [
  "SEND_TO_REVIEW",
  "DESK_REJECT",
  "ACCEPT",
  "MINOR_REVISIONS",
  "MAJOR_REVISIONS",
  "REJECT",
] as const;
export type DecisionType = (typeof DECISION_TYPES)[number];

export const FILE_KINDS = [
  "ANONYMIZED_MANUSCRIPT",
  "TITLE_PAGE",
  "REVIEW_ATTACHMENT",
  "TYPESET_PDF",
] as const;
export type FileKind = (typeof FILE_KINDS)[number];

export function formatSubmissionNumber(number: number, year: number): string {
  return `UCR-${year}-${String(number).padStart(4, "0")}`;
}
