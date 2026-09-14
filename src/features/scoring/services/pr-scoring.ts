import type { PullRequestNode } from "@/lib/github";
import type { PullRequestScoreDetail } from "../types";
import { getLanguageFactor, getLanguageMatch } from "./language-scoring";
import { hasLanguageData } from "./repo-scoring";
import { getDaysSince, getDiminishingWeight, safeLog, sanitizeNumber } from "./scoring-helpers";

export type PRScoreResult = {
  total: number;
  details: PullRequestScoreDetail[];
  mergedExternalPRs: number;
  ownRepoPRsIgnored: number;
  unmergedPRsIgnored: number;
  uniqueExternalPRRepos: number;
};

export function getPullRequestRepoActivityFactor(
  pushedAt: string | undefined,
  referenceDate: Date,
): number {
  if (!pushedAt) {
    return 0.9;
  }

  const daysSincePush = getDaysSince(pushedAt, referenceDate);
  if (daysSincePush === null) {
    return 0.9;
  }

  if (daysSincePush <= 90) {
    return 1.1;
  }
  if (daysSincePush <= 365) {
    return 1.0;
  }
  if (daysSincePush <= 730) {
    return 0.85;
  }
  return 0.7;
}

export function calculatePRScore(
  prs: PullRequestNode[],
  username: string,
  referenceDate: Date,
): PRScoreResult {
  const grouped = new Map<string, PullRequestScoreDetail[]>();
  const normalizedUsername = username.toLowerCase();

  let mergedExternalPRs = 0;
  let ownRepoPRsIgnored = 0;
  let unmergedPRsIgnored = 0;

  for (const pr of prs) {
    const repoOwner = pr.repository.owner.login.toLowerCase();

    if (!pr.merged) {
      unmergedPRsIgnored += 1;
      continue;
    }

    if (repoOwner === normalizedUsername) {
      ownRepoPRsIgnored += 1;
      continue;
    }

    const changedLines = Math.max(0, pr.additions) + Math.max(0, pr.deletions);
    const base = safeLog(pr.repository.stargazerCount) * 2;
    const sizeFactor = Math.min(safeLog(changedLines), 5);

    let score = base * sizeFactor;

    if (changedLines < 5) {
      score *= 0.25;
    }

    if (changedLines > 5000) {
      score *= 0.6;
    }

    score *= getPullRequestRepoActivityFactor(pr.repository.pushedAt, referenceDate);
    score = sanitizeNumber(score);

    const repoKey = pr.repository.nameWithOwner;
    const existingScores = grouped.get(repoKey) ?? [];
    existingScores.push({ pr, score });
    grouped.set(repoKey, existingScores);
    mergedExternalPRs += 1;
  }

  let total = 0;
  const allDetails: PullRequestScoreDetail[] = [];

  for (const repoScores of grouped.values()) {
    repoScores.sort((a, b) => b.score - a.score);

    const repoTotal = repoScores.reduce((sum, item, index) => {
      return sum + item.score * getDiminishingWeight(index);
    }, 0);

    total += repoTotal;
    allDetails.push(...repoScores);
  }

  allDetails.sort((a, b) => b.score - a.score);

  return {
    total: sanitizeNumber(total),
    details: allDetails,
    mergedExternalPRs,
    ownRepoPRsIgnored,
    unmergedPRsIgnored,
    uniqueExternalPRRepos: grouped.size,
  };
}

export function calculateLanguagePRScore(
  prDetails: PullRequestScoreDetail[],
  selectedLanguages: string[],
): {
  total: number;
  details: Array<{
    pr: PullRequestNode;
    score: number;
    languageMatch: number;
  }>;
  prsWithLanguageData: number;
  averageLanguageMatch: number;
} {
  const grouped = new Map<
    string,
    Array<{ pr: PullRequestNode; score: number; languageMatch: number }>
  >();

  for (const item of prDetails) {
    const languageMatch = getLanguageMatch(item.pr.repository.languages, selectedLanguages);
    const languageFactor = getLanguageFactor(languageMatch);
    const score = sanitizeNumber(item.score * languageFactor);
    const key = item.pr.repository.nameWithOwner;
    const current = grouped.get(key) ?? [];
    current.push({ pr: item.pr, score, languageMatch });
    grouped.set(key, current);
  }

  let total = 0;
  const details: Array<{ pr: PullRequestNode; score: number; languageMatch: number }> = [];

  for (const repoScores of grouped.values()) {
    repoScores.sort((a, b) => b.score - a.score);
    const repoTotal = repoScores.reduce((sum, item, index) => {
      return sum + item.score * getDiminishingWeight(index);
    }, 0);
    total += repoTotal;
    details.push(...repoScores);
  }

  details.sort((a, b) => b.score - a.score);

  const prsWithLanguageData = details.reduce((count, detail) => {
    return count + (hasLanguageData(detail.pr.repository.languages) ? 1 : 0);
  }, 0);

  const averageLanguageMatch =
    details.length > 0
      ? details.reduce((sum, detail) => sum + detail.languageMatch, 0) / details.length
      : 0;

  return {
    total: sanitizeNumber(total),
    details,
    prsWithLanguageData,
    averageLanguageMatch: sanitizeNumber(averageLanguageMatch),
  };
}
