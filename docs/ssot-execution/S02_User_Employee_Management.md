# SLICE S02 - User & Employee Management

## 1. What This Slice Delivers

This slice delivers user lifecycle, employee profile lifecycle, manager relationships, org-chart reads, activation and deactivation behavior, and foundational people APIs. It turns the base `users` and `employees` tables into the canonical source for workforce structure and reporting lines.

This slice does not deliver objectives, KPIs, approvals, notifications beyond optional side effects, or scoring.

## 2. Depends On

Depends on `S00` and `S01`.

## 3. Invariants

I1. Every repository query that touches organisation-owned data must scope by `organisation_id = ORG_ID_CONSTANT`.

I2. Every query against a soft-deletable table must exclude rows where `deleted_at IS NOT NULL` unless the operation is an explicit restore flow.

I3. Every state-changing workflow executes inside a single database transaction.

I4. Every mutable table uses optimistic locking through a `version` integer.

I5. Idempotency applies only to `POST`, `PATCH`, and `DELETE`.

I6. A user with `executive_label = true` is read-only.

I7. Permission checks are enforced in the Service layer.

## 4. Data Model

This slice owns the operational use of `users` and `employees` from `S00`.

Additional read shape:

```ts
export interface EmployeeTreeNode {
  id: string;
  userId: string;
  managerId: string | null;
  fullName: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  children: EmployeeTreeNode[];
}
```

## 5. State Machine

### User

| Current State | Trigger | New State | Actor | Blocked If | Error Code |
|---|---|---|---|---|---|
| ACTIVE | deactivate | DEACTIVATED | ADMIN | actor has executive_label=true | BOD_WRITE_FORBIDDEN |
| DEACTIVATED | restore | ACTIVE | ADMIN | version mismatch | CONCURRENT_MODIFICATION |
| ACTIVE | update role/profile | ACTIVE | ADMIN | version mismatch | CONCURRENT_MODIFICATION |

### Employee

| Current State | Trigger | New State | Actor | Blocked If | Error Code |
|---|---|---|---|---|---|
| ACTIVE | update manager/profile | ACTIVE | ADMIN | circular chain introduced | VALIDATION_FAILED |
| ACTIVE | deactivate | DEACTIVATED | ADMIN | linked user operation fails | CONCURRENT_MODIFICATION |
| DEACTIVATED | restore | ACTIVE | ADMIN | linked user still deactivated | INVALID_STATE_TRANSITION |

## 6. Business Rules

1. A user must exist before an employee row can be created.
2. `employee_code` is unique within the organisation.
3. An employee may have zero or one direct manager.
4. A manager chain may not be circular.
5. Deactivation is soft delete or status deactivation depending on entity intent; default repository reads exclude soft-deleted rows.
6. Restores are explicit service actions.
7. Only admins may create, edit, deactivate, or restore users and employees in V1.

## 7. Permission Matrix

| Action | ADMIN | MANAGER | EMPLOYEE | BoD Admin |
|---|---|---|---|---|
| List users | ✓ | ✗ | ✗ | ✓ read-only |
| Create user | ✓ | ✗ | ✗ | ✗ |
| Update user | ✓ | ✗ | ✗ | ✗ |
| Create employee | ✓ | ✗ | ✗ | ✗ |
| Update employee | ✓ | ✗ | ✗ | ✗ |
| Read org chart | ✓ | ✓ | ✓ | ✓ |

## 8. API Contracts

### GET `/api/v1/users`

Auth: ADMIN or BoD Admin read-only  
Query: `cursor`, `limit`, `status`, `role`, `search`

### POST `/api/v1/users`

Auth: ADMIN  
Headers: optional `Idempotency-Key`

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

### PATCH `/api/v1/users/:id`

Auth: ADMIN  
Headers: optional `Idempotency-Key`

```ts
{
  fullName?: string;
  email?: string;
  username?: string;
  role?: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  status?: 'ACTIVE' | 'DEACTIVATED';
  version: number;
}
```

### POST `/api/v1/employees`

Auth: ADMIN  
Headers: optional `Idempotency-Key`

```ts
{
  userId: string;
  managerId?: string | null;
  employeeCode: string;
  fullName: string;
  department?: string;
  division?: string;
  businessUnit?: string;
  location?: string;
  designation?: string;
}
```

### PATCH `/api/v1/employees/:id`

Auth: ADMIN  
Headers: optional `Idempotency-Key`

```ts
{
  managerId?: string | null;
  fullName?: string;
  department?: string;
  division?: string;
  businessUnit?: string;
  location?: string;
  designation?: string;
  version: number;
}
```

### GET `/api/v1/employees/org-chart`

Auth: authenticated user

## 9. Implementation - Repository Layer

Required functions include:

```ts
findUserById();
findUserByEmail();
findUserByUsername();
listUsers(filters);
createUser();
updateUser();
findEmployeeById();
findEmployeeByUserId();
createEmployee();
updateEmployee();
listEmployeesForOrgChart();
```

## 10. Implementation - Service Layer

Services enforce:

- uniqueness rules
- circular manager prevention
- admin-only writes
- audit event emission
- transaction boundaries across user and employee changes

## 11. Implementation - Route Layer

Routes:

- validate payloads with Zod
- call service layer only
- return paginated responses where applicable
- use shared error handler

## 12. Implementation - UI

- admin user list
- admin employee list/form
- org-chart read view
- loading state for saves
- inline field validation
- destructive confirmation text:

`Are you sure you want to continue? This action changes live system access.`

## 13. Verification Checklist

1. Create user as ADMIN | `201 Created`.
2. Create duplicate email | `409 USER_ALREADY_EXISTS`.
3. Create employee with duplicate employee code | `409 USER_ALREADY_EXISTS` or dedicated uniqueness error.
4. Update employee to circular manager chain | `400 VALIDATION_FAILED`.
5. Read org chart as EMPLOYEE | `200 OK`.
6. Write as BoD Admin | `403 BOD_WRITE_FORBIDDEN`.

## 14. Done When

This slice is complete when users, employees, and manager relationships are fully manageable through the defined APIs and no route bypasses the service layer.
