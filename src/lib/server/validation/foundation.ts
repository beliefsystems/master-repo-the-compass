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
