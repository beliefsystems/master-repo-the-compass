# SLICE S14 - In-App Notifications

## 1. What This Slice Delivers

This slice delivers in-app notification creation, unread/read tracking, mark-as-read actions, mark-all-as-read behavior, and notification list polling behavior.

This slice does not deliver email notifications.

## 2. Depends On

Depends on `S00` through `S06`.

## 3. Invariants

I1. Every repository query that touches organisation-owned data must scope by `organisation_id = ORG_ID_CONSTANT`.

I2. Every state-changing workflow executes inside a single database transaction when mutation occurs.

I3. Idempotency applies only to `POST`, `PATCH`, and `DELETE`.

## 4. Data Model

This slice operationally owns `in_app_notifications` from `S00`.

## 5. State Machine

| Current State | Trigger | New State | Actor | Blocked If | Error Code |
|---|---|---|---|---|---|
| UNREAD | mark as read | READ | recipient user | version mismatch | CONCURRENT_MODIFICATION |
| UNREAD | mark all as read | READ | recipient user | none | none |
| READ | read again | READ | recipient user | none | none |

## 6. Business Rules

1. V1 notifications are in-app only.
2. Clients poll for unread notifications.
3. Only the recipient user may mark a notification as read.
4. Mark-all-as-read updates only the caller's unread notifications.

## 7. Permission Matrix

| Action | ADMIN | MANAGER | EMPLOYEE | BoD Admin |
|---|---|---|---|---|
| Read own notifications | ✓ | ✓ | ✓ | ✓ |
| Mark own notification as read | ✓ | ✓ | ✓ | ✓ |
| Mark all own notifications as read | ✓ | ✓ | ✓ | ✓ |

## 8. API Contracts

- `GET /api/v1/notifications?status=UNREAD|READ&cursor=&limit=`
- `POST /api/v1/notifications/:id/read`
- `POST /api/v1/notifications/read-all`

## 9. Implementation - Repository Layer

Repositories list notifications by recipient and update read status.

## 10. Implementation - Service Layer

Services enforce recipient ownership and may be invoked by other slices to create notification rows.

## 11. Implementation - Route Layer

Routes validate ids and use standard pagination helpers.

## 12. Implementation - UI

- notification bell or panel
- unread badge count
- mark-as-read actions
- polling interval of 30 seconds

## 13. Verification Checklist

1. Read own unread notifications | `200 OK`.
2. Mark another user's notification as read | `403 PERMISSION_DENIED`.
3. Mark all as read | only caller's rows change.
4. Notification list paginates | bounded results returned.

## 14. Done When

This slice is complete when in-app notifications are readable, dismissible, and scoped correctly with no email dependency.
