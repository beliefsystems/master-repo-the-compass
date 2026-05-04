import { json } from "@sveltejs/kit";
import { getOrgChart } from "$lib/server/services/employee.service.js";
import { handleError, requireAuth } from "$lib/server/utils/response.js";

export const GET = async ({ locals }) => {
  try {
    const actor = requireAuth(locals);
    return json({ items: await getOrgChart(actor) });
  } catch (error) {
    return handleError(error);
  }
};
