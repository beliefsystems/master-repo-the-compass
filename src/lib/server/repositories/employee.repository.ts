import { and, asc, eq, gt, ilike, isNull, or } from "drizzle-orm";
import { db } from "$lib/server/db/client";
import { employees, users, type NewEmployee } from "$lib/server/db/foundation-schema";
import { ORG_ID_CONSTANT, type DatabaseExecutor } from "./base.js";

export interface EmployeeListFilters {
  cursor?: string;
  limit?: number;
  status?: "ACTIVE" | "DEACTIVATED";
  search?: string;
}

export async function findEmployeeById(employeeId: string) {
  const [record] = await db
    .select()
    .from(employees)
    .where(and(eq(employees.id, employeeId), eq(employees.organisationId, ORG_ID_CONSTANT), isNull(employees.deletedAt)))
    .limit(1);

  return record ?? null;
}

export async function findEmployeeByIdForRestore(employeeId: string) {
  const [record] = await db
    .select()
    .from(employees)
    .where(and(eq(employees.id, employeeId), eq(employees.organisationId, ORG_ID_CONSTANT)))
    .limit(1);

  return record ?? null;
}

export async function findEmployeeByUserId(userId: string) {
  const [record] = await db
    .select()
    .from(employees)
    .where(and(eq(employees.userId, userId), eq(employees.organisationId, ORG_ID_CONSTANT), isNull(employees.deletedAt)))
    .limit(1);

  return record ?? null;
}

export async function findEmployeeByCode(employeeCode: string) {
  const [record] = await db
    .select()
    .from(employees)
    .where(and(eq(employees.employeeCode, employeeCode), eq(employees.organisationId, ORG_ID_CONSTANT), isNull(employees.deletedAt)))
    .limit(1);

  return record ?? null;
}

export async function listEmployees(filters: EmployeeListFilters = {}) {
  const conditions = [eq(employees.organisationId, ORG_ID_CONSTANT), isNull(employees.deletedAt)];
  if (filters.cursor) conditions.push(gt(employees.id, filters.cursor));
  if (filters.status) conditions.push(eq(employees.status, filters.status));
  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(employees.fullName, term),
        ilike(employees.employeeCode, term),
        ilike(employees.department, term),
        ilike(employees.designation, term)
      )!
    );
  }

  return db
    .select()
    .from(employees)
    .where(and(...conditions))
    .orderBy(asc(employees.id))
    .limit(filters.limit ?? 50);
}

export async function createEmployee(input: Omit<NewEmployee, "organisationId">, client: DatabaseExecutor = db) {
  const [record] = await client
    .insert(employees)
    .values({
      ...input,
      organisationId: ORG_ID_CONSTANT
    })
    .returning();

  return record;
}

export async function updateEmployee(
  employeeId: string,
  patch: Partial<Omit<NewEmployee, "id" | "organisationId" | "userId" | "employeeCode" | "createdAt" | "version">>,
  expectedVersion: number,
  client: DatabaseExecutor = db
) {
  const [record] = await client
    .update(employees)
    .set({
      ...patch,
      updatedAt: new Date(),
      version: expectedVersion + 1
    })
    .where(
      and(
        eq(employees.id, employeeId),
        eq(employees.organisationId, ORG_ID_CONSTANT),
        isNull(employees.deletedAt),
        eq(employees.version, expectedVersion)
      )
    )
    .returning();

  return record ?? null;
}

export async function softDeleteEmployee(employeeId: string, expectedVersion: number, client: DatabaseExecutor = db) {
  const [record] = await client
    .update(employees)
    .set({
      status: "DEACTIVATED",
      deletedAt: new Date(),
      updatedAt: new Date(),
      version: expectedVersion + 1
    })
    .where(
      and(
        eq(employees.id, employeeId),
        eq(employees.organisationId, ORG_ID_CONSTANT),
        isNull(employees.deletedAt),
        eq(employees.version, expectedVersion)
      )
    )
    .returning();

  return record ?? null;
}

export async function restoreEmployee(employeeId: string, expectedVersion: number, client: DatabaseExecutor = db) {
  const [record] = await client
    .update(employees)
    .set({
      status: "ACTIVE",
      deletedAt: null,
      updatedAt: new Date(),
      version: expectedVersion + 1
    })
    .where(and(eq(employees.id, employeeId), eq(employees.organisationId, ORG_ID_CONSTANT), eq(employees.version, expectedVersion)))
    .returning();

  return record ?? null;
}

export async function listEmployeesForOrgChart() {
  return db
    .select({
      id: employees.id,
      userId: employees.userId,
      managerId: employees.managerId,
      fullName: employees.fullName,
      role: users.role
    })
    .from(employees)
    .innerJoin(users, and(eq(employees.userId, users.id), eq(users.organisationId, ORG_ID_CONSTANT), isNull(users.deletedAt)))
    .where(and(eq(employees.organisationId, ORG_ID_CONSTANT), isNull(employees.deletedAt), eq(employees.status, "ACTIVE"), eq(users.status, "ACTIVE")))
    .orderBy(asc(employees.fullName));
}
