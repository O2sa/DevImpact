import { describe, expect, test } from "vitest";
import {
  createGitHubUserDataFetcher,
  type GitHubFetcherDependencies,
} from "@/lib/github";
import {
  DEFAULT_GITHUB_CACHE_TTL_SECONDS,
  getCacheConfigFromEnv,
  type CacheStore,
} from "@/lib/cache-store";
import type { GitHubUserData } from "@/types/github";

type ExecuteCall = {
  operationName: string;
};

function makeExecutor(
  calls: ExecuteCall[],
  delayMs = 0,
): GitHubFetcherDependencies["executor"] {
  return {
    async execute<
      TData,
      TVariables extends Record<string, unknown>,
    >(params: {
      operationName: string;
      query: string;
      variables: TVariables;
    }): Promise<TData> {
      calls.push({
        operationName: params.operationName,
      });

      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      if (params.operationName === "FetchUserAndPullRequests") {
        return {
          user: {
            name: "User Name",
            avatarUrl: "https://example.com/avatar.png",
            repositories: {
              nodes: [
                {
                  name: "repo",
                  nameWithOwner: "owner/repo",
                  url: "https://github.com/owner/repo",
                  stargazerCount: 10,
                  forkCount: 2,
                  watchers: { totalCount: 5 },
                  isFork: false,
                  pushedAt: "2026-05-01T00:00:00.000Z",
                  languages: {
                    edges: [{ size: 100, node: { name: "TypeScript" } }],
                  },
                },
              ],
            },
            contributionsCollection: {
              totalCommitContributions: 0,
              totalPullRequestContributions: 0,
              totalIssueContributions: 0,
            },
          },
          pullRequests: {
            nodes: [
              {
                merged: true,
                additions: 10,
                deletions: 3,
                title: "Fix bug",
                url: "https://github.com/ext/repo/pull/1",
                repository: {
                  nameWithOwner: "ext/repo",
                  url: "https://github.com/ext/repo",
                  stargazerCount: 40,
                  pushedAt: "2026-05-01T00:00:00.000Z",
                  owner: { login: "ext" },
                  languages: {
                    edges: [{ size: 80, node: { name: "TypeScript" } }],
                  },
                },
              },
            ],
          },
        } as unknown as TData;
      }

      if (params.operationName === "FetchUserIssues") {
        return {
          issues: {
            nodes: [
              {
                title: "Issue",
                url: "https://github.com/ext/repo/issues/1",
                comments: { totalCount: 2 },
                repository: {
                  nameWithOwner: "ext/repo",
                  stargazerCount: 40,
                  owner: { login: "ext" },
                },
              },
            ],
          },
        } as unknown as TData;
      }

      if (params.operationName === "FetchUserDiscussions") {
        return {
          discussions: {
            nodes: [
              {
                title: "Discussion",
                url: "https://github.com/ext/repo/discussions/1",
                comments: { totalCount: 1 },
                repository: {
                  nameWithOwner: "ext/repo",
                  stargazerCount: 40,
                  owner: { login: "ext" },
                },
              },
            ],
          },
        } as unknown as TData;
      }

      throw new Error(`Unexpected operation: ${params.operationName}`);
    },
  };
}

function makeMemoryCache(
  options: {
    getImpl?: (key: string) => Promise<unknown>;
    setImpl?: (key: string, value: unknown, ttl?: number) => Promise<void>;
    delImpl?: (key: string) => Promise<void>;
    enabled?: boolean;
  } = {},
): CacheStore {
  return {
    enabled: options.enabled ?? true,
    async get<T>(key: string): Promise<T | undefined> {
      if (!options.getImpl) {
        return undefined;
      }
      const value = await options.getImpl(key);
      return value as T | undefined;
    },
    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
      if (options.setImpl) {
        await options.setImpl(key, value, ttl);
      }
    },
    async del(key: string): Promise<void> {
      if (options.delImpl) {
        await options.delImpl(key);
      }
    },
  };
}

function isGitHubUserData(value: unknown): value is GitHubUserData {
  return (
    typeof value === "object" &&
    value !== null &&
    "avatarUrl" in value &&
    "repos" in value &&
    "pullRequests" in value &&
    "contributions" in value
  );
}

