import { json } from "@sveltejs/kit";
import { updateUser } from "$lib/server/services/user.service.js";
import { parseWithValidationError, updateUserRequestSchema } from "$lib/server/validation/foundation.js";
import { handleError, requireAuth } from "$lib/server/utils/response.js";
import { getReusableResponse, persistResponse } from "$lib/server/services/idempotency.service.js";

export const PATCH = async ({ request, locals, params, url }) => {
  try {
    const actor = requireAuth(locals);
    const idempotencyKey = request.headers.get("Idempotency-Key");
    const endpoint = url.pathname;
    const reusable = await getReusableResponse({
      userId: actor.id,
      idempotencyKey,
      endpoint,
      method: "PATCH"
    });

    if (reusable) {
      return json(reusable.responseBody, { status: reusable.responseStatus });
    }

    const body = await request.json();
    const parsed = parseWithValidationError(updateUserRequestSchema, body);
    const result = await updateUser(actor, params.id, parsed);
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
      method: "PATCH",
      responseStatus: 200,
      responseBody
    });

    return json(responseBody);
  } catch (error) {
    return handleError(error);
  }
};
