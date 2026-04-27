# SLICE S01 - Organisation & Config

## 1. What This Slice Delivers

This slice delivers the single-tenant organisation profile and the one-row-per-org configuration surface that later slices consume for fiscal-year behavior, timezone behavior, KPI status bands, PMS rating bands, and import limits. It turns the foundational tables introduced in `S00` into a managed read/write feature with explicit admin-only mutation rules.

This slice does not deliver people management, objectives, KPIs, cycles, approvals, scoring workflows, or imports themselves.

## 2. Depends On

Depends on `S00`.

## 3. Invariants

I1. Every repository query that touches organisation-owned data must scope by `organisation_id = ORG_ID_CONSTANT`.

I2. Every state-changing workflow executes inside a single database transaction.

I3. Every mutable table uses optimistic locking through a `version` integer. Version mismatch returns `409 CONCURRENT_MODIFICATION`.

I4. Idempotency applies only to `POST`, `PATCH`, and `DELETE`. It never applies to `GET`.

I5. A user with `executive_label = true` is read-only. Any write attempt returns `403 BOD_WRITE_FORBIDDEN`.

I6. Permission checks are enforced in the Service layer.

## 4. Data Model

This slice owns the operational use of `organisation` and `organisation_config`.

```ts
export const organisation = pgTable('organisation', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  fiscalYearStart: fiscalYearStartEnum('fiscal_year_start').notNull(),
  timezone: varchar('timezone', { length: 100 }).notNull(),
  status: orgStatusEnum('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  version: integer('version').notNull().default(1)
});

export const organisationConfig = pgTable('organisation_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id').notNull().references(() => organisation.id),
  maxImportFileSizeMb: integer('max_import_file_size_mb').notNull().default(10),
  pmsCadencesEnabled: text('pms_cadences_enabled').array().notNull(),
  kpiStatusBands: jsonb('kpi_status_bands').notNull(),
  pmsRatingBands: jsonb('pms_rating_bands').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  version: integer('version').notNull().default(1)
});
```

## 5. State Machine

| Current State | Trigger | New State | Actor | Blocked If | Error Code |
|---|---|---|---|---|---|
| ACTIVE | patch organisation/profile fields | ACTIVE | ADMIN | version mismatch | CONCURRENT_MODIFICATION |
| ACTIVE | patch org config | ACTIVE | ADMIN | actor has executive_label=true | BOD_WRITE_FORBIDDEN |
| DEACTIVATED | read config | DEACTIVATED | authenticated user | none | none |

All other state changes are not applicable in this slice.

## 6. Business Rules

1. Exactly one `organisation` row and exactly one `organisation_config` row exist per deployment.
2. `fiscalYearStart` is immutable after initial seed unless a future version explicitly introduces a migration workflow.
3. `timezone` must be a valid IANA timezone string.
4. `pmsCadencesEnabled` contains only `QUARTERLY`, `HALF_YEARLY`, and `ANNUAL`.
5. `kpiStatusBands` and `pmsRatingBands` are treated as configuration data, not code.
6. Configuration writes are admin-only.
7. Read access is allowed to all authenticated roles because later UI and calculation behavior depend on these values.

## 7. Permission Matrix

| Action | ADMIN | MANAGER | EMPLOYEE | BoD Admin |
|---|---|---|---|---|
| Read organisation profile | ✓ | ✓ | ✓ | ✓ |
| Read organisation config | ✓ | ✓ | ✓ | ✓ |
| Update organisation profile | ✓ | ✗ | ✗ | ✗ |
| Update organisation config | ✓ | ✗ | ✗ | ✗ |

## 8. API Contracts

### GET `/api/v1/org`

Auth: authenticated user  
Success: `200 OK`

### PATCH `/api/v1/org`

Auth: ADMIN  
Headers: optional `Idempotency-Key`

```ts
{
  name?: string;
  timezone?: string;
  version: number;
}
```

Errors:

- `400 VALIDATION_FAILED`
- `403 PERMISSION_DENIED`
- `403 BOD_WRITE_FORBIDDEN`
- `409 CONCURRENT_MODIFICATION`

### GET `/api/v1/org/config`

Auth: authenticated user  
Success: `200 OK`

### PATCH `/api/v1/org/config`

Auth: ADMIN  
Headers: optional `Idempotency-Key`

```ts
{
  maxImportFileSizeMb?: number;
  pmsCadencesEnabled?: Array<'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL'>;
  kpiStatusBands?: StatusBandInput[];
  pmsRatingBands?: RatingBandInput[];
  version: number;
}
```

Errors:

- `400 VALIDATION_FAILED`
- `403 PERMISSION_DENIED`
- `403 BOD_WRITE_FORBIDDEN`
- `409 CONCURRENT_MODIFICATION`

## 9. Implementation - Repository Layer

Repository functions:

```ts
findOrganisation(): Promise<OrganisationRow>;
updateOrganisation(patch, expectedVersion): Promise<OrganisationRow | null>;
findOrganisationConfig(): Promise<OrganisationConfigRow>;
updateOrganisationConfig(patch, expectedVersion): Promise<OrganisationConfigRow | null>;
```

All queries are scoped by `ORG_ID_CONSTANT`.

## 10. Implementation - Service Layer

Services:

```ts
getOrganisation(actor): Promise<OrganisationDto>;
updateOrganisation(actor, input): Promise<OrganisationDto>;
getOrganisationConfig(actor): Promise<OrganisationConfigDto>;
updateOrganisationConfig(actor, input): Promise<OrganisationConfigDto>;
```

Service duties:

- enforce admin-only writes
- validate timezone and configuration shape
- wrap writes in one transaction
- emit `ORG_UPDATED` or `CONFIG_UPDATED` events

## 11. Implementation - Route Layer

Routes define Zod schemas inline, call the service only, and normalize errors through `handleError()`.

## 12. Implementation - UI

- an admin settings page for organisation/config editing
- loading state on save
- inline field errors
- success toast on save
- read-only rendering for non-admin roles

## 13. Verification Checklist

1. Read organisation as EMPLOYEE | `200 OK`.
2. Update org name as ADMIN | `200 OK`, event written.
3. Update config with stale version | `409 CONCURRENT_MODIFICATION`.
4. Update config as BoD Admin | `403 BOD_WRITE_FORBIDDEN`.
5. Save invalid timezone | `400 VALIDATION_FAILED`.

## 14. Done When

This slice is complete when the verification items pass and later slices can consume organisation/config values without introducing their own fallback rules.
