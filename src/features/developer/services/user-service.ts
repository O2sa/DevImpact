import { getUserData } from "@/lib/github";
import { calculateUserScore } from "@/features/scoring";
import { getDatabaseStore } from "@/lib/db";
import { createCacheStore, getCacheConfigFromEnv } from "@/lib/cache";
import { detectCountry } from "@/lib/geo";
import type { UserProfileResponse, UserResult } from "../types";
import type { GitHubUserData } from "@/lib/github";

export class UserFetchError extends Error {
  readonly username: string;
  readonly causeError: unknown;

  constructor(username: string, causeError: unknown) {
    super(`Failed to fetch GitHub data for ${username}`);
    this.name = "UserFetchError";
    this.username = username;
    this.causeError = causeError;
  }
}

export async function getUserProfile(
  username: string,
  selectedLanguages: string[] = [],
): Promise<UserProfileResponse> {
  const normalizedUsername = username.trim();
  if (!normalizedUsername) {
    throw new Error("Username is required");
  }

  let data: GitHubUserData;
  try {
    const { data: userData } = await getUserData(normalizedUsername, {
      cacheInRedis: true,
      withMetrics: true,
    });
    data = userData;
  } catch (error: unknown) {
    throw new UserFetchError(normalizedUsername, error);
  }

  const score = calculateUserScore(
    {
      ...data,
      selectedLanguages,
    },
    normalizedUsername,
  );

  const user: UserResult = {
    username: data.login,
    name: data.name,
    avatarUrl: data.avatarUrl,
    repoScore: Math.round(score.repoScore),
    prScore: Math.round(score.prScore),
    contributionScore: Math.round(score.contributionScore),
    finalScore: Math.round(score.finalScore),
    normalizedRepoScore: Math.round(score.normalizedRepoScore),
    normalizedPRScore: Math.round(score.normalizedPRScore),
    normalizedContributionScore: Math.round(score.normalizedContributionScore),
    normalizedFinalScore: Math.round(score.normalizedFinalScore),
    topRepos: score.topRepos,
    topPullRequests: score.topPullRequests,
    topCommunityContributions: score.topCommunityContributions,
    languageScores: score.languageScores,
    signals: score.signals,
    explanations: score.explanations,
    scoreVersion: process.env.DEVIMPACT_VERSION || undefined,
  };

  // Fire-and-forget: detect country & upsert into DB if configured
  const country = detectCountry(data.location);
  if (country && process.env.DATABASE_URL?.trim()) {
    const staleDays = parseInt(process.env.GITHUB_USER_STALE_DAYS ?? "14", 10);
    const dbScore =
      selectedLanguages.length > 0 ? calculateUserScore(data, normalizedUsername) : score;

    try {
      const db = getDatabaseStore();
      db.upsertUser({
        username: data.login,
        name: data.name,
        avatarUrl: data.avatarUrl,
        location: data.location,
        country,
        rawData: data,
        scores: dbScore,
        repoScore: Math.round(dbScore.repoScore),
        prScore: Math.round(dbScore.prScore),
        contributionScore: Math.round(dbScore.contributionScore),
        finalScore: Math.round(dbScore.finalScore),
        staleDays,
      })
        .then(() => {
          const cacheConfig = getCacheConfigFromEnv();
          const cacheStore = createCacheStore(cacheConfig);
          if (cacheStore.enabled && cacheStore.del) {
            const key = `${cacheConfig.namespace}:leaderboard:${country.trim().toLowerCase()}`;
            cacheStore.del(key).catch(() => {});
          }
        })
        .catch((err: unknown) => {
          console.warn("Failed to upsert user from user profile:", err);
        });
    } catch {
      // Ignore in environments without DB
    }
  }

  return {
    user,
    location: data.location ?? null,
  };
}
