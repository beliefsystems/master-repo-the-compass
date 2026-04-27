import { and, eq, isNull, or } from "drizzle-orm";
import { db } from "$lib/server/db/client";
import { users, type NewUser } from "$lib/server/db/foundation-schema";
import { ORG_ID_CONSTANT } from "./base.js";

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

export async function listUsers() {
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
    .where(and(eq(users.organisationId, ORG_ID_CONSTANT), isNull(users.deletedAt)));
}

export async function createUser(input: Omit<NewUser, "organisationId">) {
  const [record] = await db
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
  expectedVersion: number
) {
  const [record] = await db
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

export async function softDeleteUser(userId: string, expectedVersion: number) {
  const [record] = await db
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

export async function restoreUser(userId: string, expectedVersion: number) {
  const [record] = await db
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
