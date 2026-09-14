import type { RepoNode } from "@/lib/github";
import type { RepoScoreDetail } from "../types";
import { getLanguageDistribution, getLanguageFactor, getLanguageMatch } from "./language-scoring";
import { getDaysSince, getRepoRankWeight, safeLog, sanitizeNumber } from "./scoring-helpers";

export function getRepoActivityFactor(pushedAt: string | undefined, referenceDate: Date): number {
  if (!pushedAt) {
    return 0.8;
  }

  const daysSincePush = getDaysSince(pushedAt, referenceDate);
  if (daysSincePush === null) {
    return 0.8;
  }

  if (daysSincePush <= 90) {
    return 1.2;
  }
  if (daysSincePush <= 365) {
    return 1.0;
  }
  if (daysSincePush <= 730) {
    return 0.7;
  }
  return 0.4;
}

export function calculateRepoScore(
  repos: RepoNode[],
  referenceDate: Date,
): { total: number; details: RepoScoreDetail[] } {
  const details = repos.map((repo) => {
    const baseRepoScore =
      safeLog(repo.stargazerCount) * 5 +
      safeLog(repo.forkCount) * 3 +
      safeLog(repo.watchers.totalCount) * 2;

    let score = baseRepoScore;

    if (repo.isFork === true) {
      score *= 0.2;
    }

    score *= getRepoActivityFactor(repo.pushedAt, referenceDate);

    return { repo, score: sanitizeNumber(score) };
  });

  details.sort((a, b) => b.score - a.score);

  const total = details.reduce((sum, { score }, index) => {
    return sum + score * getRepoRankWeight(index);
  }, 0);

  return { total: sanitizeNumber(total), details };
}

export function hasLanguageData(languages: RepoNode["languages"] | undefined): boolean {
  return Object.keys(getLanguageDistribution(languages)).length > 0;
}

export function calculateLanguageRepoScore(
  repoDetails: RepoScoreDetail[],
  selectedLanguages: string[],
): {
  total: number;
  details: Array<{
    repo: RepoNode;
    score: number;
    languageMatch: number;
  }>;
  reposWithLanguageData: number;
  averageLanguageMatch: number;
} {
  const details = repoDetails.map((item) => {
    const languageMatch = getLanguageMatch(item.repo.languages, selectedLanguages);
    const languageFactor = getLanguageFactor(languageMatch);
    return {
      repo: item.repo,
      score: sanitizeNumber(item.score * languageFactor),
      languageMatch,
    };
  });

  details.sort((a, b) => b.score - a.score);

  const total = details.reduce((sum, detail, index) => {
    return sum + detail.score * getRepoRankWeight(index);
  }, 0);

  const reposWithLanguageData = details.reduce((count, detail) => {
    return count + (hasLanguageData(detail.repo.languages) ? 1 : 0);
  }, 0);

  const averageLanguageMatch =
    details.length > 0
      ? details.reduce((sum, detail) => sum + detail.languageMatch, 0) / details.length
      : 0;

  return {
    total: sanitizeNumber(total),
    details,
    reposWithLanguageData,
    averageLanguageMatch: sanitizeNumber(averageLanguageMatch),
  };
}
