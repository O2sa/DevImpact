import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserData: vi.fn(),
  calculateUserScore: vi.fn(),
  persistUserScores: vi.fn().mockResolvedValue(undefined),
  initializeSchema: vi.fn().mockResolvedValue(undefined),
  getExistingUsernames: vi.fn().mockResolvedValue(new Set<string>()),
  getTopUsers: vi.fn().mockResolvedValue([]),
  getLeaderboard: vi.fn().mockResolvedValue([]),
  getLeaderboardCount: vi.fn().mockResolvedValue(0),
}));

vi.mock("@/lib/github", () => ({
  getUserData: mocks.getUserData,
}));

vi.mock("@/features/scoring", () => ({
  calculateUserScore: mocks.calculateUserScore,
}));

vi.mock("@/features/developer/services", () => ({
  persistUserScores: mocks.persistUserScores,
}));

vi.mock("@/lib/db", () => ({
  getDatabaseStore: () => ({
    initializeSchema: mocks.initializeSchema,
    getExistingUsernames: mocks.getExistingUsernames,
    getTopUsers: mocks.getTopUsers,
    getLeaderboard: mocks.getLeaderboard,
    getLeaderboardCount: mocks.getLeaderboardCount,
  }),
}));

vi.mock("@/lib/cache", () => ({
  getCacheConfigFromEnv: () => ({ enabled: false, namespace: "test" }),
  createCacheStore: () => ({ enabled: false, del: vi.fn() }),
}));

import type { DatabaseStore } from "@/lib/db";
import {
  seedNewUsers,
  refreshStaleUsers,
  calculateLeaderboard,
} from "../services/calculate-leaderboard";

describe("calculate-leaderboard service optimizations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("seedNewUsers", () => {
    test("batches username existence checks and skips existing users", async () => {
      const mockDb = {
        getExistingUsernames: vi.fn().mockResolvedValue(new Set(["alice"])),
      } as unknown as DatabaseStore;

      mocks.getUserData.mockResolvedValue({
        data: { login: "bob" },
        metrics: { duration: 12, errors: [] },
      });
      mocks.calculateUserScore.mockReturnValue({ finalScore: 85 });

      const users = [
        {
          rank: 1,
          name: "Alice",
          login: "alice",
          avatarUrl: "https://example.com/1.png",
          contributions: 100,
        },
        {
          rank: 2,
          name: "Bob",
          login: "bob",
          avatarUrl: "https://example.com/2.png",
          contributions: 50,
        },
      ];

      const result = await seedNewUsers(mockDb, users, 10, 30, 2);

      // getExistingUsernames was called once with both logins
      expect(mockDb.getExistingUsernames).toHaveBeenCalledTimes(1);
      expect(mockDb.getExistingUsernames).toHaveBeenCalledWith(["alice", "bob"]);

      // Alice was skipped, Bob was fetched
      expect(result.skippedExistingCount).toBe(1);
      expect(result.newUsersCount).toBe(1);
      expect(mocks.getUserData).toHaveBeenCalledTimes(1);
      expect(mocks.getUserData).toHaveBeenCalledWith("bob", {
        cacheInRedis: false,
        withMetrics: true,
      });
      expect(mocks.persistUserScores).toHaveBeenCalledTimes(1);
    });

    test("handles errors for individual users without failing the batch", async () => {
      const mockDb = {
        getExistingUsernames: vi.fn().mockResolvedValue(new Set()),
      } as unknown as DatabaseStore;

      mocks.getUserData
        .mockRejectedValueOnce(new Error("Rate limit exceeded"))
        .mockResolvedValueOnce({
          data: { login: "user2" },
          metrics: { duration: 10, errors: [] },
        });
      mocks.calculateUserScore.mockReturnValue({ finalScore: 90 });

      const users = [
        {
          rank: 1,
          name: "User 1",
          login: "user1",
          avatarUrl: "https://example.com/1.png",
          contributions: 10,
        },
        {
          rank: 2,
          name: "User 2",
          login: "user2",
          avatarUrl: "https://example.com/2.png",
          contributions: 20,
        },
      ];

      const result = await seedNewUsers(mockDb, users, 10, 30, 2);

      expect(result.newUsersCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        username: "user1",
        reason: "Rate limit exceeded",
      });
    });
  });

  describe("refreshStaleUsers", () => {
    test("only refreshes users whose stale_after is in the past", async () => {
      const mockDb = {
        getTopUsers: vi.fn().mockResolvedValue([
          { username: "staleUser", stale_after: new Date(Date.now() - 10000), final_score: 80 },
          { username: "freshUser", stale_after: new Date(Date.now() + 100000), final_score: 90 },
        ]),
      } as unknown as DatabaseStore;

      mocks.getUserData.mockResolvedValue({
        data: { login: "staleUser" },
        metrics: { duration: 15, errors: [] },
      });
      mocks.calculateUserScore.mockReturnValue({ finalScore: 85 });

      const result = await refreshStaleUsers(mockDb, "sweden", 10, 30, 2);

      expect(result.refreshedCount).toBe(1);
      expect(mocks.getUserData).toHaveBeenCalledTimes(1);
      expect(mocks.getUserData).toHaveBeenCalledWith("staleUser", {
        cacheInRedis: false,
        withMetrics: true,
      });
      expect(mocks.persistUserScores).toHaveBeenCalledTimes(1);
    });
  });

  describe("calculateLeaderboard", () => {
    test("does NOT call db.initializeSchema during execution", async () => {
      process.env.LEADERBOARD_SOURCE_URL_TEMPLATE = "https://example.com/{country}.yml";

      const sampleYaml = `
title: Sweden
total_user_count: 1
users:
  - rank: 1
    name: Tester
    login: tester
    avatarUrl: https://example.com/tester.png
    contributions: 10
`;
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          text: vi.fn().mockResolvedValue(sampleYaml),
        }),
      );

      mocks.getExistingUsernames.mockResolvedValue(new Set(["tester"]));
      mocks.getTopUsers.mockResolvedValue([]);
      mocks.getLeaderboard.mockResolvedValue([]);
      mocks.getLeaderboardCount.mockResolvedValue(1);

      await calculateLeaderboard("sweden");

      // Verify lock-eliminating fix: initializeSchema must NOT be called
      expect(mocks.initializeSchema).not.toHaveBeenCalled();
      expect(mocks.getExistingUsernames).toHaveBeenCalledWith(["tester"]);

      vi.unstubAllGlobals();
    });
  });
});
