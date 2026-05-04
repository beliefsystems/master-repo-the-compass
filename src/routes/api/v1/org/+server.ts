/**
 * PURPOSE: Expose the authenticated organisation read endpoint used to verify the Slice 0 stack.
 * CONNECTIONS: Calls OrganisationService and depends on auth locals from hooks.server.ts.
 * LAYER: Routes / Controller
 * SSOT REFERENCES: Part 23.1, Part 27 organisation endpoint
 * CONSTRAINTS ENFORCED: Auth required, no client-provided organisation_id, no business logic in the route.
 */
import { json } from "@sveltejs/kit";
import { getOrganisation, updateOrganisation } from "$lib/server/services/organisation.service";
import { getReusableResponse, persistResponse } from "$lib/server/services/idempotency.service.js";
import { parseWithValidationError, updateOrganisationRequestSchema } from "$lib/server/validation/foundation.js";
import { handleError, requireAuth } from "$lib/server/utils/response.js";

function serializeOrganisation(organisation: Awaited<ReturnType<typeof getOrganisation>>) {
  return {
    id: organisation.id,
    name: organisation.name,
    fiscalYearStart: organisation.fiscalYearStart,
    timezone: organisation.timezone,
    status: organisation.status,
    version: organisation.version
  };
}

export const GET = async ({ locals }) => {
  try {
    const actor = requireAuth(locals);
    const organisation = await getOrganisation(actor);

    return json(serializeOrganisation(organisation));
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
    const parsed = parseWithValidationError(updateOrganisationRequestSchema, body);
    const result = await updateOrganisation(actor, parsed);
    const responseBody = serializeOrganisation(result);

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
