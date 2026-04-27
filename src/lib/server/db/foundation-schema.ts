import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const now = () => sql`NOW()`;
const genRandomUuid = () => sql`gen_random_uuid()`;

export const fiscalYearStartEnum = pgEnum("fiscal_year_start", ["APRIL", "JANUARY"]);
export const organisationStatusEnum = pgEnum("organisation_status", ["ACTIVE", "DEACTIVATED"]);
export const userRoleEnum = pgEnum("user_role", ["ADMIN", "MANAGER", "EMPLOYEE"]);
export const userStatusEnum = pgEnum("user_status", ["ACTIVE", "DEACTIVATED"]);
export const employeeStatusEnum = pgEnum("employee_status", ["ACTIVE", "DEACTIVATED"]);
export const sessionStatusEnum = pgEnum("session_status", ["ACTIVE", "EXPIRED", "REVOKED"]);
export const systemEventTypeEnum = pgEnum("system_event_type", [
  "USER_CREATED",
  "USER_UPDATED",
  "USER_DEACTIVATED",
  "USER_RESTORED",
  "SESSION_REVOKED",
  "CONFIG_UPDATED",
  "ORG_UPDATED"
]);

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

export const organisation = pgTable("organisation", {
  id: uuid("id").primaryKey().default(genRandomUuid()),
  name: varchar("name", { length: 255 }).notNull(),
  fiscalYearStart: fiscalYearStartEnum("fiscal_year_start").notNull(),
  timezone: varchar("timezone", { length: 100 }).notNull().default("Asia/Kolkata"),
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
    maxImportFileSizeMb: integer("max_import_file_size_mb").notNull().default(10),
    pmsCadencesEnabled: text("pms_cadences_enabled")
      .array()
      .notNull()
      .default(sql`ARRAY['QUARTERLY','HALF_YEARLY','ANNUAL']::text[]`),
    kpiStatusBands: jsonb("kpi_status_bands").notNull().default(DEFAULT_KPI_STATUS_BANDS),
    pmsRatingBands: jsonb("pms_rating_bands").notNull().default([...DEFAULT_PMS_RATING_BANDS]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
    version: integer("version").notNull().default(1)
  },
  (table) => ({
    organisationUnique: uniqueIndex("organisation_config_organisation_id_unique").on(table.organisationId)
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
    status: userStatusEnum("status").notNull().default("ACTIVE"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    version: integer("version").notNull().default(1)
  },
  (table) => ({
    emailUnique: uniqueIndex("users_organisation_id_email_unique").on(table.organisationId, table.email),
    usernameUnique: uniqueIndex("users_organisation_id_username_unique").on(table.organisationId, table.username)
  })
);

export const employees = pgTable(
  "employees",
  {
    id: uuid("id").primaryKey().default(genRandomUuid()),
    organisationId: uuid("organisation_id").notNull().references(() => organisation.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    managerId: uuid("manager_id"),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    employeeCode: varchar("employee_code", { length: 100 }).notNull(),
    department: varchar("department", { length: 100 }),
    division: varchar("division", { length: 100 }),
    businessUnit: varchar("business_unit", { length: 100 }),
    location: varchar("location", { length: 100 }),
    designation: varchar("designation", { length: 100 }),
    status: employeeStatusEnum("status").notNull().default("ACTIVE"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
    version: integer("version").notNull().default(1)
  },
  (table) => ({
    employeeCodeUnique: uniqueIndex("employees_organisation_id_employee_code_unique").on(table.organisationId, table.employeeCode),
    userUnique: uniqueIndex("employees_organisation_id_user_id_unique").on(table.organisationId, table.userId)
  })
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().default(genRandomUuid()),
    organisationId: uuid("organisation_id").notNull().references(() => organisation.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    sessionToken: varchar("session_token", { length: 255 }).notNull(),
    status: sessionStatusEnum("status").notNull().default("ACTIVE"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().default(now()),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true })
  },
  (table) => ({
    tokenUnique: uniqueIndex("sessions_token_unique").on(table.sessionToken)
  })
);

export const idempotencyRecords = pgTable(
  "idempotency_records",
  {
    id: uuid("id").primaryKey().default(genRandomUuid()),
    userId: uuid("user_id").notNull().references(() => users.id),
    idempotencyKey: uuid("idempotency_key").notNull(),
    endpoint: varchar("endpoint", { length: 255 }).notNull(),
    method: varchar("method", { length: 10 }).notNull(),
    responseStatus: integer("response_status").notNull(),
    responseBody: jsonb("response_body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull()
  },
  (table) => ({
    idempotencyKeyUnique: uniqueIndex("idempotency_records_key_user_unique").on(table.idempotencyKey, table.userId)
  })
);

export const systemEvents = pgTable("system_events", {
  id: uuid("id").primaryKey().default(genRandomUuid()),
  organisationId: uuid("organisation_id").notNull().references(() => organisation.id),
  actorUserId: uuid("actor_user_id").notNull().references(() => users.id),
  eventType: systemEventTypeEnum("event_type").notNull(),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now())
});

export type Organisation = typeof organisation.$inferSelect;
export type OrganisationConfig = typeof organisationConfig.$inferSelect;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Employee = typeof employees.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type IdempotencyRecord = typeof idempotencyRecords.$inferSelect;
export type SystemEvent = typeof systemEvents.$inferSelect;
