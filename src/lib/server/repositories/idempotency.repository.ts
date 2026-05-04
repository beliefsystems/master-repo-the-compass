import { and, eq, gt } from "drizzle-orm";
import { db } from "$lib/server/db/client";
import { idempotencyRecords } from "$lib/server/db/foundation-schema";

export async function findReusableIdempotentResponse(input: {
  userId: string;
  idempotencyKey: string;
  endpoint: string;
  method: "POST" | "PATCH" | "DELETE";
}) {
  const [record] = await db
    .select()
    .from(idempotencyRecords)
    .where(
      and(
        eq(idempotencyRecords.userId, input.userId),
        eq(idempotencyRecords.idempotencyKey, input.idempotencyKey),
        eq(idempotencyRecords.endpoint, input.endpoint),
        eq(idempotencyRecords.method, input.method),
        gt(idempotencyRecords.expiresAt, new Date())
      )
    )
    .limit(1);

  return record ?? null;
}

export async function findActiveIdempotentResponseByKey(input: {
  userId: string;
  idempotencyKey: string;
}) {
  const [record] = await db
    .select()
    .from(idempotencyRecords)
    .where(
      and(
        eq(idempotencyRecords.userId, input.userId),
        eq(idempotencyRecords.idempotencyKey, input.idempotencyKey),
        gt(idempotencyRecords.expiresAt, new Date())
      )
    )
    .limit(1);

  return record ?? null;
}

export async function saveIdempotentResponse(input: {
  userId: string;
  idempotencyKey: string;
  endpoint: string;
  method: "POST" | "PATCH" | "DELETE";
  responseStatus: number;
  responseBody: unknown;
  expiresAt: Date;
}) {
  await db
    .insert(idempotencyRecords)
    .values({
      userId: input.userId,
      idempotencyKey: input.idempotencyKey,
      endpoint: input.endpoint,
      method: input.method,
      responseStatus: input.responseStatus,
      responseBody: input.responseBody,
      expiresAt: input.expiresAt
    })
    .onConflictDoUpdate({
      target: [idempotencyRecords.idempotencyKey, idempotencyRecords.userId],
      set: {
        endpoint: input.endpoint,
        method: input.method,
        responseStatus: input.responseStatus,
        responseBody: input.responseBody,
        expiresAt: input.expiresAt
      }
    });
}
