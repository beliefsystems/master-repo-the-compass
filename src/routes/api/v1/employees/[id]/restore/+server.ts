import { json } from "@sveltejs/kit";
import { restoreEmployee } from "$lib/server/services/employee.service.js";
import { parseWithValidationError, restoreEmployeeRequestSchema } from "$lib/server/validation/foundation.js";
import { handleError, requireAuth } from "$lib/server/utils/response.js";
import { getReusableResponse, persistResponse } from "$lib/server/services/idempotency.service.js";

export const POST = async ({ request, locals, params, url }) => {
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

    const parsed = parseWithValidationError(restoreEmployeeRequestSchema, await request.json());
    const result = await restoreEmployee(actor, params.id, parsed);
    const responseBody = {
      id: result.id,
      userId: result.userId,
      managerId: result.managerId,
      employeeCode: result.employeeCode,
      fullName: result.fullName,
      status: result.status,
      version: result.version
    };

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
