# SLICE S00 - Foundation & Infrastructure

## 1. What This Slice Delivers

This slice delivers the minimum working foundation required to build every later slice without architectural drift. When complete, the system has a SvelteKit application shell, Drizzle database connectivity, BetterAuth-based authentication, explicit session lifecycle handling, foundational organisation and people tables, a shared error model, shared response conventions, idempotency support for state-changing endpoints, audit event recording, optimistic locking rules, and enforceable 5-layer architecture boundaries.

This slice does not deliver objectives, KPIs, timelines, approvals, force close behavior, PMS workflows, business calculations, derived scores, or business-domain UI beyond minimal authentication and shell behavior.

## 2. Depends On

No dependencies.

## 3. Invariants

Copy these invariants into any implementation prompt for S00 work:

I1. Every repository query that touches organisation-owned data must scope by `organisation_id = ORG_ID_CONSTANT`.

I2. Every query against a soft-deletable table must exclude rows where `deleted_at IS NOT NULL` unless the operation is an explicit restore or admin recovery flow.

I3. Layer 5 utils are pure functions only. They do not query the database, mutate external state, or perform side effects.

I4. Every state-changing workflow executes inside a single database transaction.

I5. `NULL` and `0` are never treated as the same value. `NULL` means no data. `0` means explicit zero.

I6. Every mutable table uses optimistic locking through a `version` integer. Version mismatch returns `409 CONCURRENT_MODIFICATION`.

I7. Idempotency applies only to state-changing HTTP methods: `POST`, `PATCH`, and `DELETE`. It never applies to `GET`.

I8. A user with `executive_label = true` is read-only. Any write attempt returns `403 BOD_WRITE_FORBIDDEN`.

I9. Permission checks are enforced in the Service layer. UI state is never trusted.

I10. Restore of a soft-deleted row is always an explicit service action. Restore is never implicit.

I11. Session validation is performed on every authenticated request before service execution.

## 4. Data Model

This slice owns only foundational tables and support tables.

### 4.1 Drizzle Schema - Organisation

```ts
export const organisation = pgTable('organisation', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  fiscalYearStart: pgEnum('fiscal_year_start', ['APRIL', 'JANUARY'])('fiscal_year_start').notNull(),
  timezone: varchar('timezone', { length: 100 }).notNull().default('Asia/Kolkata'),
  status: pgEnum('organisation_status', ['ACTIVE', 'DEACTIVATED'])('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  version: integer('version').notNull().default(1)
});
```

### 4.2 Drizzle Schema - Organisation Config

```ts
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
}, (table) => ({
  uniqueOrg: uniqueIndex('organisation_config_org_uidx').on(table.organisationId)
}));
```

### 4.3 Drizzle Schema - Users

```ts
export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'MANAGER', 'EMPLOYEE']);
export const userStatusEnum = pgEnum('user_status', ['ACTIVE', 'DEACTIVATED']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id').notNull().references(() => organisation.id),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  username: varchar('username', { length: 100 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull(),
  executiveLabel: boolean('executive_label').notNull().default(false),
  status: userStatusEnum('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  version: integer('version').notNull().default(1)
}, (table) => ({
  emailPerOrg: uniqueIndex('users_org_email_uidx').on(table.organisationId, table.email),
  usernamePerOrg: uniqueIndex('users_org_username_uidx').on(table.organisationId, table.username)
}));
```

### 4.4 Drizzle Schema - Employees

```ts
export const employeeStatusEnum = pgEnum('employee_status', ['ACTIVE', 'DEACTIVATED']);

export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id').notNull().references(() => organisation.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  managerId: uuid('manager_id'),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  employeeCode: varchar('employee_code', { length: 100 }).notNull(),
  department: varchar('department', { length: 100 }),
  division: varchar('division', { length: 100 }),
  businessUnit: varchar('business_unit', { length: 100 }),
  location: varchar('location', { length: 100 }),
  designation: varchar('designation', { length: 100 }),
  status: employeeStatusEnum('status').notNull().default('ACTIVE'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  version: integer('version').notNull().default(1)
}, (table) => ({
  employeeCodePerOrg: uniqueIndex('employees_org_code_uidx').on(table.organisationId, table.employeeCode),
  userPerOrg: uniqueIndex('employees_org_user_uidx').on(table.organisationId, table.userId)
}));
```

### 4.5 Drizzle Schema - Sessions

This slice requires an explicit session table. BetterAuth may own additional internal tables, but the execution contract requires a first-class persisted session model.

```ts
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id').notNull().references(() => organisation.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  sessionToken: varchar('session_token', { length: 255 }).notNull(),
  status: pgEnum('session_status', ['ACTIVE', 'EXPIRED', 'REVOKED'])('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true })
}, (table) => ({
  tokenUnique: uniqueIndex('sessions_token_uidx').on(table.sessionToken)
}));
```

