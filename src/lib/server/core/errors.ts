/**
 * PURPOSE: Define the canonical typed error system and registry for the backend core.
 * CONNECTIONS: Used by validation, state machine helpers, and future services/controllers.
 * LAYER: Core Errors
 * SSOT REFERENCES: Part 23.4, Part 28.6
 * CONSTRAINTS ENFORCED: Registry is limited to canonical Part 28.6 error codes; PMS_BLOCKING_CONDITIONS excluded.
 */
import type { ApiFieldError } from "../../shared/types/index.js";

export const APP_ERROR_CODES = [
  "VALIDATION_FAILED",
  "USER_NOT_FOUND",
  "WEIGHTAGE_SUM_INVALID",
  "TARGET_EQUALS_STANDARD",
  "CONTROL_STANDARD_EXCEEDS_TARGET",
  "CYCLE_TARGET_EQUALS_STANDARD",
  "TIMELINE_INVALID_DATE",
  "TIMELINE_CROSS_MONTH",
  "TIMELINE_TOO_SHORT",
  "IMPORT_VALIDATION_FAILED",
  "MISSING_REASON",
  "PERMISSION_DENIED",
  "BOD_WRITE_FORBIDDEN",
  "IMMUTABILITY_VIOLATION",
  "DERIVED_CADENCE_IMMUTABLE",
  "UNAUTHORIZED_APPROVAL_ATTEMPT",
  "INVALID_CREDENTIALS",
  "SESSION_EXPIRED",
  "INVALID_STATE_TRANSITION",
  "CONCURRENT_MODIFICATION",
  "MAX_SUBMISSIONS_EXCEEDED",
  "CHILD_ALREADY_MAPPED",
  "CIRCULAR_MAPPING_BLOCKED",
  "OBJECTIVE_DUPLICATION_BLOCKED",
  "TIMELINE_LOCKED",
  "LAST_CYCLE_DELETION_BLOCKED",
  "OBJECTIVE_HAS_EXECUTION_DATA",
  "KPI_HAS_EXECUTION_DATA",
  "MOVE_BLOCKED_HAS_EXECUTION_DATA",
  "PMS_REVIEW_EXISTS",
  "IMPORT_JOB_EXPIRED",
  "IMPORT_JOB_ALREADY_COMMITTED",
  "EXPORT_EXCEEDS_LIMIT",
  "PRECONDITION_FAILED",
  "ATTRIBUTE_IN_USE",
  "USER_ALREADY_EXISTS",
  "RATE_LIMIT_EXCEEDED",
  "INTERNAL_SERVER_ERROR"
] as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

export interface AppErrorDefinition {
  httpStatus: number;
  message: string;
}

