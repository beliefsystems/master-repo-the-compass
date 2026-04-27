# SLICE S11 - Excel Import & Export

## 1. What This Slice Delivers

This slice delivers two-phase Excel import for supported business entities and bounded export behavior for V1 reporting surfaces. It provides validate-then-commit behavior, import job expiry, and fail-all atomicity.

This slice does not deliver PDF export.

## 2. Depends On

Depends on `S00` through `S04`.

## 3. Invariants

I1. Every repository query that touches organisation-owned data must scope by `organisation_id = ORG_ID_CONSTANT`.

I2. Every import write executes inside a single database transaction.

I3. Weightage totals must equal exactly `100.00` before commit.

I4. Idempotency applies only to state-changing HTTP methods.

## 4. Data Model

```ts
export const importJobStatusEnum = pgEnum('import_job_status', [
  'UPLOADED',
  'VALIDATED',
  'FAILED',
  'COMMITTED',
  'EXPIRED'
]);

export const importJobs = pgTable('import_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id').notNull().references(() => organisation.id),
  actorUserId: uuid('actor_user_id').notNull().references(() => users.id),
  status: importJobStatusEnum('status').notNull().default('UPLOADED'),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  validationErrors: jsonb('validation_errors'),
  payloadJson: jsonb('payload_json'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});
```

## 5. State Machine

| Current State | Trigger | New State | Actor | Blocked If | Error Code |
|---|---|---|---|---|---|
| UPLOADED | validate | VALIDATED | ADMIN | parse/validation fails | IMPORT_VALIDATION_FAILED |
| UPLOADED | validate | FAILED | ADMIN | validation fails | IMPORT_VALIDATION_FAILED |
| VALIDATED | commit | COMMITTED | ADMIN | expired or already committed | IMPORT_JOB_EXPIRED / IMPORT_JOB_ALREADY_COMMITTED |
| any open | TTL pass | EXPIRED | SYSTEM | none | none |

## 6. Business Rules

1. Supported import format is `.xlsx` only.
2. Validation completes before any write begins.
3. Commit is all-or-nothing.
4. Expired jobs cannot be committed.
5. Already committed jobs cannot be committed again.
6. Export is bounded to 10,000 rows.

## 7. Permission Matrix

| Action | ADMIN | MANAGER | EMPLOYEE | BoD Admin |
|---|---|---|---|---|
| Upload import file | ✓ | ✗ | ✗ | ✗ |
| Validate import | ✓ | ✗ | ✗ | ✗ |
| Commit import | ✓ | ✗ | ✗ | ✗ |
| Export data | ✓ | ✓ scoped | self only where applicable | ✓ read-only |

## 8. API Contracts

- `POST /api/v1/imports/upload`
- `POST /api/v1/imports/:id/validate`
- `POST /api/v1/imports/:id/commit`
- `GET /api/v1/exports?...`

## 9. Implementation - Repository Layer

Repositories persist import jobs, read validated payloads, and commit target rows transactionally.

## 10. Implementation - Service Layer

Services:

- parse Excel
- validate business rules
- mark jobs failed or validated
- commit transactionally
- enforce export row limit

## 11. Implementation - Route Layer

Routes validate file presence and route parameters, then delegate to services.

## 12. Implementation - UI

- upload form
- row-level validation error display
- commit action after validation
- export action with disabled state when selection exceeds limit

## 13. Verification Checklist

1. Upload invalid file type | `400 VALIDATION_FAILED`.
2. Validate file with weightage error | `400 IMPORT_VALIDATION_FAILED`.
3. Commit valid job | `200 OK`, status `COMMITTED`.
4. Recommit same job | `409 IMPORT_JOB_ALREADY_COMMITTED`.
5. Commit expired job | `409 IMPORT_JOB_EXPIRED`.
6. Export over 10,000 rows | `400 EXPORT_EXCEEDS_LIMIT`.

## 14. Done When

This slice is complete when import and export flows are deterministic, bounded, and atomic.
