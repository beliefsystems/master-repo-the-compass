/**
 * PURPOSE: Load the single protected API-backed organisation read path for Slice 0 verification.
 * CONNECTIONS: Calls the authenticated `/api/v1/org` route through SvelteKit fetch.
 * LAYER: Routes / Controller
 * SSOT REFERENCES: Part 23.1, Part 27 organisation endpoint
 * CONSTRAINTS ENFORCED: Runtime verification flow only; no additional business features.
 */
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch }) => {
  const response = await fetch("/api/v1/org");

  if (!response.ok) {
    throw error(response.status, "Failed to load organisation data.");
  }

  return {
    organisation: await response.json()
  };
};
