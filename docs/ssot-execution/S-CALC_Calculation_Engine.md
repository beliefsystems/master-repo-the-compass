# SLICE S-CALC - Calculation Engine

## 1. What This Slice Delivers

This slice delivers the pure calculation engine used by later business slices. It defines metric validation helpers, KPI percentage rules, cumulative accumulation behavior, aggregate scoring helpers, KPI status derivation, PMS rating derivation, and weightage auto-split logic. All outputs are deterministic, side-effect free, and implementation-ready for Layer 5.

This slice does not create database tables, routes, repository behavior, workflow orchestration, session behavior, or business entity state transitions.

## 2. Depends On

Depends on `S00` for architecture rules only. This slice owns no runtime data dependency on any business slice.

## 3. Invariants

Copy these invariants into any implementation prompt for S-CALC work:

I1. Layer 5 utils are pure functions only. They do not query the database, mutate external state, or perform side effects.

I2. `NULL` and `0` are never treated as the same value. `NULL` means no data. `0` means explicit zero.

I3. Weightage totals must equal exactly `100.00` before save or commit.

I4. The approved metric vocabulary is `base`, optional `standard`, and `target` only.

I5. Calculation helpers return deterministic results from input only. No hidden configuration lookup is allowed inside a formula helper.

## 4. Data Model

Not applicable in this slice.

This slice defines TypeScript contracts rather than table ownership.

### 4.1 Metric Contracts

```ts
export type MetricType = 'INCREASE' | 'DECREASE' | 'CONTROL' | 'CUMULATIVE';

export type AggregationMethod = 'SUM' | 'AVERAGE';

export interface MetricDefinition {
  metricType: MetricType;
  base: number;
  standard?: number | null;
  target: number;
  aggregationMethod?: AggregationMethod;
}

export interface MetricCalculationInput extends MetricDefinition {
  actual: number | null;
}

export interface CumulativeInput extends MetricDefinition {
  actuals: Array<number | null>;
}

export interface CalculationResult {
  percent: number | null;
  status: 'NO_DATA' | 'BELOW_STANDARD' | 'IN_RANGE' | 'OUT_OF_RANGE' | 'SCORED';
}
```

## 5. State Machine

Not applicable in this slice.

## 6. Business Rules

### 6.1 Global Numeric Rules

1. Calculation helpers accept numeric input only after prior schema validation.
2. `NULL` means no data and may produce `null` outputs where defined.
3. `0` is an explicit numeric value and must be included in formula logic.
4. All percentage outputs are decimal numbers, not strings.
5. Unless a rule below says otherwise, overshoot above `100` is allowed and not capped.
6. Negative actual values are not allowed for `CUMULATIVE`.
7. Rounding for returned percentages is to 2 decimal places using standard half-up rounding.

### 6.2 Validation Rules by Metric Type

#### INCREASE

1. `base < target` is mandatory.
2. If `standard` is present, it must satisfy `base < standard < target`.
3. If `actual` is `NULL`, result percent is `null`.
4. If `standard` exists and `actual < standard`, result percent is `0`.
5. If `standard` is absent and `actual <= base`, result percent is `0`.
6. If scoring is active, percent is `((actual - base) / (target - base)) * 100`.

#### DECREASE

1. `base > target` is mandatory.
2. If `standard` is present, it must satisfy `base > standard > target`.
3. If `actual` is `NULL`, result percent is `null`.
4. If `standard` exists and `actual > standard`, result percent is `0`.
5. If `standard` is absent and `actual >= base`, result percent is `0`.
6. If scoring is active, percent is `((base - actual) / (base - target)) * 100`.

#### CONTROL

1. `base` and `target` define the outer allowed band.
2. `base` and `target` must not be equal.
3. CONTROL scoring is binary only.
4. Without `standard`, any `actual` inside the closed interval `[min(base, target), max(base, target)]` returns `100`, and any value outside returns `0`.
5. With `standard`, the standard-qualified band is centered inside the outer band:
   - let `low = min(base, target)`
   - let `high = max(base, target)`
   - let `standard` be a non-negative tightening distance
   - valid only when `standard < (high - low) / 2`
   - qualifying band becomes `[low + standard, high - standard]`
   - inside qualifying band returns `100`
   - outside qualifying band returns `0`
6. If `actual` is `NULL`, result percent is `null`.

#### CUMULATIVE

1. `base < target` is mandatory.
2. If `standard` is present, it must satisfy `base < standard < target`.
3. `actuals` is an ordered list of cycle increments within one accumulation window.
4. `NULL` entries are ignored in the running total but preserved as no-data cycles.
5. Negative increments are not allowed.
6. Running total is the sum of all non-null increments in the current accumulation window.
7. If all entries are `NULL`, result percent is `null`.
8. If `standard` exists and `runningTotal < standard`, result percent is `0`.
9. If `standard` is absent and `runningTotal <= base`, result percent is `0`.
10. If scoring is active, percent is `((runningTotal - base) / (target - base)) * 100`.
11. Overshoot above target is allowed and not capped.
12. Partial cycles contribute their submitted increment normally.
13. Running total resets at the end of the KPI's defined accumulation window. In V1, the default accumulation window is one month unless a later slice explicitly defines a different window.

### 6.3 Aggregate Rules

