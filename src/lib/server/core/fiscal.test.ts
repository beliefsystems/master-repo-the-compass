/**
 * PURPOSE: Verify fiscal calendar mapping and derived cadence immutability helpers.
 * CONNECTIONS: Covers reusable fiscal helpers consumed by validation and scoring logic.
 * LAYER: Tests
 * SSOT REFERENCES: Part 4.2, Part 26.8
 * CONSTRAINTS ENFORCED: APRIL and JANUARY fiscal calendars, monthly-only writable cadence.
 */
import { describe, expect, it } from "vitest";
import {
  assertWritableCadence,
  deriveCadencePeriodsFromMonthly,
  getHalfForMonth,
  getMonthsForCadencePeriod,
  getQuarterForMonth,
  resolveFiscalMonthIndex
} from "./fiscal.js";
import { AppError } from "./errors.js";

describe("fiscal helpers", () => {
  it("maps months into fiscal order for APRIL and JANUARY years", () => {
    expect(resolveFiscalMonthIndex(4, "APRIL")).toBe(1);
    expect(resolveFiscalMonthIndex(3, "APRIL")).toBe(12);
    expect(resolveFiscalMonthIndex(1, "JANUARY")).toBe(1);
  });

  it("derives quarter and half labels correctly", () => {
    expect(getQuarterForMonth(4, "APRIL")).toBe("Q1");
    expect(getQuarterForMonth(1, "APRIL")).toBe("Q4");
    expect(getHalfForMonth(10, "APRIL")).toBe("H2");
  });

  it("expands cadence periods into their month sets", () => {
    expect(getMonthsForCadencePeriod("QUARTERLY", "Q2", "APRIL")).toEqual([7, 8, 9]);
    expect(getMonthsForCadencePeriod("HALF_YEARLY", "H2", "APRIL")).toEqual([10, 11, 12, 1, 2, 3]);
    expect(getMonthsForCadencePeriod("ANNUAL", "FY", "JANUARY")).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("derives cadence labels from monthly data and blocks writes to derived cadences", () => {
    expect(deriveCadencePeriodsFromMonthly([4, 5, 9, 10], "APRIL")).toEqual({
      quarters: ["Q1", "Q2", "Q3"],
      halfYears: ["H1", "H2"],
      annual: ["FY"]
    });

    expect(() => assertWritableCadence("QUARTERLY")).toThrow(AppError);
    expect(() => assertWritableCadence("MONTHLY")).not.toThrow();
  });
});
