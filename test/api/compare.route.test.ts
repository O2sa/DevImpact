import { beforeEach, describe, expect, test, vi } from "vitest";
import { GitHubApiError } from "@/lib/github-graphql-client";

const mocks = vi.hoisted(() => ({
  fetchGitHubUserData: vi.fn(),
  calculateUserScore: vi.fn(),
}));

vi.mock("@/lib/github", () => ({
  fetchGitHubUserData: mocks.fetchGitHubUserData,
}));

vi.mock("@/lib/score", () => ({
  calculateUserScore: mocks.calculateUserScore,
}));

import { GET } from "@/app/api/compare/route";

function makeRequest(params: Record<string, string | string[]>): Request {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        search.append(key, item);
      }
    } else {
      search.append(key, value);
    }
  }

  return new Request(`http://localhost/api/compare?${search.toString()}`, {
    method: "GET",
  });
}

function makeScore(finalScore: number) {
  return {
    repoScore: 10,
    prScore: 20,
    contributionScore: 3,
    finalScore,
    normalizedRepoScore: 30,
    normalizedPRScore: 40,
    normalizedContributionScore: 5,
    normalizedFinalScore: 35,
    topRepos: [],
    topPullRequests: [],
    topCommunityContributions: [],
    languageScores: undefined,
    signals: {
      reposAnalyzed: 1,
      pullRequestsAnalyzed: 1,
      mergedExternalPRs: 1,
      ownRepoPRsIgnored: 0,
      unmergedPRsIgnored: 0,
      uniqueExternalPRRepos: 1,
      issuesAnalyzed: 0,
      externalIssuesCounted: 0,
      discussionsAnalyzed: 0,
      externalDiscussionsCounted: 0,
    },
    explanations: {
      repo: [],
      pr: [],
      contribution: [],
      overall: [],
    },
  };
}

describe("GET /api/compare", () => {
  beforeEach(() => {
    mocks.fetchGitHubUserData.mockReset();
    mocks.calculateUserScore.mockReset();
  });

  test("returns structured friendly error when GitHub rate limit is hit", async () => {
    mocks.fetchGitHubUserData.mockRejectedValueOnce(
      new GitHubApiError({
        message: "API rate limit exceeded for user.",
        kind: "PRIMARY_RATE_LIMIT",
        status: 200,
        rateLimit: {
          limit: 5000,
          remaining: 0,
          used: 5000,
          resetAt: Math.floor(Date.now() / 1000) + 60,
          resource: "graphql",
        },
        retryAfterMs: 60_000,
      }),
    );

    const response = await GET(
      makeRequest({
        username: ["user-a", "user-b"],
      }),
    );
    const body = (await response.json()) as {
      success: boolean;
      error?: string;
      errorDetails?: { code?: string; retryAfterSeconds?: number; rateLimit?: unknown };
    };

    expect(response.status).toBe(429);
    expect(body.success).toBe(false);
    expect(body.errorDetails?.code).toBe("RATE_LIMITED");
    expect(body.errorDetails?.retryAfterSeconds).toBeUndefined();
    expect(body.errorDetails?.rateLimit).toBeUndefined();
  });

  test("returns success payload when both users are processed", async () => {
    mocks.fetchGitHubUserData.mockResolvedValueOnce({
      name: "User A",
      avatarUrl: "https://example.com/a.png",
      repos: [],
      pullRequests: [],
      contributions: {
        totalCommitContributions: 0,
        totalPullRequestContributions: 0,
        totalIssueContributions: 0,
      },
      issues: [],
      discussions: [],
    });
    mocks.fetchGitHubUserData.mockResolvedValueOnce({
      name: "User B",
      avatarUrl: "https://example.com/b.png",
      repos: [],
      pullRequests: [],
      contributions: {
        totalCommitContributions: 0,
        totalPullRequestContributions: 0,
        totalIssueContributions: 0,
      },
      issues: [],
      discussions: [],
    });

    mocks.calculateUserScore.mockReturnValueOnce(makeScore(20));
    mocks.calculateUserScore.mockReturnValueOnce(makeScore(10));

    const response = await GET(
      makeRequest({
        username: ["user-a", "user-b"],
      }),
    );
    const body = (await response.json()) as {
      success: boolean;
      users?: Array<{ username: string }>;
      winner?: { username: string };
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.users).toHaveLength(2);
    expect(body.winner?.username).toBe("user-a");
  });

  test("returns targeted username for not-found errors", async () => {
    mocks.fetchGitHubUserData.mockRejectedValueOnce(new Error("User not found"));

    const response = await GET(
      makeRequest({
        username: ["missing-user", "valid-user"],
      }),
    );
    const body = (await response.json()) as {
      success: boolean;
      errorDetails?: { code?: string; targetUsernames?: string[] };
    };

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.errorDetails?.code).toBe("GITHUB_NOT_FOUND");
    expect(body.errorDetails?.targetUsernames).toEqual(["missing-user"]);
  });
});
