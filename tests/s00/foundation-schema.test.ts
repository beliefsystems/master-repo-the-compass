import { describe, expect, it } from "vitest";
import * as schema from "../../src/lib/server/db/foundation-schema.js";

describe("S00 foundation schema", () => {
  it("exports only the foundation tables required by S00", () => {
    expect(schema.organisation).toBeDefined();
    expect(schema.organisationConfig).toBeDefined();
    expect(schema.users).toBeDefined();
    expect(schema.employees).toBeDefined();
    expect(schema.sessions).toBeDefined();
    expect(schema.idempotencyRecords).toBeDefined();
    expect(schema.systemEvents).toBeDefined();
    expect((schema as Record<string, unknown>).kpis).toBeUndefined();
  });

  it("keeps deleted_at only on soft-deletable tables", () => {
    expect("deletedAt" in schema.organisation).toBe(false);
    expect(schema.users.deletedAt).toBeDefined();
    expect(schema.employees.deletedAt).toBeDefined();
  });
});
