/**
 * PURPOSE: Expose the minimal organisation read service used to validate the Slice 0 runtime path.
 * CONNECTIONS: Calls the organisation repository and is consumed by the API route and protected page.
 * LAYER: Services
 * SSOT REFERENCES: Part 23.2, Part 24.1, Part 24.2, Part 27 organisation endpoints
 * CONSTRAINTS ENFORCED: No Drizzle usage in services; read orchestration only.
 */
import { getCurrentOrganisationRecord } from "$lib/server/repositories/organisation.repository";
import { requireRecord } from "./base.js";

export async function getCurrentOrganisation() {
  return requireRecord(await getCurrentOrganisationRecord(), "Organisation bootstrap record is missing.");
}
