/**
 * PURPOSE: Define the authoritative V1 Drizzle schema, relations, and PostgreSQL SQL helpers for THE COMPASS.
 * CONNECTIONS: Consumed by the db client, repositories, services, tests, and BetterAuth-adjacent runtime wiring.
 * LAYER: Schema / Models
 * SSOT REFERENCES: Part 23, Part 24, Part 30
 * CONSTRAINTS ENFORCED: V1-only schema, organisation scoping columns everywhere except organisation, exact mutable version columns, Layer 4 ownership of schema truth.
 */
import { relations, sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
  varchar
} from "drizzle-orm/pg-core";
import {
  asPgEnumValues,
  ATTRIBUTE_TYPES,
  DEFAULT_KPI_STATUS_BANDS,
  DEFAULT_ORG_TIMEZONE,
  DEFAULT_PMS_RATING_BANDS,
  FISCAL_YEAR_STARTS,
  IMPORT_JOB_STATUSES,
  KPI_AGGREGATION_METHODS,
  KPI_CYCLE_STATES,
  KPI_FREQUENCIES,
  KPI_METRIC_TYPES,
  KPI_STATES,
  KPI_SUBMISSION_STATES,
  KPI_TARGET_TYPES,
  MAX_IMPORT_FILE_SIZE_MB,
  NOTIFICATION_STATUSES,
  OBJECTIVE_CATEGORIES,
  OBJECTIVE_STATES,
  ORGANISATION_STATUSES,
  PMS_PERIOD_TYPES,
  PMS_REVIEW_STATES,
  SYSTEM_EVENT_TYPES,
  USER_ROLES
} from "../core/constants.js";
import type {
  ImportValidationError,
  KpiStatusBands,
  PmsRatingBands,
  PmsSnapshotJson,
  SubmittedReviewJson,
  SystemEventMetadata
} from "../../shared/types/index.js";

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
    pmsCadencesEnabled: text("pms_cadences_enabled")
      .array()
      .notNull()
      .default(sql`ARRAY['QUARTERLY','HALF_YEARLY','ANNUAL']::text[]`),
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
    scoreLookupIdx: index("objectives_org_employee_fy_month_idx").on(table.organisationId, table.employeeId, table.fiscalYear, table.month)
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

export const kpiCycles = pgTable(
  "kpi_cycles",
  {
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
  },
  (table) => ({
    nonNegativeSubmissionCount: check("kpi_cycles_submission_count_check", sql`${table.submissionCount} >= 0`)
  })
);

export const kpiSubmissions = pgTable(
  "kpi_submissions",
  {
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
  },
  (table) => ({
    approvalCommentLength: check(
      "kpi_submissions_approval_comment_length_check",
      sql`${table.approvalComment} IS NULL OR char_length(${table.approvalComment}) BETWEEN 10 AND 1000`
    ),
    rejectionCommentLength: check(
      "kpi_submissions_rejection_comment_length_check",
      sql`${table.rejectionComment} IS NULL OR char_length(${table.rejectionComment}) BETWEEN 10 AND 1000`
    )
  })
);

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

export const pmsReviews = pgTable(
  "pms_reviews",
  {
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
  },
  (table) => ({
    reviewUnique: unique("pms_reviews_org_employee_period_unique").on(
      table.organisationId,
      table.employeeId,
      table.periodType,
      table.fiscalYear,
      table.period
    ),
    reviewLookupIdx: index("pms_reviews_org_employee_period_idx").on(table.organisationId, table.employeeId, table.periodType, table.fiscalYear)
  })
);

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

