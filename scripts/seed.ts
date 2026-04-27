/**
 * PURPOSE: Seed the minimum Slice 0 development records required for a deterministic local bootstrap.
 * CONNECTIONS: Uses standalone DB pool (not SvelteKit-dependent modules) for organisation/config/user rows.
 * LAYER: Runtime Infrastructure
 * SSOT REFERENCES: Part 24.1, Part 24.2, Part 24.3, Part 23.3
 * CONSTRAINTS ENFORCED: Exactly one organisation row, one organisation_config row, one admin user.
 *
 * NOTE: This script runs via `tsx` outside of SvelteKit. It creates its own DB connection
 * and BetterAuth instance to avoid importing any $app/* modules.
 */
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import pg from "pg";
import { betterAuth } from "better-auth";
import * as schema from "../src/lib/server/db/foundation-schema.js";

config();

const DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/the_compass";
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET ?? "";
const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:5173";
const APP_ORGANISATION_ID = process.env.APP_ORGANISATION_ID ?? "";
const DEV_ADMIN_EMAIL = process.env.DEV_ADMIN_EMAIL ?? "";
const DEV_ADMIN_PASSWORD = process.env.DEV_ADMIN_PASSWORD ?? "";

if (!APP_ORGANISATION_ID || !DEV_ADMIN_EMAIL || !DEV_ADMIN_PASSWORD || !BETTER_AUTH_SECRET) {
  console.error("Missing required environment variables. Check .env file.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 5 });
const db = drizzle(pool, { schema });

const seedAuth = betterAuth({
  secret: BETTER_AUTH_SECRET,
  baseURL: BETTER_AUTH_URL,
  database: pool,
  emailAndPassword: { enabled: true }
});

async function seed() {
  console.log("Seeding organisation...");
  await db
    .insert(schema.organisation)
    .values({
      id: APP_ORGANISATION_ID,
      name: "THE COMPASS",
      fiscalYearStart: "APRIL",
      timezone: "Asia/Kolkata",
      status: "ACTIVE"
    })
    .onConflictDoNothing({ target: schema.organisation.id });

  console.log("Seeding organisation_config...");
  await db
    .insert(schema.organisationConfig)
    .values({
      organisationId: APP_ORGANISATION_ID
    })
    .onConflictDoNothing({ target: schema.organisationConfig.organisationId });

  // Check if BetterAuth user already exists
  const existingAuthUsers = await db.execute(
    sql`SELECT id FROM "user" WHERE email = ${DEV_ADMIN_EMAIL} LIMIT 1`
  );
  const authUserId = existingAuthUsers.rows?.[0]?.id as string | undefined;

  let finalAuthUserId = authUserId;

  if (!authUserId) {
    console.log("Creating BetterAuth user...");
    const signUpResult = await seedAuth.api.signUpEmail({
      body: {
        email: DEV_ADMIN_EMAIL,
        password: DEV_ADMIN_PASSWORD,
        name: "Compass Admin"
      },
      headers: new Headers()
    });
    finalAuthUserId = signUpResult.user?.id;
  } else {
    console.log("BetterAuth user already exists, skipping.");
  }

  // Seed the app users table (SSoT §24.3 — users table with organisation_id, role, etc.)
  if (finalAuthUserId) {
    const existingAppUser = await db.execute(
      sql`SELECT id FROM "users" WHERE email = ${DEV_ADMIN_EMAIL} AND organisation_id = ${APP_ORGANISATION_ID}::uuid LIMIT 1`
    );

    if (!existingAppUser.rows?.length) {
      console.log("Creating app users record...");
      const [appUser] = await db.insert(schema.users).values({
        organisationId: APP_ORGANISATION_ID,
        fullName: "Compass Admin",
        role: "ADMIN",
        executiveLabel: false,
        email: DEV_ADMIN_EMAIL,
        username: "admin",
        passwordHash: "managed-by-better-auth",
        status: "ACTIVE"
      }).onConflictDoNothing().returning();

      if (appUser) {
        await db.insert(schema.employees).values({
          organisationId: APP_ORGANISATION_ID,
          userId: appUser.id,
          fullName: "Compass Admin",
          employeeCode: "ADMIN-001",
          status: "ACTIVE"
        }).onConflictDoNothing();
      }
    } else {
      console.log("App users record already exists, skipping.");
    }
  }

  console.log("Verifying seed invariants...");
  const orgCount = await db.execute(sql`SELECT count(*)::int as count FROM "organisation"`);
  const configCount = await db.execute(sql`SELECT count(*)::int as count FROM "organisation_config"`);
  const userCount = await db.execute(sql`SELECT count(*)::int as count FROM "users" WHERE organisation_id = ${APP_ORGANISATION_ID}::uuid`);

  console.log(`  organisation rows: ${orgCount.rows[0]?.count}`);
  console.log(`  organisation_config rows: ${configCount.rows[0]?.count}`);
  console.log(`  app users rows: ${userCount.rows[0]?.count}`);
}

seed()
  .then(() => {
    console.log("Seed completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
