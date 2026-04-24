/**
 * PURPOSE: Define all V1 authoritative Drizzle tables and SQL helpers for THE COMPASS iron core.
 * CONNECTIONS: Uses shared constants, JSON payload types, and enum factories; re-exported to repositories and tests.
 * LAYER: Schema / Models
 * SSOT REFERENCES: Part 24 complete schema, Part 23.7 optimistic locking, Part 30 indexes
 * CONSTRAINTS ENFORCED: V1-only tables, organisation scoping columns everywhere except organisation, exact mutable version columns, hard-delete-only KPI cycles.
 */
import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core";
import {
  DEFAULT_KPI_STATUS_BANDS,
  DEFAULT_ORG_TIMEZONE,
  DEFAULT_PMS_CADENCES_ENABLED,
  DEFAULT_PMS_RATING_BANDS,
  MAX_IMPORT_FILE_SIZE_MB
} from "../../core/constants.js";
import type {
  ImportValidationError,
  KpiStatusBands,
  PmsRatingBands,
  PmsSnapshotJson,
  SubmittedReviewJson,
  SystemEventMetadata
} from "../../../shared/types/index.js";
import {
  attributeTypeEnum,
  fiscalYearStartEnum,
  importJobStatusEnum,
  kpiAggregationMethodEnum,
  kpiCycleStateEnum,
  kpiFrequencyEnum,
  kpiMetricTypeEnum,
  kpiStateEnum,
  kpiSubmissionStateEnum,
  kpiTargetTypeEnum,
  notificationStatusEnum,
  objectiveCategoryEnum,
  objectiveStateEnum,
  organisationStatusEnum,
  pmsPeriodTypeEnum,
  pmsReviewStateEnum,
  systemEventTypeEnum,
  userRoleEnum
} from "./enums.js";

const now = () => sql`NOW()`;
const genRandomUuid = () => sql`gen_random_uuid()`;

