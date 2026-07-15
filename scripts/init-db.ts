/**
 * One-time script to initialize the PostgreSQL schema.
 *
 * Usage:
 *   npx tsx scripts/init-db.ts
 *
 * Prerequisites:
 *   - PostgreSQL must be running (e.g. `docker compose up -d postgres`)
 *   - DATABASE_URL must be set in .env or environment
 */
import { getDatabaseStore } from "../lib/db-store";

async function main() {
  console.log("Initializing database schema...");

  const store = getDatabaseStore();

  console.log("  • Connecting to:", process.env.DATABASE_URL ?? "(not set)");

  // Test connection
  const alive = await store.ping();
  if (!alive) {
    console.error("  ✗ Could not connect to PostgreSQL. Is it running?");
    console.error("    Start it with: docker compose up -d postgres");
    process.exit(1);
  }
  console.log("  ✓ Connection successful");

  // Create schema
  await store.initializeSchema();
  console.log("  ✓ Schema created (github_users table + indexes)");

  console.log("\nDone. Database is ready.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Schema initialization failed:", err);
  process.exit(1);
});