import { describe, it, expect } from "vitest";
import {
  TRANSITIONS,
  canTransition,
  assertTransition,
  WorkflowError,
} from "@/lib/workflow";
import { SUBMISSION_STATUSES } from "@/lib/types";

describe("workflow state machine", () => {
  it("covers every status", () => {
    for (const s of SUBMISSION_STATUSES) {
      expect(TRANSITIONS[s]).toBeDefined();
    }
  });

  it("allows the happy path to publication", () => {
    expect(canTransition("SUBMITTED", "UNDER_REVIEW")).toBe(true);
    expect(canTransition("UNDER_REVIEW", "REVISIONS_REQUESTED")).toBe(true);
    expect(canTransition("REVISIONS_REQUESTED", "RESUBMITTED")).toBe(true);
    expect(canTransition("RESUBMITTED", "ACCEPTED")).toBe(true);
    expect(canTransition("ACCEPTED", "IN_PRODUCTION")).toBe(true);
    expect(canTransition("IN_PRODUCTION", "PUBLISHED")).toBe(true);
  });

  it("allows desk rejection only from SUBMITTED", () => {
    expect(canTransition("SUBMITTED", "DESK_REJECTED")).toBe(true);
    expect(canTransition("UNDER_REVIEW", "DESK_REJECTED")).toBe(false);
  });

  it("forbids skipping review", () => {
    expect(canTransition("SUBMITTED", "ACCEPTED")).toBe(false);
    expect(canTransition("SUBMITTED", "PUBLISHED")).toBe(false);
    expect(canTransition("ACCEPTED", "PUBLISHED")).toBe(false);
  });

  it("terminal states have no exits", () => {
    for (const s of ["PUBLISHED", "DESK_REJECTED", "REJECTED", "WITHDRAWN"] as const) {
      expect(TRANSITIONS[s]).toEqual([]);
    }
  });

  it("assertTransition throws WorkflowError on illegal moves", () => {
    expect(() => assertTransition("PUBLISHED", "SUBMITTED")).toThrow(
      WorkflowError
    );
    expect(() => assertTransition("SUBMITTED", "UNDER_REVIEW")).not.toThrow();
  });
});
