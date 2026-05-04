/**
 * PURPOSE: Verify the active S00/S01 schema surface, constraints, and export boundaries.
 * CONNECTIONS: Covers the foundation schema entrypoint used by Drizzle runtime and migrations.
 * LAYER: Tests
 * SSOT REFERENCES: Part 24, Part 30
 * CONSTRAINTS ENFORCED: V1-only schema, version/deleted_at presence, no-overlap SQL helper retained.
 */
import { describe, expect, it } from "vitest";
import * as schema from "../../src/lib/server/db/foundation-schema.js";

describe("schema", () => {
  it("exports the active schema tables required through S03", () => {
    expect(schema.organisation).toBeDefined();
    expect(schema.organisationConfig).toBeDefined();
    expect(schema.users).toBeDefined();
    expect(schema.employees).toBeDefined();
    expect(schema.idempotencyRecords).toBeDefined();
    expect(schema.sessions).toBeDefined();
    expect(schema.systemEvents).toBeDefined();
    expect(schema.objectives).toBeDefined();
    expect((schema as Record<string, unknown>).kpis).toBeUndefined();
  });

  it("keeps version and soft-delete columns only where defined through S01", () => {
    expect(schema.organisation.version).toBeDefined();
    expect("deletedAt" in schema.organisation).toBe(false);
    expect(schema.organisationConfig.version).toBeDefined();
    expect(schema.users.version).toBeDefined();
    expect(schema.users.deletedAt).toBeDefined();
    expect(schema.employees.version).toBeDefined();
    expect(schema.employees.deletedAt).toBeDefined();
    expect(schema.objectives.version).toBeDefined();
    expect(schema.objectives.deletedAt).toBeDefined();
    expect("deletedAt" in schema.systemEvents).toBe(false);
  });
});
