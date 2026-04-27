# SLICE S15 - System Events Audit Trail

## 1. What This Slice Delivers

This slice delivers the read surface and operational conventions for the append-only `system_events` audit stream. It formalizes how write slices emit auditable events and how admins consume them.

This slice does not replace submission history for KPI cycle execution; both coexist with different purposes.

## 2. Depends On

Depends on `S00`.

## 3. Invariants

I1. Every repository query that touches organisation-owned data must scope by `organisation_id = ORG_ID_CONSTANT`.

I2. Audit rows are append-only.

I3. Every audited write emits its audit event in the same transaction as the write.

I4. A user with `executive_label = true` is read-only.

## 4. Data Model

This slice owns the operational use of `system_events` from `S00`.

## 5. State Machine

Not applicable in this slice.

## 6. Business Rules

1. `system_events` rows are never updated.
2. `system_events` rows are never soft-deleted.
3. Audit reads are paginated.
4. Audit feed is admin-readable and BoD Admin-readable in V1.
5. KPI submission history remains a separate append-only stream for cycle workflow history.

## 7. Permission Matrix

| Action | ADMIN | MANAGER | EMPLOYEE | BoD Admin |
|---|---|---|---|---|
| Read system event feed | ✓ | ✗ | ✗ | ✓ read-only |

## 8. API Contracts

- `GET /api/v1/system-events?event_type=&entity_type=&cursor=&limit=`

Success:

```ts
{
  items: Array<{
    id: string;
    eventType: string;
    entityType: string;
    entityId: string | null;
    actorUserId: string;
    metadata: Record<string, unknown> | null;
    createdAt: string;
  }>;
  nextCursor: string | null;
}
```

## 9. Implementation - Repository Layer

Repositories list paginated audit events and filter by supported query params.

## 10. Implementation - Service Layer

Services enforce admin or BoD Admin read access and normalize filter handling.

## 11. Implementation - Route Layer

Read-only route with standard pagination schema.

## 12. Implementation - UI

- admin audit feed page
- read-only filters
- paginated list

## 13. Verification Checklist

1. Admin reads audit feed | `200 OK`.
2. Employee reads audit feed | `403 PERMISSION_DENIED`.
3. Event feed paginates deterministically | cursor works.
4. Audit rows remain immutable | no write route exists.

## 14. Done When

This slice is complete when the append-only audit stream is readable, paginated, and aligned with the write behavior defined in earlier slices.
