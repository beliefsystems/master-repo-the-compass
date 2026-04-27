/**
 * PURPOSE: Mount BetterAuth into SvelteKit and populate per-request session locals.
 * CONNECTIONS: Uses the BetterAuth server instance and feeds session data to routes and loads.
 * LAYER: Runtime Infrastructure
 * SSOT REFERENCES: Part 23.1, Part 29
 * CONSTRAINTS ENFORCED: Protected-route groundwork only; no authorization business logic here.
 */
import type { Handle } from "@sveltejs/kit";
import { building } from "$app/environment";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { auth } from "$lib/server/auth";
import { resolveLocals } from "$lib/server/services/auth.service";

export const handle: Handle = async ({ event, resolve }) => {
  try {
    const resolved = await resolveLocals(event.request.headers);
    event.locals.session = resolved.session;
    event.locals.user = resolved.user;
  } catch {
    event.locals.session = null;
    event.locals.user = null;
  }

  return svelteKitHandler({
    event,
    resolve,
    auth,
    building
  });
};
