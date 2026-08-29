import { beforeEach, describe, expect, test, vi } from "vitest";
import { GitHubApiError } from "@/lib/github-graphql-client";

const mocks = vi.hoisted(() => ({
  getUserData: vi.fn(),
  calculateUserScore: vi.fn(),
}));

vi.mock("@/lib/github", () => ({
  getUserData: mocks.getUserData,
}));

vi.mock("@/lib/score", () => ({
  calculateUserScore: mocks.calculateUserScore,
}));

import { GET } from "@/app/api/user/[username]/route";
import { getUserProfile } from "@/lib/user";

function makeUser(login: string, name: string) {
  return {
    login,
    name,
    avatarUrl: `https://example.com/${login}.png`,
    location: "Stockholm, Sweden",
    repos: [],
    pullRequests: [],
    contributions: {
      totalCommitContributions: 0,
      totalPullRequestContributions: 0,
      totalIssueContributions: 0,
    },
    issues: [],
    discussions: [],
  };
}

function makeScore(finalScore: number) {
  return {
    repoScore: 15,
    prScore: 25,
    contributionScore: 5,
    finalScore,
    normalizedRepoScore: 35,
    normalizedPRScore: 45,
    normalizedContributionScore: 10,
    normalizedFinalScore: 40,
    topRepos: [
      {
        name: "test-repo",
        url: "https://github.com/torvalds/test-repo",
        stars: 100,
        forks: 20,
        watchers: 100,
        score: 15,
      },
    ],
    topPullRequests: [
      {
        repo: "torvalds/linux",
        stars: 500,
        score: 25,
        title: "Kernel patch",
        url: "https://github.com/torvalds/linux/pull/1",
        additions: 100,
        deletions: 20,
      },
    ],
    topCommunityContributions: [
      {
        type: "issue" as const,
        title: "Test issue",
        url: "https://github.com/torvalds/linux/issues/2",
        repo: "torvalds/linux",
        stars: 50,
        comments: 10,
        score: 5,
      },
    ],
    signals: {
      reposAnalyzed: 10,
      pullRequestsAnalyzed: 5,
      mergedExternalPRs: 3,
      ownRepoPRsIgnored: 2,
      unmergedPRsIgnored: 0,
      uniqueExternalPRRepos: 2,
      issuesAnalyzed: 4,
      externalIssuesCounted: 2,
      discussionsAnalyzed: 1,
      externalDiscussionsCounted: 1,
    },
    explanations: {
      repo: [],
      pr: [],
      contribution: [],
      overall: [],
    },
    scoreVersion: "1.0",
  };
}

describe("GET /api/user/[username]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns user profile result for valid username", async () => {
    const rawUser = makeUser("torvalds", "Linus Torvalds");
    mocks.getUserData.mockResolvedValueOnce({
      data: rawUser,
      metrics: { duration: 100, errors: [] },
    });
    mocks.calculateUserScore.mockReturnValueOnce(makeScore(40));

    const request = new Request("http://localhost/api/user/torvalds");
    const response = await GET(request, {
      params: Promise.resolve({ username: "torvalds" }),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      success: boolean;
      user: {
        username: string;
        name: string;
        finalScore: number;
        repoScore: number;
        prScore: number;
        contributionScore: number;
      };
      location: string;
    };

    expect(body.success).toBe(true);
    expect(body.user.username).toBe("torvalds");
    expect(body.user.name).toBe("Linus Torvalds");
    expect(body.user.finalScore).toBe(40);
    expect(body.location).toBe("Stockholm, Sweden");
  });

  test("returns 404 when user is not found on GitHub", async () => {
    mocks.getUserData.mockRejectedValueOnce(
      new GitHubApiError({
        message: "Could not resolve to a User with the login of 'missing'.",
        kind: "NOT_FOUND",
        status: 200,
        rateLimit: {},
      }),
    );

    const request = new Request("http://localhost/api/user/missing");
    const response = await GET(request, {
      params: Promise.resolve({ username: "missing" }),
    });

    expect(response.status).toBe(404);
    const body = (await response.json()) as {
      success: boolean;
      error: string;
      errorDetails: { code: string };
    };

    expect(body.success).toBe(false);
    expect(body.errorDetails.code).toBe("GITHUB_NOT_FOUND");
  });

  test("returns 429 when GitHub rate limit is hit", async () => {
    mocks.getUserData.mockRejectedValueOnce(
      new GitHubApiError({
        message: "API rate limit exceeded",
        kind: "PRIMARY_RATE_LIMIT",
        status: 403,
        rateLimit: { remaining: 0, retryAfterSeconds: 60 },
      }),
    );

    const request = new Request("http://localhost/api/user/ratelimited");
    const response = await GET(request, {
      params: Promise.resolve({ username: "ratelimited" }),
    });

    expect(response.status).toBe(429);
  });

  test("returns 400 when username is empty", async () => {
    const request = new Request("http://localhost/api/user/");
    const response = await GET(request, {
      params: Promise.resolve({ username: "   " }),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
  });

  test("getUserProfile helper calculates score and extracts signals correctly", async () => {
    const rawUser = makeUser("octocat", "The Octocat");
    mocks.getUserData.mockResolvedValueOnce({
      data: rawUser,
      metrics: { duration: 50, errors: [] },
    });
    mocks.calculateUserScore.mockReturnValueOnce(makeScore(55));

    const result = await getUserProfile("octocat");

    expect(result.user.username).toBe("octocat");
    expect(result.user.finalScore).toBe(55);
    expect(result.location).toBe("Stockholm, Sweden");
    expect(result.user.topRepos.length).toBe(1);
    expect(result.user.signals?.reposAnalyzed).toBe(10);
  });
});
