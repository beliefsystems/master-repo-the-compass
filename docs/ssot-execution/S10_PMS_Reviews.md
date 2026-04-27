# SLICE S10 - PMS Reviews

## 1. What This Slice Delivers

This slice delivers PMS review initiation, immutable snapshot creation, manager and admin review stages, and final closure behavior that locks downstream performance artifacts.

This slice does not deliver PDF export or a custom audit UI beyond the review records themselves.

## 2. Depends On

Depends on `S00` through `S09` and `S-CALC`.

## 3. Invariants

I1. Every repository query that touches organisation-owned data must scope by `organisation_id = ORG_ID_CONSTANT`.

I2. Every state-changing workflow executes inside a single database transaction.

I3. `NULL` and `0` are never treated as the same value.

I4. Snapshot data is immutable once created.

I5. A user with `executive_label = true` is read-only.

## 4. Data Model

```ts
export const pmsReviewStatusEnum = pgEnum('pms_review_status', [
  'MANAGER_REVIEW_PENDING',
  'MANAGER_SUBMITTED',
  'ADMIN_REVIEW_PENDING',
  'CLOSED'
]);

export const pmsReviews = pgTable('pms_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id').notNull().references(() => organisation.id),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  periodType: varchar('period_type', { length: 50 }).notNull(),
  fiscalYear: integer('fiscal_year').notNull(),
  period: integer('period').notNull(),
  status: pmsReviewStatusEnum('status').notNull(),
  snapshotJson: jsonb('snapshot_json').notNull(),
  managerComment: text('manager_comment'),
  adminComment: text('admin_comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  version: integer('version').notNull().default(1)
});
```

## 5. State Machine

| Current State | Trigger | New State | Actor | Blocked If | Error Code |
|---|---|---|---|---|---|
| none | initiate review | MANAGER_REVIEW_PENDING | ADMIN | eligibility fails | PRECONDITION_FAILED |
| MANAGER_REVIEW_PENDING | manager submit | MANAGER_SUBMITTED | MANAGER | not direct report | PERMISSION_DENIED |
| MANAGER_SUBMITTED | admin advance | ADMIN_REVIEW_PENDING | ADMIN | actor has executive_label=true | BOD_WRITE_FORBIDDEN |
| ADMIN_REVIEW_PENDING | close review | CLOSED | ADMIN | actor has executive_label=true | BOD_WRITE_FORBIDDEN |

All other transitions -> `409 INVALID_STATE_TRANSITION`.

## 6. Business Rules

1. A PMS review may not be initiated if the period contains DRAFT or SUBMITTED cycles.
2. `CANCELLED_BY_SYSTEM` cycles do not block initiation.
3. Snapshot JSON is captured at initiation and never updated.
4. Closing a review locks affected KPI cycles and later pushes KPI state to immutable behavior.

## 7. Permission Matrix

| Action | ADMIN | MANAGER | EMPLOYEE | BoD Admin |
|---|---|---|---|---|
| Initiate PMS review | ✓ | ✗ | ✗ | ✗ |
| Submit manager review | ✗ | direct reports only | ✗ | ✗ |
| Close PMS review | ✓ | ✗ | ✗ | ✗ |
| Read PMS review | ✓ | direct reports only | self only | ✓ read-only |

## 8. API Contracts

- `POST /api/v1/pms-reviews/initiate`
- `POST /api/v1/pms-reviews/:id/manager-submit`
- `POST /api/v1/pms-reviews/:id/close`
- `GET /api/v1/pms-reviews/:id`

## 9. Implementation - Repository Layer

Repositories:

- create review
- update review status with version check
- load eligibility data
- persist locked states to affected cycles/KPIs

## 10. Implementation - Service Layer

Services enforce:

- eligibility gating
- immutable snapshot creation
- role-specific transition checks
- closure locking behavior

## 11. Implementation - Route Layer

Routes validate payloads and call the review service only.

## 12. Implementation - UI

- review initiation action
- manager review form
- admin close action
- read-only snapshot view

## 13. Verification Checklist

1. Initiate review with DRAFT cycle present | `412 PRECONDITION_FAILED`.
2. Initiate review with only APPROVED and CANCELLED_BY_SYSTEM cycles | success.
3. Update snapshot after initiation | blocked by contract.
4. Close review | status `CLOSED`, locked artifacts updated.

## 14. Done When

This slice is complete when PMS review artifacts are immutable and period closure can serve as a final performance record.
