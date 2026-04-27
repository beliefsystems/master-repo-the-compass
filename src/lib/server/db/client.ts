/**
 * PURPOSE: Create the PostgreSQL pool and Drizzle client for THE COMPASS runtime.
 * CONNECTIONS: Used by repositories, migration tooling, and BetterAuth database access.
 * LAYER: Data Access Infrastructure
 * SSOT REFERENCES: Part 23.3, Part 24
 * CONSTRAINTS ENFORCED: Single PostgreSQL connection source, schema-aware Drizzle client.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./foundation-schema.js";
import { env } from "../env.js";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10
});

export const db = drizzle(pool, { schema });
