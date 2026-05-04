# S02 Postman Manual Testing Guide

This guide verifies the implemented S02 user and employee APIs. S-CALC has no HTTP endpoints; it is verified through automated tests because the slice is pure Layer 5 utility code.

## 1. Prerequisites

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Confirm `.env` contains valid values for:

   ```text
   DATABASE_URL
   BETTER_AUTH_SECRET
   BETTER_AUTH_URL=http://localhost:5173
   APP_ORGANISATION_ID
   DEV_ADMIN_EMAIL
   DEV_ADMIN_PASSWORD
   ```

3. Prepare the database:

   ```powershell
   npm run db:migrate
   npm run auth:migrate
   npm run db:seed
   npm run db:ensure-admin
   ```

4. Start the app:

   ```powershell
   npm run dev
   ```

5. Keep the server running at:

   ```text
   http://localhost:5173
   ```

## 2. Postman Environment

Create or update a Postman environment with these variables:

| Variable | Initial value |
|---|---|
| `baseUrl` | `http://localhost:5173` |
| `adminLogin` | value from `DEV_ADMIN_EMAIL`, or `admin` if username login is seeded |
| `adminPassword` | value from `DEV_ADMIN_PASSWORD` |
| `userId` | blank |
| `managerUserId` | blank |
| `employeeId` | blank |
| `managerEmployeeId` | blank |
| `userVersion` | blank |
| `employeeVersion` | blank |

In Postman settings, make sure cookies are enabled. The login request stores the auth cookie automatically for `localhost`.

Safety rule: keep at least one active non-executive `ADMIN` at all times. Before destructive lifecycle testing, create a second admin user and use that second admin for deactivate/restore tests. If you accidentally deactivate the seeded admin, run:

```powershell
npm run db:ensure-admin
```

## 3. Authentication

### 3.1 Login as Admin

Request:

```text
POST {{baseUrl}}/api/v1/auth/login
Content-Type: application/json
```

Body:

```json
{
  "usernameOrEmail": "{{adminLogin}}",
  "password": "{{adminPassword}}"
}
```

Expected:

- Status: `200 OK`
- Response includes `user.role = "ADMIN"`
- Postman cookie jar contains the session cookie.

## 4. User API Smoke Tests

### 4.1 List Users

```text
GET {{baseUrl}}/api/v1/users?limit=50
```

Expected:

- Status: `200 OK`
- Body has `items`.
- Seeded admin user is present.

### 4.2 Create Manager User

```text
POST {{baseUrl}}/api/v1/users
Content-Type: application/json
Idempotency-Key: 11111111-1111-4111-8111-111111111111
```

Body:

```json
{
  "fullName": "Smoke Manager",
  "email": "smoke.manager@example.com",
  "username": "smoke.manager",
  "password": "Password123",
  "role": "MANAGER"
}
```

Expected:

- Status: `201 Created`
- Save response `id` into `managerUserId`.
- Save response `version` if needed.

### 4.3 Create Employee User

```text
POST {{baseUrl}}/api/v1/users
Content-Type: application/json
Idempotency-Key: 22222222-2222-4222-8222-222222222222
```

Body:

```json
{
  "fullName": "Smoke Employee",
  "email": "smoke.employee@example.com",
  "username": "smoke.employee",
  "password": "Password123",
  "role": "EMPLOYEE"
}
```

Expected:

- Status: `201 Created`
- Save response `id` into `userId`.
- Save response `version` into `userVersion`.

### 4.4 Duplicate Email Is Rejected

```text
POST {{baseUrl}}/api/v1/users
Content-Type: application/json
```

Body:

```json
{
  "fullName": "Duplicate User",
  "email": "smoke.employee@example.com",
  "username": "smoke.employee.dup",
  "password": "Password123",
  "role": "EMPLOYEE"
}
```

Expected:

- Status: `409 Conflict`
- Error code: `USER_ALREADY_EXISTS`

### 4.5 Update User

```text
PATCH {{baseUrl}}/api/v1/users/{{userId}}
Content-Type: application/json
Idempotency-Key: 33333333-3333-4333-8333-333333333333
```

Body:

```json
{
  "fullName": "Smoke Employee Updated",
  "version": {{userVersion}}
}
```

Expected:

- Status: `200 OK`
- `fullName` is updated.
- Save returned `version` into `userVersion`.

### 4.6 Restore User

Only run this against a non-seeded test user that was previously deactivated.

```text
POST {{baseUrl}}/api/v1/users/{{userId}}/restore
Content-Type: application/json
Idempotency-Key: 77777777-7777-4777-8777-777777777777
```

Body:

```json
{
  "version": {{userVersion}}
}
```

Expected:

