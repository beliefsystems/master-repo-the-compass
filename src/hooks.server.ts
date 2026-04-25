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

export const handle: Handle = async ({ event, resolve }) => {
  let authSession: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;

  try {
    authSession = await auth.api.getSession({
      headers: event.request.headers
    });
  } catch {
    authSession = null;
  }

  event.locals.session = authSession?.session
    ? {
        id: authSession.session.id,
        userId: authSession.session.userId,
        expiresAt: authSession.session.expiresAt
      }
    : null;
  event.locals.user = authSession?.user
    ? {
        id: authSession.user.id,
        email: authSession.user.email,
        name: authSession.user.name
      }
    : null;

  return svelteKitHandler({
    event,
    resolve,
    auth,
    building
  });
};
