import { json } from "@sveltejs/kit";
import { createUser, getUsers } from "$lib/server/services/user.service.js";
import { createUserRequestSchema, parseWithValidationError } from "$lib/server/validation/foundation.js";
import { handleError, requireAuth } from "$lib/server/utils/response.js";
import { getReusableResponse, persistResponse } from "$lib/server/services/idempotency.service.js";

export const GET = async ({ locals }) => {
  try {
    const actor = requireAuth(locals);
    const users = await getUsers(actor);
    return json({ items: users });
  } catch (error) {
    return handleError(error);
  }
};

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

    const body = await request.json();
    const parsed = parseWithValidationError(createUserRequestSchema, body);
    const result = await createUser(actor, parsed);
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
      endpoint: url.pathname,
      method: "POST",
      responseStatus: 201,
      responseBody
    });

    return json(responseBody, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
};
