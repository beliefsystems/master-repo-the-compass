/**
 * PURPOSE: Read the single deployment organisation and config rows from the database.
 * CONNECTIONS: Used by OrganisationService and the Slice 0 org read route.
 * LAYER: Repositories
 * SSOT REFERENCES: Part 23.3, Part 24.1, Part 24.2
 * CONSTRAINTS ENFORCED: Reads are scoped to the server-owned organisation_id constant; no business logic.
 */
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db/client";
import { organisation, organisationConfig } from "$lib/server/db/foundation-schema";
import { ORG_ID_CONSTANT } from "./base.js";

export async function getCurrentOrganisationRecord() {
  const [record] = await db
    .select({
      id: organisation.id,
      name: organisation.name,
      fiscalYearStart: organisation.fiscalYearStart,
      timezone: organisation.timezone,
      status: organisation.status,
      configId: organisationConfig.id,
      pmsCadencesEnabled: organisationConfig.pmsCadencesEnabled
    })
    .from(organisation)
    .leftJoin(organisationConfig, eq(organisationConfig.organisationId, organisation.id))
    .where(eq(organisation.id, ORG_ID_CONSTANT))
    .limit(1);

  return record ?? null;
}
