/**
 * PURPOSE: Define Drizzle relations between all V1 schema tables.
 * CONNECTIONS: Uses authoritative tables from tables.ts and is re-exported for repository/service composition.
 * LAYER: Schema / Models
 * SSOT REFERENCES: Part 24 foreign key relationships
 * CONSTRAINTS ENFORCED: Relations mirror DB truth only; no derived business behavior encoded here.
 */
import { relations } from "drizzle-orm";
import {
  employees,
  idempotencyRecords,
  importJobs,
  inAppNotifications,
  kpiCycles,
  kpiSubmissions,
  kpis,
  objectiveMappings,
  objectives,
  organisation,
  organisationConfig,
  pmsReviews,
  systemEvents,
  tenantAttributeValues,
  users
} from "./tables.js";

export const organisationRelations = relations(organisation, ({ one, many }) => ({
  config: one(organisationConfig, {
    fields: [organisation.id],
    references: [organisationConfig.organisationId]
  }),
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
  organisation: one(organisation, {
    fields: [organisationConfig.organisationId],
    references: [organisation.id]
  })
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
  submittedByUser: one(users, {
    fields: [kpiSubmissions.submittedBy],
    references: [users.id],
    relationName: "submitted_by_user"
  }),
  approvedByUser: one(users, {
    fields: [kpiSubmissions.approvedBy],
    references: [users.id],
    relationName: "approved_by_user"
  }),
  rejectedByUser: one(users, {
    fields: [kpiSubmissions.rejectedBy],
    references: [users.id],
    relationName: "rejected_by_user"
  })
}));

export const objectiveMappingRelations = relations(objectiveMappings, ({ one }) => ({
  organisation: one(organisation, { fields: [objectiveMappings.organisationId], references: [organisation.id] }),
  parentObjective: one(objectives, {
    fields: [objectiveMappings.parentObjectiveId],
    references: [objectives.id],
    relationName: "parent_objective"
  }),
  childObjective: one(objectives, {
    fields: [objectiveMappings.childObjectiveId],
    references: [objectives.id]
  })
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
