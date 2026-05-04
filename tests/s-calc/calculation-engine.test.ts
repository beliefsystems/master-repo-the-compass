import { describe, expect, it } from "vitest";
import {
  autoSplitWeightage,
  calculateCumulativePercent,
  calculateMetricPercent,
  calculateWeightedScore,
  deriveKpiStatus,
  derivePmsRating,
  validateMetricDefinition
} from "../../src/lib/server/utils/calculation-engine.js";

describe("S-CALC calculation engine", () => {
  it("validates INCREASE metric definitions", () => {
    expect(() => validateMetricDefinition({ metricType: "INCREASE", base: 100, target: 100 })).toThrow();
    expect(() => validateMetricDefinition({ metricType: "INCREASE", base: 100, standard: 100, target: 200 })).toThrow();
    expect(() => validateMetricDefinition({ metricType: "INCREASE", base: 100, standard: 200, target: 200 })).toThrow();
  });

  it("calculates INCREASE percent with null, standard floor, and overshoot", () => {
    expect(calculateMetricPercent({ metricType: "INCREASE", base: 10, target: 20, actual: null }).percent).toBeNull();
    expect(calculateMetricPercent({ metricType: "INCREASE", base: 10, standard: 15, target: 20, actual: 14 }).percent).toBe(0);
    expect(calculateMetricPercent({ metricType: "INCREASE", base: 10, target: 20, actual: 25 }).percent).toBe(150);
  });

  it("validates and calculates DECREASE metrics", () => {
    expect(() => validateMetricDefinition({ metricType: "DECREASE", base: 10, target: 20 })).toThrow();
    expect(calculateMetricPercent({ metricType: "DECREASE", base: 20, standard: 15, target: 10, actual: 16 }).percent).toBe(0);
    expect(calculateMetricPercent({ metricType: "DECREASE", base: 20, target: 10, actual: 5 }).percent).toBe(150);
  });

  it("calculates CONTROL metrics with and without tightening standard", () => {
    expect(calculateMetricPercent({ metricType: "CONTROL", base: 10, target: 20, actual: 12 }).percent).toBe(100);
    expect(calculateMetricPercent({ metricType: "CONTROL", base: 10, target: 20, actual: 25 }).percent).toBe(0);
    expect(() => validateMetricDefinition({ metricType: "CONTROL", base: 10, standard: 5, target: 20 })).toThrow();
    expect(calculateMetricPercent({ metricType: "CONTROL", base: 10, standard: 2, target: 20, actual: 15 }).percent).toBe(100);
    expect(calculateMetricPercent({ metricType: "CONTROL", base: 10, standard: 2, target: 20, actual: 11 }).percent).toBe(0);
  });

  it("calculates CUMULATIVE metrics with null preservation, validation, standard floor, and overshoot", () => {
    expect(calculateCumulativePercent({ metricType: "CUMULATIVE", base: 0, target: 100, actuals: [null, null] })).toMatchObject({
      percent: null,
      runningTotal: null
    });
    expect(() => calculateCumulativePercent({ metricType: "CUMULATIVE", base: 0, target: 100, actuals: [10, -1] })).toThrow();
    expect(calculateCumulativePercent({ metricType: "CUMULATIVE", base: 0, standard: 50, target: 100, actuals: [20, 20] }).percent).toBe(0);
    expect(calculateCumulativePercent({ metricType: "CUMULATIVE", base: 0, target: 100, actuals: [60, null, 50] }).percent).toBe(110);
  });

  it("calculates weighted score without treating null as zero", () => {
    expect(
      calculateWeightedScore([
        { percent: null, weightage: 40 },
        { percent: 80, weightage: 60 }
      ])
    ).toBe(48);
    expect(calculateWeightedScore([{ percent: null, weightage: 100 }])).toBeNull();
  });

  it("derives statuses, ratings, and exact two-decimal auto-splits", () => {
    expect(autoSplitWeightage(3)).toEqual([33.33, 33.33, 33.34]);
    expect(autoSplitWeightage(7).reduce((sum, value) => Number((sum + value).toFixed(2)), 0)).toBe(100);
    expect(deriveKpiStatus(null, [{ min: 0, max: null, label: "Any" }])).toBe("NO_DATA");
    expect(deriveKpiStatus(85, [{ min: 80, max: 99, label: "On Track" }])).toBe("On Track");
    expect(derivePmsRating(null, [{ min: 0, max: null, label: "Any" }])).toBeNull();
    expect(derivePmsRating(95, [{ min: 90, max: null, label: "Meets Expectations" }])).toBe("Meets Expectations");
  });
});
