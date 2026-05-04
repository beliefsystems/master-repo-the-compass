import { writeSystemEvent } from "$lib/server/repositories/system-event.repository.js";
import type { DatabaseExecutor } from "$lib/server/repositories/base.js";
import type { SystemEvent } from "$lib/server/db/foundation-schema.js";

export async function recordSystemEvent(input: {
  actorUserId: string;
  eventType: SystemEvent["eventType"];
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}, client?: DatabaseExecutor) {
  return writeSystemEvent(input, client);
}