### 4.6 Drizzle Schema - Idempotency Records

```ts
export const idempotencyRecords = pgTable('idempotency_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  idempotencyKey: uuid('idempotency_key').notNull(),
  endpoint: varchar('endpoint', { length: 255 }).notNull(),
  method: varchar('method', { length: 10 }).notNull(),
  responseStatus: integer('response_status').notNull(),
  responseBody: jsonb('response_body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
}, (table) => ({
  uniqueUserKey: uniqueIndex('idempotency_user_key_uidx').on(table.userId, table.idempotencyKey)
}));
```

### 4.7 Drizzle Schema - System Events

```ts
export const systemEventTypeEnum = pgEnum('system_event_type', [
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DEACTIVATED',
  'USER_RESTORED',
  'SESSION_REVOKED',
  'CONFIG_UPDATED',
  'ORG_UPDATED'
]);

export const systemEvents = pgTable('system_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id').notNull().references(() => organisation.id),
  actorUserId: uuid('actor_user_id').notNull().references(() => users.id),
  eventType: systemEventTypeEnum('event_type').notNull(),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  entityId: uuid('entity_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});
```

### 4.8 Zod Foundations

Every route-level input in this slice must have an inline or adjacent Zod schema. Shared Zod shapes may exist for:

- login payload
- create user payload
- update user payload
- create employee payload
- restore user payload
- pagination and cursor payloads

## 5. State Machine

### 5.1 User State

| Current State | Trigger | New State | Actor | Blocked If | Error Code |
|---|---|---|---|---|---|
| ACTIVE | deactivate user | DEACTIVATED | ADMIN | actor has executive_label=true | BOD_WRITE_FORBIDDEN |
| DEACTIVATED | restore user | ACTIVE | ADMIN | restore route not used | INVALID_STATE_TRANSITION |
| ACTIVE | patch non-status fields | ACTIVE | ADMIN | version mismatch | CONCURRENT_MODIFICATION |
| DEACTIVATED | patch non-status fields | DEACTIVATED | ADMIN | version mismatch | CONCURRENT_MODIFICATION |

All other user state transitions -> `409 INVALID_STATE_TRANSITION`.

### 5.2 Session State

| Current State | Trigger | New State | Actor | Blocked If | Error Code |
|---|---|---|---|---|---|
| ACTIVE | inactivity timeout reached | EXPIRED | SYSTEM | none | not exposed |
| ACTIVE | logout | REVOKED | AUTHENTICATED USER | session already terminal | INVALID_STATE_TRANSITION |
| ACTIVE | admin revoke | REVOKED | ADMIN | actor has executive_label=true | BOD_WRITE_FORBIDDEN |
| EXPIRED | login again | ACTIVE | AUTH SYSTEM | credentials invalid | INVALID_CREDENTIALS |
| REVOKED | login again | ACTIVE | AUTH SYSTEM | credentials invalid | INVALID_CREDENTIALS |

All other session transitions -> `409 INVALID_STATE_TRANSITION`.

## 6. Business Rules

1. `S00` owns architecture and infrastructure only. It must not introduce KPI, objective, approval, or calculation logic.
2. `organisation_id` is server-owned and sourced from configuration, never from request payloads.
3. A soft-deletable table must include `deleted_at TIMESTAMPTZ NULL`.
4. Repository read queries against soft-deletable tables must exclude deleted rows by default.
5. A write against a soft-deleted row must fail unless the service action is an explicit restore flow.
6. Restore must be modeled as its own service action and its own API contract.
7. Every mutable table in this slice must include `version INTEGER NOT NULL DEFAULT 1`.
8. Every update to a mutable row must include version match semantics. Zero rows updated means `409 CONCURRENT_MODIFICATION`.
9. Idempotency is valid only for `POST`, `PATCH`, and `DELETE`.
10. Idempotency keys are stored per user and endpoint. Replays within the TTL return the cached response body and status without re-processing.
11. `GET` requests never use idempotency records.
12. Session validation happens before service execution on every authenticated request.
13. A revoked or expired session must behave as unauthenticated for business endpoints.
14. A user with `executive_label = true` may authenticate and read allowed data but may not execute write actions.
15. Audit events in `system_events` are append-only and never updated or soft-deleted.
16. BetterAuth remains the auth library, but the execution contract requires explicit session persistence and lifecycle semantics in this system.
17. Route handlers may parse and validate input, but they may not perform business rule evaluation beyond basic auth presence and schema validation.
18. Services own workflow rules, permission checks, restore logic, and transaction boundaries.
19. Repositories own database reads and writes only.
20. Utils in this slice may format responses, normalize errors, and provide pure helper logic, but may not call the database.

## 7. Permission Matrix

