import {
  createCacheStore,
  getCacheConfigFromEnv,
  type CacheConfig,
  type CacheStore,
} from "@/lib/cache-store";
import { GitHubGraphQLClient } from "@/lib/github-graphql-client";
import type {
  DiscussionNode,
  GitHubUserData,
  IssueNode,
  PullRequestNode,
  RepoNode,
} from "@/types/github";

export type UserFetchMetrics = {
  duration: number;
  errors: { part: string; reason: string }[];
};

type Logger = Pick<Console, "info" | "warn">;

type GitHubRawUser = { 
  login: string;
  name: string | null;
  avatarUrl: string;
  location: string | null;
  repositories: { nodes: Array<RepoNode | null> };
  contributionsCollection: {
    totalCommitContributions: number;
    totalPullRequestContributions: number;
    totalIssueContributions: number;
  };
};

type RawIssueNode = {
  title: string;
  url?: string;
  comments: { totalCount: number };
  repository: {
    nameWithOwner: string;
    stargazerCount: number;
    owner: { login: string };
  };
};

type RawDiscussionNode = {
  title: string;
  url?: string;
  comments: { totalCount: number };
  repository: {
    nameWithOwner: string;
    stargazerCount: number;
    owner: { login: string };
  };
};

type PageInfo = {
  hasNextPage: boolean;
  endCursor: string | null;
};

type GitHubQueryExecutor = Pick<GitHubGraphQLClient, "execute">;

export type GitHubFetcherDependencies = {
  executor: GitHubQueryExecutor;
  cacheStore: CacheStore;
  cacheConfig: Pick<CacheConfig, "namespace" | "ttlSeconds">;
  logger?: Logger;
};

const DEFAULT_GITHUB_REPO_COUNT = 50;
const DEFAULT_GITHUB_PR_COUNT = 300;
const DEFAULT_GITHUB_ISSUE_COUNT = 100;
const DEFAULT_GITHUB_DISCUSSION_COUNT = 50;


const MAX_GITHUB_REPO_COUNT = 100;
const MAX_GITHUB_PR_COUNT = 1000;
const MAX_GITHUB_ISSUE_COUNT = 100;
const MAX_GITHUB_DISCUSSION_COUNT = 100;

export function parseCountEnv(
  value: string | undefined,
  fallback: number,
  maxValue: number,
): number{

  const parsed = Number.parseInt(value ?? "", 10);
  if(!Number.isInteger(parsed)|| parsed<=0){
    return fallback;
  }
  return Math.min(parsed, maxValue);

}

const USER_QUERY = /* GraphQL */ `
  query FetchUser($login: String!, $repoCount: Int = 100) {
    user(login: $login) {
      login
      name
      avatarUrl(size: 80)
      location
      repositories(
        first: $repoCount
        privacy: PUBLIC
        ownerAffiliations: OWNER
        orderBy: { field: STARGAZERS, direction: DESC }
      ) {
        nodes {
          name
          nameWithOwner
          url
          isFork
          stargazerCount
          forkCount
          pushedAt
          watchers {
            totalCount
          }
          languages(first: 5, orderBy: { field: SIZE, direction: DESC }) {
            edges {
              size
              node {
                name
              }
            }
          }
        }
      }
    }
  }
`;

const PULL_REQUESTS_SEARCH_FRAGMENT = `
  pageInfo { hasNextPage endCursor }
  nodes {
    ... on PullRequest {
      merged
      additions
      deletions
      title
      url
      repository {
        nameWithOwner
        url
        stargazerCount
        pushedAt
        owner {
          login
        }
        languages(first: 5, orderBy: { field: SIZE, direction: DESC }) {
          edges {
            size
            node {
              name
            }
          }
        }
      }
    }
  }
`;

const PULL_REQUESTS_QUERY = /* GraphQL */ `
  query FetchUserPullRequests($prCount: Int = 100, $externalPrQuery: String!, $prCursor: String) {
    pullRequests: search(query: $externalPrQuery, type: ISSUE, first: $prCount, after: $prCursor) {
      ${PULL_REQUESTS_SEARCH_FRAGMENT}
    }
  }
`;