1. Monthly KPI percent for non-cumulative metrics is derived from the applicable actual or aggregated actual defined by the owning slice.
2. Objective score is the weighted sum of valid KPI percentages divided by 100.
3. KPI rows with `null` percentage do not contribute weighted value and do not count as zero.
4. If all KPI percentages in an objective are `null`, objective score is `null`.
5. Employee aggregate scores use the same null-preserving principle: all-null children produce `null`.

### 6.4 KPI Status Derivation

The calculation engine defines a pure status helper:

```ts
export interface StatusBand {
  min: number;
  max: number | null;
  label: string;
}

export function deriveKpiStatus(
  percent: number | null,
  bands: StatusBand[]
): string;
```

Rules:

1. `null` percentage returns `NO_DATA`.
2. Otherwise, the first matching band by inclusive range wins.
3. `max = null` means no upper bound.

### 6.5 PMS Rating Derivation

```ts
export interface RatingBand {
  min: number;
  max: number | null;
  label: string;
}

export function derivePmsRating(
  score: number | null,
  bands: RatingBand[]
): string | null;
```

Rules:

1. `null` score returns `null`.
2. Otherwise, the first matching band by inclusive range wins.

### 6.6 Auto-Split

```ts
export function autoSplitWeightage(count: number): number[];
```

Rules:

1. `count` must be a positive integer.
2. Base weight is `floor((100 / count) * 100) / 100`.
3. Every slot starts with the base weight.
4. The final slot receives the remainder so that the total equals exactly `100.00`.
5. Result precision is always 2 decimals.

## 7. Permission Matrix

Not applicable in this slice.

## 8. API Contracts

Not applicable in this slice.

This slice may be imported by later service or route layers but does not expose HTTP endpoints by itself.

## 9. Implementation - Repository Layer

Not applicable in this slice.

No repository code is permitted in S-CALC.

## 10. Implementation - Service Layer

Services must consume the calculation engine, not re-implement formulas.

### 10.1 Example Utility Surface

```ts
export function validateMetricDefinition(definition: MetricDefinition): void;

export function calculateMetricPercent(
  input: MetricCalculationInput
): CalculationResult;

export function calculateCumulativePercent(
  input: CumulativeInput
): CalculationResult & { runningTotal: number | null };

export function calculateWeightedScore(
  items: Array<{ percent: number | null; weightage: number }>
): number | null;

export function deriveKpiStatus(
  percent: number | null,
  bands: StatusBand[]
): string;

export function derivePmsRating(
  score: number | null,
  bands: RatingBand[]
): string | null;

export function autoSplitWeightage(count: number): number[];
```

### 10.2 Service Consumption Rules

1. Services call these helpers and treat them as the only formula authority.
2. Services must not silently patch invalid metric definitions. Invalid definitions fail fast.
3. Services must not reinterpret `null` output as `0`.

## 11. Implementation - Route Layer

Not applicable in this slice.

Later slices that expose calculation-driven APIs must validate request input and then delegate calculation semantics to Layer 5 helpers.

## 12. Implementation - UI

This slice has no standalone UI, but it imposes UI-facing behavior expectations on later slices:

1. UI must display `null`-driven no-data states distinctly from numeric zero.
2. UI must not clamp overshoot locally if the backend returns percent above `100`.
3. UI labels must use the names `base`, `standard`, and `target`.
4. Any form that captures cumulative increments must prevent negative values inline and also rely on backend validation.

## 13. Verification Checklist

1. Validate INCREASE with `base >= target` | validation fails.
2. Validate INCREASE with `standard <= base` or `standard >= target` | validation fails.
3. INCREASE with `actual = NULL` | percent is `null`.
4. INCREASE with `standard` present and `actual < standard` | percent is `0`.
5. INCREASE with `actual > target` | percent is greater than `100` and not capped.
6. Validate DECREASE with `base <= target` | validation fails.
7. DECREASE with `standard` present and `actual > standard` | percent is `0`.
8. DECREASE with `actual < target` | percent is greater than `100` and not capped.
9. CONTROL without `standard`, actual inside outer band | percent is `100`.
10. CONTROL without `standard`, actual outside outer band | percent is `0`.
11. CONTROL with standard tightening distance too large | validation fails.
12. CONTROL with `standard` present and actual inside qualifying band | percent is `100`.
13. CONTROL with `standard` present and actual outside qualifying band | percent is `0`.
14. CUMULATIVE with all `NULL` increments | percent is `null`, running total is `null`.
15. CUMULATIVE with negative increment | validation fails.
16. CUMULATIVE with running total below standard | percent is `0`.
17. CUMULATIVE with running total above target | percent is greater than `100` and not capped.
18. Weighted score with one `null` KPI and one numeric KPI | only numeric KPI contributes.
19. Weighted score with all `null` KPIs | result is `null`.
20. Auto-split with `count = 3` | result totals exactly `100.00`.
21. Auto-split with `count = 7` | result totals exactly `100.00`.
22. KPI status derivation with `percent = null` | returns `NO_DATA`.
23. PMS rating derivation with `score = null` | returns `null`.

## 14. Done When

This slice is complete when every verification item above passes, the utility surface is deterministic and side-effect free, and `npx tsc --noEmit` returns zero errors in the implementation that consumes this spec.
