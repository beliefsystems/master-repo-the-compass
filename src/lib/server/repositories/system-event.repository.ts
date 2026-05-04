import { db } from "$lib/server/db/client";
import { systemEvents, type SystemEvent } from "$lib/server/db/foundation-schema";
import { ORG_ID_CONSTANT, type DatabaseExecutor } from "./base.js";

export async function writeSystemEvent(input: {
  actorUserId: string;
  eventType: SystemEvent["eventType"];
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}, client: DatabaseExecutor = db) {
  const [record] = await client
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
