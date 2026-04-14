
export type RepoNode = {
  name: string;
  stargazerCount: number;
  forkCount: number;
  watchers: { totalCount: number };
};

export type PullRequestNode = {
  merged: boolean;
  additions: number;
  deletions: number;
  title: string;
  url: string;
  repository: {
    nameWithOwner: string;
    stargazerCount: number;
    owner: { login: string };
  };
};

export type ContributionTotals = {
  totalCommitContributions: number;
  totalPullRequestContributions: number;
  totalIssueContributions: number;
};

export type GitHubUserData = {
  name: string | null;
  avatarUrl: string;
  repos: RepoNode[];
  pullRequests: PullRequestNode[];
  contributions: ContributionTotals;
};