/**
 * PURPOSE: Verify formula correctness, NULL handling, rollups, and ranking utilities.
 * CONNECTIONS: Covers the pure calc engine exports.
 * LAYER: Tests
 * SSOT REFERENCES: Part 26
 * CONSTRAINTS ENFORCED: NULL vs 0, force-close denominator rules, no weight redistribution.
 */
import { describe, expect, it } from "vitest";
import {
  autoSplitWeights,
  computeCyclePercent,
  computeHallOfFameRankings,
  computeMonthlyKpiPercent,
  computeObjectivePercent,
  computeOea,
  computeOem,
  derivePmsRating
} from "./calc.js";

describe("calc engine", () => {
  it("computes cycle percent for increase, decrease, and control metrics", () => {
    expect(computeCyclePercent({ metricType: "INCREASE", standard: 10, target: 20, actual: 15 }).percent).toBe(50);
    expect(computeCyclePercent({ metricType: "DECREASE", standard: 20, target: 10, actual: 15 }).percent).toBe(50);
    expect(computeCyclePercent({ metricType: "CONTROL", standard: 10, target: 20, actual: 12 }).percent).toBe(100);
    expect(computeCyclePercent({ metricType: "CONTROL", standard: 10, target: 20, actual: 25 }).percent).toBe(0);
  });

  it("treats null as excluded and zero as included in monthly KPI aggregation", () => {
    expect(
      computeMonthlyKpiPercent({
        metricType: "INCREASE",
        targetType: "FIXED",
        standard: 0,
        target: 10,
        aggregationMethod: "SUM",
        cycles: [{ actualValue: null }, { actualValue: null }]
      })
    ).toBeNull();

    expect(
      computeMonthlyKpiPercent({
        metricType: "INCREASE",
        targetType: "FIXED",
        standard: 0,
        target: 10,
        aggregationMethod: "SUM",
        cycles: [{ actualValue: 0 }, { actualValue: 10 }]
      })
    ).toBe(100);
  });

  it("computes objective and cadence rollups without weight redistribution", () => {
    expect(
      computeObjectivePercent({
        directKpis: [
          { weightage: 70, percent: 80 },
          { weightage: 30, percent: null }
        ]
      })
    ).toBe(56);

    expect(
      computeOem(
        [
          { weightage: 50, percent: 80 },
          { weightage: 50, percent: 100 }
        ],
        false
      )
    ).toBe(90);

    expect(
      computeOea([
        { month: 1, oem: 80, forceClosed: false },
        { month: 2, oem: null, forceClosed: true },
        { month: 3, oem: 100, forceClosed: false }
      ])
    ).toBe(60);
  });

  it("applies auto-split and PMS rating derivation rules", () => {
    expect(autoSplitWeights(3)).toEqual([33.33, 33.33, 33.34]);
    expect(derivePmsRating(95)).toBe("Meets Expectations");
  });

  it("computes hall of fame rankings with eligibility and tie-breaks", () => {
    const result = computeHallOfFameRankings([
      {
        employeeId: "e1",
        userId: "u1",
        dateOfJoining: "2020-01-01",
        quarters: [
          { months: [{ month: 1, oem: 90, forceClosed: false }, { month: 2, oem: 95, forceClosed: false }, { month: 3, oem: 100, forceClosed: false }] }
        ],
        kpiStatusesByMonth: ["ON_TRACK", "ACHIEVED", "ON_TRACK"],
        annualScore: 95,
        totalSubmissions: 10,
        rejections: 1,
        validMonthsInAnnualScore: 6
      },
      {
        employeeId: "e2",
        userId: "u2",
        dateOfJoining: "2021-01-01",
        quarters: [
          { months: [{ month: 1, oem: 80, forceClosed: false }, { month: 2, oem: 80, forceClosed: false }, { month: 3, oem: 80, forceClosed: false }] }
        ],
        kpiStatusesByMonth: ["ON_TRACK", "ON_TRACK", "ON_TRACK"],
        annualScore: 90,
        totalSubmissions: 10,
        rejections: 0,
        validMonthsInAnnualScore: 6
      }
    ]);

    expect(result.mostConsistentPerformers[0]?.employeeId).toBe("e1");
    expect(result.topAnnualPerformers[0]?.employeeId).toBe("e1");
  });
});
