# SLICE S08 - Objective Mapping

## 1. What This Slice Delivers

This slice delivers parent-child objective mapping across employees, the single-parent rule, circular mapping prevention, and the read model later used by aggregate scoring.

This slice does not deliver score computation itself.

## 2. Depends On

Depends on `S00` through `S04` and `S-CALC`.

## 3. Invariants

I1. Every repository query that touches organisation-owned data must scope by `organisation_id = ORG_ID_CONSTANT`.

I2. Every state-changing workflow executes inside a single database transaction.

I3. Permission checks are enforced in the Service layer.

I4. A user with `executive_label = true` is read-only.

## 4. Data Model

```ts
export const objectiveMappings = pgTable('objective_mappings', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id').notNull().references(() => organisation.id),
  parentObjectiveId: uuid('parent_objective_id').notNull().references(() => objectives.id),
  childObjectiveId: uuid('child_objective_id').notNull().references(() => objectives.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  uniqueChild: uniqueIndex('objective_mapping_child_uidx').on(table.organisationId, table.childObjectiveId)
}));
```

## 5. State Machine

Not applicable in this slice.

## 6. Business Rules

1. A child objective may have only one parent objective.
2. Circular mappings are blocked at write time.
3. Mapping does not move ownership of the child objective; it only adds dependency structure for later score propagation.
4. Deleting a mapping removes only the link, not either objective.

## 7. Permission Matrix

| Action | ADMIN | MANAGER | EMPLOYEE | BoD Admin |
|---|---|---|---|---|
| Create mapping | ✓ | direct reports only where applicable | ✗ | ✗ |
| Delete mapping | ✓ | direct reports only where applicable | ✗ | ✗ |
| Read mappings | ✓ | direct reports only | self only if visible through own objectives | ✓ read-only |

## 8. API Contracts

- `POST /api/v1/objective-mappings`
- `DELETE /api/v1/objective-mappings/:id`
- `GET /api/v1/objective-mappings?objective_id=`

Create payload:

```ts
{
  parentObjectiveId: string;
  childObjectiveId: string;
}
```

Errors:

- `409 CHILD_ALREADY_MAPPED`
- `409 CIRCULAR_MAPPING_BLOCKED`

## 9. Implementation - Repository Layer

Repositories:

- insert mapping
- delete mapping
- check child existing parent
- fetch graph edges

## 10. Implementation - Service Layer

Services enforce:

- permission scope
- single-parent constraint
- DFS or equivalent circularity detection before insert

## 11. Implementation - Route Layer

Routes validate UUIDs and delegate all graph logic to the service.

## 12. Implementation - UI

- mapping create/remove action from objective management surfaces
- clear indication when child already mapped
- inline validation on blocked circular links

## 13. Verification Checklist

1. Map child to one parent | success.
2. Map same child to second parent | `409 CHILD_ALREADY_MAPPED`.
3. Create circular mapping | `409 CIRCULAR_MAPPING_BLOCKED`.
4. Delete mapping | link removed, objectives remain.

## 14. Done When

This slice is complete when objective relationship graphs are acyclic and later score propagation can consume them safely.
