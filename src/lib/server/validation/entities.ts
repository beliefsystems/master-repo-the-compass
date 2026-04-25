/**
 * PURPOSE: Define Zod schemas that mirror the authoritative V1 entity shapes without service-layer orchestration rules.
 * CONNECTIONS: Reused by request schemas, tests, and future repository/service boundaries.
 * LAYER: Schema / Models Validation
 * SSOT REFERENCES: Part 24 schema, Part 7 KPI properties, Part 23.7 optimistic locking
 * CONSTRAINTS ENFORCED: Enum correctness, field types, required shapes, version fields where explicitly mutable.
 */
import { z } from "zod";
import {
  APPROVAL_ACTIONS,
  ATTRIBUTE_TYPES,
  FISCAL_YEAR_STARTS,
  IMPORT_JOB_STATUSES,
  KPI_AGGREGATION_METHODS,
  KPI_CYCLE_STATES,
  KPI_FREQUENCIES,
  KPI_METRIC_TYPES,
  KPI_STATES,
  KPI_SUBMISSION_STATES,
  KPI_TARGET_TYPES,
  MAX_COMMENT_LENGTH,
  MIN_COMMENT_LENGTH,
  NOTIFICATION_STATUSES,
  OBJECTIVE_CATEGORIES,
  OBJECTIVE_STATES,
  ORGANISATION_STATUSES,
  PMS_PERIOD_TYPES,
  PMS_REVIEW_STATES,
  REVIEW_SENTIMENTS,
  SYSTEM_EVENT_TYPES,
  USER_ROLES
} from "../core/constants.js";

export const uuidSchema = z.string().uuid();
export const positiveIntSchema = z.number().int().positive();
export const monthSchema = z.number().int().min(1).max(12);
export const fiscalYearSchema = z.number().int().min(2000).max(9999);
export const nonNegativeNumberSchema = z.number().finite().min(0);
export const nullableNumberSchema = z.number().finite().nullable();
export const optionalTextSchema = z.string().trim().min(1).optional();
export const versionSchema = z.number().int().min(1);
export const reasonSchema = z.string().trim().min(1);
export const commentSchema = z.string().trim().min(MIN_COMMENT_LENGTH).max(MAX_COMMENT_LENGTH);
export const quarterPeriodSchema = z.enum(["Q1", "Q2", "Q3", "Q4"]);
export const halfPeriodSchema = z.enum(["H1", "H2"]);
export const reviewPeriodSchema = z.union([quarterPeriodSchema, halfPeriodSchema, z.literal("FY")]);

export const organisationEntitySchema = z.object({
  id: uuidSchema.optional(),
  name: z.string().trim().min(1).max(255),
  fiscal_year_start: z.enum(FISCAL_YEAR_STARTS),
  timezone: z.string().trim().min(1).max(100),
  status: z.enum(ORGANISATION_STATUSES).default("ACTIVE"),
  version: versionSchema.default(1)
});

export const kpiStatusBandSchema = z.object({
  min: z.number().finite(),
  max: z.number().finite().nullable(),
  label: z.string().trim().min(1),
  color: z.string().trim().min(1)
});

export const organisationConfigEntitySchema = z.object({
  id: uuidSchema.optional(),
  organisation_id: uuidSchema,
  pms_cadences_enabled: z.array(z.enum(PMS_PERIOD_TYPES)).default(["QUARTERLY", "HALF_YEARLY", "ANNUAL"]),
  kpi_status_bands: z.object({
    at_risk: kpiStatusBandSchema,
    off_track: kpiStatusBandSchema,
    on_track: kpiStatusBandSchema,
    achieved: kpiStatusBandSchema
  }),
  pms_rating_bands: z.array(
    z.object({
      min: z.number().finite(),
      max: z.number().finite().nullable(),
      label: z.string().trim().min(1)
    })
  ),
  max_import_file_size_mb: positiveIntSchema,
  version: versionSchema.default(1)
});

export const userEntitySchema = z.object({
  id: uuidSchema.optional(),
  organisation_id: uuidSchema,
  full_name: z.string().trim().min(1).max(255),
  role: z.enum(USER_ROLES),
  executive_label: z.boolean().default(false),
  email: z.string().trim().email().max(255),
  username: z.string().trim().min(1).max(100),
  password_hash: z.string().min(1).max(255),
  status: z.enum(ORGANISATION_STATUSES).default("ACTIVE"),
  version: versionSchema.default(1)
});

export const employeeEntitySchema = z.object({
  id: uuidSchema.optional(),
  organisation_id: uuidSchema,
  user_id: uuidSchema,
  manager_id: uuidSchema.nullish(),
  status: z.enum(ORGANISATION_STATUSES).default("ACTIVE"),
  full_name: z.string().trim().min(1).max(255),
  employee_code: z.string().trim().min(1).max(100),
  department: z.string().trim().max(100).nullish(),
  division: z.string().trim().max(100).nullish(),
  business_unit: z.string().trim().max(100).nullish(),
  location: z.string().trim().max(100).nullish(),
  designation: z.string().trim().max(100).nullish(),
  date_of_joining: z.string().date().nullish(),
  date_of_birth: z.string().date().nullish(),
  gender: z.string().trim().max(50).nullish(),
  version: versionSchema.default(1)
});

export const objectiveEntitySchema = z.object({
  id: uuidSchema.optional(),
  organisation_id: uuidSchema,
  employee_id: uuidSchema,
  category: z.enum(OBJECTIVE_CATEGORIES),
  weightage: z.number().finite().min(0).max(100),
  fiscal_year: fiscalYearSchema,
  month: monthSchema,
  status: z.enum(OBJECTIVE_STATES).default("LAUNCHED"),
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().nullish(),
  version: versionSchema.default(1)
});

