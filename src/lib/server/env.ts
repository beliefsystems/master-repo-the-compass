/**
 * PURPOSE: Parse and expose server-only environment configuration for the Slice 0 runtime.
 * CONNECTIONS: Used by db, auth, repositories, seed scripts, and runtime route wiring.
 * LAYER: Runtime Infrastructure
 * SSOT REFERENCES: Part 23.1, Part 23.3, Part 29
 * CONSTRAINTS ENFORCED: organisation_id remains server-owned; local defaults are explicit and deterministic.
 */
import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  APP_ORGANISATION_ID: z.string().uuid(),
  DEV_ADMIN_EMAIL: z.string().email(),
  DEV_ADMIN_PASSWORD: z.string().min(8)
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  APP_ORGANISATION_ID: process.env.APP_ORGANISATION_ID,
  DEV_ADMIN_EMAIL: process.env.DEV_ADMIN_EMAIL,
  DEV_ADMIN_PASSWORD: process.env.DEV_ADMIN_PASSWORD
});
