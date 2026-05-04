import { json } from "@sveltejs/kit";
import { createObjective, getObjectives } from "$lib/server/services/objective.service.js";
import { createObjectiveRequestSchema, listObjectivesQuerySchema, parseWithValidationError } from "$lib/server/validation/foundation.js";
import { handleError, requireAuth } from "$lib/server/utils/response.js";
import { getReusableResponse, persistResponse } from "$lib/server/services/idempotency.service.js";

export const GET = async ({ locals, url }) => {
  try {
    const actor = requireAuth(locals);
    const parsed = parseWithValidationError(listObjectivesQuerySchema, {
      employeeId: url.searchParams.get("employee_id"),
      month: Number(url.searchParams.get("month")),
      fiscalYear: Number(url.searchParams.get("fiscal_year"))
    });

    return json({ items: await getObjectives(actor, parsed) });
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

    const parsed = parseWithValidationError(createObjectiveRequestSchema, await request.json());
    const result = await createObjective(actor, parsed);
    const responseBody = {
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