export const kpiEntitySchema = z.object({
  id: uuidSchema.optional(),
  organisation_id: uuidSchema,
  objective_id: uuidSchema,
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().nullish(),
  unit: z.string().trim().max(50).nullish(),
  metric_type: z.enum(KPI_METRIC_TYPES),
  target_type: z.enum(KPI_TARGET_TYPES),
  standard: z.number().finite(),
  target: z.number().finite(),
  aggregation_method: z.enum(KPI_AGGREGATION_METHODS),
  frequency: z.enum(KPI_FREQUENCIES),
  weightage: z.number().finite().min(0).max(100),
  kpi_state: z.enum(KPI_STATES).default("DRAFT"),
  immutable_flag: z.boolean().default(false),
  timeline_start_date: z.string().date().nullish(),
  timeline_end_date: z.string().date().nullish(),
  version: versionSchema.default(1)
});

export const kpiCycleEntitySchema = z.object({
  id: uuidSchema.optional(),
  organisation_id: uuidSchema,
  kpi_id: uuidSchema,
  cycle_start_date: z.string().date(),
  cycle_end_date: z.string().date(),
  standard_value: z.number().finite(),
  target_value: z.number().finite(),
  actual_value: z.number().finite().nullable(),
  comments: z.string().trim().nullish(),
  achievement_percent: z.number().finite().nullable().optional(),
  submission_count: z.number().int().min(0).default(0),
  state: z.enum(KPI_CYCLE_STATES).default("DRAFT"),
  force_closed: z.boolean().default(false),
  max_submissions_reached: z.boolean().default(false),
  version: versionSchema.default(1)
});

export const kpiSubmissionEntitySchema = z.object({
  id: uuidSchema.optional(),
  organisation_id: uuidSchema,
  kpi_cycle_id: uuidSchema,
  state: z.enum(KPI_SUBMISSION_STATES),
  submitted_by: uuidSchema.nullish(),
  submitted_at: z.string().datetime().nullish(),
  approved_by: uuidSchema.nullish(),
  approved_at: z.string().datetime().nullish(),
  approval_comment: commentSchema.nullish(),
  rejected_by: uuidSchema.nullish(),
  rejected_at: z.string().datetime().nullish(),
  rejection_comment: commentSchema.nullish(),
  is_override: z.boolean().default(false),
  is_self_approval: z.boolean().default(false),
  cancellation_reason: z.string().trim().nullish()
});

export const objectiveMappingEntitySchema = z.object({
  id: uuidSchema.optional(),
  organisation_id: uuidSchema,
  parent_objective_id: uuidSchema,
  child_objective_id: uuidSchema,
  weight_in_parent: z.number().finite().min(0).max(100),
  version: versionSchema.default(1)
});

export const pmsReviewEntitySchema = z.object({
  id: uuidSchema.optional(),
  organisation_id: uuidSchema,
  employee_id: uuidSchema,
  period_type: z.enum(PMS_PERIOD_TYPES),
  fiscal_year: fiscalYearSchema,
  period: reviewPeriodSchema,
  snapshot_json: z.record(z.string(), z.unknown()),
  manager_review_json: z.record(z.string(), z.unknown()).nullish(),
  admin_review_json: z.record(z.string(), z.unknown()).nullish(),
  status: z.enum(PMS_REVIEW_STATES).default("MANAGER_REVIEW_PENDING"),
  version: versionSchema.default(1)
});

export const notificationEntitySchema = z.object({
  id: uuidSchema.optional(),
  organisation_id: uuidSchema,
  recipient_user_id: uuidSchema,
  title: z.string().trim().min(1).max(255),
  message: z.string().trim().min(1),
  link_url: z.string().trim().max(500).nullish(),
  status: z.enum(NOTIFICATION_STATUSES).default("UNREAD")
});

export const attributeValueEntitySchema = z.object({
  id: uuidSchema.optional(),
  organisation_id: uuidSchema,
  attribute_type: z.enum(ATTRIBUTE_TYPES),
  attribute_value: z.string().trim().min(1).max(255),
  parent_value: z.string().trim().max(255).nullish()
});

export const idempotencyRecordEntitySchema = z.object({
  id: uuidSchema.optional(),
  idempotency_key: uuidSchema,
  user_id: uuidSchema,
  endpoint: z.string().trim().min(1).max(255),
  response_body: z.record(z.string(), z.unknown()),
  expires_at: z.string().datetime()
});

export const importJobEntitySchema = z.object({
  id: uuidSchema.optional(),
  organisation_id: uuidSchema,
  uploaded_by: uuidSchema,
  status: z.enum(IMPORT_JOB_STATUSES).default("PENDING"),
  validation_errors: z
    .array(
      z.object({
        row: z.number().int().positive(),
        sheet: z.string().trim().min(1),
        field: z.string().trim().min(1),
        message: z.string().trim().min(1)
      })
    )
    .nullish(),
  row_count: z.number().int().positive().nullish(),
  committed_at: z.string().datetime().nullish(),
  expires_at: z.string().datetime()
});

export const systemEventEntitySchema = z.object({
  id: uuidSchema.optional(),
  organisation_id: uuidSchema,
  actor_user_id: uuidSchema,
  event_type: z.enum(SYSTEM_EVENT_TYPES),
  entity_type: z.string().trim().min(1).max(100),
  entity_id: uuidSchema.nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish()
});

export const approvalActionSchema = z.enum(APPROVAL_ACTIONS);
export const reviewSentimentSchema = z.enum(REVIEW_SENTIMENTS);
