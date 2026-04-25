/**
 * PURPOSE: Define API request validation schemas for all V1 core-facing endpoints.
 * CONNECTIONS: Builds on entity validation primitives and throws typed AppErrors via parse helpers.
 * LAYER: API Validation
 * SSOT REFERENCES: Part 27 locked endpoints, Part 7.2, Part 7.5, Part 28.6
 * CONSTRAINTS ENFORCED: Client never sends organisation_id, derived cadences are read-only, no service-layer cross-record logic.
 */
import { z } from "zod";
import { EXPORT_FORMATS, KPI_METRIC_TYPES, KPI_TARGET_TYPES, REVIEW_SENTIMENTS, SCORE_CADENCES } from "../core/constants.js";
import { createAppError, ValidationAppError } from "../core/errors.js";
import {
  approvalActionSchema,
  commentSchema,
  fiscalYearSchema,
  monthSchema,
  organisationConfigEntitySchema,
  reasonSchema,
  reviewPeriodSchema,
  uuidSchema,
  userEntitySchema,
  versionSchema
} from "./entities.js";
import { assertWritableCadence } from "../core/fiscal.js";

const timelineCoreSchema = z.object({
  start_date: z.string().date(),
  end_date: z.string().date(),
  frequency: z.enum(["WEEKLY", "MONTHLY"]),
  version: versionSchema
});

export const kpiTimelineRequestSchema = timelineCoreSchema.superRefine((value, ctx) => {
  const start = new Date(`${value.start_date}T00:00:00.000Z`);
  const end = new Date(`${value.end_date}T00:00:00.000Z`);
  const days = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;

  if (end < start) {
    ctx.addIssue({ code: "custom", path: ["end_date"], message: "End date must be on or after start date." });
    return;
  }

  if (start.getUTCMonth() !== end.getUTCMonth() || start.getUTCFullYear() !== end.getUTCFullYear()) {
    ctx.addIssue({ code: "custom", path: ["end_date"], message: "Timeline cannot span multiple months." });
  }

  if (days < 7) {
    ctx.addIssue({ code: "custom", path: ["end_date"], message: "Timeline must be at least 7 days long." });
  }

  if (days > 31) {
    ctx.addIssue({ code: "custom", path: ["end_date"], message: "Timeline cannot exceed 31 days." });
  }
});

export const orgConfigPatchSchema = organisationConfigEntitySchema
  .pick({
    pms_cadences_enabled: true,
    kpi_status_bands: true,
    pms_rating_bands: true,
    version: true
  })
  .partial()
  .extend({ version: versionSchema });

export const createUserRequestSchema = userEntitySchema
  .pick({
    full_name: true,
    username: true,
    email: true,
    role: true,
    executive_label: true
  })
  .extend({
    password: z.string().min(8).max(255)
  });

export const updateUserRequestSchema = userEntitySchema
  .pick({
    full_name: true,
    username: true,
    email: true,
    role: true,
    status: true,
    version: true
  })
  .partial()
  .extend({ version: versionSchema });

export const bulkDeactivateUsersRequestSchema = z.object({
  user_ids: z.array(uuidSchema).min(1)
});

export const bulkRoleChangeUsersRequestSchema = z.object({
  user_ids: z.array(uuidSchema).min(1),
  new_role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"])
});

export const createEmployeeRequestSchema = z.object({
  user_id: uuidSchema,
  manager_id: uuidSchema.optional(),
  employee_code: z.string().trim().min(1).max(100),
  department: z.string().trim().max(100).optional(),
  division: z.string().trim().max(100).optional(),
  business_unit: z.string().trim().max(100).optional(),
  location: z.string().trim().max(100).optional(),
  designation: z.string().trim().max(100).optional(),
  date_of_joining: z.string().date().optional(),
  date_of_birth: z.string().date().optional(),
  gender: z.string().trim().max(50).optional()
});

export const updateEmployeeRequestSchema = createEmployeeRequestSchema.partial().extend({
  version: versionSchema
});

