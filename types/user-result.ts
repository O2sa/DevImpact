import { ScoringExplanations, ScoringSignals } from "./score";

export type UserResult = {
  username: string;
  name: string | null;
  avatarUrl: string;
  repoScore: number;
  prScore: number;
  contributionScore: number;
  finalScore: number;
  normalizedRepoScore?: number;
  normalizedPRScore?: number;
  normalizedContributionScore?: number;
  normalizedFinalScore?: number;
  topRepos: {
    name?: string;
    url?: string;
    stars?: number;
    forks?: number;
    watchers?: number;
    score?: number;
    languageMatch?: number;
    topLanguages?: {
      name: string;
      percentage: number;
    }[];
  }[];
  topPullRequests: {
    repo?: string;
    stars?: number;
    score?: number;
    title?: string;
    url?: string;
    deletions?: number;
    additions?: number;
    languageMatch?: number;
    topLanguages?: {
      name: string;
      percentage: number;
    }[];
  }[];
  topCommunityContributions?: {
    type: "issue" | "discussion";
    title: string;
    url?: string;
    repo: string;
    stars: number;
    comments: number;
    score: number;
  }[];
  languageScores?: {
    selectedLanguages: string[];
    repoScore: number;
    prScore: number;
    contributionScore: number;
    finalScore: number;
    normalizedRepoScore?: number;
    normalizedPRScore?: number;
    normalizedContributionScore?: number;
    normalizedFinalScore?: number;
    topRepos: {
      name: string;
      url?: string;
      stars: number;
      forks: number;
      watchers: number;
      score: number;
      languageMatch: number;
      topLanguages: {
        name: string;
        percentage: number;
      }[];
    }[];
    topPullRequests: {
      repo: string;
      title: string;
      url?: string;
      stars: number;
      score: number;
      additions: number;
      deletions: number;
      languageMatch: number;
      topLanguages: {
        name: string;
        percentage: number;
      }[];
    }[];
  };
  signals?: ScoringSignals;
  explanations?: ScoringExplanations;
  scoreVersion?: string;
  isWinner?: boolean;
};
