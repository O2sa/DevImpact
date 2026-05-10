import type {
  ContributionTotals,
  DiscussionNode,
  IssueNode,
  PullRequestNode,
  ReactionSummary,
  RepoLanguages,
  RepoNode,
} from "@/types/github";

export type UserScoreInput = {
  repos: RepoNode[];
  pullRequests: PullRequestNode[];
  contributions: ContributionTotals;
  issues?: IssueNode[];
  discussions?: DiscussionNode[];
  referenceDate?: string;
  selectedLanguages?: string[];
};

const defaultRepo: RepoNode = {
  name: "repo",
  nameWithOwner: "owner/repo",
  url: "https://github.com/owner/repo",
  isFork: false,
  stargazerCount: 10,
  forkCount: 2,
  watchers: { totalCount: 1 },
  pushedAt: "2026-05-01T00:00:00.000Z",
  languages: {
    edges: [{ size: 1000, node: { name: "TypeScript" } }],
  },
};

const defaultPullRequest: PullRequestNode = {
  merged: true,
  additions: 100,
  deletions: 20,
  title: "Improve the developer comparison score",
  url: "https://example.com/external-owner/repo/pull/1",
  repository: {
    nameWithOwner: "external-owner/repo",
    url: "https://github.com/external-owner/repo",
    stargazerCount: 10,
    pushedAt: "2026-05-01T00:00:00.000Z",
    owner: { login: "external-owner" },
    languages: {
      edges: [{ size: 1000, node: { name: "TypeScript" } }],
    },
  },
};

const defaultContributions: ContributionTotals = {
  totalCommitContributions: 0,
  totalPullRequestContributions: 0,
  totalIssueContributions: 0,
};

const defaultReactions: ReactionSummary = {
  thumbsUp: 0,
  thumbsDown: 0,
  heart: 0,
  hooray: 0,
  rocket: 0,
  eyes: 0,
  confused: 0,
  laugh: 0,
};

const defaultIssue: IssueNode = {
  title: "Issue about improving docs",
  url: "https://example.com/external-owner/repo/issues/1",
  comments: { totalCount: 2 },
  reactions: defaultReactions,
  repository: {
    nameWithOwner: "external-owner/repo",
    stargazerCount: 10,
    owner: { login: "external-owner" },
  },
};

const defaultDiscussion: DiscussionNode = {
  title: "Discussion about roadmap",
  url: "https://example.com/external-owner/repo/discussions/1",
  comments: { totalCount: 2 },
  reactions: defaultReactions,
  repository: {
    nameWithOwner: "external-owner/repo",
    stargazerCount: 10,
    owner: { login: "external-owner" },
  },
};

export function makeRepo(overrides: Partial<RepoNode> = {}): RepoNode {
  return {
    ...defaultRepo,
    ...overrides,
    watchers: overrides.watchers ?? defaultRepo.watchers,
    languages: overrides.languages ?? defaultRepo.languages,
  };
}

export function makePullRequest(
  overrides: Partial<PullRequestNode> = {},
): PullRequestNode {
  const repository = overrides.repository
    ? {
      ...defaultPullRequest.repository,
      ...overrides.repository,
      languages: overrides.repository.languages ?? defaultPullRequest.repository.languages,
    }
    : defaultPullRequest.repository;

  return {
    ...defaultPullRequest,
    ...overrides,
    repository,
  };
}

export function makeRepoLanguages(
  edges: Array<{ size: number; name: string }>,
): RepoLanguages {
  return {
    edges: edges.map((edge) => ({
      size: edge.size,
      node: { name: edge.name },
    })),
  };
}

export function makeIssue(overrides: Partial<IssueNode> = {}): IssueNode {
  return {
    ...defaultIssue,
    ...overrides,
    comments: overrides.comments ?? defaultIssue.comments,
    reactions: overrides.reactions ?? defaultIssue.reactions,
    repository: overrides.repository ?? defaultIssue.repository,
  };
}

export function makeDiscussion(
  overrides: Partial<DiscussionNode> = {},
): DiscussionNode {
  return {
    ...defaultDiscussion,
    ...overrides,
    comments: overrides.comments ?? defaultDiscussion.comments,
    reactions: overrides.reactions ?? defaultDiscussion.reactions,
    repository: overrides.repository ?? defaultDiscussion.repository,
  };
}

export function makeContributions(
  overrides: Partial<ContributionTotals> = {},
): ContributionTotals {
  return {
    ...defaultContributions,
    ...overrides,
  };
}

export function makeUserScoreInput(
  overrides: Partial<UserScoreInput> = {},
): UserScoreInput {
  return {
    repos: overrides.repos ?? [makeRepo()],
    pullRequests: overrides.pullRequests ?? [makePullRequest()],
    contributions: overrides.contributions ?? makeContributions(),
    issues: overrides.issues ?? [],
    discussions: overrides.discussions ?? [],
    referenceDate: overrides.referenceDate,
    selectedLanguages: overrides.selectedLanguages,
  };
}
