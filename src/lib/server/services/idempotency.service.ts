import {
  findActiveIdempotentResponseByKey,
  findReusableIdempotentResponse,
  saveIdempotentResponse
} from "$lib/server/repositories/idempotency.repository.js";
import { createAppError } from "$lib/server/utils/errors.js";

const IDEMPOTENCY_TTL_HOURS = 24;

export async function getReusableResponse(input: {
  userId: string;
  idempotencyKey: string | null;
  endpoint: string;
  method: string;
}) {
  if (!input.idempotencyKey) return null;
  if (input.method !== "POST" && input.method !== "PATCH" && input.method !== "DELETE") {
    return null;
  }

  const reusable = await findReusableIdempotentResponse({
    userId: input.userId,
    idempotencyKey: input.idempotencyKey,
    endpoint: input.endpoint,
    method: input.method
  });

  if (reusable) return reusable;

  const existing = await findActiveIdempotentResponseByKey({
    userId: input.userId,
    idempotencyKey: input.idempotencyKey
  });

  if (existing) {
    throw createAppError("PRECONDITION_FAILED", {
      fields: [{ field: "Idempotency-Key", message: "Idempotency key was already used for a different endpoint or method." }]
    });
  }

  return null;
}

export async function persistResponse(input: {
  userId: string;
  idempotencyKey: string | null;
  endpoint: string;
  method: string;
  responseStatus: number;
  responseBody: unknown;
}) {
  if (!input.idempotencyKey) return;
  if (input.method !== "POST" && input.method !== "PATCH" && input.method !== "DELETE") return;

  const expiresAt = new Date(Date.now() + IDEMPOTENCY_TTL_HOURS * 60 * 60 * 1000);
  await saveIdempotentResponse({
    userId: input.userId,
    idempotencyKey: input.idempotencyKey,
    endpoint: input.endpoint,
    method: input.method,
    responseStatus: input.responseStatus,
    responseBody: input.responseBody,
    expiresAt
  });
}
