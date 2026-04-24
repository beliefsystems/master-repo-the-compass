/**
 * PURPOSE: Verify validation schema behavior and typed error mapping.
 * CONNECTIONS: Covers parse helpers and error registry contracts.
 * LAYER: Tests
 * SSOT REFERENCES: Part 27, Part 28.6
 * CONSTRAINTS ENFORCED: Correct input rejection, cumulative KPI rules, timeline checks, canonical HTTP statuses.
 */
import { describe, expect, it } from "vitest";
import { APP_ERROR_REGISTRY, ValidationAppError } from "../errors.js";
import {
  createKpiRequestSchema,
  kpiTimelineRequestSchema,
  parseWithAppError,
  submitPmsReviewRequestSchema
} from "./index.js";

describe("validation", () => {
  it("rejects invalid cumulative KPI payloads", () => {
    const result = createKpiRequestSchema.safeParse({
      title: "Revenue",
      metric_type: "CUMULATIVE",
      target_type: "CUSTOM",
      standard: 1,
      target: 0,
      aggregation_method: "AVERAGE",
      frequency: "MONTHLY",
      weightage: 50
    });

    expect(result.success).toBe(false);
    expect(result.success ? [] : result.error.issues.map((issue) => issue.path.join("."))).toEqual(
      expect.arrayContaining(["target_type", "standard", "aggregation_method", "target"])
    );
  });

  it("rejects invalid KPI timelines", () => {
    const result = kpiTimelineRequestSchema.safeParse({
      start_date: "2026-04-28",
      end_date: "2026-05-01",
      frequency: "WEEKLY",
      version: 1
    });

    expect(result.success).toBe(false);
  });

  it("maps zod failures into ValidationAppError field payloads", () => {
    expect(() =>
      parseWithAppError(submitPmsReviewRequestSchema, {
        rating: "HAPPY",
        comment: "short",
        version: 1
      })
    ).toThrow(ValidationAppError);
  });

  it("keeps canonical HTTP statuses in the error registry", () => {
    expect(APP_ERROR_REGISTRY.DERIVED_CADENCE_IMMUTABLE.httpStatus).toBe(403);
    expect(APP_ERROR_REGISTRY.CONCURRENT_MODIFICATION.httpStatus).toBe(409);
    expect(APP_ERROR_REGISTRY.INTERNAL_SERVER_ERROR.httpStatus).toBe(500);
  });
});
