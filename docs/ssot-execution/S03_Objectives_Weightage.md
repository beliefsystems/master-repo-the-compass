# SLICE S03 - Objectives & Weightage

## 1. What This Slice Delivers

This slice delivers objective creation, objective editing, objective weightage management, auto-split behavior, objective lifecycle status, and the employee-scoped objective surface for one fiscal month or period unit as defined by the product rules.

This slice does not deliver KPI definitions, timeline generation, KPI cycle submission, approvals, or derived employee-wide scoring views.

## 2. Depends On

Depends on `S00`, `S01`, `S02`, and `S-CALC`.

## 3. Invariants

I1. Every repository query that touches organisation-owned data must scope by `organisation_id = ORG_ID_CONSTANT`.

I2. Every query against a soft-deletable table must exclude rows where `deleted_at IS NOT NULL` unless the operation is an explicit restore flow.

I3. Every state-changing workflow executes inside a single database transaction.

I4. Weightage totals must equal exactly `100.00` before save.

I5. `NULL` and `0` are never treated as the same value.

I6. A user with `executive_label = true` is read-only.

## 4. Data Model

```ts
export const objectiveStatusEnum = pgEnum('objective_status', [
  'LAUNCHED',
  'ONGOING',
  'COMPLETED',
  'DELETED'
]);

export const objectives = pgTable('objectives', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id').notNull().references(() => organisation.id),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  month: integer('month').notNull(),
  fiscalYear: integer('fiscal_year').notNull(),
  weightage: numeric('weightage', { precision: 5, scale: 2 }).notNull(),
  status: objectiveStatusEnum('status').notNull().default('LAUNCHED'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  version: integer('version').notNull().default(1)
});
```

## 5. State Machine

| Current State | Trigger | New State | Actor | Blocked If | Error Code |
|---|---|---|---|---|---|
| LAUNCHED | update content | LAUNCHED | ADMIN or owning MANAGER | version mismatch | CONCURRENT_MODIFICATION |
| LAUNCHED | start execution via KPI work | ONGOING | SYSTEM | none | none |
| ONGOING | mark complete | COMPLETED | ADMIN or owning MANAGER | open execution rules fail | INVALID_STATE_TRANSITION |
| LAUNCHED/ONGOING/COMPLETED | delete | DELETED | ADMIN | execution data exists | OBJECTIVE_HAS_EXECUTION_DATA |

## 6. Business Rules

1. Objectives belong to one employee, one fiscal year, and one month.
2. Objective weightages for a given employee-month must total exactly `100.00`.
3. Auto-split uses the `S-CALC` helper and must total exactly `100.00`.
4. Objective deletion is soft delete unless later slices explicitly require hard delete for a different entity.
5. An objective with submitted or approved KPI execution data cannot be deleted.

## 7. Permission Matrix

| Action | ADMIN | MANAGER | EMPLOYEE | BoD Admin |
|---|---|---|---|---|
| List objectives | ✓ | direct reports only | self only | ✓ read-only |
| Create objective | ✓ | direct reports only | ✗ | ✗ |
| Update objective | ✓ | direct reports only | ✗ | ✗ |
| Delete objective | ✓ | ✗ | ✗ | ✗ |
| Auto-split weightages | ✓ | direct reports only | ✗ | ✗ |

## 8. API Contracts

- `GET /api/v1/objectives?employee_id=&month=&fiscal_year=`
- `POST /api/v1/objectives`
- `PATCH /api/v1/objectives/:id`
- `DELETE /api/v1/objectives/:id`
- `POST /api/v1/objectives/auto-split`

Mutation payloads must include `version` where applicable and use optional `Idempotency-Key`.

## 9. Implementation - Repository Layer

Repositories perform:

- objective list by employee-month
- objective insert
- objective update with version check
- objective soft delete
- employee-month weightage aggregation

## 10. Implementation - Service Layer

Services enforce:

- direct-report scoping for managers
- exact `100.00` total before save
- auto-split contract from `S-CALC`
- delete blocking when execution data exists

## 11. Implementation - Route Layer

Routes validate all inputs with Zod and never compute weightage math directly.

## 12. Implementation - UI

- objective list view
- objective create/edit form
- auto-split action
- inline weightage validation
- destructive confirmation text:

`Are you sure you want to delete this objective? This action cannot be used once execution data exists.`

## 13. Verification Checklist

1. Save objectives totaling `99.99` | `400 WEIGHTAGE_SUM_INVALID`.
2. Save objectives totaling `100.01` | `400 WEIGHTAGE_SUM_INVALID`.
3. Auto-split for 3 objectives | total equals `100.00`.
4. Manager edits non-direct-report objective | `403 UNAUTHORIZED_APPROVAL_ATTEMPT` or `PERMISSION_DENIED`.
5. Delete objective with execution data | `409 OBJECTIVE_HAS_EXECUTION_DATA`.

## 14. Done When

This slice is complete when objective ownership and weightage rules are deterministic and later KPI slices can safely attach KPI definitions to objectives.
