/**
 * PURPOSE: Provide minimal shared service-layer helpers without introducing business logic.
 * CONNECTIONS: Used by concrete services to enforce consistent not-found handling and invariants.
 * LAYER: Services
 * SSOT REFERENCES: Part 23.2
 * CONSTRAINTS ENFORCED: Services remain the orchestration boundary above repositories and below routes.
 */
import { createAppError } from "$lib/server/core/errors";

export function requireRecord<T>(record: T | null | undefined, message = "Required record was not found."): T {
  if (!record) {
    throw createAppError("INTERNAL_SERVER_ERROR", { message });
  }

  return record;
}
