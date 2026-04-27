import { json } from "@sveltejs/kit";
import { loginWithPassword } from "$lib/server/services/auth.service.js";
import { parseWithValidationError, loginRequestSchema } from "$lib/server/validation/foundation.js";
import { handleError } from "$lib/server/utils/response.js";

export const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const parsed = parseWithValidationError(loginRequestSchema, body);
    const result = await loginWithPassword({
      ...parsed,
      headers: request.headers
    });

    return json(result);
  } catch (error) {
    return handleError(error);
  }
};
