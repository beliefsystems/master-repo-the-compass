import { json } from "@sveltejs/kit";
import { restoreUser } from "$lib/server/services/user.service.js";
import { parseWithValidationError, restoreUserRequestSchema } from "$lib/server/validation/foundation.js";
import { handleError, requireAuth } from "$lib/server/utils/response.js";
import { getReusableResponse, persistResponse } from "$lib/server/services/idempotency.service.js";

export const POST = async ({ request, locals, params, url }) => {
  try {
    const actor = requireAuth(locals);
    const idempotencyKey = request.headers.get("Idempotency-Key");
    const endpoint = url.pathname;
    const reusable = await getReusableResponse({
      userId: actor.id,
      idempotencyKey,
      endpoint,
      method: "POST"
    });

    if (reusable) {
      return json(reusable.responseBody, { status: reusable.responseStatus });
    }

    const body = await request.json();
    const parsed = parseWithValidationError(restoreUserRequestSchema, body);
    const result = await restoreUser(actor, params.id, parsed);
    const responseBody = {
      id: result.id,
      fullName: result.fullName,
      email: result.email,
      username: result.username,
      role: result.role,
      executiveLabel: result.executiveLabel,
      status: result.status,
      version: result.version
    };

    await persistResponse({
      userId: actor.id,
      idempotencyKey,
      endpoint,
      method: "POST",
      responseStatus: 200,
      responseBody
    });

    return json(responseBody);
  } catch (error) {
    return handleError(error);
  }
};
