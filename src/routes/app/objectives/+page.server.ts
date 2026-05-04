import { fail } from "@sveltejs/kit";
import {
  autoSplitObjectives,
  createObjective,
  deleteObjective,
  getObjectiveEmployeeOptions,
  getObjectives,
  updateObjective
} from "$lib/server/services/objective.service.js";
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

function objectiveTitleFromForm(formData: FormData) {
  const choice = String(formData.get("titleChoice") ?? "").trim();
  const title = choice === "Others" ? String(formData.get("customTitle") ?? "").trim() : choice || String(formData.get("title") ?? "").trim();
  if (!title) {
    throw new AppError("VALIDATION_FAILED", {
      fields: [{ field: "title", message: "Objective title is required." }]
    });
  }
  return title;
}

export const load: PageServerLoad = async ({ locals, url }) => {
  const actor = requireAuth(locals);
  const employees = await getObjectiveEmployeeOptions(actor);
  const employeeId = url.searchParams.get("employee_id") ?? employees[0]?.id ?? "";
  const month = Number(url.searchParams.get("month") ?? new Date().getMonth() + 1);
  const fiscalYear = Number(url.searchParams.get("fiscal_year") ?? new Date().getFullYear());
  const objectives = employeeId ? await getObjectives(actor, { employeeId, month, fiscalYear }) : [];

  return {
    employees,
    selected: { employeeId, month, fiscalYear },
    objectives
  };
};

export const actions: Actions = {
  createObjective: async ({ request, locals }) => {
    try {
      const actor = requireAuth(locals);
      const formData = await request.formData();
      await createObjective(actor, {
        employeeId: String(formData.get("employeeId")),
        title: objectiveTitleFromForm(formData),
        description: optionalText(formData.get("description")) ?? null,
        month: Number(formData.get("month")),
        fiscalYear: Number(formData.get("fiscalYear")),
        weightage: Number(formData.get("weightage"))
      });
      return { message: "Objective created." };
    } catch (error) {
      return actionFailure(error);
    }
  },
  updateObjective: async ({ request, locals }) => {
    try {
      const actor = requireAuth(locals);
      const formData = await request.formData();
      await updateObjective(actor, String(formData.get("id")), {
        title: objectiveTitleFromForm(formData),
        description: optionalText(formData.get("description")) ?? null,
        weightage: Number(formData.get("weightage")),
        status: formData.get("status") as "LAUNCHED" | "ONGOING" | "COMPLETED",
        version: Number(formData.get("version"))
      });
      return { message: "Objective saved." };
    } catch (error) {
      return actionFailure(error);
    }
  },
  deleteObjective: async ({ request, locals }) => {
    try {
      const actor = requireAuth(locals);
      const formData = await request.formData();
      await deleteObjective(actor, String(formData.get("id")), {
        version: Number(formData.get("version"))
      });
      return { message: "Objective deleted." };
    } catch (error) {
      return actionFailure(error);
    }
  },
  autoSplit: async ({ request, locals }) => {
    try {
      const actor = requireAuth(locals);
      const formData = await request.formData();
      return {
        message: "Auto-split calculated.",
        weightages: (await autoSplitObjectives(actor, { count: Number(formData.get("count")) })).weightages
      };
    } catch (error) {
      return actionFailure(error);
    }
  }
};