| Action | ADMIN | MANAGER | EMPLOYEE | BoD Admin |
|---|---|---|---|---|
| Login | ✓ | ✓ | ✓ | ✓ |
| Read own session | ✓ | ✓ | ✓ | ✓ |
| Logout own session | ✓ | ✓ | ✓ | ✓ |
| List users | ✓ | ✗ | ✗ | ✓ read-only if route is read-only |
| Create user | ✓ | ✗ | ✗ | ✗ |
| Update user | ✓ | ✗ | ✗ | ✗ |
| Deactivate user | ✓ | ✗ | ✗ | ✗ |
| Restore user | ✓ | ✗ | ✗ | ✗ |
| Create employee | ✓ | ✗ | ✗ | ✗ |
| Update employee | ✓ | ✗ | ✗ | ✗ |
| Read org config | ✓ | ✓ | ✓ | ✓ |
| Update org config | ✓ | ✗ | ✗ | ✗ |
| Revoke another session | ✓ | ✗ | ✗ | ✗ |
| Read system events | ✓ | ✗ | ✗ | ✓ read-only |

## 8. API Contracts

### 8.1 POST `/api/v1/auth/login`

Auth: none  
Headers: none  
Request body:

```ts
{
  usernameOrEmail: string;
  password: string;
}
```

Success:

- `200 OK`

```ts
{
  user: {
    id: string;
    fullName: string;
    role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
    executiveLabel: boolean;
  };
  session: {
    id: string;
    expiresAt: string;
  };
}
```

Errors:

- `401 INVALID_CREDENTIALS`
- `401 SESSION_EXPIRED` for unusable carried session tokens
- `403 BOD_WRITE_FORBIDDEN` does not apply here because login is not a write workflow
- `400 VALIDATION_FAILED`

### 8.2 POST `/api/v1/users`

Auth: ADMIN  
Headers:

- optional `Idempotency-Key`

Request body:

```ts
{
  fullName: string;
  email: string;
  username: string;
  password: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  executiveLabel?: boolean;
}
```

Success:

- `201 Created`

Errors:

- `400 VALIDATION_FAILED`
- `403 PERMISSION_DENIED`
- `403 BOD_WRITE_FORBIDDEN`
- `409 CONCURRENT_MODIFICATION`
- `409 USER_ALREADY_EXISTS`

### 8.3 PATCH `/api/v1/users/:id`

Auth: ADMIN  
Headers:

- optional `Idempotency-Key`

Request body:

```ts
{
  fullName?: string;
  email?: string;
  username?: string;
  status?: 'ACTIVE' | 'DEACTIVATED';
  role?: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  version: number;
}
```

Success:

- `200 OK`

Errors:

- `400 VALIDATION_FAILED`
- `403 PERMISSION_DENIED`
- `403 BOD_WRITE_FORBIDDEN`
- `404 USER_NOT_FOUND`
- `409 CONCURRENT_MODIFICATION`
- `409 INVALID_STATE_TRANSITION`

### 8.4 POST `/api/v1/users/:id/restore`

Auth: ADMIN  
Headers:

- optional `Idempotency-Key`

Request body:

```ts
{
  version: number;
}
```

Success:

- `200 OK`

Errors:

- `403 PERMISSION_DENIED`
- `403 BOD_WRITE_FORBIDDEN`
- `404 USER_NOT_FOUND`
- `409 CONCURRENT_MODIFICATION`
- `409 INVALID_STATE_TRANSITION`

### 8.5 POST `/api/v1/auth/logout`

Auth: authenticated user  
Headers:

- optional `Idempotency-Key`

Request body:

```ts
{}
```

Success:

- `204 No Content`

Errors:

- `401 SESSION_EXPIRED`
- `409 INVALID_STATE_TRANSITION`

## 9. Implementation - Repository Layer

Repository functions in this slice must be narrow and deterministic.

### 9.1 Example Repository Contracts

```ts
export async function findUserById(userId: string): Promise<UserRow | null>;

export async function findUserByEmail(email: string): Promise<UserRow | null>;

export async function createUser(input: CreateUserRowInput): Promise<UserRow>;

export async function updateUser(
  userId: string,
  patch: UpdateUserRowInput,
  expectedVersion: number
): Promise<UserRow | null>;

export async function softDeleteUser(
  userId: string,
  expectedVersion: number
): Promise<UserRow | null>;

export async function restoreUser(
  userId: string,
  expectedVersion: number
): Promise<UserRow | null>;

export async function createSession(input: CreateSessionInput): Promise<SessionRow>;

export async function findActiveSessionByToken(sessionToken: string): Promise<SessionRow | null>;

export async function revokeSession(
  sessionId: string
): Promise<SessionRow | null>;

export async function saveIdempotentResponse(input: SaveIdempotentResponseInput): Promise<void>;

export async function findReusableIdempotentResponse(
  userId: string,
  idempotencyKey: string,
  endpoint: string,
  method: 'POST' | 'PATCH' | 'DELETE'
): Promise<StoredIdempotentResponse | null>;
```

