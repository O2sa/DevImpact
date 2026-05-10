import { describe, expect, test } from "vitest";

import { calculateUserScore } from "@/lib/score";
import { makeContributions, makeRepo, makeUserScoreInput } from "@/test/fixtures/github";
import { expectedRepoScore, sumRepoScores } from "@/test/helpers/score";

describe("calculateUserScore - repository scoring", () => {
  test("empty repos return a zero repository score", () => {
    const result = calculateUserScore(
      {
        repos: [],
        pullRequests: [],
        contributions: makeContributions(),
      },
      "octocat",
    );

    expect(result.repoScore).toBe(0);
    expect(result.topRepos).toEqual([]);
    expect(result.signals.reposAnalyzed).toBe(0);
  });

  test("repo with zero stars/forks/watchers returns zero", () => {
    const repo = makeRepo({
      stargazerCount: 0,
      forkCount: 0,
      watchers: { totalCount: 0 },
    });

    const result = calculateUserScore(
      makeUserScoreInput({ repos: [repo], pullRequests: [] }),
      "octocat",
    );

    expect(result.repoScore).toBe(0);
    expect(Number.isNaN(result.repoScore)).toBe(false);
  });

  test("repo score uses stars, forks, and watchers as base signals", () => {
    const lowSignalRepo = makeRepo({
      stargazerCount: 5,
      forkCount: 1,
      watchers: { totalCount: 1 },
    });
    const highSignalRepo = makeRepo({
      stargazerCount: 100,
      forkCount: 20,
      watchers: { totalCount: 10 },
    });

    const low = calculateUserScore(
      makeUserScoreInput({ repos: [lowSignalRepo], pullRequests: [] }),
      "octocat",
    );
    const high = calculateUserScore(
      makeUserScoreInput({ repos: [highSignalRepo], pullRequests: [] }),
      "octocat",
    );

    expect(high.repoScore).toBeGreaterThan(low.repoScore);
    expect(high.repoScore).toBeCloseTo(expectedRepoScore(highSignalRepo), 10);
  });

  test("top 5 repos get full weight", () => {
    const repos = [1, 2, 3, 4, 5].map((index) =>
      makeRepo({
        name: `repo-${index}`,
        stargazerCount: 120 - index * 10,
        forkCount: 25 - index * 2,
        watchers: { totalCount: 15 - index },
      }),
    );

    const result = calculateUserScore(
      makeUserScoreInput({ repos, pullRequests: [] }),
      "octocat",
    );

    expect(result.repoScore).toBeCloseTo(sumRepoScores(repos), 10);
  });

  test("repos after top 5 get 0.1 rank weight", () => {
    const repos = [1, 2, 3, 4, 5, 6, 7].map((index) =>
      makeRepo({
        name: `repo-${index}`,
        stargazerCount: 150 - index * 12,
        forkCount: 30 - index * 2,
        watchers: { totalCount: 18 - index },
      }),
    );

    const result = calculateUserScore(
      makeUserScoreInput({ repos, pullRequests: [] }),
      "octocat",
    );

    expect(result.repoScore).toBeCloseTo(sumRepoScores(repos), 10);
  });

  test("forked repositories are heavily penalized", () => {
    const original = makeRepo({ isFork: false });
    const forked = makeRepo({ isFork: true });

    const originalResult = calculateUserScore(
      makeUserScoreInput({ repos: [original], pullRequests: [] }),
      "octocat",
    );
    const forkedResult = calculateUserScore(
      makeUserScoreInput({ repos: [forked], pullRequests: [] }),
      "octocat",
    );

    expect(forkedResult.repoScore).toBeLessThan(originalResult.repoScore * 0.25);
  });

  test("inactive repositories are penalized", () => {
    const activeRepo = makeRepo({ pushedAt: "2026-04-20T00:00:00.000Z" });
    const staleRepo = makeRepo({ pushedAt: "2020-01-01T00:00:00.000Z" });

    const activeResult = calculateUserScore(
      makeUserScoreInput({
        repos: [activeRepo],
        pullRequests: [],
        referenceDate: "2026-05-10T00:00:00.000Z",
      }),
      "octocat",
    );
    const staleResult = calculateUserScore(
      makeUserScoreInput({
        repos: [staleRepo],
        pullRequests: [],
        referenceDate: "2026-05-10T00:00:00.000Z",
      }),
      "octocat",
    );

    expect(staleResult.repoScore).toBeLessThan(activeResult.repoScore);
  });

  test("recently active repositories get a score boost", () => {
    const recentRepo = makeRepo({ pushedAt: "2026-05-08T00:00:00.000Z" });
    const mediumRepo = makeRepo({ pushedAt: "2025-06-01T00:00:00.000Z" });

    const recent = calculateUserScore(
      makeUserScoreInput({
        repos: [recentRepo],
        pullRequests: [],
        referenceDate: "2026-05-10T00:00:00.000Z",
      }),
      "octocat",
    );
    const medium = calculateUserScore(
      makeUserScoreInput({
        repos: [mediumRepo],
        pullRequests: [],
        referenceDate: "2026-05-10T00:00:00.000Z",
      }),
      "octocat",
    );

    expect(recent.repoScore).toBeGreaterThan(medium.repoScore);
  });
});
