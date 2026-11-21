import { createCacheStore, getCacheConfigFromEnv } from "@/lib/cache";
import { getDatabaseStore } from "@/lib/db";
import type { LeaderboardResult, ScoredLeaderboardEntry } from "../types";
import { getDisplayLimit, isWorldwideSlug } from "./display-limit";
import { buildLeaderboardCacheKey, mapRowsToScoredLeaderboardEntries } from "./leaderboard-helpers";

export type { LeaderboardResult, ScoredLeaderboardEntry };

function getLeaderboardTitle(country: string): string {
  return isWorldwideSlug(country) ? "Worldwide" : country;
}

function getCachedLeaderboard(
  cached: LeaderboardResult,
  displayLimit: number,
): LeaderboardResult | null {
  if (cached.scored.length < Math.min(displayLimit, cached.totalFromSource)) {
    return null;
  }

  return {
    ...cached,
    scored: cached.scored.slice(0, displayLimit),
  };
}

export async function getLeaderboardResult(country: string): Promise<LeaderboardResult> {
  const displayLimit = getDisplayLimit(country);
  const title = getLeaderboardTitle(country);
  const cacheConfig = getCacheConfigFromEnv();
  const cacheStore = createCacheStore(cacheConfig);

  if (cacheStore.enabled) {
    try {
      const cacheKey = buildLeaderboardCacheKey(country, cacheConfig.namespace);
      const cached = await cacheStore.get<LeaderboardResult>(cacheKey);
      if (cached) {
        const cachedLeaderboard = getCachedLeaderboard(cached, displayLimit);
        if (cachedLeaderboard) {
          return cachedLeaderboard;
        }
      }
    } catch {
      console.warn("Failed to read leaderboard from cache");
    }
  }

  try {
    const db = getDatabaseStore();

    const [rows, totalCount] = await Promise.all([
      db.getLeaderboard(country, displayLimit),
      db.getLeaderboardCount(country),
    ]);

    if (rows.length === 0) {
      return {
        title,
        totalFromSource: 0,
        scored: [],
        errors: [],
      };
    }

    const scored = mapRowsToScoredLeaderboardEntries(rows);

    const result: LeaderboardResult = {
      title,
      totalFromSource: totalCount,
      scored,
      errors: [],
    };

    if (cacheStore.enabled) {
      try {
        const cacheKey = buildLeaderboardCacheKey(country, cacheConfig.namespace);
        await cacheStore.set(cacheKey, result, cacheConfig.ttlSeconds);
      } catch {
        // Cache write failures should not block the page/API response.
      }
    }

    return result;
  } catch (err: unknown) {
    console.warn("Leaderboard database query error:", err);
    return {
      title,
      totalFromSource: 0,
      scored: [],
      errors: [err instanceof Error ? err.message : "Database unavailable"],
    };
  }
}
