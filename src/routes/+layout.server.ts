/**
 * PURPOSE: Make current session data available to all route loads and pages.
 * CONNECTIONS: Reads populated auth locals from hooks.server.ts.
 * LAYER: Routes / Controller
 * SSOT REFERENCES: Part 23.1, Part 29
 * CONSTRAINTS ENFORCED: Request/session plumbing only; no business logic.
 */
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => ({
  session: locals.session,
  user: locals.user
});
