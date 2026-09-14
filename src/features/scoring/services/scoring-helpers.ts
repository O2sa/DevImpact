import type { PullRequestNode, RepoNode } from "@/lib/github";
import { FALLBACK_REFERENCE_DATE, MS_PER_DAY } from "./scoring-constants";

export function safeLog(value: number): number {
  return Math.log(Math.max(0, value) + 1);
}

export function roundScore(value: number): number {
  return Number.isFinite(value) ? Math.round(value) : 0;
}

export function sanitizeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

export function normalizeScore(score: number, k: number): number {
  const sanitizedScore = sanitizeNumber(score);
  const sanitizedK = Math.max(0, sanitizeNumber(k));
  const denominator = sanitizedScore + sanitizedK;

  if (denominator <= 0) {
    return 0;
  }

  return (100 * sanitizedScore) / denominator;
}

export function getDiminishingWeight(index: number): number {
  const safeIndex = Math.max(0, index);
  return 1 / (safeIndex + 1);
}

export function getRepoRankWeight(index: number): number {
  return index < 5 ? 1 : 0.1;
}

export function parseDate(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function resolveReferenceDate(data: {
  repos: RepoNode[];
  pullRequests: PullRequestNode[];
  referenceDate?: string;
}): Date {
  const timestamps: number[] = [];

  const explicitReference = parseDate(data.referenceDate);
  if (explicitReference) {
    timestamps.push(explicitReference.getTime());
  }

  for (const repo of data.repos) {
    const parsed = parseDate(repo.pushedAt);
    if (parsed) {
      timestamps.push(parsed.getTime());
    }
  }

  for (const pr of data.pullRequests) {
    const parsed = parseDate(pr.repository.pushedAt);
    if (parsed) {
      timestamps.push(parsed.getTime());
    }
  }

  if (timestamps.length === 0) {
    return new Date(FALLBACK_REFERENCE_DATE);
  }

  return new Date(Math.max(...timestamps));
}

export function getDaysSince(dateValue: string, referenceDate: Date): number | null {
  const date = parseDate(dateValue);
  if (!date) {
    return null;
  }

  const diff = referenceDate.getTime() - date.getTime();
  return Math.max(0, diff / MS_PER_DAY);
}
