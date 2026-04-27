# SLICE S12 - Bulk Operations

## 1. What This Slice Delivers

This slice delivers bulk create/update/delete-style operations that apply to supported entities in V1, such as bulk user deactivation, bulk role change, bulk objective duplication, and similar bounded operations with explicit partial-success or all-or-nothing rules.

This slice does not redefine single-entity business rules; it orchestrates them in batch form.

## 2. Depends On

Depends on `S00` through `S04`.

## 3. Invariants

I1. Every repository query that touches organisation-owned data must scope by `organisation_id = ORG_ID_CONSTANT`.

I2. Idempotency applies only to `POST`, `PATCH`, and `DELETE`.

I3. Permission checks are enforced in the Service layer.

I4. A user with `executive_label = true` is read-only.

## 4. Data Model

No new tables required. Batch operations reuse owned tables from prior slices.

## 5. State Machine

Not applicable in this slice.

## 6. Business Rules

1. Each bulk endpoint must state whether it is atomic or partial-success.
2. If partial-success is allowed, the response must list successes and failures separately.
3. If atomic, any failure aborts the whole batch.
4. Batch size limits must be explicit per endpoint.

## 7. Permission Matrix

| Action | ADMIN | MANAGER | EMPLOYEE | BoD Admin |
|---|---|---|---|---|
| Bulk user deactivation | ✓ | ✗ | ✗ | ✗ |
| Bulk role change | ✓ | ✗ | ✗ | ✗ |
| Bulk objective duplication | ✓ | direct reports only | ✗ | ✗ |

## 8. API Contracts

Examples:

- `POST /api/v1/users/bulk/deactivate`
- `POST /api/v1/users/bulk/role-change`
- `POST /api/v1/objectives/bulk/duplicate`

Each payload contains an array of ids and any required target fields.

## 9. Implementation - Repository Layer

Repositories expose bulk-safe data operations or single-row helpers called repeatedly inside service-controlled loops.

## 10. Implementation - Service Layer

Services define:

- atomic vs partial-success semantics
- per-item validation
- result aggregation
- audit logging

## 11. Implementation - Route Layer

Routes validate batch size and payload shape.

## 12. Implementation - UI

- bulk action selection UI
- progress feedback
- explicit result summary showing success and failure rows
- destructive confirmation text:

`Are you sure you want to apply this bulk action? Some changes may affect multiple records immediately.`

## 13. Verification Checklist

1. Bulk deactivate valid users | success set returned.
2. Bulk action with mixed valid/invalid ids on partial-success endpoint | both `updated` and `failed` arrays returned.
3. Bulk action as BoD Admin | `403 BOD_WRITE_FORBIDDEN`.

## 14. Done When

This slice is complete when batch operations reuse single-entity rules safely and return deterministic outcome summaries.
