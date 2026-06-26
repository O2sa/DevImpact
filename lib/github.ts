import {
  DEFAULT_GITHUB_CACHE_TTL_SECONDS,
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

type Logger = Pick<Console, "info" | "warn">;

type GitHubRawUser = {
  name: string | null;
  avatarUrl: string;
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

type FetchUserAndPullRequestsResponse = {
  user: GitHubRawUser | null;
  pullRequests: {
    nodes: Array<PullRequestNode | null>;
    pageInfo: PageInfo;
  };
};

type FetchPullRequestsPageResponse = {
  pullRequests: {
    nodes: Array<PullRequestNode | null>;
    pageInfo: PageInfo;
  };
};

type FetchIssuesPageResponse = {
  issues: {
    nodes: Array<RawIssueNode | null>;
    pageInfo: PageInfo;
  };
};

type FetchDiscussionsPageResponse = {
  discussions: {
    nodes: Array<RawDiscussionNode | null>;
    pageInfo: PageInfo;
  };
};

type GitHubQueryExecutor = Pick<GitHubGraphQLClient, "execute">;

export type GitHubFetcherDependencies = {
  executor: GitHubQueryExecutor;
  cacheStore: CacheStore;
  cacheConfig: Pick<CacheConfig, "namespace" | "ttlSeconds">;
  logger?: Logger;
};

const USER_QUERY = /* GraphQL */ `
  query FetchUser($login: String!, $repoCount: Int = 100) {
    user(login: $login) {
      name
      avatarUrl(size: 80)
      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
      }
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
  buildVariables: (cursor: string | null) => Record<string, unknown>;
  extractField: (data: Record<string, unknown>) => {
    nodes: Array<TNode | null>;
    pageInfo: PageInfo;
  } | undefined;
  maxPages?: number;
};

const SEARCH_PAGE_SIZE = 100;
const DEFAULT_MAX_SEARCH_PAGES = 10;

async function paginateSearch<TNode>(
  executor: GitHubQueryExecutor,
  params: SearchPaginateParams<TNode>,
): Promise<Array<TNode>> {
  const maxPages = params.maxPages ?? DEFAULT_MAX_SEARCH_PAGES;
  const allNodes: Array<TNode> = [];
  let cursor: string | null = null;

  for (let page = 0; page < maxPages; page += 1) {
    const variables = params.buildVariables(cursor);
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

function isNumericRecord(value: unknown): value is Record<string, number> {
  return (
    isObject(value) &&
    Object.values(value).every(
      (item) => typeof item === "number" && Number.isFinite(item),
    )
  );
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
    !Array.isArray(candidate.pullRequests) ||
    !isObject(candidate.contributions) ||
    !isNumericRecord(candidate.contributions)
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
): Promise<GitHubUserData> {
  const externalPrQuery = `type:pr is:merged author:${username} -user:${username}`;
  const externalIssueQuery = `type:issue author:${username} -user:${username}`;
  const externalDiscussionQuery = `author:${username} -user:${username}`;

  const [userResponse, pullRequests, issues, discussions] = await Promise.all([
    executor.execute<
      { user: GitHubRawUser | null },
      { login: string; repoCount: number }
    >({
      operationName: "FetchUser",
      query: USER_QUERY,
      variables: { login: username, repoCount: 30 },
    }),
    paginateSearch<PullRequestNode>(executor, {
      operationName: "FetchUserPullRequests",
      query: PULL_REQUESTS_QUERY,
      buildVariables: (cursor) => ({
        prCount: SEARCH_PAGE_SIZE,
        externalPrQuery,
        prCursor: cursor,
      }),
      extractField: (data) =>
        data.pullRequests as
          | { nodes: Array<PullRequestNode | null>; pageInfo: PageInfo }
          | undefined,
    }),
    paginateSearch<IssueNode>(executor, {
      operationName: "FetchUserIssues",
      query: ISSUES_QUERY,
      buildVariables: (cursor) => ({
        issueCount: SEARCH_PAGE_SIZE,
        externalIssueQuery,
        issueCursor: cursor,
      }),
      extractField: (data) =>
        data.issues as
          | { nodes: Array<RawIssueNode | null>; pageInfo: PageInfo }
          | undefined,
    }),
    paginateSearch<DiscussionNode>(executor, {
      operationName: "FetchUserDiscussions",
      query: DISCUSSIONS_QUERY,
      buildVariables: (cursor) => ({
        discussionCount: SEARCH_PAGE_SIZE,
        externalDiscussionQuery,
        discussionCursor: cursor,
      }),
      extractField: (data) =>
        data.discussions as
          | { nodes: Array<RawDiscussionNode | null>; pageInfo: PageInfo }
          | undefined,
    }),
  ]);

  const user = userResponse.user;
  if (!user) {
    throw new Error("User not found");
  }

  return {
    name: user.name,
    avatarUrl: user.avatarUrl,
    repos: user.repositories.nodes.filter(isDefined),
    pullRequests,
    contributions: user.contributionsCollection,
    issues: issues.map(toIssueNode),
    discussions: discussions.map(toDiscussionNode),
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
      const fresh = await fetchUserDataFromGitHub(
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

let defaultFetcher: ((username: string) => Promise<GitHubUserData>) | undefined;

function getDefaultFetcher(): (username: string) => Promise<GitHubUserData> {
  if (!defaultFetcher) {
    const cacheConfig = getCacheConfigFromEnv();
    const cacheStore = createCacheStore(cacheConfig);

    defaultFetcher = createGitHubUserDataFetcher({
      executor: createDefaultGitHubExecutor(),
      cacheStore,
      cacheConfig: {
        namespace: cacheConfig.namespace,
        ttlSeconds: cacheConfig.ttlSeconds || DEFAULT_GITHUB_CACHE_TTL_SECONDS,
      },
      logger: console,
    });
  }

  return defaultFetcher;
}

export async function fetchGitHubUserData(
  username: string,
): Promise<GitHubUserData> {
  return getDefaultFetcher()(username);
}
