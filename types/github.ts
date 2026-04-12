export type ContributionTotals = {
  totalCommitContributions: number;
  totalPullRequestContributions: number;
  totalIssueContributions: number;
};

export type RepoNode = {
  name: string;
  stargazerCount: number;
  forkCount: number;
  watchers: {
    totalCount: number;
  };
};

export type PullRequestNode = {
  merged: boolean;
  additions: number;
  deletions: number;
  url?: string;
  repository: {
    nameWithOwner: string;
    stargazerCount: number;
    owner: {
      login: string;
    };
  };
};

export type GitHubUserData = {
  repos: RepoNode[];
  pullRequests: PullRequestNode[];
  contributions: ContributionTotals;
};
