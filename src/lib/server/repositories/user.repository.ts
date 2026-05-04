import { and, asc, count, eq, gt, ilike, isNull, or } from "drizzle-orm";
import { db } from "$lib/server/db/client";
import { users, type NewUser } from "$lib/server/db/foundation-schema";
import { ORG_ID_CONSTANT, type DatabaseExecutor } from "./base.js";

export async function findUserById(userId: string) {
  const [record] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), eq(users.organisationId, ORG_ID_CONSTANT), isNull(users.deletedAt)))
    .limit(1);

  return record ?? null;
}

export async function findUserByEmail(email: string) {
  const [record] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), eq(users.organisationId, ORG_ID_CONSTANT), isNull(users.deletedAt)))
    .limit(1);

  return record ?? null;
}

export async function findUserByUsername(username: string) {
  const [record] = await db
    .select()
    .from(users)
    .where(and(eq(users.username, username), eq(users.organisationId, ORG_ID_CONSTANT), isNull(users.deletedAt)))
    .limit(1);

  return record ?? null;
}

export async function findUserByUsernameOrEmail(usernameOrEmail: string) {
  const [record] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.organisationId, ORG_ID_CONSTANT),
        isNull(users.deletedAt),
        or(eq(users.email, usernameOrEmail), eq(users.username, usernameOrEmail))
      )
    )
    .limit(1);

  return record ?? null;
}

export interface UserListFilters {
  cursor?: string;
  limit?: number;
  status?: "ACTIVE" | "DEACTIVATED";
  role?: "ADMIN" | "MANAGER" | "EMPLOYEE";
  search?: string;
}

export async function listUsers(filters: UserListFilters = {}) {
  const conditions = [eq(users.organisationId, ORG_ID_CONSTANT), isNull(users.deletedAt)];
  if (filters.cursor) conditions.push(gt(users.id, filters.cursor));
  if (filters.status) conditions.push(eq(users.status, filters.status));
  if (filters.role) conditions.push(eq(users.role, filters.role));
  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(or(ilike(users.fullName, term), ilike(users.email, term), ilike(users.username, term))!);
  }

  return db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      username: users.username,
      role: users.role,
      executiveLabel: users.executiveLabel,
      status: users.status,
      version: users.version,
      createdAt: users.createdAt
    })
    .from(users)
    .where(and(...conditions))
    .orderBy(asc(users.id))
    .limit(filters.limit ?? 50);
}

export async function countActiveWritableAdmins() {
  const [record] = await db
    .select({ count: count() })
    .from(users)
    .where(
      and(
        eq(users.organisationId, ORG_ID_CONSTANT),
        isNull(users.deletedAt),
        eq(users.role, "ADMIN"),
        eq(users.status, "ACTIVE"),
        eq(users.executiveLabel, false)
      )
    );

  return Number(record?.count ?? 0);
}

export async function createUser(input: Omit<NewUser, "organisationId">, client: DatabaseExecutor = db) {
  const [record] = await client
    .insert(users)
    .values({
      ...input,
      organisationId: ORG_ID_CONSTANT
    })
    .returning();

  return record;
}

export async function updateUser(
  userId: string,
  patch: Partial<Pick<NewUser, "fullName" | "email" | "username" | "role" | "status" | "executiveLabel" | "passwordHash">>,
  expectedVersion: number,
  client: DatabaseExecutor = db
) {
  const [record] = await client
    .update(users)
    .set({
      ...patch,
      updatedAt: new Date(),
      version: expectedVersion + 1
    })
    .where(
      and(
        eq(users.id, userId),
        eq(users.organisationId, ORG_ID_CONSTANT),
        isNull(users.deletedAt),
        eq(users.version, expectedVersion)
      )
    )
    .returning();

  return record ?? null;
}

export async function softDeleteUser(userId: string, expectedVersion: number, client: DatabaseExecutor = db) {
  const [record] = await client
    .update(users)
    .set({
      status: "DEACTIVATED",
      deletedAt: new Date(),
      updatedAt: new Date(),
      version: expectedVersion + 1
    })
    .where(
      and(
        eq(users.id, userId),
        eq(users.organisationId, ORG_ID_CONSTANT),
        isNull(users.deletedAt),
        eq(users.version, expectedVersion)
      )
    )
    .returning();

  return record ?? null;
}

export async function restoreUser(userId: string, expectedVersion: number, client: DatabaseExecutor = db) {
  const [record] = await client
    .update(users)
    .set({
      status: "ACTIVE",
      deletedAt: null,
      updatedAt: new Date(),
      version: expectedVersion + 1
    })
    .where(
      and(
        eq(users.id, userId),
        eq(users.organisationId, ORG_ID_CONSTANT),
        eq(users.version, expectedVersion)
      )
    )
    .returning();

  return record ?? null;
}
