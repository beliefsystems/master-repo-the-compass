/**
 * PURPOSE: Load the single protected organisation read path for Slice 0 verification.
 * CONNECTIONS: Calls the service layer directly to avoid internal HTTP waterfalls during navigation.
 * LAYER: Routes / Controller
 * SSOT REFERENCES: Part 23.1, Part 27 organisation endpoint
 * CONSTRAINTS ENFORCED: Runtime verification flow only; no additional business features.
 */
import { error } from "@sveltejs/kit";
import { getOrganisation } from "$lib/server/services/organisation.service.js";
import { requireAuth } from "$lib/server/utils/response.js";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const actor = requireAuth(locals);
  const organisation = await getOrganisation(actor);

  if (!organisation) {
    throw error(500, "Failed to load organisation data.");
  }

  return {
    organisation: {
      id: organisation.id,
      name: organisation.name,
      fiscalYearStart: organisation.fiscalYearStart,
      timezone: organisation.timezone,
      status: organisation.status,
      version: organisation.version
    }
  };
};