export const idempotencyRecords = pgTable(
  "idempotency_records",
  {
    id: uuid("id").primaryKey().default(genRandomUuid()),
    idempotencyKey: uuid("idempotency_key").notNull(),
    userId: uuid("user_id").notNull().references(() => users.id),
    endpoint: varchar("endpoint", { length: 255 }).notNull(),
    responseBody: jsonb("response_body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull()
  },
  (table) => ({
    idempotencyKeyUnique: unique("idempotency_records_key_user_unique").on(table.idempotencyKey, table.userId)
  })
);

export const importJobs = pgTable(
  "import_jobs",
  {
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
  },
  (table) => ({
    importJobsExpiryIdx: index("import_jobs_org_expires_at_idx").on(table.organisationId, table.expiresAt)
  })
);

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

export const OBJECTIVE_MAPPINGS_CHILD_UNIQUE_INDEX_SQL = `
  CREATE UNIQUE INDEX "objective_mappings_child_unique_active_idx"
  ON "objective_mappings" ("child_objective_id")
  WHERE "deleted_at" IS NULL;
`;

export const TENANT_ATTRIBUTE_VALUES_UNIQUE_INDEX_SQL = `
  CREATE UNIQUE INDEX "tenant_attribute_values_org_type_value_active_idx"
  ON "tenant_attribute_values" ("organisation_id", "attribute_type", "attribute_value")
  WHERE "deleted_at" IS NULL;
`;

export const KPI_CYCLES_NO_OVERLAP_CONSTRAINT_SQL = `
  ALTER TABLE "kpi_cycles"
  ADD CONSTRAINT "no_overlapping_cycles"
  EXCLUDE USING gist (
    "kpi_id" WITH =,
    daterange("cycle_start_date", "cycle_end_date", '[]') WITH &&
  );
`;

export const organisationRelations = relations(organisation, ({ one, many }) => ({
  config: one(organisationConfig, { fields: [organisation.id], references: [organisationConfig.organisationId] }),
  users: many(users),
  employees: many(employees),
  objectives: many(objectives),
  kpis: many(kpis),
  kpiCycles: many(kpiCycles),
  kpiSubmissions: many(kpiSubmissions),
  objectiveMappings: many(objectiveMappings),
  pmsReviews: many(pmsReviews),
  notifications: many(inAppNotifications),
  tenantAttributeValues: many(tenantAttributeValues),
  importJobs: many(importJobs),
  systemEvents: many(systemEvents)
}));

export const organisationConfigRelations = relations(organisationConfig, ({ one }) => ({
  organisation: one(organisation, { fields: [organisationConfig.organisationId], references: [organisation.id] })
}));

export const userRelations = relations(users, ({ one, many }) => ({
  organisation: one(organisation, { fields: [users.organisationId], references: [organisation.id] }),
  employee: one(employees, { fields: [users.id], references: [employees.userId] }),
  submittedKpiSubmissions: many(kpiSubmissions, { relationName: "submitted_by_user" }),
  approvedKpiSubmissions: many(kpiSubmissions, { relationName: "approved_by_user" }),
  rejectedKpiSubmissions: many(kpiSubmissions, { relationName: "rejected_by_user" }),
  notifications: many(inAppNotifications),
  idempotencyRecords: many(idempotencyRecords),
  importJobs: many(importJobs),
  systemEvents: many(systemEvents)
}));

export const employeeRelations = relations(employees, ({ one, many }) => ({
  organisation: one(organisation, { fields: [employees.organisationId], references: [organisation.id] }),
  user: one(users, { fields: [employees.userId], references: [users.id] }),
  manager: one(employees, { fields: [employees.managerId], references: [employees.id], relationName: "manager_employee" }),
  directReports: many(employees, { relationName: "manager_employee" }),
  objectives: many(objectives),
  pmsReviews: many(pmsReviews)
}));

export const objectiveRelations = relations(objectives, ({ one, many }) => ({
  organisation: one(organisation, { fields: [objectives.organisationId], references: [organisation.id] }),
  employee: one(employees, { fields: [objectives.employeeId], references: [employees.id] }),
  kpis: many(kpis),
  parentMappings: many(objectiveMappings, { relationName: "parent_objective" }),
  childMapping: one(objectiveMappings, { fields: [objectives.id], references: [objectiveMappings.childObjectiveId] })
}));

export const kpiRelations = relations(kpis, ({ one, many }) => ({
  organisation: one(organisation, { fields: [kpis.organisationId], references: [organisation.id] }),
  objective: one(objectives, { fields: [kpis.objectiveId], references: [objectives.id] }),
  cycles: many(kpiCycles)
}));

export const kpiCycleRelations = relations(kpiCycles, ({ one, many }) => ({
  organisation: one(organisation, { fields: [kpiCycles.organisationId], references: [organisation.id] }),
  kpi: one(kpis, { fields: [kpiCycles.kpiId], references: [kpis.id] }),
  submissions: many(kpiSubmissions)
}));

export const kpiSubmissionRelations = relations(kpiSubmissions, ({ one }) => ({
  organisation: one(organisation, { fields: [kpiSubmissions.organisationId], references: [organisation.id] }),
  kpiCycle: one(kpiCycles, { fields: [kpiSubmissions.kpiCycleId], references: [kpiCycles.id] }),
  submittedByUser: one(users, { fields: [kpiSubmissions.submittedBy], references: [users.id], relationName: "submitted_by_user" }),
  approvedByUser: one(users, { fields: [kpiSubmissions.approvedBy], references: [users.id], relationName: "approved_by_user" }),
  rejectedByUser: one(users, { fields: [kpiSubmissions.rejectedBy], references: [users.id], relationName: "rejected_by_user" })
}));

export const objectiveMappingRelations = relations(objectiveMappings, ({ one }) => ({
  organisation: one(organisation, { fields: [objectiveMappings.organisationId], references: [organisation.id] }),
  parentObjective: one(objectives, {
    fields: [objectiveMappings.parentObjectiveId],
    references: [objectives.id],
    relationName: "parent_objective"
  }),
  childObjective: one(objectives, { fields: [objectiveMappings.childObjectiveId], references: [objectives.id] })
}));

export const pmsReviewRelations = relations(pmsReviews, ({ one }) => ({
  organisation: one(organisation, { fields: [pmsReviews.organisationId], references: [organisation.id] }),
  employee: one(employees, { fields: [pmsReviews.employeeId], references: [employees.id] })
}));

export const notificationRelations = relations(inAppNotifications, ({ one }) => ({
  organisation: one(organisation, { fields: [inAppNotifications.organisationId], references: [organisation.id] }),
  recipientUser: one(users, { fields: [inAppNotifications.recipientUserId], references: [users.id] })
}));

export const tenantAttributeValueRelations = relations(tenantAttributeValues, ({ one }) => ({
  organisation: one(organisation, { fields: [tenantAttributeValues.organisationId], references: [organisation.id] })
}));

export const idempotencyRecordRelations = relations(idempotencyRecords, ({ one }) => ({
  user: one(users, { fields: [idempotencyRecords.userId], references: [users.id] })
}));

export const importJobRelations = relations(importJobs, ({ one }) => ({
  organisation: one(organisation, { fields: [importJobs.organisationId], references: [organisation.id] }),
  uploadedByUser: one(users, { fields: [importJobs.uploadedBy], references: [users.id] })
}));

export const systemEventRelations = relations(systemEvents, ({ one }) => ({
  organisation: one(organisation, { fields: [systemEvents.organisationId], references: [organisation.id] }),
  actorUser: one(users, { fields: [systemEvents.actorUserId], references: [users.id] })
}));

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
