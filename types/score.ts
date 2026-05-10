import {
  DiscussionNode,
  IssueNode,
  PullRequestNode,
  RepoNode,
} from "./github";

export type RepoScoreDetail = {
  repo: RepoNode;
  score: number;
};

export type PullRequestScoreDetail = {
  pr: PullRequestNode;
  score: number;
};

export type CommunityContributionDetail = {
  type: "issue" | "discussion";
  item: IssueNode | DiscussionNode;
  score: number;
};

export type ScoringSignals = {
  reposAnalyzed: number;
  pullRequestsAnalyzed: number;
  mergedExternalPRs: number;
  ownRepoPRsIgnored: number;
  unmergedPRsIgnored: number;
  uniqueExternalPRRepos: number;
  issuesAnalyzed: number;
  externalIssuesCounted: number;
  discussionsAnalyzed: number;
  externalDiscussionsCounted: number;
  selectedLanguages?: string[];
  reposWithLanguageData?: number;
  prsWithLanguageData?: number;
  averageRepoLanguageMatch?: number;
  averagePRLanguageMatch?: number;
};

export type ScoringExplanations = {
  repo: string[];
  pr: string[];
  contribution: string[];
  overall: string[];
  language?: string[];
};
