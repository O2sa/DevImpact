import { ContributionTotals, GitHubUserData, PullRequestNode, RepoNode } from "@/types/github";
import { graphql } from "@octokit/graphql";

type GitHubRawUser = {
  name: string | null;
  avatarUrl: string;
  repositories: { nodes: RepoNode[] };
  pullRequests: { nodes: PullRequestNode[] };
  contributionsCollection: ContributionTotals;
};

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
      name
      avatarUrl(size: 80)
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
          title
          url
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

export async function fetchGitHubUserData(
  username: string
): Promise<GitHubUserData> {
  const { user } = await client<{ user: GitHubRawUser | null }>(QUERY, { login: username });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    name: user.name,
    avatarUrl: user.avatarUrl,
    repos: user.repositories.nodes,
    pullRequests: user.pullRequests.nodes,
    contributions: user.contributionsCollection,
  };
}
