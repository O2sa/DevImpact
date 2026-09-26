import { getUserData } from "@/lib/github";
import { calculateUserScore } from "@/features/scoring";
import type { CalculateUserScoreResult } from "@/features/scoring/services";
import { persistUserScores } from "./user-persistence";
import { getCachedProfile, setCachedProfile } from "./profile-cache";
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

  // ── 1. Check Redis Profile Cache (Tier 1: Pre-computed Profile) ──
  try {
    const cached = await getCachedProfile(normalizedUsername, selectedLanguages);
    if (cached) {
      return cached;
    }
  } catch {
    // Non-fatal: continue to DB / fresh calculation
  }

  // ── 2. Check PostgreSQL Pre-calculated Scores (Tier 2 for Canonical) ──
  const isCanonical = selectedLanguages.length === 0;
  if (isCanonical) {
    try {
      const { getDatabaseStore } = await import("@/lib/db");
      const db = getDatabaseStore();
      if (typeof db.getUserProfile === "function") {
        const row = await db.getUserProfile(normalizedUsername);

        if (row && row.scores && row.stale_after > new Date()) {
          const scores = row.scores as CalculateUserScoreResult;
          const profile: UserProfileResponse = {
            user: {
              username: row.username,
              name: row.name,
              avatarUrl: row.avatar_url,
              repoScore: row.repo_score,
              prScore: row.pr_score,
              contributionScore: row.contribution_score,
              finalScore: row.final_score,
              normalizedRepoScore: Math.round(scores.normalizedRepoScore ?? scores.repoScore),
              normalizedPRScore: Math.round(scores.normalizedPRScore ?? scores.prScore),
              normalizedContributionScore: Math.round(
                scores.normalizedContributionScore ?? scores.contributionScore,
              ),
              normalizedFinalScore: Math.round(scores.normalizedFinalScore ?? scores.finalScore),
              topRepos: scores.topRepos ?? [],
              topPullRequests: scores.topPullRequests ?? [],
              topCommunityContributions: scores.topCommunityContributions ?? [],
              languageScores: scores.languageScores,
              signals: scores.signals,
              explanations: scores.explanations,
              scoreVersion: process.env.DEVIMPACT_VERSION || undefined,
            },
            location: row.location ?? null,
          };

          // Warm Redis profile cache
          void setCachedProfile(normalizedUsername, profile, selectedLanguages);

          return profile;
        }
      }
    } catch {
      // Non-fatal: fall through to full calculation
    }
  }

  // ── 3. Fallback: Fetch raw GitHub data & compute score ──────────────
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

  const response: UserProfileResponse = {
    user,
    location: data.location ?? null,
  };

  // Warm Redis profile cache with the computed profile
  void setCachedProfile(normalizedUsername, response, selectedLanguages);

  // Persist canonical scores into DB
  void persistUserScores({
    data,
    score,
    selectedLanguages,
  });

  return response;
}
