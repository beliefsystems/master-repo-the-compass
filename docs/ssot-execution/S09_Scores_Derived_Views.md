# SLICE S09 - Scores & Derived Views

## 1. What This Slice Delivers

This slice delivers objective score computation, employee-period aggregate score computation, KPI status derivation, and derived read views that summarize execution state without mutating source data.

This slice does not deliver PMS review persistence or executive summary ranking.

## 2. Depends On

Depends on `S00` through `S08` and `S-CALC`.

## 3. Invariants

I1. Every repository query that touches organisation-owned data must scope by `organisation_id = ORG_ID_CONSTANT`.

I2. `NULL` and `0` are never treated as the same value.

I3. Calculation helpers in `S-CALC` are the only formula authority.

I4. Derived values are read models, not source of truth.

## 4. Data Model

No new tables. This slice composes from:

- objectives
- kpis
- kpi_cycles
- objective_mappings
- organisation_config

## 5. State Machine

Not applicable in this slice.

## 6. Business Rules

1. Derived scores are recalculated from source data on read.
2. Cached cycle `achievementPercent` may be used as a hint but must not override formula truth when re-evaluation is required.
3. Objective score is the weighted sum of valid KPI percents.
4. All-null KPI results yield objective score `null`.
5. Employee aggregate monthly score uses valid objective scores only and preserves all-null semantics.
6. Objective mappings contribute through the approved mapping rules from `S08`.

## 7. Permission Matrix

| Action | ADMIN | MANAGER | EMPLOYEE | BoD Admin |
|---|---|---|---|---|
| Read derived objective view | ✓ | direct reports only | self only | ✓ read-only |
| Read employee monthly score | ✓ | direct reports only | self only | ✓ read-only |

## 8. API Contracts

- `GET /api/v1/derived/objectives/:id`
- `GET /api/v1/derived/employees/:employeeId/monthly-score?month=&fiscal_year=`
- `GET /api/v1/derived/employees/:employeeId/status-view`

## 9. Implementation - Repository Layer

Repositories gather the required source rows efficiently, with no N+1 query pattern.

## 10. Implementation - Service Layer

Services:

- assemble read models
- invoke `calculateWeightedScore`, `deriveKpiStatus`, and related helpers
- preserve `null` semantics

## 11. Implementation - Route Layer

Read-only routes with auth and permission checks.

## 12. Implementation - UI

- derived objective score panel
- employee month summary view
- no-data state distinct from zero
- read-only badge/status presentation

## 13. Verification Checklist

1. Objective with all-null KPI results | objective score `null`.
2. Objective with one `0` KPI and one null KPI | `0` contributes, null does not.
3. Employee monthly score with force-closed month data | denominator logic behaves per later slices.
4. Manager reads non-direct-report derived view | `403 PERMISSION_DENIED`.

## 14. Done When

This slice is complete when downstream consumers can read deterministic score views without adding their own formula logic.
