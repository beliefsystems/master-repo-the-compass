import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { and, eq, sql } from "drizzle-orm";
import pg from "pg";
import * as schema from "../src/lib/server/db/foundation-schema.js";

config();

const DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/the_compass";
const APP_ORGANISATION_ID = process.env.APP_ORGANISATION_ID ?? "";
const DEV_ADMIN_EMAIL = process.env.DEV_ADMIN_EMAIL ?? "";

if (!APP_ORGANISATION_ID || !DEV_ADMIN_EMAIL) {
  console.error("Missing APP_ORGANISATION_ID or DEV_ADMIN_EMAIL. Check .env file.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 1 });
const db = drizzle(pool, { schema });

async function main() {
  const [admin] = await db
    .update(schema.users)
    .set({
      role: "ADMIN",
      status: "ACTIVE",
      executiveLabel: false,
      deletedAt: null,
      updatedAt: new Date()
    })
    .where(and(eq(schema.users.organisationId, APP_ORGANISATION_ID), eq(schema.users.email, DEV_ADMIN_EMAIL)))
    .returning({
      id: schema.users.id,
      email: schema.users.email,
      status: schema.users.status,
      role: schema.users.role,
      executiveLabel: schema.users.executiveLabel
    });

  if (!admin) {
    throw new Error(`No app user found for DEV_ADMIN_EMAIL=${DEV_ADMIN_EMAIL}. Run npm run db:seed first.`);
  }

  const existingEmployee = await db.execute(
    sql`SELECT id FROM "employees" WHERE organisation_id = ${APP_ORGANISATION_ID}::uuid AND user_id = ${admin.id}::uuid LIMIT 1`
  );
  const employeeId = existingEmployee.rows?.[0]?.id as string | undefined;

  if (employeeId) {
    await db
      .update(schema.employees)
      .set({
        fullName: "Compass Admin",
        employeeCode: "ADMIN-001",
        managerId: null,
        status: "ACTIVE",
        deletedAt: null,
        updatedAt: new Date()
      })
      .where(eq(schema.employees.id, employeeId));
  } else {
    await db.insert(schema.employees).values({
      organisationId: APP_ORGANISATION_ID,
      userId: admin.id,
      fullName: "Compass Admin",
      employeeCode: "ADMIN-001",
      status: "ACTIVE"
    });
  }

  console.log("Ensured active writable admin:", admin);
}

main()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Failed to ensure active admin:", error);
    await pool.end();
    process.exit(1);
  });