export const APP_ERROR_REGISTRY: Record<AppErrorCode, AppErrorDefinition> = {
  VALIDATION_FAILED: { httpStatus: 400, message: "Validation failed." },
  USER_NOT_FOUND: { httpStatus: 404, message: "User not found." },
  WEIGHTAGE_SUM_INVALID: { httpStatus: 400, message: "Weightage does not sum to 100." },
  TARGET_EQUALS_STANDARD: { httpStatus: 400, message: "KPI target equals standard." },
  CONTROL_STANDARD_EXCEEDS_TARGET: { httpStatus: 400, message: "CONTROL KPI standard exceeds target." },
  CYCLE_TARGET_EQUALS_STANDARD: { httpStatus: 400, message: "Custom target cycle target equals standard." },
  TIMELINE_INVALID_DATE: { httpStatus: 400, message: "Timeline date is outside the allowed boundary." },
  TIMELINE_CROSS_MONTH: { httpStatus: 400, message: "Timeline cannot span multiple months." },
  TIMELINE_TOO_SHORT: { httpStatus: 400, message: "Timeline duration is below the minimum allowed length." },
  IMPORT_VALIDATION_FAILED: { httpStatus: 400, message: "Import validation failed." },
  MISSING_REASON: { httpStatus: 400, message: "A reason is required for this action." },
  PERMISSION_DENIED: { httpStatus: 403, message: "Permission denied." },
  BOD_WRITE_FORBIDDEN: { httpStatus: 403, message: "BoD Admin write actions are forbidden." },
  IMMUTABILITY_VIOLATION: { httpStatus: 403, message: "Immutable data cannot be modified." },
  DERIVED_CADENCE_IMMUTABLE: { httpStatus: 403, message: "Derived cadence values are read-only." },
  UNAUTHORIZED_APPROVAL_ATTEMPT: { httpStatus: 403, message: "Approval attempt is not authorized." },
  INVALID_CREDENTIALS: { httpStatus: 401, message: "Invalid credentials." },
  SESSION_EXPIRED: { httpStatus: 401, message: "Session has expired." },
  INVALID_STATE_TRANSITION: { httpStatus: 409, message: "Invalid state transition." },
  CONCURRENT_MODIFICATION: { httpStatus: 409, message: "Concurrent modification detected." },
  MAX_SUBMISSIONS_EXCEEDED: { httpStatus: 409, message: "Maximum submissions exceeded." },
  CHILD_ALREADY_MAPPED: { httpStatus: 409, message: "The child objective is already mapped." },
  CIRCULAR_MAPPING_BLOCKED: { httpStatus: 409, message: "Circular objective mapping is blocked." },
  OBJECTIVE_DUPLICATION_BLOCKED: { httpStatus: 409, message: "Duplicate objective identity is blocked." },
  TIMELINE_LOCKED: { httpStatus: 409, message: "Timeline is locked after submission." },
  LAST_CYCLE_DELETION_BLOCKED: { httpStatus: 409, message: "Deleting the last cycle is blocked." },
  OBJECTIVE_HAS_EXECUTION_DATA: { httpStatus: 409, message: "Objective has execution data." },
  KPI_HAS_EXECUTION_DATA: { httpStatus: 409, message: "KPI has execution data." },
  MOVE_BLOCKED_HAS_EXECUTION_DATA: { httpStatus: 409, message: "Move is blocked because execution data exists." },
  PMS_REVIEW_EXISTS: { httpStatus: 409, message: "PMS review already exists." },
  IMPORT_JOB_EXPIRED: { httpStatus: 409, message: "Import job has expired." },
  IMPORT_JOB_ALREADY_COMMITTED: { httpStatus: 409, message: "Import job has already been committed." },
  EXPORT_EXCEEDS_LIMIT: { httpStatus: 400, message: "Export exceeds the maximum allowed size." },
  PRECONDITION_FAILED: { httpStatus: 412, message: "A required precondition is not satisfied." },
  ATTRIBUTE_IN_USE: { httpStatus: 409, message: "Attribute is in use." },
  USER_ALREADY_EXISTS: { httpStatus: 409, message: "User already exists." },
  RATE_LIMIT_EXCEEDED: { httpStatus: 429, message: "Rate limit exceeded." },
  INTERNAL_SERVER_ERROR: { httpStatus: 500, message: "Internal server error." }
};

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly httpStatus: number;
  public readonly fields?: ApiFieldError[];
  public readonly requestId?: string;

  public constructor(code: AppErrorCode, options?: { message?: string; fields?: ApiFieldError[]; requestId?: string }) {
    super(options?.message ?? APP_ERROR_REGISTRY[code].message);
    this.code = code;
    this.httpStatus = APP_ERROR_REGISTRY[code].httpStatus;
    this.fields = options?.fields;
    this.requestId = options?.requestId;
  }
}

export class ValidationAppError extends AppError {
  public constructor(fields: ApiFieldError[], message = APP_ERROR_REGISTRY.VALIDATION_FAILED.message) {
    super("VALIDATION_FAILED", { message, fields });
  }
}

export class StateTransitionError extends AppError {
  public constructor(message = APP_ERROR_REGISTRY.INVALID_STATE_TRANSITION.message) {
    super("INVALID_STATE_TRANSITION", { message });
  }
}

export function createAppError(code: AppErrorCode, options?: { message?: string; fields?: ApiFieldError[]; requestId?: string }) {
  return new AppError(code, options);
}

export function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${String(value)}`);
}
