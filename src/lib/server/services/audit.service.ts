import { writeSystemEvent } from "$lib/server/repositories/system-event.repository.js";

export async function recordSystemEvent(input: {
  actorUserId: string;
  eventType: "USER_CREATED" | "USER_UPDATED" | "USER_DEACTIVATED" | "USER_RESTORED" | "SESSION_REVOKED" | "CONFIG_UPDATED" | "ORG_UPDATED";
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  return writeSystemEvent(input);
}
