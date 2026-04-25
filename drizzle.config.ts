/**
 * PURPOSE: Configure Drizzle migrations for THE COMPASS application schema.
 * CONNECTIONS: Consumed by drizzle-kit scripts for SQL generation and migration application.
 * LAYER: Runtime Infrastructure
 * SSOT REFERENCES: Part 24, Part 30
 * CONSTRAINTS ENFORCED: PostgreSQL only, single authoritative schema entrypoint.
 */
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config();

export default defineConfig({
  schema: "./src/lib/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/the_compass"
  }
});
