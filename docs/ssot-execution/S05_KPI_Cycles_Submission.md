# SLICE S05 - KPI Cycles & Submission

## 1. What This Slice Delivers

This slice delivers cycle-level actual entry, submission, resubmission, rejection-ready re-entry behavior, append-only submission history, and cycle-level achievement calculation. It is the first execution slice where employees provide measurable data.

This slice does not deliver manager approval decisions, force close, PMS review locking, or executive summary views.

## 2. Depends On

Depends on `S00` through `S04` and `S-CALC`.

## 3. Invariants

I1. Every repository query that touches organisation-owned data must scope by `organisation_id = ORG_ID_CONSTANT`.

I2. Every state-changing workflow executes inside a single database transaction.

I3. `NULL` and `0` are never treated as the same value.

I4. Calculation helpers in `S-CALC` are the only formula authority.

I5. Idempotency applies only to `POST`, `PATCH`, and `DELETE`.

I6. A user with `executive_label = true` is read-only.

## 4. Data Model

```ts
export const kpiSubmissionStateEnum = pgEnum('kpi_submission_state', [
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'CANCELLED_BY_SYSTEM',
  'LOCKED'
]);

export const kpiSubmissions = pgTable('kpi_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id').notNull().references(() => organisation.id),
  kpiCycleId: uuid('kpi_cycle_id').notNull().references(() => kpiCycles.id),
  actorUserId: uuid('actor_user_id').notNull().references(() => users.id),
  state: kpiSubmissionStateEnum('state').notNull(),
  actualValue: numeric('actual_value', { precision: 12, scale: 2 }),
  achievementPercent: numeric('achievement_percent', { precision: 8, scale: 2 }),
  comment: text('comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});
```

## 5. State Machine

| Current State | Trigger | New State | Actor | Blocked If | Error Code |
|---|---|---|---|---|---|
| DRAFT | submit actual | SUBMITTED | EMPLOYEE | submission count already 3 | MAX_SUBMISSIONS_EXCEEDED |
| REJECTED | resubmit actual | SUBMITTED | EMPLOYEE | submission count already 3 | MAX_SUBMISSIONS_EXCEEDED |
| DRAFT | save draft actual | DRAFT | EMPLOYEE | version mismatch | CONCURRENT_MODIFICATION |
| SUBMITTED | manager action later | SUBMITTED | SYSTEM | none | none |

All other state changes in this slice -> `409 INVALID_STATE_TRANSITION`.

## 6. Business Rules

1. Employees submit actuals only for their own cycles.
2. `actual_value = NULL` means no data and may still be stored in draft context when allowed.
3. `actual_value = 0` is a valid explicit numeric value.
4. A cycle may be submitted at most 3 times. The 4th submit attempt returns `409 MAX_SUBMISSIONS_EXCEEDED`.
5. Each successful submit appends one immutable row to `kpi_submissions`.
6. `achievement_percent` is recalculated from current cycle values using `S-CALC`.
7. Idempotent replay of submit returns the stored response and does not append another submission row.

## 7. Permission Matrix

| Action | ADMIN | MANAGER | EMPLOYEE | BoD Admin |
|---|---|---|---|---|
| View cycles | ✓ | direct reports only | self only | ✓ read-only |
| Save draft actual | ✗ | ✗ | self only | ✗ |
| Submit cycle | ✗ | ✗ | self only | ✗ |
| View submission history | ✓ | direct reports only | self only | ✓ read-only |

## 8. API Contracts

- `GET /api/v1/kpi-cycles?employee_id=&month=&status=`
- `PATCH /api/v1/kpi-cycles/:id/draft`
- `POST /api/v1/kpi-cycles/:id/submit`
- `GET /api/v1/kpi-cycles/:id/submissions`

Submit payload:

```ts
{
  actualValue: number | null;
  comment?: string;
  version: number;
}
```

## 9. Implementation - Repository Layer

Repositories own:

- cycle lookup by employee access path
- cycle update with version check
- submission append
- submission history list

## 10. Implementation - Service Layer

Services enforce:

- self-only employee submission
- submission count ceiling
- `S-CALC` percent derivation
- append-only history
- idempotent response reuse

## 11. Implementation - Route Layer

Routes validate payloads and never update cycle state directly through SQL.

## 12. Implementation - UI

- employee submission table
- explicit no-data vs zero display
- loading state during submit
- inline validation errors
- submission history drawer or panel

## 13. Verification Checklist

1. Submit cycle with `actualValue = 0` | accepted and included in calculation.
2. Submit cycle with `actualValue = NULL` where allowed | handled distinctly from zero.
3. Fourth submit attempt | `409 MAX_SUBMISSIONS_EXCEEDED`.
4. Replay submit with same `Idempotency-Key` | no duplicate submission row.
5. Employee submits another employee's cycle | `403 PERMISSION_DENIED`.

## 14. Done When

This slice is complete when cycle submission and submission history are deterministic and approval can consume the submitted state without recomputing intent.
