/**
 * Standalone script to calculate the next country's leaderboard.
 *
 * This script:
 * 1. Loads .env file automatically
 * 2. Connects to the shared PostgreSQL database (via DATABASE_URL)
 * 3. Picks the country that was calculated longest ago
 * 4. Calls the same calculateLeaderboard() function used by the API
 * 5. Updates the leaderboard_calculation tracking table
 * 6. Exits
 *
 * Usage:
 *   npx tsx scripts/calculate-next-country.ts
 *
 * Prerequisites:
 *   - DATABASE_URL must be set (in .env or environment)
 *   - GITHUB_TOKEN must be set (in .env or environment)
 */
// Load .env file for standalone execution. This must be the first import.
import "dotenv/config";

import { getDatabaseStore } from "@/lib/db-store";
import { calculateLeaderboard } from "@/lib/calculate-leaderboard";
import { logger } from "@/lib/logger";

async function main() {
  const overallStartTime = performance.now();
  logger.info("=== DevImpact Leaderboard Calculator Start ===");
  logger.info(`DB:  ${(process.env.DATABASE_URL ?? "").slice(0, 40)}...`);

  const db = getDatabaseStore();
  await db.initializeSchema();
  await db.seedCalculationCountries();

  // 1. Pick the next country to calculate
  logger.info("Picking next country to calculate...");
  const next = await db.getNextCountryToCalculate();
  if (!next) {
    logger.info("No countries to calculate. All are up-to-date or running.");
    process.exit(0);
  }

  logger.info(`Selected: ${next.title} (${next.slug})`);

  // 2. Mark as running
  await db.startCalculation(next.slug);
  logger.info(`Marked '${next.slug}' as running.`);

  try {
    // 3. Run the calculation (same function used by the API endpoint)
    logger.info("Starting leaderboard calculation...");
    const result = await calculateLeaderboard(next.slug);

    // 4. Mark as done
    const errorCount = result._meta.errors;
    const errorMessage = errorCount > 0 ? `${errorCount} users failed` : undefined;

    await db.finishCalculation(next.slug, errorMessage);
    logger.info(`Finished calculation for '${next.slug}'.`);

    // 5. Log detailed summary
    const overallDuration = (performance.now() - overallStartTime) / 1000;
    const totalFetchTime = result._meta.totalFetchTime ?? 0;
    const successfulFetches = result._meta.successfulFetches ?? 0;
    const averageFetchTime = successfulFetches > 0 ? (totalFetchTime / successfulFetches / 1000).toFixed(2) : "N/A";

    logger.info("=== Calculation Summary ===", {
      country: next.title,
      newUsers: result._meta.newUsers,
      skippedExisting: result._meta.skippedExisting,
      refreshedUsers: result._meta.refreshedUsers,
      totalInDb: result._meta.totalInDb,
      errors: errorCount,
      failedUsernames: result._meta.failedUsernames,
      totalFetchTime: `${(totalFetchTime / 1000).toFixed(2)}s`,
      averageFetchTime: `${averageFetchTime}s`,
      overallDuration: `${overallDuration.toFixed(2)}s`,
    });

    if (result._meta.userFetchErrors && result._meta.userFetchErrors.length > 0) {
      logger.warn("Detailed user fetch errors:", { errors: result._meta.userFetchErrors });
    }

    process.exit(0);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`FATAL: ${message}`);
    await db.finishCalculation(next.slug, message);
    process.exit(1);
  }
}

main();