export const createAttributeRequestSchema = z.object({
  attribute_type: z.enum(["DEPARTMENT", "DIVISION", "BUSINESS_UNIT", "LOCATION", "DESIGNATION"]),
  attribute_value: z.string().trim().min(1).max(255),
  parent_value: z.string().trim().max(255).optional()
});

export const updateAttributeRequestSchema = createAttributeRequestSchema.partial().extend({
  version: versionSchema
});

export const createObjectiveRequestSchema = z.object({
  employee_id: uuidSchema,
  category: z.enum(["RC", "CO", "OE", "OTHERS"]),
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().optional(),
  fiscal_year: fiscalYearSchema,
  month: monthSchema
});

export const updateObjectiveRequestSchema = z.object({
  category: z.enum(["RC", "CO", "OE", "OTHERS"]).optional(),
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().optional(),
  weightage: z.number().finite().min(0).max(100).optional(),
  version: versionSchema
});

export const reopenObjectiveRequestSchema = z.object({
  reason: reasonSchema,
  version: versionSchema
});

export const objectiveAutoSplitRequestSchema = z.object({
  employee_id: uuidSchema,
  fiscal_year: fiscalYearSchema,
  month: monthSchema
});

export const objectiveWeightageBatchRequestSchema = z.object({
  objectives: z.array(
    z.object({
      id: uuidSchema,
      weightage: z.number().finite().min(0).max(100),
      version: versionSchema
    })
  ).min(1)
});

export const duplicateObjectiveRequestSchema = z.object({
  source_objective_id: uuidSchema,
  target_employee_id: uuidSchema,
  target_fiscal_year: fiscalYearSchema,
  target_month: monthSchema
});

const baseKpiCreateSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().optional(),
  unit: z.string().trim().max(50).optional(),
  metric_type: z.enum(KPI_METRIC_TYPES),
  target_type: z.enum(KPI_TARGET_TYPES),
  standard: z.number().finite(),
  target: z.number().finite(),
  aggregation_method: z.enum(["SUM", "AVERAGE"]),
  frequency: z.enum(["WEEKLY", "MONTHLY"]),
  weightage: z.number().finite().min(0).max(100)
});

export const createKpiRequestSchema = baseKpiCreateSchema.superRefine((value, ctx) => {
  if ((value.metric_type === "INCREASE" || value.metric_type === "DECREASE") && value.target === value.standard) {
    ctx.addIssue({ code: "custom", path: ["target"], message: "Target must not equal standard." });
  }

  if (value.metric_type === "CONTROL" && value.standard > value.target) {
    ctx.addIssue({ code: "custom", path: ["target"], message: "CONTROL KPI standard cannot exceed target." });
  }

  if (value.metric_type === "CUMULATIVE") {
    if (value.standard !== 0) {
      ctx.addIssue({ code: "custom", path: ["standard"], message: "CUMULATIVE KPI standard must be 0." });
    }
    if (value.target_type !== "FIXED") {
      ctx.addIssue({ code: "custom", path: ["target_type"], message: "CUMULATIVE KPI target_type must be FIXED." });
    }
    if (value.aggregation_method !== "SUM") {
      ctx.addIssue({ code: "custom", path: ["aggregation_method"], message: "CUMULATIVE KPI aggregation_method must be SUM." });
    }
    if (value.target <= 0) {
      ctx.addIssue({ code: "custom", path: ["target"], message: "CUMULATIVE KPI target must be greater than 0." });
    }
  }
});

export const updateKpiRequestSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().optional(),
  unit: z.string().trim().max(50).optional(),
  standard: z.number().finite().optional(),
  target: z.number().finite().optional(),
  weightage: z.number().finite().min(0).max(100).optional(),
  version: versionSchema
});

export const kpiWeightageBatchRequestSchema = z.object({
  kpis: z.array(
    z.object({
      id: uuidSchema,
      weightage: z.number().finite().min(0).max(100),
      version: versionSchema
    })
  ).min(1)
});

export const saveKpiCycleDraftRequestSchema = z.object({
  actual_value: z.number().finite().nullable().optional(),
  comments: z.string().trim().optional(),
  version: versionSchema
});

