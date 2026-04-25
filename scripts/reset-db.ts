/**
 * PURPOSE: Provide a quick dev-only database reset: drop + recreate + full setup.
 * CONNECTIONS: Uses Docker exec to reset the PostgreSQL database.
 * LAYER: Runtime Infrastructure (Dev Only)
 * CONSTRAINTS ENFORCED: Local development only — never run against production.
 */
import { execSync } from "child_process";
import { config } from "dotenv";

config();

const CONTAINER_NAME = "the-compass-postgres";
const DB_NAME = "the_compass";
const DB_USER = "postgres";

function run(cmd: string, label: string) {
  console.log(`→ ${label}...`);
  try {
    execSync(cmd, { stdio: "inherit" });
  } catch (error) {
    console.error(`✗ ${label} failed.`);
    process.exit(1);
  }
  console.log(`✓ ${label} done.\n`);
}

console.log("\n=== THE COMPASS — Database Reset ===\n");

run(
  `docker exec ${CONTAINER_NAME} psql -U ${DB_USER} -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();" 2>nul`,
  "Terminating active connections"
);

run(
  `docker exec ${CONTAINER_NAME} psql -U ${DB_USER} -c "DROP DATABASE IF EXISTS ${DB_NAME};"`,
  "Dropping database"
);

run(
  `docker exec ${CONTAINER_NAME} psql -U ${DB_USER} -c "CREATE DATABASE ${DB_NAME};"`,
  "Creating database"
);

console.log("=== Database reset complete. Run 'npm run db:setup' to re-initialize. ===\n");
