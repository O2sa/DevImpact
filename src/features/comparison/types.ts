import type { UserResult } from "@/features/developer";
import type { calculateUserScore } from "@/features/scoring";
import type { ClientSafeError, SafeApiError } from "@/types/api";

export type ComparisonPresentationRequest = {
  user1: string;
  user2: string;
  selectedLanguages: string[];
  fetchKey: string;
};

export type CompareWinner = {
  username: string;
  finalScoreDifference: number;
  percentageDifference: number | null;
};

export type LanguageWinner = {
  username: string;
  finalScoreDifference: number;
  percentageDifference: number | null;
  selectedLanguages: string[];
};

export type CompareInsights = {
  summary: string;
  keyDifferences: string[];
  user1Strengths: string[];
  user2Strengths: string[];
  recommendations: {
    user1: string[];
    user2: string[];
  };
  confidenceNote: string;
};

export type ComparedUserResult = {
  username: string;
  name: string | null;
  avatarUrl: string;
  repoScore: number;
  prScore: number;
  contributionScore: number;
  finalScore: number;
  normalizedRepoScore: number;
  normalizedPRScore: number;
  normalizedContributionScore: number;
  normalizedFinalScore: number;
  topRepos: ReturnType<typeof calculateUserScore>["topRepos"];
  topPullRequests: ReturnType<typeof calculateUserScore>["topPullRequests"];
  topCommunityContributions: ReturnType<typeof calculateUserScore>["topCommunityContributions"];
  languageScores: ReturnType<typeof calculateUserScore>["languageScores"];
  signals: ReturnType<typeof calculateUserScore>["signals"];
  explanations: ReturnType<typeof calculateUserScore>["explanations"];
};

export type ComparisonResponse = {
  success: boolean;
  scoreVersion?: string;
  users?: UserResult[];
  winner?: CompareWinner;
  languageWinner?: LanguageWinner;
  insights?: CompareInsights;
  error?: string;
  errorDetails?: SafeApiError | ClientSafeError;
};
