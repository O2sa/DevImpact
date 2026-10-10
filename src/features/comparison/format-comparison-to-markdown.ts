import type { UserResult } from "@/features/developer";
import type { CompareWinner } from "./types";

type ComparisonMarkdownUser = Pick<
  UserResult,
  | "username"
  | "name"
  | "finalScore"
  | "repoScore"
  | "prScore"
  | "contributionScore"
  | "normalizedFinalScore"
  | "normalizedRepoScore"
  | "normalizedPRScore"
  | "normalizedContributionScore"
>;

function escapeTableCell(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
}

function getDisplayName(user: ComparisonMarkdownUser): string {
  return user.name?.trim() || user.username;
}

function formatRawScore(score: number): string {
  return score.toFixed(2);
}

function formatNormalizedScore(score?: number): string {
  return typeof score === "number" ? `${Math.round(score)} / 100` : "—";
}

export function formatComparisonToMarkdown(
  user1: ComparisonMarkdownUser,
  user2: ComparisonMarkdownUser,
  winner?: CompareWinner,
): string {
  const winnerUsername =
    winner?.username === user1.username || winner?.username === user2.username
      ? winner.username
      : user1.finalScore === user2.finalScore
        ? undefined
        : user1.finalScore > user2.finalScore
          ? user1.username
          : user2.username;

  const user1Name = escapeTableCell(getDisplayName(user1));
  const user2Name = escapeTableCell(getDisplayName(user2));
  const user1Header =
    winnerUsername === user1.username ? `${user1Name} 🏆 Winner` : user1Name;
  const user2Header =
    winnerUsername === user2.username ? `${user2Name} 🏆 Winner` : user2Name;

  return [
    `| Metric | ${user1Header} | ${user2Header} |`,
    "| --- | ---: | ---: |",
    `| Final score | ${formatRawScore(user1.finalScore)} | ${formatRawScore(user2.finalScore)} |`,
    `| Normalized final score | ${formatNormalizedScore(user1.normalizedFinalScore)} | ${formatNormalizedScore(user2.normalizedFinalScore)} |`,
    `| Repository score | ${formatRawScore(user1.repoScore)} | ${formatRawScore(user2.repoScore)} |`,
    `| Normalized repository score | ${formatNormalizedScore(user1.normalizedRepoScore)} | ${formatNormalizedScore(user2.normalizedRepoScore)} |`,
    `| Pull request score | ${formatRawScore(user1.prScore)} | ${formatRawScore(user2.prScore)} |`,
    `| Normalized pull request score | ${formatNormalizedScore(user1.normalizedPRScore)} | ${formatNormalizedScore(user2.normalizedPRScore)} |`,
    `| Community contribution score | ${formatRawScore(user1.contributionScore)} | ${formatRawScore(user2.contributionScore)} |`,
    `| Normalized community contribution score | ${formatNormalizedScore(user1.normalizedContributionScore)} | ${formatNormalizedScore(user2.normalizedContributionScore)} |`,
    "",
    "_Generated with [DevImpact](https://github.com/O2sa/DevImpact)_",
  ].join("\n");
}
