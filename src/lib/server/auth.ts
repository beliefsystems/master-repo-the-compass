/**
 * PURPOSE: Configure BetterAuth for minimal Slice 0 session handling.
 * CONNECTIONS: Used by hooks, server actions, and seed setup for the initial dev-run auth flow.
 * LAYER: Runtime Infrastructure
 * SSOT REFERENCES: Part 23.1, Part 29, BetterAuth official SvelteKit integration docs
 * CONSTRAINTS ENFORCED: Minimal auth scope only: email/password, session, protected routes.
 *
 * NOTE: This file MUST NOT import any $app/* modules. It is used by both
 * SvelteKit runtime (via hooks.server.ts) and standalone scripts (via seed.ts).
 * The svelteKitHandler in hooks.server.ts handles cookie management natively.
 */
import { betterAuth } from "better-auth";
import { env } from "./env.js";
import { pool } from "./db/client.js";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: pool,
  emailAndPassword: {
    enabled: true
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24
  }
});
