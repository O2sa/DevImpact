import type { DiscussionNode, IssueNode, PullRequestNode, RepoNode } from "@/lib/github";

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

export type LanguageScore = {
  language: string;
  repoScore: number;
  prScore: number;
  contributionScore: number;
  finalScore: number;
};

export type ScoreBreakdown = {
  repoScore: number;
  prScore: number;
  contributionScore: number;
  finalScore: number;
  normalizedRepoScore: number;
  normalizedPRScore: number;
  normalizedContributionScore: number;
  normalizedFinalScore: number;
  topRepos: RepoScoreDetail[];
  topPullRequests: PullRequestScoreDetail[];
  topCommunityContributions: CommunityContributionDetail[];
  languageScores: LanguageScore[];
  signals: ScoringSignals;
  explanations: ScoringExplanations;
};
