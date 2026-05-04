import { z } from "zod";
import { ValidationAppError } from "$lib/server/utils/errors.js";

export const uuidSchema = z.string().uuid();
export const versionSchema = z.number().int().min(1);

export const loginRequestSchema = z.object({
  usernameOrEmail: z.string().trim().min(1),
  password: z.string().min(1)
});

export const createUserRequestSchema = z.object({
  fullName: z.string().trim().min(1).max(255),
  email: z.string().trim().email().max(255),
  username: z.string().trim().min(1).max(100),
  password: z.string().min(8).max(255),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]),
  executiveLabel: z.boolean().optional().default(false)
});

export const updateUserRequestSchema = z
  .object({
    fullName: z.string().trim().min(1).max(255).optional(),
    email: z.string().trim().email().max(255).optional(),
    username: z.string().trim().min(1).max(100).optional(),
    role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]).optional(),
    status: z.enum(["ACTIVE", "DEACTIVATED"]).optional(),
    executiveLabel: z.boolean().optional(),
    version: versionSchema
  })
  .refine((value) => Object.keys(value).some((key) => key !== "version"), {
    message: "At least one writable field must be provided.",
    path: ["body"]
  });

export const restoreUserRequestSchema = z.object({
  version: versionSchema
});

export const createEmployeeRequestSchema = z.object({
  userId: uuidSchema,
  managerId: uuidSchema.nullable().optional(),
  employeeCode: z.string().trim().min(1).max(100),
  fullName: z.string().trim().min(1).max(255),
  department: z.string().trim().min(1).max(100).optional(),
  division: z.string().trim().min(1).max(100).optional(),
  businessUnit: z.string().trim().min(1).max(100).optional(),
  location: z.string().trim().min(1).max(100).optional(),
  designation: z.string().trim().min(1).max(100).optional()
});

export const updateEmployeeRequestSchema = z
  .object({
    managerId: uuidSchema.nullable().optional(),
    fullName: z.string().trim().min(1).max(255).optional(),
    department: z.string().trim().min(1).max(100).nullable().optional(),
    division: z.string().trim().min(1).max(100).nullable().optional(),
    businessUnit: z.string().trim().min(1).max(100).nullable().optional(),
    location: z.string().trim().min(1).max(100).nullable().optional(),
    designation: z.string().trim().min(1).max(100).nullable().optional(),
    status: z.enum(["ACTIVE", "DEACTIVATED"]).optional(),
    version: versionSchema
  })
  .refine((value) => Object.keys(value).some((key) => key !== "version"), {
    message: "At least one writable field must be provided.",
    path: ["body"]
  });

export const restoreEmployeeRequestSchema = z.object({
  version: versionSchema
});

export const objectiveMonthSchema = z.number().int().min(1).max(12);
export const objectiveFiscalYearSchema = z.number().int().min(2000).max(9999);
export const objectiveWeightageSchema = z.number().finite().min(0).max(100);
export const fixedObjectiveTitleSchema = z.enum([
  "Revenue Contribution",
  "Cost Optimization",
  "Operational Efficiency"
]);
export const objectiveTitleSchema = z.string().trim().min(1).max(255);

export const listObjectivesQuerySchema = z.object({
  employeeId: uuidSchema,
  month: objectiveMonthSchema,
  fiscalYear: objectiveFiscalYearSchema
});

export const createObjectiveRequestSchema = z.object({
  employeeId: uuidSchema,
  title: objectiveTitleSchema,
  description: z.string().trim().max(5000).nullable().optional(),
  month: objectiveMonthSchema,
  fiscalYear: objectiveFiscalYearSchema,
  weightage: objectiveWeightageSchema
});

export const updateObjectiveRequestSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    weightage: objectiveWeightageSchema.optional(),
    status: z.enum(["LAUNCHED", "ONGOING", "COMPLETED"]).optional(),
    version: versionSchema
  })
  .refine((value) => Object.keys(value).some((key) => key !== "version"), {
    message: "At least one writable field must be provided.",
    path: ["body"]
  });

export const deleteObjectiveRequestSchema = z.object({
  version: versionSchema
});

export const autoSplitObjectivesRequestSchema = z.object({
  count: z.number().int().positive()
});

export const updateOrganisationRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    timezone: z.string().trim().min(1).max(100).optional(),
    version: versionSchema
  })
  .refine((value) => value.name !== undefined || value.timezone !== undefined, {
    message: "At least one writable field must be provided.",
    path: ["body"]
  });

const statusBandSchema = z.object({
  min: z.number().finite(),
  max: z.number().finite().nullable(),
  label: z.string().trim().min(1),
  color: z.string().trim().min(1)
});

const ratingBandSchema = z.object({
  min: z.number().finite(),
  max: z.number().finite().nullable(),
  label: z.string().trim().min(1)
});

export const updateOrganisationConfigRequestSchema = z
  .object({
    maxImportFileSizeMb: z.number().int().positive().optional(),
    pmsCadencesEnabled: z.array(z.enum(["QUARTERLY", "HALF_YEARLY", "ANNUAL"])).min(1).optional(),
    kpiStatusBands: z
      .object({
        at_risk: statusBandSchema,
        off_track: statusBandSchema,
        on_track: statusBandSchema,
        achieved: statusBandSchema
      })
      .optional(),
    pmsRatingBands: z.array(ratingBandSchema).min(1).optional(),
    version: versionSchema
  })
  .refine(
    (value) =>
      value.maxImportFileSizeMb !== undefined ||
      value.pmsCadencesEnabled !== undefined ||
      value.kpiStatusBands !== undefined ||
      value.pmsRatingBands !== undefined,
    {
      message: "At least one writable field must be provided.",
      path: ["body"]
    }
  );

export function parseWithValidationError<T>(schema: z.ZodType<T>, input: unknown): T {
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