export const submitKpiCycleRequestSchema = z.object({
  actual_value: z.number().finite(),
  comments: z.string().trim().optional(),
  version: versionSchema
});

export const approveRejectKpiRequestSchema = z.object({
  month: monthSchema,
  fiscal_year: fiscalYearSchema,
  comment: commentSchema,
  version: versionSchema
});

export const overrideKpiRequestSchema = z.object({
  month: monthSchema,
  fiscal_year: fiscalYearSchema,
  action: approvalActionSchema,
  reason: reasonSchema,
  version: versionSchema
});

export const createObjectiveMappingRequestSchema = z.object({
  parent_objective_id: uuidSchema,
  child_objective_id: uuidSchema,
  weight_in_parent: z.number().finite().min(0).max(100)
});

export const updateObjectiveMappingRequestSchema = z.object({
  weight_in_parent: z.number().finite().min(0).max(100),
  version: versionSchema
});

export const forceCloseMonthRequestSchema = z.object({
  fiscal_year: fiscalYearSchema,
  month: monthSchema,
  reason: reasonSchema
});

export const initiatePmsReviewRequestSchema = z.object({
  employee_id: uuidSchema,
  period_type: z.enum(["QUARTERLY", "HALF_YEARLY", "ANNUAL"]),
  fiscal_year: fiscalYearSchema,
  period: reviewPeriodSchema
});

export const bulkInitiatePmsReviewRequestSchema = z.object({
  employee_ids: z.array(uuidSchema).min(1),
  period_type: z.enum(["QUARTERLY", "HALF_YEARLY", "ANNUAL"]),
  fiscal_year: fiscalYearSchema,
  period: reviewPeriodSchema
});

export const submitPmsReviewRequestSchema = z.object({
  rating: z.enum(REVIEW_SENTIMENTS),
  comment: commentSchema,
  version: versionSchema
});

export const employeeScoresQuerySchema = z.object({
  fiscal_year: fiscalYearSchema,
  cadence: z.enum(SCORE_CADENCES),
  period: z.string().trim().min(1)
});

export const teamScoresQuerySchema = z.object({
  fiscal_year: fiscalYearSchema,
  cadence: z.enum(SCORE_CADENCES),
  period: z.string().trim().min(1),
  cursor: z.string().trim().optional(),
  limit: z.number().int().min(1).max(100).optional()
});

export const exportObjectivesQuerySchema = z.object({
  employee_id: uuidSchema.optional(),
  fiscal_year: fiscalYearSchema.optional(),
  month: monthSchema.optional(),
  format: z.enum(EXPORT_FORMATS)
});

export const cloneObjectivesBulkRequestSchema = z.object({
  source_employee_id: uuidSchema,
  source_fiscal_year: fiscalYearSchema,
  source_month: monthSchema,
  objective_ids: z.array(uuidSchema).min(1),
  targets: z.array(
    z.object({
      employee_id: uuidSchema,
      fiscal_year: fiscalYearSchema,
      month: monthSchema
    })
  ).min(1)
});

export const moveObjectivesBulkRequestSchema = z.object({
  objective_ids: z.array(uuidSchema).min(1),
  target_employee_id: uuidSchema
});

export const deleteObjectivesBulkRequestSchema = z.object({
  objective_ids: z.array(uuidSchema).min(1)
});

export const importObjectivesRequestSchema = z.object({
  import_job_id: uuidSchema.optional()
});

export function parseWithAppError<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationAppError(
      result.error.issues.map((issue) => ({
        field: issue.path.join(".") || "body",
        message: issue.message
      }))
    );
  }

  return result.data;
}

export function assertDerivedCadenceReadOnly(cadence: z.infer<typeof employeeScoresQuerySchema>["cadence"]): void {
  if (cadence !== "MONTHLY") {
    throw createAppError("DERIVED_CADENCE_IMMUTABLE");
  }
}

export function assertWritableCadenceInput(cadence: string): void {
  assertWritableCadence(cadence as "MONTHLY");
}
