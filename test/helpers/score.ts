import type {
  DiscussionNode,
  IssueNode,
  PullRequestNode,
  ReactionSummary,
  RepoNode,
} from "@/types/github";

const MS_PER_DAY = 86_400_000;
const DEFAULT_REFERENCE_DATE = new Date("2026-05-10T00:00:00.000Z");

export function safeLog(value: number): number {
  return Math.log(Math.max(0, value) + 1);
}

export function getDiminishingWeight(index: number): number {
  return 1 / (index + 1);
}

export function getRepoRankWeight(index: number): number {
  return index < 5 ? 1 : 0.1;
}

function parseDate(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getDaysSince(pushedAt: string, referenceDate: Date): number | null {
  const pushed = parseDate(pushedAt);
  if (!pushed) {
    return null;
  }

  return Math.max(0, (referenceDate.getTime() - pushed.getTime()) / MS_PER_DAY);
}

function getRepoActivityFactor(
  pushedAt: string | undefined,
  referenceDate: Date,
): number {
  if (!pushedAt) {
    return 0.8;
  }

  const days = getDaysSince(pushedAt, referenceDate);
  if (days === null) {
    return 0.8;
  }

  if (days <= 90) return 1.2;
  if (days <= 365) return 1.0;
  if (days <= 730) return 0.7;
  return 0.4;
}

function getPRActivityFactor(
  pushedAt: string | undefined,
  referenceDate: Date,
): number {
  if (!pushedAt) {
    return 0.9;
  }

  const days = getDaysSince(pushedAt, referenceDate);
  if (days === null) {
    return 0.9;
  }

  if (days <= 90) return 1.1;
  if (days <= 365) return 1.0;
  if (days <= 730) return 0.85;
  return 0.7;
}

export function expectedRepoScore(
  repo: RepoNode,
  referenceDate: Date = DEFAULT_REFERENCE_DATE,
): number {
  let score =
    safeLog(repo.stargazerCount) * 5 +
    safeLog(repo.forkCount) * 3 +
    safeLog(repo.watchers.totalCount) * 2;

  if (repo.isFork) {
    score *= 0.2;
  }

  score *= getRepoActivityFactor(repo.pushedAt, referenceDate);

  return score;
}

export function expectedPRScore(
  pr: PullRequestNode,
  username: string,
  referenceDate: Date = DEFAULT_REFERENCE_DATE,
): number {
  if (!pr.merged) {
    return 0;
  }

  if (pr.repository.owner.login.toLowerCase() === username.toLowerCase()) {
    return 0;
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

  score *= getPRActivityFactor(pr.repository.pushedAt, referenceDate);

  return score;
}

export function sortDescending(values: number[]): number[] {
  return [...values].sort((left, right) => right - left);
}

export function sumWithDiminishingReturns(scores: number[]): number {
  return sortDescending(scores).reduce(
    (sum, score, index) => sum + score * getDiminishingWeight(index),
    0,
  );
}

export function sumRepoScores(
  repos: RepoNode[],
  referenceDate: Date = DEFAULT_REFERENCE_DATE,
): number {
  const scores = sortDescending(repos.map((repo) => expectedRepoScore(repo, referenceDate)));

  return scores.reduce((sum, score, index) => {
    return sum + score * getRepoRankWeight(index);
  }, 0);
}

export function sumPRScores(
  prs: PullRequestNode[],
  username: string,
  referenceDate: Date = DEFAULT_REFERENCE_DATE,
): number {
  const grouped = new Map<string, number[]>();

  for (const pr of prs) {
    const score = expectedPRScore(pr, username, referenceDate);
    if (score === 0) {
      continue;
    }

    const repoKey = pr.repository.nameWithOwner;
    const current = grouped.get(repoKey) ?? [];
    current.push(score);
    grouped.set(repoKey, current);
  }

  let total = 0;
  for (const scores of grouped.values()) {
    total += sumWithDiminishingReturns(scores);
  }

  return total;
}

function readReactionTotals(
  reactions?: ReactionSummary,
): { positive: number; neutral: number; negative: number } {
  if (!reactions) {
    return { positive: 0, neutral: 0, negative: 0 };
  }

  return {
    positive:
      reactions.thumbsUp +
      reactions.heart * 1.2 +
      reactions.hooray * 1.2 +
      reactions.rocket * 1.3,
    neutral: reactions.eyes * 0.4 + reactions.laugh * 0.2,
    negative: reactions.thumbsDown * 1.5 + reactions.confused,
  };
}

export function expectedCommunityScore(
  item: IssueNode | DiscussionNode,
): number {
  const comments = Math.max(0, item.comments.totalCount);
  const { positive, neutral, negative } = readReactionTotals(item.reactions);
  const reactionQuality = Math.max(0, positive + neutral - negative);
  const reactionTotal = positive + neutral + negative;
  const negativeRatio = reactionTotal > 0 ? negative / reactionTotal : 0;

  let score =
    safeLog(item.repository.stargazerCount) *
    safeLog(comments + reactionQuality);

  if (comments === 0 && reactionQuality === 0) {
    score *= 0.2;
  }

  if (negativeRatio > 0.5) {
    score *= 0.2;
  } else if (negativeRatio > 0.3) {
    score *= 0.6;
  }

  return score;
}
