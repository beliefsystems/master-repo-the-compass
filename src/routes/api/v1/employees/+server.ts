import { json } from "@sveltejs/kit";
import { createEmployee, getEmployees } from "$lib/server/services/employee.service.js";
import { createEmployeeRequestSchema, parseWithValidationError } from "$lib/server/validation/foundation.js";
import { handleError, requireAuth } from "$lib/server/utils/response.js";
import { getReusableResponse, persistResponse } from "$lib/server/services/idempotency.service.js";

export const GET = async ({ locals, url }) => {
  try {
    const actor = requireAuth(locals);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);
    const employees = await getEmployees(actor, {
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: Number.isFinite(limit) ? limit : 50,
      status: (url.searchParams.get("status") as "ACTIVE" | "DEACTIVATED" | null) ?? undefined,
      search: url.searchParams.get("search") ?? undefined
    });
    return json({ items: employees });
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

    const parsed = parseWithValidationError(createEmployeeRequestSchema, await request.json());
    const result = await createEmployee(actor, parsed);
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
      method: "POST",
      responseStatus: 201,
      responseBody
    });

    return json(responseBody, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
};
