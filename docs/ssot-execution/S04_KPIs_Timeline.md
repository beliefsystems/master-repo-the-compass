# SLICE S04 - KPIs & Timeline

## 1. What This Slice Delivers

This slice delivers KPI definition management, KPI validation using the new `base` / optional `standard` / `target` vocabulary, KPI timeline setup, and cycle generation rules. It defines the feature boundary where objectives gain measurable KPIs and where execution windows are created.

This slice does not deliver actual cycle submission, approval, force close, or derived scoring views.

## 2. Depends On

Depends on `S00`, `S01`, `S02`, `S03`, and `S-CALC`.

## 3. Invariants

I1. Every repository query that touches organisation-owned data must scope by `organisation_id = ORG_ID_CONSTANT`.

I2. Every state-changing workflow executes inside a single database transaction.

I3. `NULL` and `0` are never treated as the same value.

I4. Weightage totals must equal exactly `100.00` before save.

I5. Calculation helpers in `S-CALC` are the only formula authority.

I6. A user with `executive_label = true` is read-only.

## 4. Data Model

```ts
export const metricTypeEnum = pgEnum('metric_type', ['INCREASE', 'DECREASE', 'CONTROL', 'CUMULATIVE']);
export const targetTypeEnum = pgEnum('target_type', ['FIXED', 'CUSTOM']);
export const aggregationMethodEnum = pgEnum('aggregation_method', ['SUM', 'AVERAGE']);
export const kpiStateEnum = pgEnum('kpi_state', ['DRAFT', 'ACTIVE', 'LOCKED', 'IMMUTABLE']);
export const cycleFrequencyEnum = pgEnum('cycle_frequency', ['WEEKLY', 'MONTHLY']);

export const kpis = pgTable('kpis', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id').notNull().references(() => organisation.id),
  objectiveId: uuid('objective_id').notNull().references(() => objectives.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  unit: varchar('unit', { length: 100 }),
  metricType: metricTypeEnum('metric_type').notNull(),
  targetType: targetTypeEnum('target_type').notNull(),
  aggregationMethod: aggregationMethodEnum('aggregation_method').notNull(),
  base: numeric('base', { precision: 12, scale: 2 }).notNull(),
  standard: numeric('standard', { precision: 12, scale: 2 }),
  target: numeric('target', { precision: 12, scale: 2 }).notNull(),
  weightage: numeric('weightage', { precision: 5, scale: 2 }).notNull(),
  frequency: cycleFrequencyEnum('frequency').notNull(),
  state: kpiStateEnum('state').notNull().default('DRAFT'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  version: integer('version').notNull().default(1)
});

export const kpiCycles = pgTable('kpi_cycles', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id').notNull().references(() => organisation.id),
  kpiId: uuid('kpi_id').notNull().references(() => kpis.id),
  cycleNumber: integer('cycle_number').notNull(),
  cycleStartDate: date('cycle_start_date').notNull(),
  cycleEndDate: date('cycle_end_date').notNull(),
  cycleTarget: numeric('cycle_target', { precision: 12, scale: 2 }),
  baseValue: numeric('base_value', { precision: 12, scale: 2 }).notNull(),
  standardValue: numeric('standard_value', { precision: 12, scale: 2 }),
  targetValue: numeric('target_value', { precision: 12, scale: 2 }).notNull(),
  actualValue: numeric('actual_value', { precision: 12, scale: 2 }),
  achievementPercent: numeric('achievement_percent', { precision: 8, scale: 2 }),
  state: pgEnum('kpi_cycle_state', ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED_BY_SYSTEM', 'LOCKED'])('state').notNull().default('DRAFT'),
  submissionCount: integer('submission_count').notNull().default(0),
  forceClosed: boolean('force_closed').notNull().default(false),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  version: integer('version').notNull().default(1)
});
```

## 5. State Machine

### KPI

