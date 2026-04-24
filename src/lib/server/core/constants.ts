/**
 * PURPOSE: Provide the single source of truth for all V1 system vocabulary and enum-like values.
 * CONNECTIONS: Consumed by Drizzle schema enums, validation schemas, state machines, calculations, and shared types.
 * LAYER: Core Constants
 * SSOT REFERENCES: Part 24 schema enums, Part 25 state machines, Part 26 cadence and status vocabulary, Part 28.6 errors
 * CONSTRAINTS ENFORCED: No duplicated enum definitions across layers; V2-only vocabulary excluded from V1 core where deferred.
 */
export const FISCAL_YEAR_STARTS = ["APRIL", "JANUARY"] as const;
export const ORGANISATION_STATUSES = ["ACTIVE", "DEACTIVATED"] as const;
export const USER_ROLES = ["ADMIN", "MANAGER", "EMPLOYEE"] as const;
export const OBJECTIVE_CATEGORIES = ["RC", "CO", "OE", "OTHERS"] as const;
export const OBJECTIVE_STATES = ["LAUNCHED", "ONGOING", "COMPLETED", "DELETED"] as const;
export const KPI_METRIC_TYPES = ["INCREASE", "DECREASE", "CONTROL", "CUMULATIVE"] as const;
export const KPI_TARGET_TYPES = ["FIXED", "CUSTOM"] as const;
export const KPI_AGGREGATION_METHODS = ["SUM", "AVERAGE"] as const;
export const KPI_FREQUENCIES = ["WEEKLY", "MONTHLY"] as const;
export const KPI_STATES = ["DRAFT", "ACTIVE", "LOCKED", "IMMUTABLE"] as const;
export const KPI_CYCLE_STATES = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "CANCELLED_BY_SYSTEM",
  "LOCKED"
] as const;
export const KPI_SUBMISSION_STATES = [
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "CANCELLED_BY_SYSTEM",
  "LOCKED"
] as const;
export const PMS_PERIOD_TYPES = ["QUARTERLY", "HALF_YEARLY", "ANNUAL"] as const;
export const PMS_REVIEW_STATES = [
  "MANAGER_REVIEW_PENDING",
  "MANAGER_SUBMITTED",
  "ADMIN_REVIEW_PENDING",
  "CLOSED"
] as const;
export const NOTIFICATION_STATUSES = ["UNREAD", "READ"] as const;
export const ATTRIBUTE_TYPES = [
  "DEPARTMENT",
  "DIVISION",
  "BUSINESS_UNIT",
  "LOCATION",
  "DESIGNATION"
] as const;
export const IMPORT_JOB_STATUSES = ["PENDING", "VALIDATED", "FAILED", "COMMITTED"] as const;
export const SYSTEM_EVENT_TYPES = [
  "USER_CREATED",
  "USER_DEACTIVATED",
  "USER_REACTIVATED",
  "ROLE_CHANGED",
  "MANAGER_CHANGED",
  "FORCE_CLOSE_MONTH",
  "OBJECTIVE_DELETED",
  "KPI_DELETED",
  "KPI_CYCLE_DELETED",
  "APPROVAL_OVERRIDE",
  "PMS_REVIEW_INITIATED",
  "PMS_REVIEW_CLOSED",
  "ATTRIBUTE_CHANGED",
  "CONFIG_CHANGED"
] as const;
export const WRITABLE_CADENCES = ["MONTHLY"] as const;
export const DERIVED_CADENCES = ["QUARTERLY", "HALF_YEARLY", "ANNUAL"] as const;
export const SCORE_CADENCES = ["MONTHLY", ...DERIVED_CADENCES] as const;
export const REVIEW_SENTIMENTS = ["HAPPY", "NEUTRAL", "SAD"] as const;
export const KPI_STATUSES = ["NOT_STARTED", "AT_RISK", "OFF_TRACK", "ON_TRACK", "ACHIEVED"] as const;
export const STATE_MACHINE_ACTORS = ["SYSTEM", "ADMIN", "MANAGER", "EMPLOYEE"] as const;
export const APPROVAL_ACTIONS = ["APPROVE", "REJECT"] as const;
export const EXPORT_FORMATS = ["xlsx", "csv"] as const;

export type FiscalYearStart = (typeof FISCAL_YEAR_STARTS)[number];
export type OrganisationStatus = (typeof ORGANISATION_STATUSES)[number];
export type UserRole = (typeof USER_ROLES)[number];
export type ObjectiveCategory = (typeof OBJECTIVE_CATEGORIES)[number];
export type ObjectiveState = (typeof OBJECTIVE_STATES)[number];
export type KpiMetricType = (typeof KPI_METRIC_TYPES)[number];
export type KpiTargetType = (typeof KPI_TARGET_TYPES)[number];
export type KpiAggregationMethod = (typeof KPI_AGGREGATION_METHODS)[number];
export type KpiFrequency = (typeof KPI_FREQUENCIES)[number];
export type KpiState = (typeof KPI_STATES)[number];
export type KpiCycleState = (typeof KPI_CYCLE_STATES)[number];
export type KpiSubmissionState = (typeof KPI_SUBMISSION_STATES)[number];
export type PmsPeriodType = (typeof PMS_PERIOD_TYPES)[number];
export type PmsReviewState = (typeof PMS_REVIEW_STATES)[number];
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];
export type AttributeType = (typeof ATTRIBUTE_TYPES)[number];
export type ImportJobStatus = (typeof IMPORT_JOB_STATUSES)[number];
export type SystemEventType = (typeof SYSTEM_EVENT_TYPES)[number];
export type WritableCadence = (typeof WRITABLE_CADENCES)[number];
export type DerivedCadence = (typeof DERIVED_CADENCES)[number];
export type ScoreCadence = (typeof SCORE_CADENCES)[number];
export type ReviewSentiment = (typeof REVIEW_SENTIMENTS)[number];
export type KpiStatus = (typeof KPI_STATUSES)[number];
export type StateMachineActor = (typeof STATE_MACHINE_ACTORS)[number];
export type ApprovalAction = (typeof APPROVAL_ACTIONS)[number];
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const DEFAULT_KPI_STATUS_BANDS = {
  at_risk: { min: 0, max: 59, label: "At Risk", color: "#EF4444" },
  off_track: { min: 60, max: 79, label: "Off Track", color: "#F59E0B" },
  on_track: { min: 80, max: 99, label: "On Track", color: "#84CC16" },
  achieved: { min: 100, max: null, label: "Achieved", color: "#22C55E" }
} as const;

export const DEFAULT_PMS_RATING_BANDS = [
  { min: 100, max: null, label: "Exceeds Expectations" },
  { min: 90, max: 99.99, label: "Meets Expectations" },
  { min: 70, max: 89.99, label: "Below Expectations" },
  { min: 0, max: 69.99, label: "Disappointing" }
] as const;

export const DEFAULT_ORG_TIMEZONE = "Asia/Kolkata" as const;
export const DEFAULT_PMS_CADENCES_ENABLED = [...DERIVED_CADENCES] as const;
export const MAX_SUBMISSIONS_PER_CYCLE = 3 as const;
export const MIN_COMMENT_LENGTH = 10 as const;
export const MAX_COMMENT_LENGTH = 1000 as const;
export const MIN_TIMELINE_DAYS = 7 as const;
export const MAX_TIMELINE_DAYS = 31 as const;
export const MAX_IMPORT_FILE_SIZE_MB = 10 as const;

export function asPgEnumValues<const T extends readonly string[]>(values: T): [T[number], ...T[number][]] {
  return values as unknown as [T[number], ...T[number][]];
}
