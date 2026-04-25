/**
 * PURPOSE: Implement the authoritative pure calculation engine for KPI, Objective, and PMS scoring.
 * CONNECTIONS: Consumes constants and shared calculation IO types; intended for service-layer orchestration only.
 * LAYER: Core Calculations
 * SSOT REFERENCES: Part 23.5, Part 26.1 through Part 26.12
 * CONSTRAINTS ENFORCED: Pure functions only, strict NULL vs 0 handling, no DB access, no weight redistribution.
 */
import {
  DEFAULT_KPI_STATUS_BANDS,
  DEFAULT_PMS_RATING_BANDS,
  type KpiMetricType
} from "./constants.js";
import { createAppError } from "./errors.js";
import type {
  CumulativeCycleDisplayInput,
  CycleScoreInput,
  CycleScoreResult,
  ForceClosedMonthInput,
  HallOfFameEmployee,
  HallOfFameResult,
  KpiStatusBands,
  MonthlyKpiComputationInput,
  ObjectiveRollupInput,
  PmsRatingBands,
  WeightedPercentInput
} from "../../shared/types/index.js";

function requireValidIncreaseDecreaseTarget(standard: number, target: number) {
  if (target === standard) {
    throw createAppError("TARGET_EQUALS_STANDARD");
  }
}

function requireValidControlTarget(standard: number, target: number) {
  if (standard > target) {
    throw createAppError("CONTROL_STANDARD_EXCEEDS_TARGET");
  }
}

function computeIncreasePercent(actual: number, standard: number, target: number) {
  requireValidIncreaseDecreaseTarget(standard, target);
  if (actual <= standard) {
    return 0;
  }

  return ((actual - standard) / (target - standard)) * 100;
}

function computeDecreasePercent(actual: number, standard: number, target: number) {
  requireValidIncreaseDecreaseTarget(standard, target);
  if (actual >= standard) {
    return 0;
  }

  return ((standard - actual) / (standard - target)) * 100;
}

function computeControlPercent(actual: number, standard: number, target: number) {
  requireValidControlTarget(standard, target);
  return actual >= Math.min(standard, target) && actual <= Math.max(standard, target) ? 100 : 0;
}

export function computeCyclePercent(input: CycleScoreInput): CycleScoreResult {
  switch (input.metricType) {
    case "INCREASE":
      return { percent: computeIncreasePercent(input.actual, input.standard, input.target) };
    case "DECREASE":
      return { percent: computeDecreasePercent(input.actual, input.standard, input.target) };
    case "CONTROL":
      return { percent: computeControlPercent(input.actual, input.standard, input.target) };
    case "CUMULATIVE":
      requireValidIncreaseDecreaseTarget(0, input.target);
      return { percent: (input.actual / input.target) * 100 };
    default:
      throw new Error(`Unsupported metric type: ${String(input.metricType)}`);
  }
}

export function computeCumulativeCycleDisplay(input: CumulativeCycleDisplayInput) {
  if (input.target === 0) {
    throw createAppError("TARGET_EQUALS_STANDARD");
  }

  const runningTotal = input.cycleActuals.reduce<number>((sum, value) => (value === null ? sum : sum + value), 0);
  return {
    runningTotal,
    runningPercent: (runningTotal / input.target) * 100
  };
}

export function computeMonthlyKpiPercent(input: MonthlyKpiComputationInput): number | null {
  const includedCycles = input.cycles.filter((cycle) => cycle.actualValue !== null);

  if (input.metricType === "CUMULATIVE") {
    if (input.target === 0) {
      throw createAppError("TARGET_EQUALS_STANDARD");
    }

    if (input.cycles.length === 0 || includedCycles.length === 0) {
      return null;
    }

    const runningTotal = includedCycles.reduce((sum, cycle) => sum + Number(cycle.actualValue), 0);
    return (runningTotal / input.target) * 100;
  }

  if (includedCycles.length === 0) {
    return null;
  }

  if (input.targetType === "CUSTOM") {
    const cyclePercents = includedCycles.map((cycle) => {
      if (cycle.cyclePercent === undefined || cycle.cyclePercent === null) {
        throw createAppError("VALIDATION_FAILED", {
          fields: [{ field: "cycles", message: "cyclePercent is required for CUSTOM target monthly aggregation." }]
        });
      }

      return cycle.cyclePercent;
    });

    return cyclePercents.reduce((sum, percent) => sum + percent, 0) / cyclePercents.length;
  }

  const monthlyActualSum = includedCycles.reduce((sum, cycle) => sum + Number(cycle.actualValue), 0);
  const monthlyActual =
    input.aggregationMethod === "AVERAGE" ? monthlyActualSum / includedCycles.length : monthlyActualSum;

  return computeCyclePercent({
    metricType: input.metricType,
    standard: input.standard,
    target: input.target,
    actual: monthlyActual
  }).percent;
}

function computeWeightedPercent(items: WeightedPercentInput[]): number | null {
  const includedItems = items.filter((item) => item.percent !== null);
  if (includedItems.length === 0) {
    return null;
  }

  return items.reduce((sum, item) => sum + ((item.percent ?? 0) * item.weightage) / 100, 0);
}

export function computeObjectivePercent(input: ObjectiveRollupInput): number | null {
  const merged = [...input.directKpis, ...(input.mappedChildren ?? [])];
  return computeWeightedPercent(merged);
}

export function computeMappedObjectivePercent(input: ObjectiveRollupInput, excludeMappedChildren = false): number | null {
  return computeObjectivePercent({
    directKpis: input.directKpis,
    mappedChildren: excludeMappedChildren ? [] : input.mappedChildren
  });
}