### 9.2 Repository Rules

1. Every organisation-owned query includes `organisation_id = ORG_ID_CONSTANT`.
2. Every soft-deletable read excludes rows with `deleted_at IS NOT NULL`.
3. Restore queries may explicitly target deleted rows, but only for restore functions.
4. Repository functions do not decide whether an actor is allowed to perform the operation.
5. Repository functions do not assemble UI-oriented shapes.

## 10. Implementation - Service Layer

Services own the actual foundation workflows.

### 10.1 Example Service Contracts

```ts
export async function login(input: LoginInput): Promise<LoginResult>;

export async function logout(actor: AppActor, sessionId: string): Promise<void>;

export async function createUser(
  actor: AppActor,
  input: CreateUserInput
): Promise<UserDto>;

export async function updateUser(
  actor: AppActor,
  userId: string,
  input: UpdateUserInput
): Promise<UserDto>;

export async function restoreUser(
  actor: AppActor,
  userId: string,
  input: RestoreUserInput
): Promise<UserDto>;
```

### 10.2 Service Rules

1. Permission checks occur at the top of every write workflow.
2. `executive_label = true` is checked before repository mutation.
3. Login creates a persisted session record with expiry.
4. Logout revokes the active session rather than silently discarding only a cookie.
5. User create, update, soft delete, and restore execute in a single transaction.
6. Any audited write emits a `system_events` record in the same transaction.
7. Idempotency lookup happens before a state-changing workflow starts.
8. Idempotency persistence happens only after a successful state-changing result is finalized.
9. Reused idempotent responses return stored status and stored response body without repeating side effects.

## 11. Implementation - Route Layer

Routes in this slice must be thin.

### 11.1 Route Pattern

```ts
const CreateUserSchema = z.object({
  fullName: z.string().min(1).max(255),
  email: z.string().email(),
  username: z.string().min(3).max(100),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']),
  executiveLabel: z.boolean().optional()
});

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    requireAuth(locals);
    const actor = requireAdmin(locals);
    const body = await request.json();
    const parsed = CreateUserSchema.parse(body);
    const result = await UserService.createUser(actor, parsed);
    return json(result, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
};
```

### 11.2 Route Rules

1. Routes validate with Zod before calling services.
2. Routes call service layer only.
3. Routes never touch Drizzle directly.
4. Routes always normalize failures through a single error handler.
5. `hooks.server.ts` must load and validate the session into request-local state before protected routes execute.

## 12. Implementation - UI

This slice requires only minimal UI.

### 12.1 Required UI Elements

- login page
- protected app shell placeholder
- unauthenticated redirect behavior
- inline login form validation errors
- success redirect after login
- explicit logout action

### 12.2 UI Behavior Rules

1. Login submit shows a loading state while the request is in flight.
2. Invalid credentials render inline form error text, not a toast.
3. Successful login redirects into the protected app shell.
4. Logout success may use a dismissible toast and then redirect to login.
5. Any destructive admin action introduced in this slice must use the exact confirmation text:

`Are you sure you want to continue? This action changes live system access.`

## 13. Verification Checklist

1. Start app with valid environment configuration | App boots without TypeScript or configuration failure.
2. Initialize DB connection | Drizzle connects successfully to PostgreSQL.
3. Login with valid credentials | `200 OK`, session is persisted, protected route becomes accessible.
4. Login with invalid credentials | `401 INVALID_CREDENTIALS`.
5. Logout active session | Session status becomes `REVOKED`, protected route requires login again.
6. Create user as ADMIN with `Idempotency-Key` | `201 Created`, one user row created, one system event written.
7. Replay the same create-user request with the same key within TTL | cached `201` returned, no duplicate user row.
8. Send `GET` request with `Idempotency-Key` header | request behaves normally and does not consult idempotency records.
9. Soft-delete a user | user is excluded from default repository reads.
10. Restore a soft-deleted user through explicit restore route | user becomes active and query-visible again.
11. Update user with stale version | `409 CONCURRENT_MODIFICATION`.
12. Execute a write as BoD Admin | `403 BOD_WRITE_FORBIDDEN`.
13. Query users through repository default read path | rows with `deleted_at IS NOT NULL` are excluded.
14. Revoke a session, then retry protected API call with the same token | `401 SESSION_EXPIRED`.
15. Inspect route handlers | no direct DB queries appear in Layer 1.
16. Inspect utility helpers | no DB access or side effects appear in Layer 5.

## 14. Done When

This slice is complete when all verification items above pass, the architecture boundaries remain intact, and `npx tsc --noEmit` returns zero errors.
