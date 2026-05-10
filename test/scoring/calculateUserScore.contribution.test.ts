import { describe, expect, test } from "vitest";

import { calculateUserScore } from "@/lib/score";
import {
  makeContributions,
  makeDiscussion,
  makeIssue,
  makePullRequest,
  makeRepo,
  makeUserScoreInput,
} from "@/test/fixtures/github";
import { expectedCommunityScore } from "@/test/helpers/score";

describe("calculateUserScore - contribution scoring", () => {
  test("commits are not counted", () => {
    const withCommitTotals = calculateUserScore(
      makeUserScoreInput({
        repos: [],
        pullRequests: [],
        contributions: makeContributions({
          totalCommitContributions: 10_000,
          totalPullRequestContributions: 0,
          totalIssueContributions: 0,
        }),
      }),
      "octocat",
    );

    expect(withCommitTotals.contributionScore).toBe(0);
  });

  test("PR contribution totals are not counted", () => {
    const withPrTotals = calculateUserScore(
      makeUserScoreInput({
        repos: [],
        pullRequests: [],
        contributions: makeContributions({
          totalCommitContributions: 0,
          totalPullRequestContributions: 10_000,
          totalIssueContributions: 0,
        }),
      }),
      "octocat",
    );

    expect(withPrTotals.contributionScore).toBe(0);
  });

  test("issues in own repos are ignored", () => {
    const ownIssue = makeIssue({
      repository: {
        nameWithOwner: "octocat/repo",
        stargazerCount: 100,
        owner: { login: "octocat" },
      },
    });

    const result = calculateUserScore(
      makeUserScoreInput({
        repos: [],
        pullRequests: [],
        issues: [ownIssue],
      }),
      "OcToCaT",
    );

    expect(result.contributionScore).toBe(0);
    expect(result.signals.externalIssuesCounted).toBe(0);
  });

  test("external issues are counted", () => {
    const externalIssue = makeIssue({
      comments: { totalCount: 6 },
      reactions: {
        thumbsUp: 3,
        thumbsDown: 0,
        heart: 1,
        hooray: 1,
        rocket: 0,
        eyes: 1,
        confused: 0,
        laugh: 0,
      },
      repository: {
        nameWithOwner: "external-owner/repo",
        stargazerCount: 120,
        owner: { login: "external-owner" },
      },
    });

    const result = calculateUserScore(
      makeUserScoreInput({
        repos: [
          makeRepo({
            stargazerCount: 5000,
            forkCount: 1000,
            watchers: { totalCount: 500 },
          }),
        ],
        pullRequests: [],
        issues: [externalIssue],
      }),
      "octocat",
    );

    expect(result.contributionScore).toBeCloseTo(expectedCommunityScore(externalIssue), 10);
    expect(result.signals.externalIssuesCounted).toBe(1);
  });

  test("discussions are counted when provided", () => {
    const discussion = makeDiscussion({
      comments: { totalCount: 4 },
      reactions: {
        thumbsUp: 2,
        thumbsDown: 0,
        heart: 1,
        hooray: 0,
        rocket: 1,
        eyes: 1,
        confused: 0,
        laugh: 0,
      },
      repository: {
        nameWithOwner: "external-owner/repo",
        stargazerCount: 80,
        owner: { login: "external-owner" },
      },
    });

    const result = calculateUserScore(
      makeUserScoreInput({
        repos: [
          makeRepo({
            stargazerCount: 5000,
            forkCount: 1000,
            watchers: { totalCount: 500 },
          }),
        ],
        pullRequests: [],
        discussions: [discussion],
      }),
      "octocat",
    );

    expect(result.contributionScore).toBeGreaterThan(0);
    expect(result.signals.externalDiscussionsCounted).toBe(1);
  });

  test("issues with negative reactions are penalized", () => {
    const positiveIssue = makeIssue({
      comments: { totalCount: 2 },
      reactions: {
        thumbsUp: 12,
        thumbsDown: 0,
        heart: 1,
        hooray: 0,
        rocket: 0,
        eyes: 1,
        confused: 0,
        laugh: 0,
      },
      repository: {
        nameWithOwner: "external-owner/repo",
        stargazerCount: 60,
        owner: { login: "external-owner" },
      },
    });
    const negativeIssue = makeIssue({
      comments: { totalCount: 2 },
      reactions: {
        thumbsUp: 1,
        thumbsDown: 10,
        heart: 0,
        hooray: 0,
        rocket: 0,
        eyes: 0,
        confused: 4,
        laugh: 0,
      },
      repository: positiveIssue.repository,
    });

    const positiveResult = calculateUserScore(
      makeUserScoreInput({
        repos: [
          makeRepo({
            stargazerCount: 5000,
            forkCount: 1000,
            watchers: { totalCount: 500 },
          }),
        ],
        pullRequests: [],
        issues: [positiveIssue],
      }),
      "octocat",
    );
    const negativeResult = calculateUserScore(
      makeUserScoreInput({
        repos: [
          makeRepo({
            stargazerCount: 5000,
            forkCount: 1000,
            watchers: { totalCount: 500 },
          }),
        ],
        pullRequests: [],
        issues: [negativeIssue],
      }),
      "octocat",
    );

    expect(negativeResult.contributionScore).toBeLessThan(positiveResult.contributionScore);
  });

  test("issues with zero comments and reactions get reduced score", () => {
    const emptySignalIssue = makeIssue({
      comments: { totalCount: 0 },
      reactions: {
        thumbsUp: 0,
        thumbsDown: 0,
        heart: 0,
        hooray: 0,
        rocket: 0,
        eyes: 0,
        confused: 0,
        laugh: 0,
      },
      repository: {
        nameWithOwner: "external-owner/repo",
        stargazerCount: 500,
        owner: { login: "external-owner" },
      },
    });
    const meaningfulIssue = makeIssue({
      comments: { totalCount: 5 },
      reactions: {
        thumbsUp: 5,
        thumbsDown: 0,
        heart: 1,
        hooray: 1,
        rocket: 1,
        eyes: 1,
        confused: 0,
        laugh: 0,
      },
      repository: emptySignalIssue.repository,
    });

    const emptySignalResult = calculateUserScore(
      makeUserScoreInput({
        repos: [
          makeRepo({
            stargazerCount: 5000,
            forkCount: 1000,
            watchers: { totalCount: 500 },
          }),
        ],
        pullRequests: [],
        issues: [emptySignalIssue],
      }),
      "octocat",
    );
    const meaningfulResult = calculateUserScore(
      makeUserScoreInput({
        repos: [
          makeRepo({
            stargazerCount: 5000,
            forkCount: 1000,
            watchers: { totalCount: 500 },
          }),
        ],
        pullRequests: [],
        issues: [meaningfulIssue],
      }),
      "octocat",
    );

    expect(emptySignalResult.contributionScore).toBeLessThan(meaningfulResult.contributionScore);
  });

  test("contribution score is capped at 30% of repo + PR scores", () => {
    const result = calculateUserScore(
      makeUserScoreInput({
        repos: [
          makeRepo({
            stargazerCount: 10,
            forkCount: 2,
            watchers: { totalCount: 1 },
          }),
        ],
        pullRequests: [
          makePullRequest({
            additions: 40,
            deletions: 10,
            repository: {
              nameWithOwner: "external-owner/repo",
              stargazerCount: 20,
              owner: { login: "external-owner" },
              pushedAt: "2026-05-01T00:00:00.000Z",
            },
          }),
        ],
        issues: Array.from({ length: 10 }, (_, index) =>
          makeIssue({
            title: `Issue ${index + 1}`,
            comments: { totalCount: 20 },
            reactions: {
              thumbsUp: 10,
              thumbsDown: 0,
              heart: 3,
              hooray: 2,
              rocket: 2,
              eyes: 2,
              confused: 0,
              laugh: 1,
            },
            repository: {
              nameWithOwner: `external-owner/repo-${index + 1}`,
              stargazerCount: 500 + index * 20,
              owner: { login: "external-owner" },
            },
          }),
        ),
      }),
      "octocat",
    );

    expect(result.contributionScore).toBeCloseTo(
      0.3 * (result.repoScore + result.prScore),
      10,
    );
  });
});
