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

type FetchUserAndPullRequestsResponse = {
  user: GitHubRawUser | null;
  pullRequests: { nodes: Array<PullRequestNode | null> };
};

type FetchIssuesResponse = {
  issues: { nodes: Array<RawIssueNode | null> };
};

type FetchDiscussionsResponse = {
  discussions: { nodes: Array<RawDiscussionNode | null> };
};

type GitHubQueryExecutor = Pick<GitHubGraphQLClient, "execute">;

export type GitHubFetcherDependencies = {
  executor: GitHubQueryExecutor;
  cacheStore: CacheStore;
  cacheConfig: Pick<CacheConfig, "namespace" | "ttlSeconds">;
  logger?: Logger;
};

const DEFAULT_GITHUB_REPO_COUNT = 30;
const DEFAULT_GITHUB_PR_COUNT = 80;
const DEFAULT_GITHUB_ISSUE_COUNT = 20;
const DEFAULT_GITHUB_DISCUSSION_COUNT = 10;


const MAX_GITHUB_REPO_COUNT = 100;
const MAX_GITHUB_PR_COUNT = 100;
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

const USER_AND_PULL_REQUESTS_QUERY = /* GraphQL */ `
  query FetchUserAndPullRequests(
    $login: String!
    $repoCount: Int = 100
    $prCount: Int = 100
    $externalPrQuery: String!
  ) {
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

    pullRequests: search(query: $externalPrQuery, type: ISSUE, first: $prCount) {
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
    }
  }
`;

const ISSUES_QUERY = /* GraphQL */ `
  query FetchUserIssues($issueCount: Int = 20, $externalIssueQuery: String!) {
    issues: search(query: $externalIssueQuery, type: ISSUE, first: $issueCount) {
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
    $discussionCount: Int = 10
    $externalDiscussionQuery: String!
  ) {
    discussions: search(
      query: $externalDiscussionQuery
      type: DISCUSSION
      first: $discussionCount
    ) {
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



async function fetchUserDataFromGitHub(
  executor: GitHubQueryExecutor,
  username: string,
): Promise<GitHubUserData> {
  const externalPrQuery = `type:pr is:merged author:${username} -user:${username}`;
  const externalIssueQuery = `type:issue author:${username} -user:${username}`;
  const externalDiscussionQuery = `author:${username} -user:${username}`;

  
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

  const userAndPrResponse =
    await executor.execute<
      FetchUserAndPullRequestsResponse,
      {
        login: string;
        repoCount: number;
        prCount: number;
        externalPrQuery: string;
      }
    >({
      operationName: "FetchUserAndPullRequests",
      query: USER_AND_PULL_REQUESTS_QUERY,
      variables: {
        login: username,
        repoCount,
        prCount,
        externalPrQuery,
      },
    });

  const user = userAndPrResponse.user;
  if (!user) {
    throw new Error("User not found");
  }

  const [issuesResponse, discussionsResponse] = await Promise.all([
    executor.execute<
      FetchIssuesResponse,
      {
        issueCount: number;
        externalIssueQuery: string;
      }
    >({
      operationName: "FetchUserIssues",
      query: ISSUES_QUERY,
      variables: {
        issueCount,
        externalIssueQuery,
      },
    }),
    executor.execute<
      FetchDiscussionsResponse,
      {
        discussionCount: number;
        externalDiscussionQuery: string;
      }
    >({
      operationName: "FetchUserDiscussions",
      query: DISCUSSIONS_QUERY,
      variables: {
        discussionCount,
        externalDiscussionQuery,
      },
    }),
  ]);

  return {
    name: user.name,
    avatarUrl: user.avatarUrl,
    repos: user.repositories.nodes.filter(isDefined),
    pullRequests: userAndPrResponse.pullRequests.nodes.filter(isDefined),
    contributions: user.contributionsCollection,
    issues: issuesResponse.issues.nodes.filter(isDefined).map(toIssueNode),
    discussions: discussionsResponse.discussions.nodes
      .filter(isDefined)
      .map(toDiscussionNode),
  };
}

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
