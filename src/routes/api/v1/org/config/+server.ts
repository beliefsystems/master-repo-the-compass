import { json } from "@sveltejs/kit";
import { getOrganisationConfig, updateOrganisationConfig } from "$lib/server/services/organisation.service.js";
import { getReusableResponse, persistResponse } from "$lib/server/services/idempotency.service.js";
import { parseWithValidationError, updateOrganisationConfigRequestSchema } from "$lib/server/validation/foundation.js";
import { handleError, requireAuth } from "$lib/server/utils/response.js";

function serializeOrganisationConfig(config: Awaited<ReturnType<typeof getOrganisationConfig>>) {
  return {
    id: config.id,
    organisationId: config.organisationId,
    maxImportFileSizeMb: config.maxImportFileSizeMb,
    pmsCadencesEnabled: config.pmsCadencesEnabled,
    kpiStatusBands: config.kpiStatusBands,
    pmsRatingBands: config.pmsRatingBands,
    version: config.version
  };
}

export const GET = async ({ locals }) => {
  try {
    const actor = requireAuth(locals);
    const config = await getOrganisationConfig(actor);

    return json(serializeOrganisationConfig(config));
  } catch (error) {
    return handleError(error);
  }
};

export const PATCH = async ({ request, locals, url }) => {
  try {
    const actor = requireAuth(locals);
    const idempotencyKey = request.headers.get("Idempotency-Key");
    const reusable = await getReusableResponse({
      userId: actor.id,
      idempotencyKey,
      endpoint: url.pathname,
      method: "PATCH"
    });

    if (reusable) {
      return json(reusable.responseBody, { status: reusable.responseStatus });
    }

    const body = await request.json();
    const parsed = parseWithValidationError(updateOrganisationConfigRequestSchema, body);
    const result = await updateOrganisationConfig(actor, parsed);
    const responseBody = serializeOrganisationConfig(result);

    await persistResponse({
      userId: actor.id,
      idempotencyKey,
      endpoint: url.pathname,
      method: "PATCH",
      responseStatus: 200,
      responseBody
    });

    return json(responseBody);
  } catch (error) {
    return handleError(error);
  }
};
