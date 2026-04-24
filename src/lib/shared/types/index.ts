/**
 * PURPOSE: Define reusable shared TypeScript contracts spanning schema JSON payloads and calculation IO.
 * CONNECTIONS: Imported by calc, validation, errors, and schema modules; re-exported via src/lib/shared/index.ts.
 * LAYER: Shared Types
 * SSOT REFERENCES: Part 24.2, Part 24.10, Part 24.15, Part 24.16, Part 26
 * CONSTRAINTS ENFORCED: Avoid duplicate ad hoc JSON shapes and loose calculation payloads.
 */
import type {
  AttributeType,
  KpiAggregationMethod,
  KpiFrequency,
  KpiMetricType,
  KpiState,
  KpiStatus,
  ObjectiveCategory,
  ObjectiveState,
  PmsPeriodType,
  ReviewSentiment,
  UserRole
} from "../../server/core/constants.js";

export interface BandDefinition {
  min: number;
  max: number | null;
  label: string;
}

export interface KpiStatusBandDefinition extends BandDefinition {
  color: string;
}

export interface KpiStatusBands {
  at_risk: KpiStatusBandDefinition;
  off_track: KpiStatusBandDefinition;
  on_track: KpiStatusBandDefinition;
  achieved: KpiStatusBandDefinition;
}

export type PmsRatingBands = BandDefinition[];

export interface SnapshotObjectiveData {
  objective_id: string;
  title: string;
  type: ObjectiveCategory;
  weightage: number;
  objective_percent: number | null;
}

export interface SnapshotOemByMonth {
  month: number;
  oem: number | null;
}

export interface PmsSnapshotJson {
  employee_id: string;
  period_type: PmsPeriodType;
  fiscal_year: number;
  period: string;
  objective_data: SnapshotObjectiveData[];
  oem_by_month: SnapshotOemByMonth[];
  oeq?: number | null;
  oeh?: number | null;
  oea?: number | null;
  pms_score: number | null;
  pms_rating: string | null;
  captured_at: string;
}

export interface SubmittedReviewJson {
  rating: ReviewSentiment;
  comment: string;
  submitted_by: string;
  submitted_at: string;
}

export interface ImportValidationError {
  row: number;
  sheet: string;
  field: string;
  message: string;
}

export interface SystemEventMetadata {
  [key: string]: unknown;
}

export interface CycleScoreInput {
  metricType: KpiMetricType;
  standard: number;
  target: number;
  actual: number;
}

export interface CycleScoreResult {
  percent: number;
}

export interface CumulativeCycleDisplayInput {
  target: number;
  cycleActuals: Array<number | null>;
}

export interface MonthlyKpiCycleInput {
  actualValue: number | null;
  cyclePercent?: number | null;
}

export interface MonthlyKpiComputationInput {
  metricType: KpiMetricType;
  targetType: "FIXED" | "CUSTOM";
  standard: number;
  target: number;
  aggregationMethod: KpiAggregationMethod;
  cycles: MonthlyKpiCycleInput[];
}

export interface WeightedPercentInput {
  weightage: number;
  percent: number | null;
}

export interface ObjectiveRollupInput {
  directKpis: WeightedPercentInput[];
  mappedChildren?: WeightedPercentInput[];
}

export interface MonthlyObjectiveInput extends WeightedPercentInput {
  deletedAt?: string | null;
}

export interface ForceClosedMonthInput {
  month: number;
  oem: number | null;
  forceClosed: boolean;
}

export interface HallOfFameQuarter {
  months: ForceClosedMonthInput[];
}

export interface HallOfFameEmployee {
  employeeId: string;
  userId: string;
  dateOfJoining: string | null;
  quarters: HallOfFameQuarter[];
  kpiStatusesByMonth: KpiStatus[];
  annualScore: number | null;
  totalSubmissions: number;
  rejections: number;
  validMonthsInAnnualScore: number;
}

export interface ConsistentPerformer {
  employeeId: string;
  avgOem: number;
  onTrackRate: number;
}

export interface AnnualPerformer {
  employeeId: string;
  oea: number;
  rejectionRate: number;
}

export interface HallOfFameResult {
  mostConsistentPerformers: ConsistentPerformer[];
  topAnnualPerformers: AnnualPerformer[];
}

export interface TransitionValidationResult<S extends string> {
  allowed: boolean;
  toState?: S;
}

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface UserSummaryJson {
  id: string;
  role: UserRole;
  executive_label: boolean;
}

export interface ObjectiveSummaryJson {
  id: string;
  state: ObjectiveState;
  category: ObjectiveCategory;
}

export interface KpiSummaryJson {
  id: string;
  state: KpiState;
  metric_type: KpiMetricType;
  frequency: KpiFrequency;
}

export interface AttributeReferenceJson {
  attribute_type: AttributeType;
  attribute_value: string;
}
