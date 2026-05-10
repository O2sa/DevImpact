import type {
  DiscussionNode,
  GitHubUserData,
  IssueNode,
  PullRequestNode,
  ReactionSummary,
  RepoNode,
} from "@/types/github";
import { graphql } from "@octokit/graphql";

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
  thumbsUp: { totalCount: number };
  thumbsDown: { totalCount: number };
  heart: { totalCount: number };
  hooray: { totalCount: number };
  rocket: { totalCount: number };
  eyes: { totalCount: number };
  confused: { totalCount: number };
  laugh: { totalCount: number };
  repository: {
    nameWithOwner: string;
    stargazerCount: number;
    owner: { login: string };
    languages?: RepoNode["languages"];
  };
};

type RawDiscussionNode = {
  title: string;
  url?: string;
  comments: { totalCount: number };
  thumbsUp: { totalCount: number };
  thumbsDown: { totalCount: number };
  heart: { totalCount: number };
  hooray: { totalCount: number };
  rocket: { totalCount: number };
  eyes: { totalCount: number };
  confused: { totalCount: number };
  laugh: { totalCount: number };
  repository: {
    nameWithOwner: string;
    stargazerCount: number;
    owner: { login: string };
    languages?: RepoNode["languages"];
  };
};

type FetchUserDataResponse = {
  user: GitHubRawUser | null;
  pullRequests: { nodes: Array<PullRequestNode | null> };
  issues: { nodes: Array<RawIssueNode | null> };
  discussions: { nodes: Array<RawDiscussionNode | null> };
  rateLimit: {
    limit: number;
    remaining: number;
    used: number;
    resetAt: string;
    cost: number;
  };
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
  query FetchUserData(
    $login: String!
    $repoCount: Int = 100
    $prCount: Int = 100
    $issueCount: Int = 100
    $discussionCount: Int = 100
    $externalPrQuery: String!
    $externalIssueQuery: String!
    $externalDiscussionQuery: String!
  ) {
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
          nameWithOwner
          url
          isFork
          stargazerCount
          forkCount
          pushedAt
          watchers {
            totalCount
          }
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            edges {
              size
              node {
                name
              }
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
            languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
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

    issues: search(query: $externalIssueQuery, type: ISSUE, first: $issueCount) {
      nodes {
        ... on Issue {
          title
          url
          comments {
            totalCount
          }
          thumbsUp: reactions(content: THUMBS_UP) {
            totalCount
          }
          thumbsDown: reactions(content: THUMBS_DOWN) {
            totalCount
          }
          heart: reactions(content: HEART) {
            totalCount
          }
          hooray: reactions(content: HOORAY) {
            totalCount
          }
          rocket: reactions(content: ROCKET) {
            totalCount
          }
          eyes: reactions(content: EYES) {
            totalCount
          }
          confused: reactions(content: CONFUSED) {
            totalCount
          }
          laugh: reactions(content: LAUGH) {
            totalCount
          }
          repository {
            nameWithOwner
            stargazerCount
            owner {
              login
            }
            languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
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
          thumbsUp: reactions(content: THUMBS_UP) {
            totalCount
          }
          thumbsDown: reactions(content: THUMBS_DOWN) {
            totalCount
          }
          heart: reactions(content: HEART) {
            totalCount
          }
          hooray: reactions(content: HOORAY) {
            totalCount
          }
          rocket: reactions(content: ROCKET) {
            totalCount
          }
          eyes: reactions(content: EYES) {
            totalCount
          }
          confused: reactions(content: CONFUSED) {
            totalCount
          }
          laugh: reactions(content: LAUGH) {
            totalCount
          }
          repository {
            nameWithOwner
            stargazerCount
            owner {
              login
            }
            languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
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

    rateLimit {
      limit
      remaining
      used
      resetAt
      cost
    }
  }
`;

function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function toReactionSummary(item: RawIssueNode): ReactionSummary {
  return {
    thumbsUp: item.thumbsUp.totalCount,
    thumbsDown: item.thumbsDown.totalCount,
    heart: item.heart.totalCount,
    hooray: item.hooray.totalCount,
    rocket: item.rocket.totalCount,
    eyes: item.eyes.totalCount,
    confused: item.confused.totalCount,
    laugh: item.laugh.totalCount,
  };
}

function toIssueNode(item: RawIssueNode): IssueNode {
  return {
    title: item.title,
    url: item.url,
    comments: item.comments,
    reactions: toReactionSummary(item),
    repository: item.repository,
  };
}

function toDiscussionNode(item: RawDiscussionNode): DiscussionNode {
  return {
    title: item.title,
    url: item.url,
    comments: item.comments,
    reactions: toReactionSummary(item),
    repository: item.repository,
  };
}

export async function fetchGitHubUserData(
  username: string,
): Promise<GitHubUserData> {
  const externalPrQuery = `type:pr is:merged author:${username} -user:${username}`;
  const externalIssueQuery = `type:issue author:${username} -user:${username}`;
  const externalDiscussionQuery = `author:${username} -user:${username}`;

  const response = await client<FetchUserDataResponse>(QUERY, {
    login: username,
    repoCount: 100,
    prCount: 100,
    issueCount: 100,
    discussionCount: 100,
    externalPrQuery,
    externalIssueQuery,
    externalDiscussionQuery,
    headers: {
      authorization: `bearer ${process.env.GITHUB_TOKEN}`,
    },
  });

  const user = response.user;
  console.log(response.rateLimit);

  if (!user) {
    throw new Error("User not found");
  }

  return {
    name: user.name,
    avatarUrl: user.avatarUrl,
    repos: user.repositories.nodes.filter(isDefined),
    pullRequests: response.pullRequests.nodes.filter(isDefined),
    contributions: user.contributionsCollection,
    issues: response.issues.nodes.filter(isDefined).map(toIssueNode),
    discussions: response.discussions.nodes
      .filter(isDefined)
      .map(toDiscussionNode),
  };
}
