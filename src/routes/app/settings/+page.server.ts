import { error, fail } from "@sveltejs/kit";
import {
  getOrganisation,
  getOrganisationConfig,
  updateOrganisation,
  updateOrganisationConfig
} from "$lib/server/services/organisation.service.js";
import {
  parseWithValidationError,
  updateOrganisationConfigRequestSchema,
  updateOrganisationRequestSchema
} from "$lib/server/validation/foundation.js";
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

  return fail(500, {
    message: "Unexpected server error.",
    fields: []
  });
}

function parseJsonField(name: string, value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return undefined;

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new AppError("VALIDATION_FAILED", {
      fields: [{ field: name, message: "Must be valid JSON." }]
    });
  }
}

export const load: PageServerLoad = async ({ locals }) => {
  const actor = requireAuth(locals);
  const [organisation, config] = await Promise.all([getOrganisation(actor), getOrganisationConfig(actor)]);

  if (!organisation || !config) {
    throw error(500, "Organisation bootstrap data is missing.");
  }

  return {
    organisation: {
      id: organisation.id,
      name: organisation.name,
      fiscalYearStart: organisation.fiscalYearStart,
      timezone: organisation.timezone,
      status: organisation.status,
      version: organisation.version
    },
    config: {
      id: config.id,
      maxImportFileSizeMb: config.maxImportFileSizeMb,
      pmsCadencesEnabled: config.pmsCadencesEnabled,
      kpiStatusBands: config.kpiStatusBands,
      pmsRatingBands: config.pmsRatingBands,
      version: config.version
    }
  };
};

export const actions: Actions = {
  organisation: async ({ request, locals }) => {
    try {
      const actor = requireAuth(locals);
      const formData = await request.formData();
      const parsed = parseWithValidationError(updateOrganisationRequestSchema, {
        name: String(formData.get("name") ?? "").trim(),
        timezone: String(formData.get("timezone") ?? "").trim(),
        version: Number(formData.get("version"))
      });
      await updateOrganisation(actor, parsed);

      return { message: "Organisation saved." };
    } catch (error) {
      return actionFailure(error);
    }
  },
  config: async ({ request, locals }) => {
    try {
      const actor = requireAuth(locals);
      const formData = await request.formData();
      const parsed = parseWithValidationError(updateOrganisationConfigRequestSchema, {
        maxImportFileSizeMb: Number(formData.get("maxImportFileSizeMb")),
        pmsCadencesEnabled: formData.getAll("pmsCadencesEnabled") as Array<"QUARTERLY" | "HALF_YEARLY" | "ANNUAL">,
        kpiStatusBands: parseJsonField("kpiStatusBands", formData.get("kpiStatusBands")),
        pmsRatingBands: parseJsonField("pmsRatingBands", formData.get("pmsRatingBands")),
        version: Number(formData.get("version"))
      });
      await updateOrganisationConfig(actor, parsed);

      return { message: "Configuration saved." };
    } catch (error) {
      return actionFailure(error);
    }
  }
};
