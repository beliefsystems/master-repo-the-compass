/**
 * PURPOSE: Encode the authoritative pure state transition maps and helpers for THE COMPASS workflows.
 * CONNECTIONS: Consumed by future services, validation guards, and tests; throws typed errors from core/errors.
 * LAYER: Core State Machines
 * SSOT REFERENCES: Part 23.4, Part 25.1, Part 25.2, Part 25.3, Part 25.4
 * CONSTRAINTS ENFORCED: Pure transition validation only; no repository, permission, or side-effect logic.
 */
import {
  KPI_CYCLE_STATES,
  KPI_STATES,
  MAX_SUBMISSIONS_PER_CYCLE,
  OBJECTIVE_STATES,
  PMS_REVIEW_STATES,
  STATE_MACHINE_ACTORS,
  type KpiCycleState,
  type KpiState,
  type ObjectiveState,
  type PmsReviewState,
  type StateMachineActor
} from "./constants.js";
import { createAppError, StateTransitionError } from "./errors.js";

type TransitionMap<S extends string> = Record<S, ReadonlySet<S>>;

export const OBJECTIVE_TRANSITIONS: TransitionMap<ObjectiveState> = {
  LAUNCHED: new Set(["ONGOING", "DELETED"]),
  ONGOING: new Set(["COMPLETED", "DELETED"]),
  COMPLETED: new Set(["ONGOING"]),
  DELETED: new Set(["LAUNCHED"])
};

export const KPI_TRANSITIONS: TransitionMap<KpiState> = {
  DRAFT: new Set(["ACTIVE"]),
  ACTIVE: new Set(["LOCKED"]),
  LOCKED: new Set(["IMMUTABLE"]),
  IMMUTABLE: new Set()
};

export const KPI_CYCLE_TRANSITIONS: TransitionMap<KpiCycleState> = {
  DRAFT: new Set(["SUBMITTED", "CANCELLED_BY_SYSTEM"]),
  SUBMITTED: new Set(["APPROVED", "REJECTED", "CANCELLED_BY_SYSTEM"]),
  APPROVED: new Set(["REJECTED", "LOCKED"]),
  REJECTED: new Set(["SUBMITTED", "APPROVED", "CANCELLED_BY_SYSTEM"]),
  CANCELLED_BY_SYSTEM: new Set(),
  LOCKED: new Set()
};

export const PMS_REVIEW_TRANSITIONS: TransitionMap<PmsReviewState> = {
  MANAGER_REVIEW_PENDING: new Set(["MANAGER_SUBMITTED"]),
  MANAGER_SUBMITTED: new Set(["ADMIN_REVIEW_PENDING"]),
  ADMIN_REVIEW_PENDING: new Set(["CLOSED"]),
  CLOSED: new Set()
};

export function canTransition<S extends string>(fromState: S, toState: S, map: TransitionMap<S>): boolean {
  return map[fromState]?.has(toState) ?? false;
}

export function getAllowedTransitions<S extends string>(fromState: S, map: TransitionMap<S>): S[] {
  return Array.from(map[fromState] ?? []);
}

export function isTerminalState<S extends string>(state: S, map: TransitionMap<S>): boolean {
  return getAllowedTransitions(state, map).length === 0;
}

export function assertTransition<S extends string>(fromState: S, toState: S, map: TransitionMap<S>, message?: string): void {
  if (!canTransition(fromState, toState, map)) {
    throw new StateTransitionError(message);
  }
}

export function assertObjectiveTransition(fromState: ObjectiveState, toState: ObjectiveState): void {
  assertTransition(fromState, toState, OBJECTIVE_TRANSITIONS);
}

export function assertKpiTransition(fromState: KpiState, toState: KpiState): void {
  assertTransition(fromState, toState, KPI_TRANSITIONS);
}

export function assertPmsReviewTransition(fromState: PmsReviewState, toState: PmsReviewState): void {
  assertTransition(fromState, toState, PMS_REVIEW_TRANSITIONS);
}

export interface KpiCycleTransitionContext {
  actor: StateMachineActor;
  actualValue: number | null;
  submissionCount: number;
  reasonProvided?: boolean;
  inClosedPmsReview?: boolean;
}

export function assertKpiCycleTransition(
  fromState: KpiCycleState,
  toState: KpiCycleState,
  context: KpiCycleTransitionContext
): void {
  assertTransition(fromState, toState, KPI_CYCLE_TRANSITIONS);

  if (toState === "SUBMITTED") {
    if (context.actualValue === null) {
      throw createAppError("VALIDATION_FAILED", {
        fields: [{ field: "actual_value", message: "actual_value is required for submission." }]
      });
    }

    if (context.submissionCount >= MAX_SUBMISSIONS_PER_CYCLE) {
      throw createAppError("MAX_SUBMISSIONS_EXCEEDED");
    }
  }

  if (toState === "REJECTED" && context.actor !== "ADMIN" && !context.reasonProvided) {
    throw createAppError("VALIDATION_FAILED", {
      fields: [{ field: "comment", message: "A rejection comment is required." }]
    });
  }

  if (fromState === "APPROVED" && toState === "REJECTED" && context.actor !== "ADMIN") {
    throw createAppError("PERMISSION_DENIED");
  }

  if ((fromState === "APPROVED" || fromState === "REJECTED") && toState !== "LOCKED" && context.inClosedPmsReview) {
    throw createAppError("IMMUTABILITY_VIOLATION");
  }
}

export interface ForceCloseResolution {
  resultingState: KpiCycleState;
  forceClosed: true;
  actualValue: null;
}

export function resolveForceCloseState(state: KpiCycleState): ForceCloseResolution {
  if (state === "APPROVED" || state === "LOCKED") {
    throw createAppError("IMMUTABILITY_VIOLATION");
  }

  if (state === "DRAFT") {
    return { resultingState: "DRAFT", forceClosed: true, actualValue: null };
  }

  if (state === "SUBMITTED" || state === "REJECTED") {
    return { resultingState: "CANCELLED_BY_SYSTEM", forceClosed: true, actualValue: null };
  }

  if (state === "CANCELLED_BY_SYSTEM") {
    return { resultingState: "CANCELLED_BY_SYSTEM", forceClosed: true, actualValue: null };
  }

  throw new StateTransitionError();
}

export function assertKnownActor(actor: string): asserts actor is StateMachineActor {
  if (!(STATE_MACHINE_ACTORS as readonly string[]).includes(actor)) {
    throw createAppError("VALIDATION_FAILED", {
      fields: [{ field: "actor", message: "Unknown state machine actor." }]
    });
  }
}

export const OBJECTIVE_STATE_VALUES = OBJECTIVE_STATES;
export const KPI_STATE_VALUES = KPI_STATES;
export const KPI_CYCLE_STATE_VALUES = KPI_CYCLE_STATES;
export const PMS_REVIEW_STATE_VALUES = PMS_REVIEW_STATES;
