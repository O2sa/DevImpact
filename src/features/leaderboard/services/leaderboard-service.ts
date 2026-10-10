import { createCacheStore, getCacheConfigFromEnv } from "@/lib/cache";
import { getDatabaseStore } from "@/lib/db";
import type { LeaderboardResult, ScoredLeaderboardEntry } from "../types";
import { getDisplayLimit, isWorldwideSlug } from "./display-limit";

export type { LeaderboardResult, ScoredLeaderboardEntry };

function buildLeaderboardCacheKey(country: string, namespace: string): string {
  return `${namespace}:leaderboard:${country.trim().toLowerCase()}`;
}

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

    const rows = await db.getLeaderboard(country, displayLimit);
    const totalCount = await db.getLeaderboardCount(country);

    if (rows.length === 0) {
      return {
        title,
        totalFromSource: 0,
        scored: [],
        errors: [],
      };
    }

    const scored: ScoredLeaderboardEntry[] = rows.map((row) => ({
      username: row.username,
      name: row.name,
      avatarUrl: row.avatar_url,
      repoScore: row.repo_score,
      prScore: row.pr_score,
      contributionScore: row.contribution_score,
      finalScore: row.final_score,
      impactRank: 0,
    }));

    scored.sort((a, b) => b.finalScore - a.finalScore);
    scored.forEach((user, index) => {
      user.impactRank = index + 1;
    });

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