describe("GitHub user data caching", () => {
  test("cache hit skips GitHub calls", async () => {
    const cachedPayload: GitHubUserData = {
      name: "Cached",
      avatarUrl: "https://example.com/cached.png",
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

    const calls: ExecuteCall[] = [];
    const fetcher = createGitHubUserDataFetcher({
      executor: makeExecutor(calls),
      cacheStore: makeMemoryCache({
        getImpl: async () => cachedPayload,
      }),
      cacheConfig: {
        namespace: "devimpact:v1",
        ttlSeconds: 604_800,
      },
    });

    const result = await fetcher("TeStUser");
    expect(result.name).toBe("Cached");
    expect(calls).toHaveLength(0);
  });

  test("cache miss fetches and stores data", async () => {
    const calls: ExecuteCall[] = [];
    const setCalls: Array<{ key: string; ttl?: number; value: unknown }> = [];

    const fetcher = createGitHubUserDataFetcher({
      executor: makeExecutor(calls),
      cacheStore: makeMemoryCache({
        getImpl: async () => undefined,
        setImpl: async (key, value, ttl) => {
          setCalls.push({ key, value, ttl });
        },
      }),
      cacheConfig: {
        namespace: "devimpact:v1",
        ttlSeconds: 604_800,
      },
    });

    const result = await fetcher("TeStUser");
    expect(isGitHubUserData(result)).toBe(true);
    expect(calls).toHaveLength(3);
    expect(setCalls).toHaveLength(1);
    expect(setCalls[0]?.ttl).toBe(604_800);
    expect(setCalls[0]?.key).toBe("devimpact:v1:github-user:testuser");
  });

  test("cache read failure falls back to GitHub fetch", async () => {
    const calls: ExecuteCall[] = [];
    const fetcher = createGitHubUserDataFetcher({
      executor: makeExecutor(calls),
      cacheStore: makeMemoryCache({
        getImpl: async () => {
          throw new Error("redis down");
        },
      }),
      cacheConfig: {
        namespace: "devimpact:v1",
        ttlSeconds: 604_800,
      },
    });

    const result = await fetcher("testuser");
    expect(result.name).toBe("User Name");
    expect(calls).toHaveLength(3);
  });

  test("cache write failure does not fail request", async () => {
    const calls: ExecuteCall[] = [];
    const fetcher = createGitHubUserDataFetcher({
      executor: makeExecutor(calls),
      cacheStore: makeMemoryCache({
        getImpl: async () => undefined,
        setImpl: async () => {
          throw new Error("write failed");
        },
      }),
      cacheConfig: {
        namespace: "devimpact:v1",
        ttlSeconds: 604_800,
      },
    });

    const result = await fetcher("testuser");
    expect(result.pullRequests).toHaveLength(1);
    expect(calls).toHaveLength(3);
  });

  test("corrupted cache payload is treated as miss", async () => {
    const calls: ExecuteCall[] = [];
    const deleted: string[] = [];
    const fetcher = createGitHubUserDataFetcher({
      executor: makeExecutor(calls),
      cacheStore: makeMemoryCache({
        getImpl: async () => ({ broken: true }),
        delImpl: async (key) => {
          deleted.push(key);
        },
      }),
      cacheConfig: {
        namespace: "devimpact:v1",
        ttlSeconds: 604_800,
      },
    });

    const result = await fetcher("testuser");
    expect(result.name).toBe("User Name");
    expect(calls).toHaveLength(3);
    expect(deleted).toEqual(["devimpact:v1:github-user:testuser"]);
  });

  test("single-flight dedupe joins concurrent same-key fetches", async () => {
    const calls: ExecuteCall[] = [];
    const fetcher = createGitHubUserDataFetcher({
      executor: makeExecutor(calls, 20),
      cacheStore: makeMemoryCache({
        getImpl: async () => undefined,
      }),
      cacheConfig: {
        namespace: "devimpact:v1",
        ttlSeconds: 604_800,
      },
    });

    const [first, second] = await Promise.all([
      fetcher("testuser"),
      fetcher("TestUser"),
    ]);

    expect(first.avatarUrl).toBe(second.avatarUrl);
    expect(calls).toHaveLength(3);
  });

  test("default cache TTL is seven days", () => {
    const config = getCacheConfigFromEnv({} as NodeJS.ProcessEnv);
    expect(config.ttlSeconds).toBe(DEFAULT_GITHUB_CACHE_TTL_SECONDS);
  });
});