| Current State | Trigger | New State | Actor | Blocked If | Error Code |
|---|---|---|---|---|---|
| DRAFT | activate by saving valid timeline | ACTIVE | ADMIN or direct MANAGER | invalid metric definition | VALIDATION_FAILED |
| ACTIVE | change immutable metric fields after first submission | ACTIVE | ADMIN or direct MANAGER | execution exists | IMMUTABILITY_VIOLATION |
| ACTIVE | PMS lock later | LOCKED | SYSTEM | none | none |
| LOCKED | PMS close later | IMMUTABLE | SYSTEM | none | none |

## 6. Business Rules

1. KPI weightages under one objective must total exactly `100.00`.
2. Metric definitions are validated by `S-CALC` rules, not redefined here.
3. `CUMULATIVE` may use optional `standard` as an activation threshold.
4. Timeline generation may not cross months in V1.
5. Timeline duration must be at least 7 days.
6. Weekly timelines generate non-overlapping weekly cycles and may end with a shorter final cycle.
7. Monthly timelines generate one cycle covering the full valid range.
8. If no execution has been submitted yet, DRAFT cycles may be deleted and regenerated when a timeline changes.
9. Once any cycle has been submitted, timeline redefinition is blocked with `409 TIMELINE_LOCKED`.

## 7. Permission Matrix

| Action | ADMIN | MANAGER | EMPLOYEE | BoD Admin |
|---|---|---|---|---|
| List KPIs | ✓ | direct reports only | self only | ✓ read-only |
| Create KPI | ✓ | direct reports only | ✗ | ✗ |
| Update KPI | ✓ | direct reports only | ✗ | ✗ |
| Delete KPI | ✓ | ✗ | ✗ | ✗ |
| Define timeline | ✓ | direct reports only | ✗ | ✗ |

## 8. API Contracts

- `GET /api/v1/kpis?objective_id=`
- `POST /api/v1/kpis`
- `PATCH /api/v1/kpis/:id`
- `DELETE /api/v1/kpis/:id`
- `POST /api/v1/kpis/:id/timeline`
- `GET /api/v1/kpis/:id/cycles`

Create/update payload includes:

```ts
{
  title: string;
  description?: string;
  unit?: string;
  metricType: 'INCREASE' | 'DECREASE' | 'CONTROL' | 'CUMULATIVE';
  targetType: 'FIXED' | 'CUSTOM';
  aggregationMethod: 'SUM' | 'AVERAGE';
  base: number;
  standard?: number | null;
  target: number;
  weightage: number;
  frequency: 'WEEKLY' | 'MONTHLY';
  version?: number;
}
```

## 9. Implementation - Repository Layer

Repositories own:

- KPI CRUD
- KPI list by objective
- KPI weightage aggregation
- cycle generation inserts and DRAFT-cycle replacement
- timeline existence checks

## 10. Implementation - Service Layer

Services enforce:

- direct-report scoping
- exact KPI weightage total
- metric validation via `validateMetricDefinition`
- timeline rules and lock rules
- transactionally replacing DRAFT cycles during allowed regeneration

## 11. Implementation - Route Layer

Routes validate payloads, call the KPI service, and never compute timeline or formulas themselves.

## 12. Implementation - UI

- KPI definition form using `base`, `standard`, `target`
- timeline setup form
- inline validation for metric rules
- read-only display for locked/immutable KPIs

## 13. Verification Checklist

1. Create KPI with invalid INCREASE rule | `400 VALIDATION_FAILED`.
2. Create CONTROL KPI with invalid tightening value | `400 VALIDATION_FAILED`.
3. Save KPI weightage totals not equal to `100.00` | `400 WEIGHTAGE_SUM_INVALID`.
4. Generate weekly timeline across months | `400 TIMELINE_CROSS_MONTH`.
5. Redefine timeline after first submission exists | `409 TIMELINE_LOCKED`.

## 14. Done When

This slice is complete when KPIs and timelines are deterministic and later execution slices can consume generated cycles without reinterpreting KPI definitions.
