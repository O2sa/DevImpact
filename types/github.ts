
export type RepoLanguageEdge = {
  size: number;
  node: {
    name: string;
  };
};

export type RepoLanguages = {
  edges: RepoLanguageEdge[];
};

type CommunityRepositoryNode = {
  nameWithOwner: string;
  stargazerCount: number;
  owner: { login: string };
};

export type IssueNode = {
  title: string;
  url?: string;
  comments: { totalCount: number };
  repository: CommunityRepositoryNode;
};

export type DiscussionNode = {
  title: string;
  url?: string;
  comments: { totalCount: number };
  repository: CommunityRepositoryNode;
};

export type RepoNode = {
  name: string;
  nameWithOwner?: string;
  url?: string;
  isFork?: boolean;
  stargazerCount: number;
  forkCount: number;
  watchers: { totalCount: number };
  pushedAt?: string;
  languages?: RepoLanguages;
};

export type PullRequestNode = {
  merged: boolean;
  additions: number;
  deletions: number;
  title: string;
  url?: string;
  repository: {
    nameWithOwner: string;
    url?: string;
    stargazerCount: number;
    pushedAt?: string;
    owner: { login: string };
    languages?: RepoLanguages;
  };
};

export type ContributionTotals = {
  totalCommitContributions: number;
  totalPullRequestContributions: number;
  totalIssueContributions: number;
};

export type GitHubUserData = {
  login: string;
  name: string | null;
  avatarUrl: string;
  location: string | null;
  repos: RepoNode[];
  pullRequests: PullRequestNode[];
  contributions: ContributionTotals;
  issues?: IssueNode[];
  discussions?: DiscussionNode[];
};
