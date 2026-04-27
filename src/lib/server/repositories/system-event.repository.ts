import { db } from "$lib/server/db/client";
import { systemEvents } from "$lib/server/db/foundation-schema";
import { ORG_ID_CONSTANT } from "./base.js";

export async function writeSystemEvent(input: {
  actorUserId: string;
  eventType: "USER_CREATED" | "USER_UPDATED" | "USER_DEACTIVATED" | "USER_RESTORED" | "SESSION_REVOKED" | "CONFIG_UPDATED" | "ORG_UPDATED";
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const [record] = await db
    .insert(systemEvents)
    .values({
      organisationId: ORG_ID_CONSTANT,
      actorUserId: input.actorUserId,
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? null
    })
    .returning();

  return record;
}
