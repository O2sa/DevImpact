import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  cacheDel: vi.fn(),
  getUserData: vi.fn(),
  calculateUserScore: vi.fn(),
  getUserProfile: vi.fn(),
  upsertUser: vi.fn(),
}));

vi.mock("@/lib/cache", () => ({
  getCacheConfigFromEnv: () => ({
    enabled: true,
    namespace: "devimpact:v1",
    ttlSeconds: 604800,
  }),
  createCacheStore: () => ({
    enabled: true,
    get: mocks.cacheGet,
    set: mocks.cacheSet,
    del: mocks.cacheDel,
  }),
}));

vi.mock("@/lib/github", () => ({
  getUserData: mocks.getUserData,
}));

vi.mock("@/features/scoring", () => ({
  calculateUserScore: mocks.calculateUserScore,
}));

vi.mock("@/lib/db", () => ({
  getDatabaseStore: () => ({
    getUserProfile: mocks.getUserProfile,
    upsertUser: mocks.upsertUser,
  }),
}));

import {
  buildProfileCacheKey,
  getCachedProfile,
  setCachedProfile,
  invalidateProfileCache,
} from "../services/profile-cache";
import { getUserProfile } from "../services/user-service";

describe("Profile & Score Caching", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("buildProfileCacheKey", () => {
    test("builds canonical key for user", () => {
      const key = buildProfileCacheKey(" Torvalds ");
      expect(key).toBe("devimpact:v1:profile:torvalds");
    });

    test("builds language-sorted key when selectedLanguages provided", () => {
      const key = buildProfileCacheKey("torvalds", ["Rust", "Python", "Go"]);
      expect(key).toBe("devimpact:v1:profile:torvalds:go,python,rust");
    });
  });

  describe("getCachedProfile & setCachedProfile", () => {
    test("retrieves cached profile from store", async () => {
      const mockProfile = {
        user: {
          username: "torvalds",
          name: "Linus Torvalds",
          avatarUrl: "https://example.com/avatar.png",
          repoScore: 100,
          prScore: 100,
          contributionScore: 100,
          finalScore: 100,
          topRepos: [],
          topPullRequests: [],
        },
        location: "Helsinki, Finland",
      };

      mocks.cacheGet.mockResolvedValueOnce(mockProfile);

      const result = await getCachedProfile("torvalds");
      expect(mocks.cacheGet).toHaveBeenCalledWith("devimpact:v1:profile:torvalds");
      expect(result).toEqual(mockProfile);
    });

    test("stores profile with TTL", async () => {
      const mockProfile = {
        user: {
          username: "torvalds",
          name: "Linus",
          avatarUrl: "https://example.com/avatar.png",
          repoScore: 90,
          prScore: 90,
          contributionScore: 90,
          finalScore: 90,
          topRepos: [],
          topPullRequests: [],
        },
        location: null,
      };

      await setCachedProfile("torvalds", mockProfile);
      expect(mocks.cacheSet).toHaveBeenCalledWith(
        "devimpact:v1:profile:torvalds",
        mockProfile,
        604800,
      );
    });

    test("invalidates profile cache", async () => {
      await invalidateProfileCache("torvalds");
      expect(mocks.cacheDel).toHaveBeenCalledWith("devimpact:v1:profile:torvalds");
    });
  });

  describe("getUserProfile tiered retrieval", () => {
    test("Tier 1: returns directly from Redis cache without calling DB or GitHub", async () => {
      const cachedProfile = {
        user: {
          username: "torvalds",
          name: "Linus",
          avatarUrl: "https://example.com/avatar.png",
          repoScore: 95,
          prScore: 95,
          contributionScore: 95,
          finalScore: 95,
          topRepos: [],
          topPullRequests: [],
        },
        location: "Finland",
      };

      mocks.cacheGet.mockResolvedValueOnce(cachedProfile);

      const result = await getUserProfile("torvalds");

      expect(result).toEqual(cachedProfile);
      // Zero calls to DB, GitHub, or Scoring engine
      expect(mocks.getUserProfile).not.toHaveBeenCalled();
      expect(mocks.getUserData).not.toHaveBeenCalled();
      expect(mocks.calculateUserScore).not.toHaveBeenCalled();
    });

    test("Tier 2: returns from PostgreSQL pre-calculated scores when Redis misses", async () => {
      mocks.cacheGet.mockResolvedValueOnce(null);

      mocks.getUserProfile.mockResolvedValueOnce({
        username: "torvalds",
        name: "Linus Torvalds",
        avatar_url: "https://example.com/avatar.png",
        location: "Finland",
        country: "Finland",
        repo_score: 92,
        pr_score: 92,
        contribution_score: 92,
        final_score: 92,
        scores: {
          repoScore: 92,
          prScore: 92,
          contributionScore: 92,
          finalScore: 92,
          normalizedRepoScore: 90,
          normalizedPRScore: 90,
          normalizedContributionScore: 90,
          normalizedFinalScore: 90,
          topRepos: [{ name: "linux", score: 99 }],
          topPullRequests: [],
          topCommunityContributions: [],
        },
        stale_after: new Date(Date.now() + 86400000), // fresh for 1 day
      });

      const result = await getUserProfile("torvalds");

      expect(result.user.username).toBe("torvalds");
      expect(result.user.finalScore).toBe(92);
      expect(result.location).toBe("Finland");

      // Warmed Redis profile cache
      expect(mocks.cacheSet).toHaveBeenCalledWith(
        "devimpact:v1:profile:torvalds",
        expect.objectContaining({ location: "Finland" }),
        604800,
      );

      // GitHub and score calculation were NOT called
      expect(mocks.getUserData).not.toHaveBeenCalled();
      expect(mocks.calculateUserScore).not.toHaveBeenCalled();
    });
  });
});