export function computeOem(objectives: WeightedPercentInput[], forceClosed = false): number | null {
  const includedObjectives = objectives.filter((objective) => objective.percent !== null);
  if (includedObjectives.length === 0) {
    // SSoT §26.6: force-closed month with all-NULL objectives → OEM = null, included in cadence denominator
    return null;
  }

  return objectives.reduce((sum, objective) => sum + ((objective.percent ?? 0) * objective.weightage) / 100, 0);
}

function computeDerivedCadence(months: ForceClosedMonthInput[]): number | null {
  const validMonths = months.filter((month) => month.oem !== null);
  const forceClosedNullMonths = months.filter((month) => month.forceClosed && month.oem === null);
  const denominator = validMonths.length + forceClosedNullMonths.length;

  if (denominator === 0) {
    return null;
  }

  const numerator = validMonths.reduce((sum, month) => sum + Number(month.oem), 0);
  return numerator / denominator;
}

export function computeOeq(months: ForceClosedMonthInput[]): number | null {
  return computeDerivedCadence(months);
}

export function computeOeh(months: ForceClosedMonthInput[]): number | null {
  return computeDerivedCadence(months);
}

export function computeOea(months: ForceClosedMonthInput[]): number | null {
  return computeDerivedCadence(months);
}

export function autoSplitWeights(count: number): number[] {
  if (count <= 0) {
    return [];
  }

  const base = Math.floor((100 / count) * 100) / 100;
  const allWeights = new Array<number>(count).fill(base);
  const delta = Number((100 - base * count).toFixed(2));
  allWeights[count - 1] = Number((allWeights[count - 1] + delta).toFixed(2));
  return allWeights;
}

export function deriveKpiStatus(
  score: number | null,
  bands: KpiStatusBands = DEFAULT_KPI_STATUS_BANDS
): "NOT_STARTED" | "AT_RISK" | "OFF_TRACK" | "ON_TRACK" | "ACHIEVED" {
  if (score === null) {
    return "NOT_STARTED";
  }

  const orderedBands = Object.entries(bands).sort(([, a], [, b]) => a.min - b.min);
  const matched = orderedBands.find(([, band]) => score >= band.min && (band.max === null || score <= band.max));
  switch (matched?.[0]) {
    case "at_risk":
      return "AT_RISK";
    case "off_track":
      return "OFF_TRACK";
    case "on_track":
      return "ON_TRACK";
    case "achieved":
      return "ACHIEVED";
    default:
      return "NOT_STARTED";
  }
}

export function derivePmsRating(score: number | null, bands: PmsRatingBands = [...DEFAULT_PMS_RATING_BANDS]): string | null {
  if (score === null) {
    return null;
  }

  const orderedBands = [...bands].sort((a, b) => b.min - a.min);
  return orderedBands.find((band) => score >= band.min && (band.max === null || score <= band.max))?.label ?? null;
}

export function computeHallOfFameRankings(employees: HallOfFameEmployee[]): HallOfFameResult {
  const mostConsistentPerformers = employees
    .map((employee) => {
      const completedQuarterMonths = employee.quarters.filter((quarter) =>
        quarter.months.every((month) => month.oem !== null || month.forceClosed)
      );
      const validMonths = completedQuarterMonths.flatMap((quarter) => quarter.months.filter((month) => month.oem !== null));
      const onTrackMonths = employee.kpiStatusesByMonth.filter((status) => status === "ON_TRACK" || status === "ACHIEVED").length;
      const avgOem = validMonths.length > 0 ? validMonths.reduce((sum, month) => sum + Number(month.oem), 0) / validMonths.length : null;
      const onTrackRate = validMonths.length > 0 ? onTrackMonths / validMonths.length : 0;

      return {
        employeeId: employee.employeeId,
        avgOem,
        onTrackRate,
        dateOfJoining: employee.dateOfJoining
      };
    })
    .filter((employee) => employee.avgOem !== null && employee.onTrackRate >= 0.8)
    .sort((a, b) => {
      if (b.avgOem !== a.avgOem) {
        return Number(b.avgOem) - Number(a.avgOem);
      }

      return String(a.dateOfJoining ?? "").localeCompare(String(b.dateOfJoining ?? ""));
    })
    .slice(0, 10)
    .map((employee) => ({
      employeeId: employee.employeeId,
      avgOem: Number(employee.avgOem),
      onTrackRate: employee.onTrackRate
    }));

  const topAnnualPerformers = employees
    .filter((employee) => employee.annualScore !== null && employee.validMonthsInAnnualScore >= 6)
    .map((employee) => ({
      employeeId: employee.employeeId,
      oea: Number(employee.annualScore),
      rejectionRate: employee.rejections / Math.max(employee.totalSubmissions, 1)
    }))
    .sort((a, b) => {
      if (b.oea !== a.oea) {
        return b.oea - a.oea;
      }

      return a.rejectionRate - b.rejectionRate;
    })
    .slice(0, 10);

  return {
    mostConsistentPerformers,
    topAnnualPerformers
  };
}

export function normalizeNumeric(input: number | string | null | undefined): number | null {
  if (input === null || input === undefined) {
    return null;
  }

  return typeof input === "number" ? input : Number(input);
}

export function isValidMetricType(metricType: string): metricType is KpiMetricType {
  return ["INCREASE", "DECREASE", "CONTROL", "CUMULATIVE"].includes(metricType);
}
