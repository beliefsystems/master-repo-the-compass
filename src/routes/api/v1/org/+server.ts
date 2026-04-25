/**
 * PURPOSE: Expose the authenticated organisation read endpoint used to verify the Slice 0 stack.
 * CONNECTIONS: Calls OrganisationService and depends on auth locals from hooks.server.ts.
 * LAYER: Routes / Controller
 * SSOT REFERENCES: Part 23.1, Part 27 organisation endpoint
 * CONSTRAINTS ENFORCED: Auth required, no client-provided organisation_id, no business logic in the route.
 */
import { json } from "@sveltejs/kit";
import { getCurrentOrganisation } from "$lib/server/services/organisation.service";

export const GET = async ({ locals }) => {
  if (!locals.session) {
    return json(
      {
        error: {
          code: "SESSION_EXPIRED",
          message: "Session expired."
        }
      },
      { status: 401 }
    );
  }

  const organisation = await getCurrentOrganisation();

  return json({
    id: organisation.id,
    name: organisation.name,
    fiscal_year_start: organisation.fiscalYearStart,
    timezone: organisation.timezone,
    status: organisation.status
  });
};
