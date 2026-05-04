import { json } from "@sveltejs/kit";
import { updateEmployee } from "$lib/server/services/employee.service.js";
import { parseWithValidationError, updateEmployeeRequestSchema } from "$lib/server/validation/foundation.js";
import { handleError, requireAuth } from "$lib/server/utils/response.js";
import { getReusableResponse, persistResponse } from "$lib/server/services/idempotency.service.js";

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

    const parsed = parseWithValidationError(updateEmployeeRequestSchema, await request.json());
    const result = await updateEmployee(actor, params.id, parsed);
    const responseBody = {
      id: result.id,
      userId: result.userId,
      managerId: result.managerId,
      employeeCode: result.employeeCode,
      fullName: result.fullName,
      department: result.department,
      division: result.division,
      businessUnit: result.businessUnit,
      location: result.location,
      designation: result.designation,
      status: result.status,
      version: result.version
    };

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
