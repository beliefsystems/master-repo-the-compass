/**
 * PURPOSE: Redirect the root route to the appropriate Slice 0 entrypoint.
 * CONNECTIONS: Uses auth locals populated in hooks.server.ts.
 * LAYER: Routes / Controller
 * SSOT REFERENCES: Part 23.1
 * CONSTRAINTS ENFORCED: No UI logic beyond top-level routing choice.
 */
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  throw redirect(302, locals.session ? "/app" : "/login");
};
