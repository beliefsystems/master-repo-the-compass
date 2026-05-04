/**
 * PURPOSE: Read the single deployment organisation and config rows from the database.
 * CONNECTIONS: Used by OrganisationService and the Slice 0 org read route.
 * LAYER: Repositories
 * SSOT REFERENCES: Part 23.3, Part 24.1, Part 24.2
 * CONSTRAINTS ENFORCED: Reads are scoped to the server-owned organisation_id constant; no business logic.
 */
import { and, eq } from "drizzle-orm";
import { db } from "$lib/server/db/client";
import { organisation, organisationConfig, type NewOrganisationConfig, type NewOrganisation } from "$lib/server/db/foundation-schema";
import { ORG_ID_CONSTANT, type DatabaseExecutor } from "./base.js";

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

export async function findOrganisation(client: DatabaseExecutor = db) {
  const [record] = await client
    .select()
    .from(organisation)
    .where(eq(organisation.id, ORG_ID_CONSTANT))
    .limit(1);

  return record ?? null;
}

export async function updateOrganisation(
  patch: Partial<Pick<NewOrganisation, "name" | "timezone">>,
  expectedVersion: number,
  client: DatabaseExecutor = db
) {
  const [record] = await client
    .update(organisation)
    .set({
      ...patch,
      updatedAt: new Date(),
      version: expectedVersion + 1
    })
    .where(and(eq(organisation.id, ORG_ID_CONSTANT), eq(organisation.version, expectedVersion)))
    .returning();

  return record ?? null;
}

export async function findOrganisationConfig(client: DatabaseExecutor = db) {
  const [record] = await client
    .select()
    .from(organisationConfig)
    .where(eq(organisationConfig.organisationId, ORG_ID_CONSTANT))
    .limit(1);

  return record ?? null;
}

export async function updateOrganisationConfig(
  patch: Partial<Pick<NewOrganisationConfig, "maxImportFileSizeMb" | "pmsCadencesEnabled" | "kpiStatusBands" | "pmsRatingBands">>,
  expectedVersion: number,
  client: DatabaseExecutor = db
) {
  const [record] = await client
    .update(organisationConfig)
    .set({
      ...patch,
      updatedAt: new Date(),
      version: expectedVersion + 1
    })
    .where(and(eq(organisationConfig.organisationId, ORG_ID_CONSTANT), eq(organisationConfig.version, expectedVersion)))
    .returning();

  return record ?? null;
}
