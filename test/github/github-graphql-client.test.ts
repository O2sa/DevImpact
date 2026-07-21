import "dotenv/config";

import { describe, expect, test } from "vitest";
import {
  GitHubApiError,
  GitHubGraphQLClient,
  classifyGitHubError,
  computeRetryDelayMs,
  parseRateLimitHeaders,
} from "@/lib/github-graphql-client";

function makeHeaders(values: Record<string, string>): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(values)) {
    headers.set(key, value);
  }
  return headers;
}

describe("github graphql client helpers", () => {
  test("parseRateLimitHeaders extracts header values", () => {
    const headers = makeHeaders({
      "x-ratelimit-limit": "5000",
      "x-ratelimit-remaining": "1234",
      "x-ratelimit-used": "3766",
      "x-ratelimit-reset": "2000000000",
      "x-ratelimit-resource": "graphql",
      "retry-after": "30",
    });

    const parsed = parseRateLimitHeaders(headers);
    expect(parsed.limit).toBe(5000);
    expect(parsed.remaining).toBe(1234);
    expect(parsed.used).toBe(3766);
    expect(parsed.resetAt).toBe(2000000000);
    expect(parsed.resource).toBe("graphql");
    expect(parsed.retryAfterSeconds).toBe(30);
  });

  test("classifyGitHubError detects primary rate limit from 200 response", () => {
    const kind = classifyGitHubError({
      status: 200,
      errors: [{ message: "API rate limit exceeded for user." }],
      rateLimit: { remaining: 0 },
    });

    expect(kind).toBe("PRIMARY_RATE_LIMIT");
  });

  test("classifyGitHubError detects secondary rate limit", () => {
    const kind = classifyGitHubError({
      status: 403,
      errors: [{ message: "You have exceeded a secondary rate limit." }],
      rateLimit: { remaining: 200 },
    });

    expect(kind).toBe("SECONDARY_RATE_LIMIT");
  });

  test("computeRetryDelayMs honors retry-after", () => {
    const delay = computeRetryDelayMs(0, "SECONDARY_RATE_LIMIT", {
      retryAfterSeconds: 7,
    });

    expect(delay).toBe(7000);
  });

  test("computeRetryDelayMs uses reset header when remaining is zero", () => {
    const delay = computeRetryDelayMs(
      0,
      "PRIMARY_RATE_LIMIT",
      { remaining: 0, resetAt: 1005 },
      1_000_000,
    );

    expect(delay).toBe(5000);
  });

  test("computeRetryDelayMs uses secondary fallback with jitter", () => {
    const delay = computeRetryDelayMs(1, "SECONDARY_RATE_LIMIT", {}, 0);
    expect(delay).toBeGreaterThanOrEqual(60000);
  });
});

describe("GitHubGraphQLClient scheduling and retry behavior", () => {
  test("serializes requests when maxConcurrency is 1", async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    const fetchImpl: typeof fetch = async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 20));
      inFlight -= 1;

      return new Response(JSON.stringify({ data: { viewer: { login: "octocat" } } }), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-ratelimit-limit": "5000",
          "x-ratelimit-remaining": "4999",
          "x-ratelimit-used": "1",
          "x-ratelimit-reset": "2000000000",
          "x-ratelimit-resource": "graphql",
        },
      });
    };

    const client = new GitHubGraphQLClient({
      token: "test",
      maxRetries: 0,
      maxConcurrency: 1,
      baseDelayMs: 0,
      fetchImpl,
    });

    await Promise.all([
      client.execute<{ viewer: { login: string } }, Record<string, never>>({
        operationName: "OpOne",
        query: "query OpOne { viewer { login } }",
        variables: {},
      }),
      client.execute<{ viewer: { login: string } }, Record<string, never>>({
        operationName: "OpTwo",
        query: "query OpTwo { viewer { login } }",
        variables: {},
      }),
    ]);

    expect(maxInFlight).toBe(1);
  });

  test("throws typed GitHubApiError for primary rate limit response", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          errors: [{ message: "API rate limit exceeded for user." }],
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
            "x-ratelimit-limit": "5000",
            "x-ratelimit-remaining": "0",
            "x-ratelimit-used": "5000",
            "x-ratelimit-reset": "2000000000",
            "x-ratelimit-resource": "graphql",
          },
        },
      );

    const client = new GitHubGraphQLClient({
      token: "test",
      maxRetries: 0,
      baseDelayMs: 0,
      fetchImpl,
    });

    await expect(
      client.execute<{ viewer: { login: string } }, Record<string, never>>({
        operationName: "RateLimited",
        query: "query RateLimited { viewer { login } }",
        variables: {},
      }),
    ).rejects.toBeInstanceOf(GitHubApiError);
  });
});
