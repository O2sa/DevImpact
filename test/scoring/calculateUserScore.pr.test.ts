import { describe, expect, test } from "vitest";

import { calculateUserScore } from "@/lib/score";
import { makePullRequest, makeUserScoreInput } from "@/test/fixtures/github";
import { expectedPRScore, sumPRScores, sumWithDiminishingReturns } from "@/test/helpers/score";

describe("calculateUserScore - pull request scoring", () => {
  test("unmerged PRs are ignored", () => {
    const result = calculateUserScore(
      makeUserScoreInput({
        repos: [],
        pullRequests: [makePullRequest({ merged: false })],
      }),
      "octocat",
    );

    expect(result.prScore).toBe(0);
    expect(result.signals.unmergedPRsIgnored).toBe(1);
  });

  test("own repo PRs are ignored case-insensitively", () => {
    const result = calculateUserScore(
      makeUserScoreInput({
        repos: [],
        pullRequests: [
          makePullRequest({
            repository: {
              nameWithOwner: "TestUser/repo",
              stargazerCount: 50,
              owner: { login: "testuser" },
              pushedAt: "2026-05-01T00:00:00.000Z",
            },
          }),
        ],
      }),
      "TestUser",
    );

    expect(result.prScore).toBe(0);
    expect(result.signals.ownRepoPRsIgnored).toBe(1);
  });

  test("merged external PRs are counted", () => {
    const pr = makePullRequest({
      repository: {
        nameWithOwner: "external-owner/repo",
        stargazerCount: 50,
        owner: { login: "external-owner" },
        pushedAt: "2026-05-01T00:00:00.000Z",
      },
    });

    const result = calculateUserScore(
      makeUserScoreInput({ repos: [], pullRequests: [pr] }),
      "octocat",
    );

    expect(result.prScore).toBeGreaterThan(0);
    expect(result.signals.mergedExternalPRs).toBe(1);
  });

  test("repeated PRs to same repo use diminishing returns", () => {
    const prs = [
      makePullRequest({
        additions: 250,
        deletions: 80,
        repository: {
          nameWithOwner: "external-owner/repo",
          stargazerCount: 80,
          owner: { login: "external-owner" },
          pushedAt: "2026-05-01T00:00:00.000Z",
        },
      }),
      makePullRequest({
        additions: 120,
        deletions: 35,
        repository: {
          nameWithOwner: "external-owner/repo",
          stargazerCount: 80,
          owner: { login: "external-owner" },
          pushedAt: "2026-05-01T00:00:00.000Z",
        },
      }),
      makePullRequest({
        additions: 30,
        deletions: 10,
        repository: {
          nameWithOwner: "external-owner/repo",
          stargazerCount: 80,
          owner: { login: "external-owner" },
          pushedAt: "2026-05-01T00:00:00.000Z",
        },
      }),
    ];

    const result = calculateUserScore(
      makeUserScoreInput({ repos: [], pullRequests: prs }),
      "octocat",
    );

    const expectedScores = prs.map((pr) => expectedPRScore(pr, "octocat"));
    expect(result.prScore).toBeCloseTo(sumWithDiminishingReturns(expectedScores), 10);
  });

  test("PRs to different repos do not share diminishing returns", () => {
    const prs = [
      makePullRequest({
        additions: 180,
        deletions: 40,
        repository: {
          nameWithOwner: "external-owner/repo-a",
          stargazerCount: 60,
          owner: { login: "external-owner" },
          pushedAt: "2026-05-01T00:00:00.000Z",
        },
      }),
      makePullRequest({
        additions: 90,
        deletions: 20,
        repository: {
          nameWithOwner: "external-owner/repo-a",
          stargazerCount: 60,
          owner: { login: "external-owner" },
          pushedAt: "2026-05-01T00:00:00.000Z",
        },
      }),
      makePullRequest({
        additions: 220,
        deletions: 60,
        repository: {
          nameWithOwner: "external-owner/repo-b",
          stargazerCount: 60,
          owner: { login: "external-owner" },
          pushedAt: "2026-05-01T00:00:00.000Z",
        },
      }),
      makePullRequest({
        additions: 110,
        deletions: 25,
        repository: {
          nameWithOwner: "external-owner/repo-b",
          stargazerCount: 60,
          owner: { login: "external-owner" },
          pushedAt: "2026-05-01T00:00:00.000Z",
        },
      }),
    ];

    const result = calculateUserScore(
      makeUserScoreInput({ repos: [], pullRequests: prs }),
      "octocat",
    );

    expect(result.prScore).toBeCloseTo(sumPRScores(prs, "octocat"), 10);
    expect(result.signals.uniqueExternalPRRepos).toBe(2);
  });

  test("tiny PRs are penalized", () => {
    const tinyPr = makePullRequest({ additions: 1, deletions: 1 });
    const normalPr = makePullRequest({ additions: 60, deletions: 20 });

    const tiny = calculateUserScore(
      makeUserScoreInput({ repos: [], pullRequests: [tinyPr] }),
      "octocat",
    );
    const normal = calculateUserScore(
      makeUserScoreInput({ repos: [], pullRequests: [normalPr] }),
      "octocat",
    );

    expect(tiny.prScore).toBeLessThan(normal.prScore);
  });

  test("huge PRs are penalized", () => {
    const hugePr = makePullRequest({ additions: 8000, deletions: 2500 });
    const mediumPr = makePullRequest({ additions: 3000, deletions: 1000 });

    const huge = calculateUserScore(
      makeUserScoreInput({ repos: [], pullRequests: [hugePr] }),
      "octocat",
    );
    const medium = calculateUserScore(
      makeUserScoreInput({ repos: [], pullRequests: [mediumPr] }),
      "octocat",
    );

    expect(huge.prScore).toBeLessThan(medium.prScore);
  });

  test("zero-line PR does not produce NaN", () => {
    const pr = makePullRequest({ additions: 0, deletions: 0 });

    const result = calculateUserScore(
      makeUserScoreInput({ repos: [], pullRequests: [pr] }),
      "octocat",
    );

    expect(Number.isNaN(result.prScore)).toBe(false);
    expect(Number.isFinite(result.prScore)).toBe(true);
  });

  test("topPullRequests returns top 3 sorted by score", () => {
    const prs = [
      makePullRequest({
        title: "PR 1",
        additions: 10,
        deletions: 5,
        repository: {
          nameWithOwner: "external-owner/repo-1",
          stargazerCount: 10,
          owner: { login: "external-owner" },
          pushedAt: "2026-05-01T00:00:00.000Z",
        },
      }),
      makePullRequest({
        title: "PR 2",
        additions: 120,
        deletions: 40,
        repository: {
          nameWithOwner: "external-owner/repo-2",
          stargazerCount: 20,
          owner: { login: "external-owner" },
          pushedAt: "2026-05-01T00:00:00.000Z",
        },
      }),
      makePullRequest({
        title: "PR 3",
        additions: 250,
        deletions: 90,
        repository: {
          nameWithOwner: "external-owner/repo-3",
          stargazerCount: 30,
          owner: { login: "external-owner" },
          pushedAt: "2026-05-01T00:00:00.000Z",
        },
      }),
      makePullRequest({
        title: "PR 4",
        additions: 40,
        deletions: 10,
        repository: {
          nameWithOwner: "external-owner/repo-4",
          stargazerCount: 40,
          owner: { login: "external-owner" },
          pushedAt: "2026-05-01T00:00:00.000Z",
        },
      }),
    ];

    const result = calculateUserScore(
      makeUserScoreInput({ repos: [], pullRequests: prs }),
      "octocat",
    );

    expect(result.topPullRequests).toHaveLength(3);
    expect(result.topPullRequests[0].score).toBeGreaterThanOrEqual(
      result.topPullRequests[1].score,
    );
    expect(result.topPullRequests[1].score).toBeGreaterThanOrEqual(
      result.topPullRequests[2].score,
    );
  });
});