const ISSUES_QUERY = /* GraphQL */ `
  query FetchUserIssues($issueCount: Int = 100, $externalIssueQuery: String!, $issueCursor: String) {
    issues: search(query: $externalIssueQuery, type: ISSUE, first: $issueCount, after: $issueCursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        ... on Issue {
          title
          url
          comments {
            totalCount
          }
          repository {
            nameWithOwner
            stargazerCount
            owner {
              login
            }
          }
        }
      }
    }
  }
`;

const DISCUSSIONS_QUERY = /* GraphQL */ `
  query FetchUserDiscussions(
    $discussionCount: Int = 100
    $externalDiscussionQuery: String!
    $discussionCursor: String
  ) {
    discussions: search(
      query: $externalDiscussionQuery
      type: DISCUSSION
      first: $discussionCount
      after: $discussionCursor
    ) {
      pageInfo { hasNextPage endCursor }
      nodes {
        ... on Discussion {
          title
          url
          comments {
            totalCount
          }
          repository {
            nameWithOwner
            stargazerCount
            owner {
              login
            }
          }
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Search pagination helper
// ---------------------------------------------------------------------------

type SearchPaginateParams<TNode> = {
  operationName: string;
  query: string;
  buildVariables: (cursor: string | null, pageSize: number) => Record<string, unknown>;
  extractField: (data: Record<string, unknown>) => {
    nodes: Array<TNode | null>;
    pageInfo: PageInfo;
  } | undefined;
  maxPages?: number;
  maxItems?: number;
};

const SEARCH_PAGE_SIZE = 100;
const DEFAULT_MAX_SEARCH_PAGES = 10;

async function paginateSearch<TNode>(
  executor: GitHubQueryExecutor,
  params: SearchPaginateParams<TNode>,
): Promise<Array<TNode>> {
  const maxPages = params.maxPages ?? DEFAULT_MAX_SEARCH_PAGES;
  const maxItems = params.maxItems;
  const allNodes: Array<TNode> = [];
  let cursor: string | null = null;

  for (let page = 0; page < maxPages; page += 1) {
    const remainingItems =
      maxItems === undefined ? undefined : Math.max(0, maxItems - allNodes.length);
    if (remainingItems === 0) {
      break;
    }

    const pageSize =
      remainingItems === undefined
        ? SEARCH_PAGE_SIZE
        : Math.min(SEARCH_PAGE_SIZE, remainingItems);

    const variables = params.buildVariables(cursor, pageSize);
    const data = await executor.execute<
      Record<string, unknown>,
      Record<string, unknown>
    >({
      operationName: params.operationName,
      query: params.query,
      variables,
    });

    const field = params.extractField(data);
    if (!field) {
      break;
    }

    const pageNodes = field.nodes.filter(isDefined);
    allNodes.push(...pageNodes);

    if (maxItems !== undefined && allNodes.length >= maxItems) {
      break;
    }

    if (!field.pageInfo.hasNextPage || !field.pageInfo.endCursor) {
      break;
    }

    cursor = field.pageInfo.endCursor;
  }

  return allNodes;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isGitHubUserData(value: unknown): value is GitHubUserData {
  if (!isObject(value)) {
    return false;
  }

  const candidate = value as Partial<GitHubUserData>;
  if (
    !(typeof candidate.name === "string" || candidate.name === null) ||
    typeof candidate.avatarUrl !== "string" ||
    !Array.isArray(candidate.repos) ||
    !Array.isArray(candidate.pullRequests) 
  ) {
    return false;
  }

  if (candidate.issues !== undefined && !Array.isArray(candidate.issues)) {
    return false;
  }
  if (
    candidate.discussions !== undefined &&
    !Array.isArray(candidate.discussions)
  ) {
    return false;
  }

  return true;
}

function toIssueNode(item: RawIssueNode): IssueNode {
  return {
    title: item.title,
    url: item.url,
    comments: item.comments,
    repository: item.repository,
  };
}

function toDiscussionNode(item: RawDiscussionNode): DiscussionNode {
  return {
    title: item.title,
    url: item.url,
    comments: item.comments,
    repository: item.repository,
  };
}

export function normalizeGitHubUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function buildGitHubUserCacheKey(
  username: string,
  namespace: string,
): string {
  return `${namespace}:github-user:${normalizeGitHubUsername(username)}`;
}



// ---------------------------------------------------------------------------
// Core data fetch
// ---------------------------------------------------------------------------

async function fetchUserDataFromGitHub(
  executor: GitHubQueryExecutor,
  username: string,
): Promise<{ data: GitHubUserData; metrics: UserFetchMetrics }> {
  const externalPrQuery = `type:pr is:merged author:${username} -user:${username}`;
  const externalIssueQuery = `type:issue author:${username} -user:${username}`;
  const externalDiscussionQuery = `author:${username} -user:${username}`;

  const startTime = performance.now();
  const fetchErrors: { part: string; reason: string }[] = [];

  
const repoCount = parseCountEnv(
  process.env.GITHUB_REPO_COUNT,
  DEFAULT_GITHUB_REPO_COUNT,
  MAX_GITHUB_REPO_COUNT,
);

const prCount = parseCountEnv(
  process.env.GITHUB_PR_COUNT,
  DEFAULT_GITHUB_PR_COUNT,
  MAX_GITHUB_PR_COUNT,
);

const issueCount = parseCountEnv(
  process.env.GITHUB_ISSUE_COUNT,
  DEFAULT_GITHUB_ISSUE_COUNT,
  MAX_GITHUB_ISSUE_COUNT,
);

const discussionCount = parseCountEnv(
  process.env.GITHUB_DISCUSSION_COUNT,
  DEFAULT_GITHUB_DISCUSSION_COUNT,
  MAX_GITHUB_DISCUSSION_COUNT,
);

  const [userResult, prResult, issuesResult, discussionsResult] = await Promise.allSettled([
    executor.execute<
      { user: GitHubRawUser | null },
      { login: string; repoCount: number }
    >({
      operationName: "FetchUser",
      query: USER_QUERY,
      variables: { login: username, repoCount },
    }),
    paginateSearch<PullRequestNode>(executor, {
      operationName: "FetchUserPullRequests",
      query: PULL_REQUESTS_QUERY,
      buildVariables: (cursor, pageSize) => ({
        prCount: pageSize,
        externalPrQuery,
        prCursor: cursor,
      }),
      extractField: (data) =>
        data.pullRequests as
          | { nodes: Array<PullRequestNode | null>; pageInfo: PageInfo }
          | undefined,
      maxItems: prCount,
    }),
    paginateSearch<IssueNode>(executor, {
      operationName: "FetchUserIssues",
      query: ISSUES_QUERY,
      buildVariables: (cursor, pageSize) => ({
        issueCount: pageSize,
        externalIssueQuery,
        issueCursor: cursor,
      }),
      extractField: (data) =>
        data.issues as
          | { nodes: Array<RawIssueNode | null>; pageInfo: PageInfo }
          | undefined,
      maxItems: issueCount,
    }),
    paginateSearch<DiscussionNode>(executor, {
      operationName: "FetchUserDiscussions",
      query: DISCUSSIONS_QUERY,
      buildVariables: (cursor, pageSize) => ({
        discussionCount: pageSize,
        externalDiscussionQuery,
        discussionCursor: cursor,
      }),
      extractField: (data) =>
        data.discussions as
          | { nodes: Array<RawDiscussionNode | null>; pageInfo: PageInfo }
          | undefined,
      maxItems: discussionCount,
    }),
  ]);

  if (userResult.status === "rejected") {
    fetchErrors.push({ part: "user", reason: userResult.reason?.message ?? String(userResult.reason) });
  }
  if (prResult.status === "rejected") {
    fetchErrors.push({ part: "pullRequests", reason: prResult.reason?.message ?? String(prResult.reason) });
  }
  if (issuesResult.status === "rejected") {
    fetchErrors.push({ part: "issues", reason: issuesResult.reason?.message ?? String(issuesResult.reason) });
  }
  if (discussionsResult.status === "rejected") {
    fetchErrors.push({ part: "discussions", reason: discussionsResult.reason?.message ?? String(discussionsResult.reason) });
  }

  if (userResult.status === "rejected") {
    throw userResult.reason;
  }

  if (!userResult.value.user) {
    throw new Error("User not found");
  }

  const user = userResult.value.user;
  const pullRequests = prResult.status === "fulfilled" ? prResult.value : [];
  const issues = issuesResult.status === "fulfilled" ? issuesResult.value : [];
  const discussions = discussionsResult.status === "fulfilled" ? discussionsResult.value : [];

  const duration = performance.now() - startTime;

  const userData: GitHubUserData = {
      login: user.login,
      name: user.name,
      avatarUrl: user.avatarUrl,
      location: user.location,
      repos: user.repositories.nodes.filter(isDefined),
      pullRequests,
      issues: issues.map(toIssueNode),
      discussions: discussions.map(toDiscussionNode),
  };

  const metrics: UserFetchMetrics = {
    duration,
    errors: fetchErrors,
  };

  return { data: userData, metrics };
}

// Wrapper to maintain the old function signature for existing callers
async function fetchUserDataFromGitHubWrapper(
  executor: GitHubQueryExecutor,
  username: string,
): Promise<GitHubUserData> {
  const { data } = await fetchUserDataFromGitHub(executor, username);
  return data;
}

// ---------------------------------------------------------------------------
// Fetcher factory (caching + single-flight)
// ---------------------------------------------------------------------------

export function createGitHubUserDataFetcherWithMetrics(
  dependencies: GitHubFetcherDependencies,
): (username: string) => Promise<{ data: GitHubUserData; metrics: UserFetchMetrics }> {
  const inFlightByCacheKey = new Map<string, Promise<{ data: GitHubUserData; metrics: UserFetchMetrics }>>();
  const logger = dependencies.logger ?? console;

  return async (username: string): Promise<{ data: GitHubUserData; metrics: UserFetchMetrics }> => {
    const normalizedUsername = normalizeGitHubUsername(username);
    if (!normalizedUsername) {
      throw new Error("Username is required");
    }

    const cacheKey = buildGitHubUserCacheKey(
      normalizedUsername,
      dependencies.cacheConfig.namespace,
    );

    // Caching logic remains the same, but we now cache the { data, metrics } object
    if (dependencies.cacheStore.enabled) {
      try {
        const cached = await dependencies.cacheStore.get<unknown>(cacheKey);
        if (cached !== undefined) {
          // A simple check to see if it's our object.
          if (isObject(cached) && 'data' in cached && 'metrics' in cached && isGitHubUserData(cached.data)) {
            logger.info("cache-hit", { key: cacheKey });
            return cached as { data: GitHubUserData; metrics: UserFetchMetrics };
          }
          logger.warn("cache-corrupt", { key: cacheKey });
          await dependencies.cacheStore.del?.(cacheKey);
        } else {
          logger.info("cache-miss", { key: cacheKey });
        }
      } catch (error: unknown) {
        logger.warn("cache-read-fail", {
          key: cacheKey,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const inFlight = inFlightByCacheKey.get(cacheKey);
    if (inFlight) {
      logger.info("single-flight-join", { key: cacheKey });
      return inFlight;
    }

    const request = (async () => {
      const freshResult = await fetchUserDataFromGitHub(
        dependencies.executor,
        normalizedUsername,
      );

      if (dependencies.cacheStore.enabled) {
        try {
          await dependencies.cacheStore.set(
            cacheKey,
            freshResult,
            dependencies.cacheConfig.ttlSeconds,
          );
        } catch (error: unknown) {
          logger.warn("cache-set-fail", {
            key: cacheKey,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }

      return freshResult;
    })().finally(() => {
      inFlightByCacheKey.delete(cacheKey);
    });

    inFlightByCacheKey.set(cacheKey, request);
    return request;
  };
}

// ---------------------------------------------------------------------------
// Fetcher factory (caching + single-flight)
// ---------------------------------------------------------------------------

export function createGitHubUserDataFetcher(
  dependencies: GitHubFetcherDependencies,
): (username: string) => Promise<GitHubUserData> {
  const inFlightByCacheKey = new Map<string, Promise<GitHubUserData>>();
  const logger = dependencies.logger ?? console;

  return async (username: string): Promise<GitHubUserData> => {
    const normalizedUsername = normalizeGitHubUsername(username);
    if (!normalizedUsername) {
      throw new Error("Username is required");
    }

    const cacheKey = buildGitHubUserCacheKey(
      normalizedUsername,
      dependencies.cacheConfig.namespace,
    );

    if (dependencies.cacheStore.enabled) {
      try {
        const cached = await dependencies.cacheStore.get<unknown>(cacheKey);
        if (cached !== undefined) {
          if (isGitHubUserData(cached)) {
            logger.info("cache-hit", { key: cacheKey });
            return cached;
          }
          logger.warn("cache-corrupt", { key: cacheKey });
          await dependencies.cacheStore.del?.(cacheKey);
        } else {
          logger.info("cache-miss", { key: cacheKey });
        }
      } catch (error: unknown) {
        logger.warn("cache-read-fail", {
          key: cacheKey,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const inFlight = inFlightByCacheKey.get(cacheKey);
    if (inFlight) {
      logger.info("single-flight-join", { key: cacheKey });
      return inFlight;
    }

    const request = (async () => {
      const fresh = await fetchUserDataFromGitHubWrapper(
        dependencies.executor,
        normalizedUsername,
      );

      if (dependencies.cacheStore.enabled) {
        try {
          await dependencies.cacheStore.set(
            cacheKey,
            fresh,
            dependencies.cacheConfig.ttlSeconds,
          );
        } catch (error: unknown) {
          logger.warn("cache-set-fail", {
            key: cacheKey,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }

      return fresh;
    })().finally(() => {
      inFlightByCacheKey.delete(cacheKey);
    });

    inFlightByCacheKey.set(cacheKey, request);
    return request;
  };
}

// ---------------------------------------------------------------------------
// Default singleton
// ---------------------------------------------------------------------------

function createDefaultGitHubExecutor(): GitHubQueryExecutor {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) {
    throw new Error("Missing GITHUB_TOKEN");
  }

  return new GitHubGraphQLClient({
    token,
    maxRetries: 3,
    maxConcurrency: 2,
    baseDelayMs: 120,
  });
}

let executorSingleton: GitHubQueryExecutor | undefined;
const cacheConfigSingleton = getCacheConfigFromEnv();
const cacheStoreSingleton = createCacheStore(cacheConfigSingleton);

function getDefaultGitHubExecutor(): GitHubQueryExecutor {
  if (!executorSingleton) {
    executorSingleton = createDefaultGitHubExecutor();
  }

  return executorSingleton;
}

/**
 * Redis cache entry shape that includes a fetch timestamp for staleness checks.
 */
type CachedUserEntry = {
  data: GitHubUserData;
  fetchedAt: string; // ISO 8601 timestamp
};

function buildUserCacheKey(username: string): string {
  return buildGitHubUserCacheKey(username, cacheConfigSingleton.namespace);
}

function getStaleDays(): number {
  const raw = process.env.GITHUB_USER_STALE_DAYS?.trim();
  if (!raw) return 14;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 14;
}

/**
 * Unified function to get GitHub user data.
 *
 * Flow:
 * 1. If cacheInRedis: check Redis → HIT + fresh → return
 * 2. Check PostgreSQL
 *    → HIT + fresh (stale_after > now) → return (optionally warm Redis)
 *    → HIT + stale OR MISS → fetch from GitHub → upsert DB → return
 * 3. If !cacheInRedis and data was refreshed: delete stale Redis key
 *
 * @param username - GitHub username
 * @param options.cacheInRedis - Whether to cache in Redis (default: true)
 */
export async function getUserData(
  username: string,
  options?: { cacheInRedis?: boolean; withMetrics?: false },
): Promise<GitHubUserData>;
export async function getUserData(
  username: string,
  options: { cacheInRedis?: boolean; withMetrics: true },
): Promise<{ data: GitHubUserData; metrics: UserFetchMetrics }>;
export async function getUserData(
  username: string,
  options?: { cacheInRedis?: boolean; withMetrics?: boolean },
): Promise<GitHubUserData | { data: GitHubUserData; metrics: UserFetchMetrics }> {
  const normalizedUsername = normalizeGitHubUsername(username);
  if (!normalizedUsername) {
    throw new Error("Username is required");
  }

  const cacheInRedis = options?.cacheInRedis ?? true;
  const withMetrics = options?.withMetrics ?? false;
  const staleDays = getStaleDays();

  // ── 1. Check Redis (if enabled) ───────────────────────────────────────
  if (cacheInRedis && cacheStoreSingleton.enabled) {
    try {
      const cacheKey = buildUserCacheKey(normalizedUsername);
      const cached = await cacheStoreSingleton.get<CachedUserEntry>(cacheKey);
      if (cached) {
        const now = Date.now();
        const fetchedAt = new Date(cached.fetchedAt).getTime();
        const ageDays = (now - fetchedAt) / 86_400_000;

        if (ageDays < staleDays) {
          return withMetrics
            ? { data: cached.data, metrics: { duration: 0, errors: [] } } // No metrics for cached data
            : cached.data;
        }

        // Stale — delete and fall through
        await cacheStoreSingleton.del?.(cacheKey);
      }
    } catch {
      // Non-fatal: continue to DB
    }
  }

  // ── 2. Check PostgreSQL ────────────────────────────────────────────────
  try {
    const { getDatabaseStore } = await import("@/lib/db-store");
    const db = getDatabaseStore();

    const row = await db.getUser(normalizedUsername);
    if (row) {
      const isFresh = row.stale_after > new Date();
      if (isFresh) {
        // DB has fresh data — warm Redis if enabled and return
        if (cacheInRedis && cacheStoreSingleton.enabled) {
          try {
            const cacheKey = buildUserCacheKey(normalizedUsername);
            const entry: CachedUserEntry = {
              data: row.raw_data as GitHubUserData,
              fetchedAt: new Date().toISOString(),
            };
            await cacheStoreSingleton.set(cacheKey, entry, cacheConfigSingleton.ttlSeconds);
          } catch {
            // Non-fatal: cache write failure
          }
        }
        const userData = row.raw_data as GitHubUserData;
        return withMetrics
          ? { data: userData, metrics: { duration: 0, errors: [] } } // No metrics for cached data
          : userData;
      }
    }
  } catch {
    // Non-fatal: DB failure, fall through to GitHub API
  }

  // ── 3. Fetch from GitHub API ──────────────────────────────────────────
  const { data: fresh, metrics } = await fetchUserDataFromGitHub(
    getDefaultGitHubExecutor(),
    normalizedUsername,
  );

  // Upsert into PostgreSQL
  try {
    const { getDatabaseStore: getDb } = await import("@/lib/db-store");
    const { calculateUserScore: calcScore } = await import("@/lib/score");

    const db = getDb();
    const score = calcScore(fresh, normalizedUsername);

    await db.upsertUser({
      username: fresh.login,
      name: fresh.name,
      avatarUrl: fresh.avatarUrl,
      location: fresh.location,
      country: null,
      rawData: fresh,
      scores: score,
      repoScore: Math.round(score.repoScore),
      prScore: Math.round(score.prScore),
      contributionScore: Math.round(score.contributionScore),
      finalScore: Math.round(score.finalScore),
      staleDays,
    });
  } catch {
    // Non-fatal: DB write failure
  }

  // 4. Handle Redis cache
  if (cacheStoreSingleton.enabled && cacheStoreSingleton.del) {
    const cacheKey = buildUserCacheKey(normalizedUsername);
    if (cacheInRedis) {
      // Warm Redis with fresh data
      try {
        const entry: CachedUserEntry = {
          data: fresh,
          fetchedAt: new Date().toISOString(),
        };
        await cacheStoreSingleton.set(cacheKey, entry, cacheConfigSingleton.ttlSeconds);
      } catch {
        // Non-fatal
      }
    } else {
      // Delete stale cache entry (leaderboard calculation path)
      try {
        await cacheStoreSingleton.del(cacheKey);
      } catch {
        // Non-fatal
      }
    }
  }

  return withMetrics ? { data: fresh, metrics } : fresh;
}
