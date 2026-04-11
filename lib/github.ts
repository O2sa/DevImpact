import { ContributionTotals, GitHubUserData, PullRequestNode, RepoNode } from "@/types/github";
import { graphql } from "@octokit/graphql";

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
  resetAt?: Date;
  constructor(message: string, resetAt?: Date) {
    super(message);
    this.name = "RateLimitError";
    this.resetAt = resetAt;
  }
}

function parseResetTime(headers: Record<string, string>): Date | undefined {
  const resetEpoch = headers["x-ratelimit-reset"];
  return resetEpoch ? new Date(parseInt(resetEpoch, 10) * 1000) : undefined;
}

export async function fetchGitHubUserData(
  username: string
): Promise<GitHubUserData> {
  try {
    const { user } = await client<{ user: any }>(QUERY, { login: username });

    if (!user) {
      throw new Error("User not found");
    }

    return {
      repos: user.repositories.nodes as RepoNode[],
      pullRequests: user.pullRequests.nodes as PullRequestNode[],
      contributions: user.contributionsCollection as ContributionTotals,
    };
  } catch (error: any) {
    const message: string = error?.message ?? "";
    const isRateLimit =
      error?.status === 429 ||
      (error?.status === 403 && message.toLowerCase().includes("rate limit")) ||
      message.toLowerCase().includes("api rate limit exceeded") ||
      message.toLowerCase().includes("secondary rate limit");

    if (isRateLimit) {
      const resetAt = error?.headers
        ? parseResetTime(error.headers)
        : undefined;
      throw new RateLimitError("GitHub API rate limit exceeded", resetAt);
    }

    throw error;
  }
}