- Status: `200 OK`
- `status = "ACTIVE"`
- Returned `version` is incremented.

Do not deactivate the last active writable admin. The API should reject that with `412 PRECONDITION_FAILED`.

## 5. Employee API Smoke Tests

### 5.1 Create Manager Employee Profile

```text
POST {{baseUrl}}/api/v1/employees
Content-Type: application/json
Idempotency-Key: 44444444-4444-4444-8444-444444444444
```

Body:

```json
{
  "userId": "{{managerUserId}}",
  "employeeCode": "SMOKE-MGR-001",
  "fullName": "Smoke Manager",
  "department": "QA",
  "designation": "Manager"
}
```

Expected:

- Status: `201 Created`
- Save response `id` into `managerEmployeeId`.

### 5.2 Create Employee Profile With Manager

```text
POST {{baseUrl}}/api/v1/employees
Content-Type: application/json
Idempotency-Key: 55555555-5555-4555-8555-555555555555
```

Body:

```json
{
  "userId": "{{userId}}",
  "managerId": "{{managerEmployeeId}}",
  "employeeCode": "SMOKE-EMP-001",
  "fullName": "Smoke Employee Updated",
  "department": "QA",
  "designation": "Tester"
}
```

Expected:

- Status: `201 Created`
- Save response `id` into `employeeId`.
- Save response `version` into `employeeVersion`.

### 5.3 List Employees

```text
GET {{baseUrl}}/api/v1/employees?limit=50
```

Expected:

- Status: `200 OK`
- Response includes both `SMOKE-MGR-001` and `SMOKE-EMP-001`.

### 5.4 Duplicate Employee Code Is Rejected

```text
POST {{baseUrl}}/api/v1/employees
Content-Type: application/json
```

Body:

```json
{
  "userId": "{{userId}}",
  "employeeCode": "SMOKE-EMP-001",
  "fullName": "Duplicate Employee"
}
```

Expected:

- Status: `409 Conflict`
- Error code: `USER_ALREADY_EXISTS`

### 5.5 Update Employee

```text
PATCH {{baseUrl}}/api/v1/employees/{{employeeId}}
Content-Type: application/json
Idempotency-Key: 66666666-6666-4666-8666-666666666666
```

Body:

```json
{
  "designation": "Senior Tester",
  "version": {{employeeVersion}}
}
```

Expected:

- Status: `200 OK`
- `designation = "Senior Tester"`
- Save returned `version` into `employeeVersion`.

### 5.6 Circular Manager Chain Is Rejected

Attempt to make the manager report to the employee:

```text
PATCH {{baseUrl}}/api/v1/employees/{{managerEmployeeId}}
Content-Type: application/json
```

Body:

```json
{
  "managerId": "{{employeeId}}",
  "version": 1
}
```

Expected:

- Status: `400 Bad Request`
- Error code: `VALIDATION_FAILED`
- Field includes `managerId`.

If the manager profile version is no longer `1`, first call `GET /api/v1/employees` and use the latest manager `version`.

### 5.7 Read Org Chart

```text
GET {{baseUrl}}/api/v1/employees/org-chart
```

Expected:

- Status: `200 OK`
- Manager node contains employee node under `children`.

### 5.8 Stale Version Is Rejected

```text
PATCH {{baseUrl}}/api/v1/employees/{{employeeId}}
Content-Type: application/json
```

Body:

```json
{
  "designation": "Stale Update",
  "version": 1
}
```

Expected after the employee has already been updated:

- Status: `409 Conflict`
- Error code: `CONCURRENT_MODIFICATION`

## 6. Permission Smoke Tests

### 6.1 Login as Employee

Use the employee credentials created above:

```text
POST {{baseUrl}}/api/v1/auth/login
Content-Type: application/json
```

Body:

```json
{
  "usernameOrEmail": "smoke.employee",
  "password": "Password123"
}
```

Expected:

- Status: `200 OK`
- Session cookie updates to the employee user.

### 6.2 Employee Can Read Org Chart

```text
GET {{baseUrl}}/api/v1/employees/org-chart
```

Expected:

- Status: `200 OK`

### 6.3 Employee Cannot Write Employees

```text
POST {{baseUrl}}/api/v1/employees
Content-Type: application/json
```

Body:

```json
{
  "userId": "{{userId}}",
  "employeeCode": "SHOULD-NOT-WRITE",
  "fullName": "Blocked Write"
}
```

Expected:

- Status: `403 Forbidden`
- Error code: `PERMISSION_DENIED`

## 7. Local Automated Verification

Run these after manual API testing:

```powershell
npm run check
npm test
```

Current expected result:

- `svelte-check found 0 errors and 0 warnings`
- All Vitest files pass, including S-CALC and S02.
