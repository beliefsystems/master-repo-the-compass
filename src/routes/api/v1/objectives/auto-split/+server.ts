import { json } from "@sveltejs/kit";
import { autoSplitObjectives } from "$lib/server/services/objective.service.js";
import { autoSplitObjectivesRequestSchema, parseWithValidationError } from "$lib/server/validation/foundation.js";
import { handleError, requireAuth } from "$lib/server/utils/response.js";
import { getReusableResponse, persistResponse } from "$lib/server/services/idempotency.service.js";

export const POST = async ({ request, locals, url }) => {
  try {
    const actor = requireAuth(locals);
    const idempotencyKey = request.headers.get("Idempotency-Key");
    const reusable = await getReusableResponse({
      userId: actor.id,
      idempotencyKey,
      endpoint: url.pathname,
      method: "POST"
    });
    if (reusable) {
      return json(reusable.responseBody, { status: reusable.responseStatus });
    }

    const parsed = parseWithValidationError(autoSplitObjectivesRequestSchema, await request.json());
    const responseBody = await autoSplitObjectives(actor, parsed);
    await persistResponse({
      userId: actor.id,
      idempotencyKey,
      endpoint: url.pathname,
      method: "POST",
      responseStatus: 200,
      responseBody
    });

    return json(responseBody);
  } catch (error) {
    return handleError(error);
  }
};
