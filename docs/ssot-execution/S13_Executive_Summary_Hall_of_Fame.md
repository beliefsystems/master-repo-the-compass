# SLICE S13 - Executive Summary & Hall of Fame

## 1. What This Slice Delivers

This slice delivers the read-only executive summary surface, hall-of-fame rankings, and organization-level performance overview views built from completed underlying score and review data.

This slice does not deliver PDF export.

## 2. Depends On

Depends on `S00` through `S10` and `S-CALC`.

## 3. Invariants

I1. Every repository query that touches organisation-owned data must scope by `organisation_id = ORG_ID_CONSTANT`.

I2. Derived values are read models, not source of truth.

I3. A user with `executive_label = true` is read-only.

## 4. Data Model

No new tables. This slice composes from scores, reviews, employees, and organisation config.

## 5. State Machine

Not applicable in this slice.

## 6. Business Rules

1. Executive Summary is read-only in V1.
2. Hall of Fame rankings are derived from stored and recalculated performance outcomes.
3. Ties must use a deterministic secondary sort, such as employee name or consistent id ordering.
4. PDF export remains excluded.

## 7. Permission Matrix

| Action | ADMIN | MANAGER | EMPLOYEE | BoD Admin |
|---|---|---|---|---|
| Read executive summary | ✓ | ✗ | ✗ | ✓ |
| Read hall of fame | ✓ | ✗ | ✗ | ✓ |

## 8. API Contracts

- `GET /api/v1/executive-summary?period_type=&fiscal_year=&period=`
- `GET /api/v1/hall-of-fame?fiscal_year=`

## 9. Implementation - Repository Layer

Repositories gather aggregated source data efficiently and paginate where needed.

## 10. Implementation - Service Layer

Services build:

- executive summary cards
- ranking lists
- deterministic tie-break rules

## 11. Implementation - Route Layer

Read-only routes with strict role checks.

## 12. Implementation - UI

- executive summary dashboard
- hall-of-fame ranked tables
- read-only presentation

## 13. Verification Checklist

1. Employee requests executive summary | `403 PERMISSION_DENIED`.
2. BoD Admin requests executive summary | `200 OK`.
3. Ranking tie input | deterministic order returned.
4. PDF export request path absent | not implemented.

## 14. Done When

This slice is complete when executive stakeholders can consume read-only summary and ranking views without introducing writable side effects.
