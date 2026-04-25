/**
 * PURPOSE: Verify the authoritative V1 schema surface, constraints, and export boundaries.
 * CONNECTIONS: Covers the single schema entrypoint and PostgreSQL-specific helpers from the iron core.
 * LAYER: Tests
 * SSOT REFERENCES: Part 24, Part 30
 * CONSTRAINTS ENFORCED: V1-only schema, version/deleted_at presence, no-overlap SQL helper retained.
 */
import { describe, expect, it } from "vitest";
import * as schema from "../../src/lib/server/db/schema.js";

describe("schema", () => {
  it("exports all V1 tables and omits the deferred V2 KPI library table", () => {
    expect(schema.organisation).toBeDefined();
    expect(schema.organisationConfig).toBeDefined();
    expect(schema.users).toBeDefined();
    expect(schema.employees).toBeDefined();
    expect(schema.objectives).toBeDefined();
    expect(schema.kpis).toBeDefined();
    expect(schema.kpiCycles).toBeDefined();
    expect(schema.kpiSubmissions).toBeDefined();
    expect(schema.objectiveMappings).toBeDefined();
    expect(schema.pmsReviews).toBeDefined();
    expect(schema.inAppNotifications).toBeDefined();
    expect(schema.tenantAttributeValues).toBeDefined();
    expect(schema.idempotencyRecords).toBeDefined();
    expect(schema.importJobs).toBeDefined();
    expect(schema.systemEvents).toBeDefined();
    expect((schema as Record<string, unknown>).kpiLibraryTemplates).toBeUndefined();
  });

  it("keeps version and soft-delete columns only where defined by the SSoT", () => {
    expect(schema.organisation.version).toBeDefined();
    expect("deletedAt" in schema.organisation).toBe(false);
    expect(schema.users.version).toBeDefined();
    expect(schema.users.deletedAt).toBeDefined();
    expect(schema.kpiCycles.version).toBeDefined();
    expect(schema.kpiCycles.forceClosed).toBeDefined();
    expect("deletedAt" in (schema.kpiCycles as unknown as Record<string, unknown>)).toBe(false);
    expect("updatedAt" in (schema.kpiSubmissions as unknown as Record<string, unknown>)).toBe(false);
  });

  it("exposes PostgreSQL helpers for exclusion and partial unique constraints", () => {
    expect(schema.KPI_CYCLES_NO_OVERLAP_CONSTRAINT_SQL).toContain("EXCLUDE USING gist");
    expect(schema.OBJECTIVE_MAPPINGS_CHILD_UNIQUE_INDEX_SQL).toContain("CREATE UNIQUE INDEX");
    expect(schema.TENANT_ATTRIBUTE_VALUES_UNIQUE_INDEX_SQL).toContain("CREATE UNIQUE INDEX");
  });
});