export const organisation = pgTable("organisation", {
  id: uuid("id").primaryKey().default(genRandomUuid()),
  name: varchar("name", { length: 255 }).notNull(),
  fiscalYearStart: fiscalYearStartEnum("fiscal_year_start").notNull(),
  timezone: varchar("timezone", { length: 100 }).notNull().default(DEFAULT_ORG_TIMEZONE),
  status: organisationStatusEnum("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
  version: integer("version").notNull().default(1)
});

export const organisationConfig = pgTable(
  "organisation_config",
  {
    id: uuid("id").primaryKey().default(genRandomUuid()),
    organisationId: uuid("organisation_id").notNull().references(() => organisation.id),
    pmsCadencesEnabled: text("pms_cadences_enabled").array().notNull().default(sql`ARRAY['QUARTERLY','HALF_YEARLY','ANNUAL']::text[]`),
    kpiStatusBands: jsonb("kpi_status_bands").$type<KpiStatusBands>().notNull().default(DEFAULT_KPI_STATUS_BANDS),
    pmsRatingBands: jsonb("pms_rating_bands").$type<PmsRatingBands>().notNull().default([...DEFAULT_PMS_RATING_BANDS]),
    maxImportFileSizeMb: integer("max_import_file_size_mb").notNull().default(MAX_IMPORT_FILE_SIZE_MB),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
    version: integer("version").notNull().default(1)
  },
  (table) => ({
    organisationUnique: unique("organisation_config_organisation_id_unique").on(table.organisationId)
  })
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().default(genRandomUuid()),
    organisationId: uuid("organisation_id").notNull().references(() => organisation.id),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    role: userRoleEnum("role").notNull(),
    executiveLabel: boolean("executive_label").notNull().default(false),
    email: varchar("email", { length: 255 }).notNull(),
    username: varchar("username", { length: 100 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    status: organisationStatusEnum("status").notNull().default("ACTIVE"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    version: integer("version").notNull().default(1)
  },
  (table) => ({
    emailUnique: unique("users_organisation_id_email_unique").on(table.organisationId, table.email),
    usernameUnique: unique("users_organisation_id_username_unique").on(table.organisationId, table.username)
  })
);

export const employees = pgTable(
  "employees",
  {
    id: uuid("id").primaryKey().default(genRandomUuid()),
    organisationId: uuid("organisation_id").notNull().references(() => organisation.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    managerId: uuid("manager_id").references((): AnyPgColumn => employees.id),
    status: organisationStatusEnum("status").notNull().default("ACTIVE"),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    employeeCode: varchar("employee_code", { length: 100 }).notNull(),
    department: varchar("department", { length: 100 }),
    division: varchar("division", { length: 100 }),
    businessUnit: varchar("business_unit", { length: 100 }),
    location: varchar("location", { length: 100 }),
    designation: varchar("designation", { length: 100 }),
    dateOfJoining: date("date_of_joining"),
    dateOfBirth: date("date_of_birth"),
    gender: varchar("gender", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    version: integer("version").notNull().default(1)
  },
  (table) => ({
    employeeCodeUnique: unique("employees_organisation_id_employee_code_unique").on(table.organisationId, table.employeeCode),
    userUnique: unique("employees_organisation_id_user_id_unique").on(table.organisationId, table.userId)
  })
);

export const objectives = pgTable(
  "objectives",
  {
    id: uuid("id").primaryKey().default(genRandomUuid()),
    organisationId: uuid("organisation_id").notNull().references(() => organisation.id),
    employeeId: uuid("employee_id").notNull().references(() => employees.id),
    category: objectiveCategoryEnum("category").notNull(),
    weightage: numeric("weightage", { precision: 5, scale: 2 }).notNull().default("0"),
    fiscalYear: integer("fiscal_year").notNull(),
    month: smallint("month").notNull(),
    status: objectiveStateEnum("status").notNull().default("LAUNCHED"),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    version: integer("version").notNull().default(1)
  },
  (table) => ({
    monthRange: check("objectives_month_check", sql`${table.month} BETWEEN 1 AND 12`),
    scoreLookupIdx: index("objectives_org_employee_fy_month_idx").on(
      table.organisationId,
      table.employeeId,
      table.fiscalYear,
      table.month
    )
  })
);

export const kpis = pgTable("kpis", {
  id: uuid("id").primaryKey().default(genRandomUuid()),
  organisationId: uuid("organisation_id").notNull().references(() => organisation.id),
  objectiveId: uuid("objective_id").notNull().references(() => objectives.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  unit: varchar("unit", { length: 50 }),
  metricType: kpiMetricTypeEnum("metric_type").notNull(),
  targetType: kpiTargetTypeEnum("target_type").notNull().default("FIXED"),
  standard: numeric("standard").notNull().default("0"),
  target: numeric("target").notNull(),
  aggregationMethod: kpiAggregationMethodEnum("aggregation_method").notNull().default("SUM"),
  frequency: kpiFrequencyEnum("frequency").notNull(),
  weightage: numeric("weightage", { precision: 5, scale: 2 }).notNull().default("0"),
  kpiState: kpiStateEnum("kpi_state").notNull().default("DRAFT"),
  immutableFlag: boolean("immutable_flag").notNull().default(false),
  timelineStartDate: date("timeline_start_date"),
  timelineEndDate: date("timeline_end_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  version: integer("version").notNull().default(1)
});

export const kpiCycles = pgTable("kpi_cycles", {
  id: uuid("id").primaryKey().default(genRandomUuid()),
  organisationId: uuid("organisation_id").notNull().references(() => organisation.id),
  kpiId: uuid("kpi_id").notNull().references(() => kpis.id),
  cycleStartDate: date("cycle_start_date").notNull(),
  cycleEndDate: date("cycle_end_date").notNull(),
  standardValue: numeric("standard_value").notNull(),
  targetValue: numeric("target_value").notNull(),
  actualValue: numeric("actual_value"),
  comments: text("comments"),
  achievementPercent: numeric("achievement_percent"),
  submissionCount: integer("submission_count").notNull().default(0),
  state: kpiCycleStateEnum("state").notNull().default("DRAFT"),
  forceClosed: boolean("force_closed").notNull().default(false),
  maxSubmissionsReached: boolean("max_submissions_reached").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
  version: integer("version").notNull().default(1)
}, (table) => ({
  nonNegativeSubmissionCount: check("kpi_cycles_submission_count_check", sql`${table.submissionCount} >= 0`)
}));

export const kpiSubmissions = pgTable("kpi_submissions", {
  id: uuid("id").primaryKey().default(genRandomUuid()),
  organisationId: uuid("organisation_id").notNull().references(() => organisation.id),
  kpiCycleId: uuid("kpi_cycle_id").notNull().references(() => kpiCycles.id),
  state: kpiSubmissionStateEnum("state").notNull(),
  submittedBy: uuid("submitted_by").references(() => users.id),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  approvalComment: text("approval_comment"),
  rejectedBy: uuid("rejected_by").references(() => users.id),
  rejectedAt: timestamp("rejected_at", { withTimezone: true }),
  rejectionComment: text("rejection_comment"),
  isOverride: boolean("is_override").notNull().default(false),
  isSelfApproval: boolean("is_self_approval").notNull().default(false),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now())
}, (table) => ({
  approvalCommentLength: check(
    "kpi_submissions_approval_comment_length_check",
    sql`${table.approvalComment} IS NULL OR char_length(${table.approvalComment}) BETWEEN 10 AND 1000`
  ),
  rejectionCommentLength: check(
    "kpi_submissions_rejection_comment_length_check",
    sql`${table.rejectionComment} IS NULL OR char_length(${table.rejectionComment}) BETWEEN 10 AND 1000`
  )
}));

export const objectiveMappings = pgTable("objective_mappings", {
  id: uuid("id").primaryKey().default(genRandomUuid()),
  organisationId: uuid("organisation_id").notNull().references(() => organisation.id),
  parentObjectiveId: uuid("parent_objective_id").notNull().references(() => objectives.id),
  childObjectiveId: uuid("child_objective_id").notNull().references(() => objectives.id),
  weightInParent: numeric("weight_in_parent", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  version: integer("version").notNull().default(1)
});

export const OBJECTIVE_MAPPINGS_CHILD_UNIQUE_INDEX_SQL = `
  CREATE UNIQUE INDEX "objective_mappings_child_unique_active_idx"
  ON "objective_mappings" ("child_objective_id")
  WHERE "deleted_at" IS NULL;
`;

export const pmsReviews = pgTable("pms_reviews", {
  id: uuid("id").primaryKey().default(genRandomUuid()),
  organisationId: uuid("organisation_id").notNull().references(() => organisation.id),
  employeeId: uuid("employee_id").notNull().references(() => employees.id),
  periodType: pmsPeriodTypeEnum("period_type").notNull(),
  fiscalYear: integer("fiscal_year").notNull(),
  period: varchar("period", { length: 10 }).notNull(),
  snapshotJson: jsonb("snapshot_json").$type<PmsSnapshotJson>().notNull(),
  managerReviewJson: jsonb("manager_review_json").$type<SubmittedReviewJson | null>(),
  adminReviewJson: jsonb("admin_review_json").$type<SubmittedReviewJson | null>(),
  status: pmsReviewStateEnum("status").notNull().default("MANAGER_REVIEW_PENDING"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
  version: integer("version").notNull().default(1)
}, (table) => ({
  reviewUnique: unique("pms_reviews_org_employee_period_unique").on(
    table.organisationId,
    table.employeeId,
    table.periodType,
    table.fiscalYear,
    table.period
  ),
  reviewLookupIdx: index("pms_reviews_org_employee_period_idx").on(table.organisationId, table.employeeId, table.periodType, table.fiscalYear)
}));

export const inAppNotifications = pgTable("in_app_notifications", {
  id: uuid("id").primaryKey().default(genRandomUuid()),
  organisationId: uuid("organisation_id").notNull().references(() => organisation.id),
  recipientUserId: uuid("recipient_user_id").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  linkUrl: varchar("link_url", { length: 500 }),
  status: notificationStatusEnum("status").notNull().default("UNREAD"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  readAt: timestamp("read_at", { withTimezone: true })
});

export const tenantAttributeValues = pgTable("tenant_attribute_values", {
  id: uuid("id").primaryKey().default(genRandomUuid()),
  organisationId: uuid("organisation_id").notNull().references(() => organisation.id),
  attributeType: attributeTypeEnum("attribute_type").notNull(),
  attributeValue: varchar("attribute_value", { length: 255 }).notNull(),
  parentValue: varchar("parent_value", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
  deletedAt: timestamp("deleted_at", { withTimezone: true })
});

export const TENANT_ATTRIBUTE_VALUES_UNIQUE_INDEX_SQL = `
  CREATE UNIQUE INDEX "tenant_attribute_values_org_type_value_active_idx"
  ON "tenant_attribute_values" ("organisation_id", "attribute_type", "attribute_value")
  WHERE "deleted_at" IS NULL;
`;

export const idempotencyRecords = pgTable("idempotency_records", {
  id: uuid("id").primaryKey().default(genRandomUuid()),
  idempotencyKey: uuid("idempotency_key").notNull(),
  userId: uuid("user_id").notNull().references(() => users.id),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  responseBody: jsonb("response_body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull()
}, (table) => ({
  idempotencyKeyUnique: unique("idempotency_records_key_user_unique").on(table.idempotencyKey, table.userId)
}));

export const importJobs = pgTable("import_jobs", {
  id: uuid("id").primaryKey().default(genRandomUuid()),
  organisationId: uuid("organisation_id").notNull().references(() => organisation.id),
  uploadedBy: uuid("uploaded_by").notNull().references(() => users.id),
  status: importJobStatusEnum("status").notNull().default("PENDING"),
  validationErrors: jsonb("validation_errors").$type<ImportValidationError[] | null>(),
  rowCount: integer("row_count"),
  committedAt: timestamp("committed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull()
}, (table) => ({
  importJobsExpiryIdx: index("import_jobs_org_expires_at_idx").on(table.organisationId, table.expiresAt)
}));

export const systemEvents = pgTable("system_events", {
  id: uuid("id").primaryKey().default(genRandomUuid()),
  organisationId: uuid("organisation_id").notNull().references(() => organisation.id),
  actorUserId: uuid("actor_user_id").notNull().references(() => users.id),
  eventType: systemEventTypeEnum("event_type").notNull(),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata").$type<SystemEventMetadata | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now())
});

export const KPI_CYCLES_NO_OVERLAP_CONSTRAINT_SQL = `
  ALTER TABLE "kpi_cycles"
  ADD CONSTRAINT "no_overlapping_cycles"
  EXCLUDE USING gist (
    "kpi_id" WITH =,
    daterange("cycle_start_date", "cycle_end_date", '[]') WITH &&
  );
`;

export type Organisation = typeof organisation.$inferSelect;
export type NewOrganisation = typeof organisation.$inferInsert;
export type OrganisationConfig = typeof organisationConfig.$inferSelect;
export type NewOrganisationConfig = typeof organisationConfig.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
export type Objective = typeof objectives.$inferSelect;
export type NewObjective = typeof objectives.$inferInsert;
export type Kpi = typeof kpis.$inferSelect;
export type NewKpi = typeof kpis.$inferInsert;
export type KpiCycle = typeof kpiCycles.$inferSelect;
export type NewKpiCycle = typeof kpiCycles.$inferInsert;
export type KpiSubmission = typeof kpiSubmissions.$inferSelect;
export type NewKpiSubmission = typeof kpiSubmissions.$inferInsert;
export type ObjectiveMapping = typeof objectiveMappings.$inferSelect;
export type NewObjectiveMapping = typeof objectiveMappings.$inferInsert;
export type PmsReview = typeof pmsReviews.$inferSelect;
export type NewPmsReview = typeof pmsReviews.$inferInsert;
export type InAppNotification = typeof inAppNotifications.$inferSelect;
export type NewInAppNotification = typeof inAppNotifications.$inferInsert;
export type TenantAttributeValue = typeof tenantAttributeValues.$inferSelect;
export type NewTenantAttributeValue = typeof tenantAttributeValues.$inferInsert;
export type IdempotencyRecord = typeof idempotencyRecords.$inferSelect;
export type NewIdempotencyRecord = typeof idempotencyRecords.$inferInsert;
export type ImportJob = typeof importJobs.$inferSelect;
export type NewImportJob = typeof importJobs.$inferInsert;
export type SystemEvent = typeof systemEvents.$inferSelect;
export type NewSystemEvent = typeof systemEvents.$inferInsert;
