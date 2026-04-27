# SLICE S07 - Month Force Close

## 1. What This Slice Delivers

This slice delivers the admin-only force close of a month for an employee or broader scope, including transition rules for draft, submitted, rejected, and approved cycle states and the downstream impact on later aggregate calculations.

This slice does not deliver PMS reviews or alter already locked cycles.

## 2. Depends On

Depends on `S00` through `S06` and `S-CALC`.

## 3. Invariants

I1. Every repository query that touches organisation-owned data must scope by `organisation_id = ORG_ID_CONSTANT`.

I2. Every state-changing workflow executes inside a single database transaction.

I3. `NULL` and `0` are never treated as the same value.

I4. A user with `executive_label = true` is read-only.

## 4. Data Model

Operational use of:

- `kpi_cycles.forceClosed`
- `kpi_cycles.state`
- `kpi_cycles.actualValue`
- `system_events`

No new tables.

## 5. State Machine

| Current State | Trigger | New State | Actor | Blocked If | Error Code |
|---|---|---|---|---|---|
| DRAFT | force close | DRAFT | ADMIN | actor has executive_label=true | BOD_WRITE_FORBIDDEN |
| SUBMITTED | force close | CANCELLED_BY_SYSTEM | ADMIN | actor has executive_label=true | BOD_WRITE_FORBIDDEN |
| REJECTED | force close | CANCELLED_BY_SYSTEM | ADMIN | actor has executive_label=true | BOD_WRITE_FORBIDDEN |
| APPROVED | force close | APPROVED | ADMIN | none | none |
| LOCKED | force close | LOCKED | ADMIN | none | none |

## 6. Business Rules

1. Force close requires a reason.
2. Force close sets `forceClosed = true` on all targeted cycles in scope.
3. DRAFT cycles remain `DRAFT` with `actualValue = NULL`.
4. SUBMITTED and REJECTED cycles move to `CANCELLED_BY_SYSTEM`.
5. APPROVED and LOCKED cycles remain unchanged.
6. Force-closed months remain part of denominator logic in later aggregate calculations.

## 7. Permission Matrix

| Action | ADMIN | MANAGER | EMPLOYEE | BoD Admin |
|---|---|---|---|---|
| Force close month | ✓ | ✗ | ✗ | ✗ |
| Read force-close history | ✓ | ✓ direct reports only | self only | ✓ read-only |

## 8. API Contracts

- `POST /api/v1/force-close`

```ts
{
  employeeId: string;
  month: number;
  fiscalYear: number;
  reason: string;
}
```

Errors:

- `400 MISSING_REASON`
- `403 PERMISSION_DENIED`
- `403 BOD_WRITE_FORBIDDEN`

## 9. Implementation - Repository Layer

Repositories find the targeted cycles and persist force-close updates in bulk within one transaction.

## 10. Implementation - Service Layer

Services enforce:

- admin-only access
- required reason
- state-specific outcome rules
- audit event creation

## 11. Implementation - Route Layer

One POST route with inline Zod validation.

## 12. Implementation - UI

- admin force-close action
- exact confirmation text:

`Are you sure you want to force close this month? This action cannot be undone for cancelled submissions.`

- reason text area
- inline validation

## 13. Verification Checklist

1. Force close without reason | `400 MISSING_REASON`.
2. Force close submitted cycle | cycle becomes `CANCELLED_BY_SYSTEM`.
3. Force close rejected cycle | cycle becomes `CANCELLED_BY_SYSTEM`.
4. Force close approved cycle | cycle remains `APPROVED`.
5. Force close as BoD Admin | `403 BOD_WRITE_FORBIDDEN`.

## 14. Done When

This slice is complete when month-close behavior is deterministic and later score calculations can rely on the stored `forceClosed` semantics.
