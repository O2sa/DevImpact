import { ContributionTotals, GitHubUserData, PullRequestNode, RepoNode } from "@/types/github";
import { graphql } from "@octokit/graphql";
import { getCached, getStale, setCached } from "./cache";

if (!process.env.GITHUB_TOKEN) {
  throw new Error("Missing GITHUB_TOKEN");
}

const client = graphql.defaults({
  headers: {
    authorization: `token ${process.env.GITHUB_TOKEN}`,
  },
});


const QUERY = /* GraphQL */ `
  query FetchUserData($login: String!, $repoCount: Int = 100, $prCount: Int = 100) {
    user(login: $login) {
      repositories(
        first: $repoCount
        privacy: PUBLIC
        ownerAffiliations: OWNER
        orderBy: { field: STARGAZERS, direction: DESC }
      ) {
        nodes {
          name
          stargazerCount
          forkCount
          watchers {
            totalCount
          }
        }
      }
      pullRequests(
        first: $prCount
        states: [MERGED]
        orderBy: { field: CREATED_AT, direction: DESC }
      ) {
        nodes {
          merged
          additions
          deletions
          repository {
            nameWithOwner
            stargazerCount
            owner {
              login
            }
          }
        }
      }
      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
      }
    }
  }
`;

export class RateLimitError extends Error {
  retryAfter: number;
  constructor(retryAfter: number) {
    super("GitHub API rate limit exceeded");
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

function isRateLimitError(error: any): boolean {
  const status = error?.status ?? error?.response?.status;
  return status === 403 || status === 429;
}

export async function fetchGitHubUserData(
  username: string
): Promise<GitHubUserData> {
  const cacheKey = `github:${username.toLowerCase()}`;
  const cached = getCached<GitHubUserData>(cacheKey);
  if (cached) return cached;

  try {
    const { user } = await client<{ user: any }>(QUERY, { login: username });

    if (!user) {
      throw new Error("User not found");
    }

    const data: GitHubUserData = {
      repos: user.repositories.nodes as RepoNode[],
      pullRequests: user.pullRequests.nodes as PullRequestNode[],
      contributions: user.contributionsCollection as ContributionTotals,
    };

    setCached(cacheKey, data);
    return data;
  } catch (error: any) {
    if (isRateLimitError(error)) {
      const stale = getStale<GitHubUserData>(cacheKey);
      if (stale) return stale;

      const resetAt = error.response?.headers?.["x-ratelimit-reset"];
      const retryAfter = resetAt
        ? Math.max(0, Number(resetAt) - Math.floor(Date.now() / 1000))
        : 60;
      throw new RateLimitError(retryAfter);
    }
    throw error;
  }
}
