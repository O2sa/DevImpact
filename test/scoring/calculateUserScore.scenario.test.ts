import { describe, expect, test } from "vitest";

import { calculateUserScore } from "@/lib/score";
import {
  makeContributions,
  makeIssue,
  makePullRequest,
  makeRepo,
  makeUserScoreInput,
} from "@/test/fixtures/github";

describe("calculateUserScore - final score behavior", () => {
  test("final score uses 45/45/10 weights", () => {
    const result = calculateUserScore(
      makeUserScoreInput({
        repos: [
          makeRepo({
            stargazerCount: 90,
            forkCount: 20,
            watchers: { totalCount: 10 },
          }),
        ],
        pullRequests: [
          makePullRequest({
            additions: 180,
            deletions: 40,
            repository: {
              nameWithOwner: "external-owner/repo",
              stargazerCount: 70,
              owner: { login: "external-owner" },
              pushedAt: "2026-05-01T00:00:00.000Z",
            },
          }),
        ],
        issues: [
          makeIssue({
            comments: { totalCount: 6 },
            repository: {
              nameWithOwner: "external-owner/repo",
              stargazerCount: 90,
              owner: { login: "external-owner" },
            },
          }),
        ],
      }),
      "octocat",
    );

    expect(result.finalScore).toBeCloseTo(
      result.repoScore * 0.45 +
        result.prScore * 0.45 +
        result.contributionScore * 0.1,
      10,
    );
  });

  test("normalized scores are always between 0 and 100", () => {
    const result = calculateUserScore(
      makeUserScoreInput({
        repos: [
          makeRepo({
            stargazerCount: 200,
            forkCount: 40,
            watchers: { totalCount: 20 },
          }),
        ],
        pullRequests: [
          makePullRequest({
            additions: 2000,
            deletions: 500,
            repository: {
              nameWithOwner: "external-owner/repo",
              stargazerCount: 120,
              owner: { login: "external-owner" },
              pushedAt: "2026-05-01T00:00:00.000Z",
            },
          }),
        ],
      }),
      "octocat",
    );

    expect(result.normalizedRepoScore).toBeGreaterThanOrEqual(0);
    expect(result.normalizedRepoScore).toBeLessThanOrEqual(100);
    expect(result.normalizedPRScore).toBeGreaterThanOrEqual(0);
    expect(result.normalizedPRScore).toBeLessThanOrEqual(100);
    expect(result.normalizedContributionScore).toBeGreaterThanOrEqual(0);
    expect(result.normalizedContributionScore).toBeLessThanOrEqual(100);
    expect(result.normalizedFinalScore).toBeGreaterThanOrEqual(0);
    expect(result.normalizedFinalScore).toBeLessThanOrEqual(100);
  });

  test("empty user returns all zero values with no NaN", () => {
    const result = calculateUserScore(
      {
        repos: [],
        pullRequests: [],
        contributions: makeContributions(),
      },
      "ghost",
    );

    expect(result.repoScore).toBe(0);
    expect(result.prScore).toBe(0);
    expect(result.contributionScore).toBe(0);
    expect(result.finalScore).toBe(0);
    expect(result.normalizedRepoScore).toBe(0);
    expect(result.normalizedPRScore).toBe(0);
    expect(result.normalizedContributionScore).toBe(0);
    expect(result.normalizedFinalScore).toBe(0);
    expect(result.topRepos).toEqual([]);
    expect(result.topPullRequests).toEqual([]);
    expect(result.topCommunityContributions).toEqual([]);
    expect(Number.isNaN(result.finalScore)).toBe(false);
  });
});
