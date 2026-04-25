/**
 * PURPOSE: Verify all explicit state-machine helpers and boundary conditions.
 * CONNECTIONS: Exercises pure state machine exports and typed errors.
 * LAYER: Tests
 * SSOT REFERENCES: Part 25
 * CONSTRAINTS ENFORCED: No invalid transitions, force-close behavior, max submission protection.
 */
import { describe, expect, it } from "vitest";
import {
  assertKpiCycleTransition,
  assertKpiTransition,
  assertObjectiveTransition,
  assertPmsReviewTransition,
  canTransition,
  KPI_CYCLE_TRANSITIONS,
  OBJECTIVE_TRANSITIONS,
  resolveForceCloseState
} from "../../src/lib/server/core/state-machines.js";
import { AppError, StateTransitionError } from "../../src/lib/server/core/errors.js";

describe("state machines", () => {
  it("allows and blocks objective transitions exactly", () => {
    expect(canTransition("LAUNCHED", "ONGOING", OBJECTIVE_TRANSITIONS)).toBe(true);
    expect(() => assertObjectiveTransition("LAUNCHED", "COMPLETED")).toThrow(StateTransitionError);
  });

  it("enforces KPI and PMS review transition boundaries", () => {
    expect(() => assertKpiTransition("ACTIVE", "LOCKED")).not.toThrow();
    expect(() => assertKpiTransition("LOCKED", "ACTIVE")).toThrow(StateTransitionError);
    expect(() => assertPmsReviewTransition("ADMIN_REVIEW_PENDING", "CLOSED")).not.toThrow();
    expect(() => assertPmsReviewTransition("CLOSED", "MANAGER_REVIEW_PENDING")).toThrow(StateTransitionError);
  });

  it("enforces KPI cycle submission prerequisites and max submission count", () => {
    expect(() =>
      assertKpiCycleTransition("DRAFT", "SUBMITTED", {
        actor: "EMPLOYEE",
        actualValue: 10,
        submissionCount: 0
      })
    ).not.toThrow();

    expect(() =>
      assertKpiCycleTransition("REJECTED", "SUBMITTED", {
        actor: "EMPLOYEE",
        actualValue: null,
        submissionCount: 1
      })
    ).toThrow(AppError);

    expect(() =>
      assertKpiCycleTransition("REJECTED", "SUBMITTED", {
        actor: "EMPLOYEE",
        actualValue: 5,
        submissionCount: 3
      })
    ).toThrow(AppError);

    expect(canTransition("APPROVED", "REJECTED", KPI_CYCLE_TRANSITIONS)).toBe(true);
  });

  it("resolves force-close state per cycle state rules", () => {
    expect(resolveForceCloseState("DRAFT")).toEqual({
      resultingState: "DRAFT",
      forceClosed: true,
      actualValue: null
    });

    expect(resolveForceCloseState("SUBMITTED")).toEqual({
      resultingState: "CANCELLED_BY_SYSTEM",
      forceClosed: true,
      actualValue: null
    });
  });

  it("rejects force-close on terminal states (APPROVED, LOCKED, CANCELLED_BY_SYSTEM)", () => {
    expect(() => resolveForceCloseState("APPROVED")).toThrow(AppError);
    expect(() => resolveForceCloseState("LOCKED")).toThrow(AppError);
    expect(() => resolveForceCloseState("CANCELLED_BY_SYSTEM")).toThrow(AppError);
  });
});
