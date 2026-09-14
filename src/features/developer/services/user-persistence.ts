import { calculateUserScore } from "@/features/scoring";
import { getDatabaseStore } from "@/lib/db";
import { createCacheStore, getCacheConfigFromEnv } from "@/lib/cache";
import { detectCountry } from "@/lib/geo";
import type { GitHubUserData } from "@/lib/github";
import type { CalculateUserScoreResult } from "@/features/scoring/services";

export type PersistUserOptions = {
  data: GitHubUserData;
  score?: CalculateUserScoreResult;
  selectedLanguages?: string[];
  explicitCountry?: string | null;
  staleDays?: number;
};

/**
 * Canonical service function to persist user score data to PostgreSQL
 * and invalidate country leaderboard cache in Redis.
 *
 * Ensures that if selectedLanguages is provided, canonical unfiltered score
 * is always computed and persisted into the database.
 */
export async function persistUserScores({
  data,
  score,
  selectedLanguages = [],
  explicitCountry,
  staleDays,
}: PersistUserOptions): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    return;
  }

  const country = explicitCountry !== undefined ? explicitCountry : detectCountry(data.location);
  const resolvedStaleDays = staleDays ?? parseInt(process.env.GITHUB_USER_STALE_DAYS ?? "14", 10);

  // Compute canonical unfiltered score if languages were selected or score was omitted
  const canonicalScore =
    selectedLanguages.length > 0 || !score ? calculateUserScore(data, data.login) : score;

  try {
    const db = getDatabaseStore();
    await db.upsertUser({
      username: data.login,
      name: data.name,
      avatarUrl: data.avatarUrl,
      location: data.location,
      country,
      rawData: data,
      scores: canonicalScore,
      repoScore: Math.round(canonicalScore.repoScore),
      prScore: Math.round(canonicalScore.prScore),
      contributionScore: Math.round(canonicalScore.contributionScore),
      finalScore: Math.round(canonicalScore.finalScore),
      staleDays: resolvedStaleDays,
    });

    if (country) {
      const cacheConfig = getCacheConfigFromEnv();
      const cacheStore = createCacheStore(cacheConfig);
      if (cacheStore.enabled && cacheStore.del) {
        const key = `${cacheConfig.namespace}:leaderboard:${country.trim().toLowerCase()}`;
        await cacheStore.del(key).catch(() => {});
      }
    }
  } catch (err: unknown) {
    console.warn(`Failed to persist user score for ${data.login}:`, err);
  }
}
