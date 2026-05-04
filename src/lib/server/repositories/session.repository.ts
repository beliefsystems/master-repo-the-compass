import { and, eq, gt } from "drizzle-orm";
import { db } from "$lib/server/db/client";
import { sessions } from "$lib/server/db/foundation-schema";
import { ORG_ID_CONSTANT, type DatabaseExecutor } from "./base.js";

export async function upsertSession(input: {
  userId: string;
  sessionToken: string;
  expiresAt: Date;
}) {
  const [record] = await db
    .insert(sessions)
    .values({
      organisationId: ORG_ID_CONSTANT,
      userId: input.userId,
      sessionToken: input.sessionToken,
      status: "ACTIVE",
      expiresAt: input.expiresAt,
      lastSeenAt: new Date()
    })
    .onConflictDoUpdate({
      target: sessions.sessionToken,
      set: {
        userId: input.userId,
        status: "ACTIVE",
        expiresAt: input.expiresAt,
        lastSeenAt: new Date(),
        revokedAt: null
      }
    })
    .returning();

  return record;
}

export async function findActiveSessionByToken(sessionToken: string) {
  const [record] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.organisationId, ORG_ID_CONSTANT),
        eq(sessions.sessionToken, sessionToken),
        eq(sessions.status, "ACTIVE"),
        gt(sessions.expiresAt, new Date())
      )
    )
    .limit(1);

  return record ?? null;
}

export async function touchSession(sessionToken: string) {
  const [record] = await db
    .update(sessions)
    .set({
      lastSeenAt: new Date()
    })
    .where(and(eq(sessions.organisationId, ORG_ID_CONSTANT), eq(sessions.sessionToken, sessionToken), eq(sessions.status, "ACTIVE")))
    .returning();

  return record ?? null;
}

export async function revokeSessionByToken(sessionToken: string, client: DatabaseExecutor = db) {
  const [record] = await client
    .update(sessions)
    .set({
      status: "REVOKED",
      revokedAt: new Date()
    })
    .where(and(eq(sessions.organisationId, ORG_ID_CONSTANT), eq(sessions.sessionToken, sessionToken), eq(sessions.status, "ACTIVE")))
    .returning();

  return record ?? null;
}
