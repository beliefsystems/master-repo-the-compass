import { describe, expect, it } from "vitest";
import {
  parseWithValidationError,
  updateOrganisationConfigRequestSchema,
  updateOrganisationRequestSchema
} from "../../src/lib/server/validation/foundation.js";

describe("S01 organisation validation", () => {
  it("requires at least one organisation field besides version", () => {
    expect(() => parseWithValidationError(updateOrganisationRequestSchema, { version: 1 })).toThrow();
  });

  it("rejects invalid config cadences", () => {
    expect(() =>
      parseWithValidationError(updateOrganisationConfigRequestSchema, {
        pmsCadencesEnabled: ["MONTHLY"],
        version: 1
      })
    ).toThrow();
  });
});
