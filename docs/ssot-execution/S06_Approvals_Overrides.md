# SLICE S06 - Approvals & Overrides

## 1. What This Slice Delivers

This slice delivers manager approval, manager rejection, admin override approval, admin override rejection, and the cycle transition rules from `SUBMITTED` to terminal approval outcomes prior to force close or PMS lock.

This slice does not deliver force close, PMS review, or executive summary behavior.

## 2. Depends On

Depends on `S00` through `S05`.

## 3. Invariants

I1. Every repository query that touches organisation-owned data must scope by `organisation_id = ORG_ID_CONSTANT`.

I2. Every state-changing workflow executes inside a single database transaction.

I3. Every mutable table uses optimistic locking through a `version` integer.

I4. Idempotency applies only to `POST`, `PATCH`, and `DELETE`.

I5. A user with `executive_label = true` is read-only.

I6. Permission checks are enforced in the Service layer.

## 4. Data Model

No new tables beyond the operational use of `kpi_cycles` and `kpi_submissions`.

## 5. State Machine

| Current State | Trigger | New State | Actor | Blocked If | Error Code |
|---|---|---|---|---|---|
| SUBMITTED | approve | APPROVED | MANAGER | not direct report | UNAUTHORIZED_APPROVAL_ATTEMPT |
| SUBMITTED | reject | REJECTED | MANAGER | not direct report | UNAUTHORIZED_APPROVAL_ATTEMPT |
| SUBMITTED | approve override | APPROVED | ADMIN | actor has executive_label=true | BOD_WRITE_FORBIDDEN |
| SUBMITTED | reject override | REJECTED | ADMIN | actor has executive_label=true | BOD_WRITE_FORBIDDEN |

All other transitions in this slice -> `409 INVALID_STATE_TRANSITION`.

## 6. Business Rules

1. Only submitted cycles may be approved or rejected.
2. Managers may act only on direct-report employee cycles.
3. Admin may override approval or rejection for any submitted cycle.
4. Approval or rejection appends an immutable `kpi_submissions` history row.
5. Approval does not permit later employee edit in this slice.

## 7. Permission Matrix

| Action | ADMIN | MANAGER | EMPLOYEE | BoD Admin |
|---|---|---|---|---|
| Approve submitted cycle | ✓ override | direct reports only | ✗ | ✗ |
| Reject submitted cycle | ✓ override | direct reports only | ✗ | ✗ |
| Read approval queue | ✓ | direct reports only | ✗ | ✓ read-only |

## 8. API Contracts

- `GET /api/v1/approvals/queue`
- `POST /api/v1/kpi-cycles/:id/approve`
- `POST /api/v1/kpi-cycles/:id/reject`

Reject payload:

```ts
{
  reason: string;
  version: number;
}
```

Approve payload:

```ts
{
  version: number;
}
```

## 9. Implementation - Repository Layer

Repositories own:

- approval queue list
- cycle state update with version check
- history append

## 10. Implementation - Service Layer

Services enforce:

- direct-report authorization
- admin override allowance
- exact transition validation
- append-only history
- optional notification trigger handoff to `S14`

## 11. Implementation - Route Layer

Routes validate minimal payloads and call approval service only.

## 12. Implementation - UI

- approval queue for managers/admin
- approve and reject actions
- reject reason inline validation
- loading state per row action

## 13. Verification Checklist

1. Manager approves direct-report cycle | `200 OK`, state `APPROVED`.
2. Manager approves non-direct-report cycle | `403 UNAUTHORIZED_APPROVAL_ATTEMPT`.
3. Admin override approve | `200 OK`.
4. BoD Admin approval attempt | `403 BOD_WRITE_FORBIDDEN`.
5. Reject non-submitted cycle | `409 INVALID_STATE_TRANSITION`.

## 14. Done When

This slice is complete when every approval decision is deterministic, permission-safe, and visible through immutable submission history.
