import { fail } from "@sveltejs/kit";
import { createEmployee, getEmployees, getOrgChart, updateEmployee } from "$lib/server/services/employee.service.js";
import { createUser, getUsers, updateUser } from "$lib/server/services/user.service.js";
import { AppError } from "$lib/server/utils/errors.js";
import { requireAuth } from "$lib/server/utils/response.js";
import type { Actions, PageServerLoad } from "./$types";

function actionFailure(error: unknown) {
  if (error instanceof AppError) {
    return fail(error.httpStatus, {
      message: error.message,
      fields: error.fields ?? []
    });
  }

  return fail(500, { message: "Unexpected server error.", fields: [] });
}

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

export const load: PageServerLoad = async ({ locals }) => {
  const actor = requireAuth(locals);
  const [users, employees, orgChart] = await Promise.all([
    getUsers(actor, { limit: 100 }),
    actor.role === "ADMIN" ? getEmployees(actor, { limit: 100 }) : Promise.resolve([]),
    getOrgChart(actor)
  ]);

  return { users, employees, orgChart };
};

export const actions: Actions = {
  createUser: async ({ request, locals }) => {
    try {
      const actor = requireAuth(locals);
      const formData = await request.formData();
      await createUser(actor, {
        fullName: String(formData.get("fullName") ?? "").trim(),
        email: String(formData.get("email") ?? "").trim(),
        username: String(formData.get("username") ?? "").trim(),
        password: String(formData.get("password") ?? ""),
        role: formData.get("role") as "ADMIN" | "MANAGER" | "EMPLOYEE",
        executiveLabel: formData.get("executiveLabel") === "on"
      });
      return { message: "User created." };
    } catch (error) {
      return actionFailure(error);
    }
  },
  updateUser: async ({ request, locals }) => {
    try {
      const actor = requireAuth(locals);
      const formData = await request.formData();
      await updateUser(actor, String(formData.get("id")), {
        fullName: optionalText(formData.get("fullName")),
        email: optionalText(formData.get("email")),
        username: optionalText(formData.get("username")),
        role: formData.get("role") as "ADMIN" | "MANAGER" | "EMPLOYEE",
        status: formData.get("status") as "ACTIVE" | "DEACTIVATED",
        version: Number(formData.get("version"))
      });
      return { message: "User updated." };
    } catch (error) {
      return actionFailure(error);
    }
  },
  createEmployee: async ({ request, locals }) => {
    try {
      const actor = requireAuth(locals);
      const formData = await request.formData();
      await createEmployee(actor, {
        userId: String(formData.get("userId")),
        managerId: optionalText(formData.get("managerId")) ?? null,
        employeeCode: String(formData.get("employeeCode") ?? "").trim(),
        fullName: String(formData.get("fullName") ?? "").trim(),
        department: optionalText(formData.get("department")),
        division: optionalText(formData.get("division")),
        businessUnit: optionalText(formData.get("businessUnit")),
        location: optionalText(formData.get("location")),
        designation: optionalText(formData.get("designation"))
      });
      return { message: "Employee created." };
    } catch (error) {
      return actionFailure(error);
    }
  },
  updateEmployee: async ({ request, locals }) => {
    try {
      const actor = requireAuth(locals);
      const formData = await request.formData();
      await updateEmployee(actor, String(formData.get("id")), {
        managerId: optionalText(formData.get("managerId")) ?? null,
        fullName: optionalText(formData.get("fullName")),
        department: optionalText(formData.get("department")) ?? null,
        division: optionalText(formData.get("division")) ?? null,
        businessUnit: optionalText(formData.get("businessUnit")) ?? null,
        location: optionalText(formData.get("location")) ?? null,
        designation: optionalText(formData.get("designation")) ?? null,
        status: formData.get("status") as "ACTIVE" | "DEACTIVATED",
        version: Number(formData.get("version"))
      });
      return { message: "Employee updated. Are you sure you want to continue? This action changes live system access." };
    } catch (error) {
      return actionFailure(error);
    }
  }
};
