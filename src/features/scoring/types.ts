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

export type TopRepo = {
  name: string;
  url?: string;
  stars: number;
  forks: number;
  watchers: number;
  score: number;
  topLanguages?: {
    name: string;
    percentage: number;
  }[];
};

export type TopPullRequest = {
  repo: string;
  title: string;
  url?: string;
  stars: number;
  score: number;
  additions: number;
  deletions: number;
  topLanguages?: {
    name: string;
    percentage: number;
  }[];
};

export type TopCommunityContribution = {
  type: "issue" | "discussion";
  title: string;
  url?: string;
  repo: string;
  stars: number;
  comments: number;
  score: number;
};

export type TopLanguageRepo = TopRepo & {
  languageMatch: number;
  topLanguages: {
    name: string;
    percentage: number;
  }[];
};

export type TopLanguagePullRequest = TopPullRequest & {
  languageMatch: number;
  topLanguages: {
    name: string;
    percentage: number;
  }[];
};

export type LanguageScores = {
  selectedLanguages: string[];
  repoScore: number;
  prScore: number;
  contributionScore: number;
  finalScore: number;
  normalizedRepoScore: number;
  normalizedPRScore: number;
  normalizedContributionScore: number;
  normalizedFinalScore: number;
  topRepos: TopLanguageRepo[];
  topPullRequests: TopLanguagePullRequest[];
};

export type CalculateUserScoreResult = {
  username: string;
  repoScore: number;
  prScore: number;
  contributionScore: number;
  finalScore: number;
  normalizedRepoScore: number;
  normalizedPRScore: number;
  normalizedContributionScore: number;
  normalizedFinalScore: number;
  scores: {
    repoScore: number;
    prScore: number;
    contributionScore: number;
    finalScore: number;
    normalizedRepoScore: number;
    normalizedPRScore: number;
    normalizedContributionScore: number;
    normalizedFinalScore: number;
  };
  topRepos: TopRepo[];
  topPullRequests: TopPullRequest[];
  topCommunityContributions: TopCommunityContribution[];
  languageScores?: LanguageScores;
  signals: ScoringSignals;
  explanations: ScoringExplanations;
};
