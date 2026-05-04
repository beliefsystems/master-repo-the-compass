import { json } from "@sveltejs/kit";
import { deleteObjective, updateObjective } from "$lib/server/services/objective.service.js";
import { deleteObjectiveRequestSchema, parseWithValidationError, updateObjectiveRequestSchema } from "$lib/server/validation/foundation.js";
import { handleError, requireAuth } from "$lib/server/utils/response.js";
import { getReusableResponse, persistResponse } from "$lib/server/services/idempotency.service.js";

function objectiveResponse(result: Awaited<ReturnType<typeof updateObjective>>) {
  return {
    id: result.id,
    employeeId: result.employeeId,
    title: result.title,
    description: result.description,
    month: result.month,
    fiscalYear: result.fiscalYear,
    weightage: result.weightage,
    status: result.status,
    version: result.version
  };
}

export const PATCH = async ({ request, locals, params, url }) => {
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

    const parsed = parseWithValidationError(updateObjectiveRequestSchema, await request.json());
    const responseBody = objectiveResponse(await updateObjective(actor, params.id, parsed));
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

export const DELETE = async ({ request, locals, params, url }) => {
  try {
    const actor = requireAuth(locals);
    const idempotencyKey = request.headers.get("Idempotency-Key");
    const reusable = await getReusableResponse({
      userId: actor.id,
      idempotencyKey,
      endpoint: url.pathname,
      method: "DELETE"
    });
    if (reusable) {
      return json(reusable.responseBody, { status: reusable.responseStatus });
    }

    const parsed = parseWithValidationError(deleteObjectiveRequestSchema, await request.json());
    const responseBody = objectiveResponse(await deleteObjective(actor, params.id, parsed));
    await persistResponse({
      userId: actor.id,
      idempotencyKey,
      endpoint: url.pathname,
      method: "DELETE",
      responseStatus: 200,
      responseBody
    });

    return json(responseBody);
  } catch (error) {
    return handleError(error);
  }
};
