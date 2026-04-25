/**
 * PURPOSE: Protect the Slice 0 application shell and require an authenticated session.
 * CONNECTIONS: Uses auth locals from hooks.server.ts.
 * LAYER: Routes / Controller
 * SSOT REFERENCES: Part 23.1, Part 29
 * CONSTRAINTS ENFORCED: Protected route boundary only; no authorization business rules yet.
 */
import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.session) {
    throw redirect(302, "/login");
  }

  return {};
};
