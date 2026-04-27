import { logout } from "$lib/server/services/auth.service.js";
import { handleError } from "$lib/server/utils/response.js";

export const POST = async ({ request }) => {
  try {
    await logout(request.headers);
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleError(error);
  }
};
