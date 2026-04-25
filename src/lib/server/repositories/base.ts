/**
 * PURPOSE: Provide repository-layer helpers for organisation-scoped queries.
 * CONNECTIONS: Used by concrete repositories to enforce the mandatory organisation_id boundary.
 * LAYER: Repositories
 * SSOT REFERENCES: Part 23.3, Part 24
 * CONSTRAINTS ENFORCED: All repository queries are scoped by the server-owned organisation_id constant.
 */
import { and, eq, isNull, type SQL, type AnyColumn } from "drizzle-orm";
import { env } from "../env.js";

export const ORGANISATION_ID = env.APP_ORGANISATION_ID;

export function withOrganisationScope(organisationColumn: AnyColumn, deletedAtColumn?: AnyColumn | null): SQL<unknown> {
  if (deletedAtColumn) {
    return and(eq(organisationColumn, ORGANISATION_ID), isNull(deletedAtColumn)) as SQL<unknown>;
  }

  return eq(organisationColumn, ORGANISATION_ID);
}
