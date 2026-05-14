import { UserResult } from "./user-result";

export type CompareWinner = {
  username: string;
  finalScoreDifference: number;
  percentageDifference: number;
};

export type SafeApiError = {
  code:
    | "RATE_LIMITED"
    | "TEMPORARY_THROTTLE"
    | "GITHUB_TIMEOUT"
    | "GITHUB_RESOURCE_LIMIT"
    | "GITHUB_AUTH"
    | "GITHUB_NOT_FOUND"
    | "NETWORK"
    | "UNKNOWN";
  message: string;
  retryAfterSeconds?: number;
  rateLimit?: {
    limit?: number;
    remaining?: number;
    used?: number;
    resetAt?: number;
    resource?: string;
  };
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

export type ApiResponse = {
  success: boolean;
  scoreVersion?: string;
  users?: UserResult[];
  winner?: CompareWinner;
  languageWinner?: {
    username: string;
    finalScoreDifference: number;
    percentageDifference: number;
    selectedLanguages: string[];
  };
  insights?: CompareInsights;
  error?: string;
  errorDetails?: SafeApiError;
};
