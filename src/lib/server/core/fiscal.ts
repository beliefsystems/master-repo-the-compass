/**
 * PURPOSE: Implement reusable fiscal calendar and cadence derivation helpers.
 * CONNECTIONS: Used by calculations, validation, and future services for cadence-safe period resolution.
 * LAYER: Core Fiscal Helpers
 * SSOT REFERENCES: Part 0.6 Q7, Part 4.2, Part 26.8, Part 27 score queries
 * CONSTRAINTS ENFORCED: Monthly is the only writable cadence; derived cadences are computed from monthly data only.
 */
import { DERIVED_CADENCES, WRITABLE_CADENCES, type DerivedCadence, type FiscalYearStart, type ScoreCadence } from "./constants.js";
import { createAppError } from "./errors.js";

const APRIL_ORDER = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3] as const;
const JANUARY_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

function getMonthOrder(fiscalYearStart: FiscalYearStart) {
  return fiscalYearStart === "APRIL" ? APRIL_ORDER : JANUARY_ORDER;
}

export function resolveFiscalMonthIndex(month: number, fiscalYearStart: FiscalYearStart): number {
  const monthOrder = getMonthOrder(fiscalYearStart);
  const index = monthOrder.indexOf(month as (typeof monthOrder)[number]);
  if (index === -1) {
    throw createAppError("VALIDATION_FAILED", { fields: [{ field: "month", message: "Month must be between 1 and 12." }] });
  }

  return index + 1;
}

export function getQuarterForMonth(month: number, fiscalYearStart: FiscalYearStart): "Q1" | "Q2" | "Q3" | "Q4" {
  const fiscalIndex = resolveFiscalMonthIndex(month, fiscalYearStart);
  return `Q${Math.ceil(fiscalIndex / 3)}` as "Q1" | "Q2" | "Q3" | "Q4";
}

export function getHalfForMonth(month: number, fiscalYearStart: FiscalYearStart): "H1" | "H2" {
  const fiscalIndex = resolveFiscalMonthIndex(month, fiscalYearStart);
  return fiscalIndex <= 6 ? "H1" : "H2";
}

export function getMonthsForCadencePeriod(
  cadence: DerivedCadence,
  period: "Q1" | "Q2" | "Q3" | "Q4" | "H1" | "H2" | "FY",
  fiscalYearStart: FiscalYearStart
): number[] {
  const order = [...getMonthOrder(fiscalYearStart)];

  if (cadence === "QUARTERLY") {
    const quarterIndex = Number(period.slice(1)) - 1;
    return order.slice(quarterIndex * 3, quarterIndex * 3 + 3);
  }

  if (cadence === "HALF_YEARLY") {
    return period === "H1" ? order.slice(0, 6) : order.slice(6, 12);
  }

  return order;
}

export function deriveCadencePeriodsFromMonthly(months: number[], fiscalYearStart: FiscalYearStart) {
  const uniqueMonths = [...new Set(months)].sort((a, b) => resolveFiscalMonthIndex(a, fiscalYearStart) - resolveFiscalMonthIndex(b, fiscalYearStart));
  const quarters = [...new Set(uniqueMonths.map((month) => getQuarterForMonth(month, fiscalYearStart)))];
  const halves = [...new Set(uniqueMonths.map((month) => getHalfForMonth(month, fiscalYearStart)))];

  return {
    quarters,
    halfYears: halves,
    annual: uniqueMonths.length > 0 ? ["FY" as const] : []
  };
}

export function assertWritableCadence(cadence: ScoreCadence): asserts cadence is "MONTHLY" {
  if ((DERIVED_CADENCES as readonly string[]).includes(cadence)) {
    throw createAppError("DERIVED_CADENCE_IMMUTABLE");
  }

  if (!(WRITABLE_CADENCES as readonly string[]).includes(cadence)) {
    throw createAppError("VALIDATION_FAILED", {
      fields: [{ field: "cadence", message: "Unknown cadence." }]
    });
  }
}

export function getValidMonthsForCadence(cadence: ScoreCadence, period: string, fiscalYearStart: FiscalYearStart): number[] {
  if (cadence === "MONTHLY") {
    return [Number(period)];
  }

  return getMonthsForCadencePeriod(cadence, period as "Q1" | "Q2" | "Q3" | "Q4" | "H1" | "H2" | "FY", fiscalYearStart);
}
