import { db } from "$lib/server/db/client";
import {
  findOrganisation,
  findOrganisationConfig,
  getCurrentOrganisationRecord,
  updateOrganisation as updateOrganisationRow,
  updateOrganisationConfig as updateOrganisationConfigRow
} from "$lib/server/repositories/organisation.repository";
import { createAppError, ValidationAppError } from "$lib/server/utils/errors.js";
import { requireRecord } from "./base.js";
import { recordSystemEvent } from "./audit.service.js";
import type { AuthenticatedActor } from "./auth.service.js";

export async function getCurrentOrganisation() {
  return requireRecord(await getCurrentOrganisationRecord(), "Organisation bootstrap record is missing.");
}

function assertAdminWritable(actor: AuthenticatedActor) {
  if (actor.role !== "ADMIN") {
    throw createAppError("PERMISSION_DENIED");
  }
  if (actor.executiveLabel) {
    throw createAppError("BOD_WRITE_FORBIDDEN");
  }
}

function assertIanaTimezone(timezone: string) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone }).format(new Date());
  } catch {
    throw new ValidationAppError([{ field: "timezone", message: "Timezone must be a valid IANA timezone." }]);
  }
}

export async function getOrganisation(_actor: AuthenticatedActor) {
  return requireRecord(await findOrganisation(), "Organisation bootstrap record is missing.");
}

export async function updateOrganisation(
  actor: AuthenticatedActor,
  input: {
    name?: string;
    timezone?: string;
    version: number;
  }
) {
  assertAdminWritable(actor);
  if (input.timezone) {
    assertIanaTimezone(input.timezone);
  }

  const updated = await db.transaction(async (tx) => {
    const organisation = await updateOrganisationRow(
      {
        name: input.name,
        timezone: input.timezone
      },
      input.version,
      tx
    );

    if (!organisation) return null;

    await recordSystemEvent({
      actorUserId: actor.id,
      eventType: "ORG_UPDATED",
      entityType: "organisation",
      entityId: organisation.id,
      metadata: {
        name: organisation.name,
        timezone: organisation.timezone
      }
    }, tx);

    return organisation;
  });

  if (!updated) {
    throw createAppError("CONCURRENT_MODIFICATION");
  }

  return updated;
}

export async function getOrganisationConfig(_actor: AuthenticatedActor) {
  return requireRecord(await findOrganisationConfig(), "Organisation config bootstrap record is missing.");
}

export async function updateOrganisationConfig(
  actor: AuthenticatedActor,
  input: {
    maxImportFileSizeMb?: number;
    pmsCadencesEnabled?: Array<"QUARTERLY" | "HALF_YEARLY" | "ANNUAL">;
    kpiStatusBands?: unknown;
    pmsRatingBands?: unknown;
    version: number;
  }
) {
  assertAdminWritable(actor);

  const updated = await db.transaction(async (tx) => {
    const config = await updateOrganisationConfigRow(
      {
        maxImportFileSizeMb: input.maxImportFileSizeMb,
        pmsCadencesEnabled: input.pmsCadencesEnabled,
        kpiStatusBands: input.kpiStatusBands,
        pmsRatingBands: input.pmsRatingBands
      },
      input.version,
      tx
    );

    if (!config) return null;

    await recordSystemEvent({
      actorUserId: actor.id,
      eventType: "CONFIG_UPDATED",
      entityType: "organisation_config",
      entityId: config.id,
      metadata: {
        maxImportFileSizeMb: config.maxImportFileSizeMb,
        pmsCadencesEnabled: config.pmsCadencesEnabled
      }
    }, tx);

    return config;
  });

  if (!updated) {
    throw createAppError("CONCURRENT_MODIFICATION");
  }

  return updated;
}
