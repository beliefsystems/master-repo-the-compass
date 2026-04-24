/**
 * PURPOSE: Define Drizzle PostgreSQL enums from the canonical core constants.
 * CONNECTIONS: Imported by schema tables; driven directly from src/lib/server/core/constants.ts.
 * LAYER: Schema / Models
 * SSOT REFERENCES: Part 24 schema enum definitions
 * CONSTRAINTS ENFORCED: No duplicated enum literals outside constants; V2-only enums omitted from V1 schema.
 */
import { pgEnum } from "drizzle-orm/pg-core";
import {
  asPgEnumValues,
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
  NOTIFICATION_STATUSES,
  OBJECTIVE_CATEGORIES,
  OBJECTIVE_STATES,
  ORGANISATION_STATUSES,
  PMS_PERIOD_TYPES,
  PMS_REVIEW_STATES,
  SYSTEM_EVENT_TYPES,
  USER_ROLES
} from "../../core/constants.js";

export const fiscalYearStartEnum = pgEnum("fiscal_year_start", asPgEnumValues(FISCAL_YEAR_STARTS));
export const organisationStatusEnum = pgEnum("organisation_status", asPgEnumValues(ORGANISATION_STATUSES));
export const userRoleEnum = pgEnum("user_role", asPgEnumValues(USER_ROLES));
export const objectiveCategoryEnum = pgEnum("objective_category", asPgEnumValues(OBJECTIVE_CATEGORIES));
export const objectiveStateEnum = pgEnum("objective_state", asPgEnumValues(OBJECTIVE_STATES));
export const kpiMetricTypeEnum = pgEnum("kpi_metric_type", asPgEnumValues(KPI_METRIC_TYPES));
export const kpiTargetTypeEnum = pgEnum("kpi_target_type", asPgEnumValues(KPI_TARGET_TYPES));
export const kpiAggregationMethodEnum = pgEnum("kpi_aggregation_method", asPgEnumValues(KPI_AGGREGATION_METHODS));
export const kpiFrequencyEnum = pgEnum("kpi_frequency", asPgEnumValues(KPI_FREQUENCIES));
export const kpiStateEnum = pgEnum("kpi_state", asPgEnumValues(KPI_STATES));
export const kpiCycleStateEnum = pgEnum("kpi_cycle_state", asPgEnumValues(KPI_CYCLE_STATES));
export const kpiSubmissionStateEnum = pgEnum("kpi_submission_state", asPgEnumValues(KPI_SUBMISSION_STATES));
export const pmsPeriodTypeEnum = pgEnum("pms_period_type", asPgEnumValues(PMS_PERIOD_TYPES));
export const pmsReviewStateEnum = pgEnum("pms_review_state", asPgEnumValues(PMS_REVIEW_STATES));
export const notificationStatusEnum = pgEnum("notification_status", asPgEnumValues(NOTIFICATION_STATUSES));
export const attributeTypeEnum = pgEnum("attribute_type", asPgEnumValues(ATTRIBUTE_TYPES));
export const importJobStatusEnum = pgEnum("import_job_status", asPgEnumValues(IMPORT_JOB_STATUSES));
export const systemEventTypeEnum = pgEnum("system_event_type", asPgEnumValues(SYSTEM_EVENT_TYPES));
