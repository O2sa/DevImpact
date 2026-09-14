import type { DiscussionNode, IssueNode } from "@/lib/github";
import type { CommunityContributionDetail } from "../types";
import { getDiminishingWeight, safeLog, sanitizeNumber } from "./scoring-helpers";

export type CommunityScoreResult = {
  total: number;
  details: CommunityContributionDetail[];
  issuesAnalyzed: number;
  externalIssuesCounted: number;
  discussionsAnalyzed: number;
  externalDiscussionsCounted: number;
};

export function calculateCommunityItemScore(item: IssueNode | DiscussionNode): number {
  const repoStars = Math.max(0, item.repository.stargazerCount);
  const comments = Math.max(0, item.comments.totalCount);
  let score = safeLog(repoStars) * safeLog(comments);

  if (comments === 0) {
    score *= 0.2;
  }

  return sanitizeNumber(score);
}

export function calculateContributionScore(
  issues: IssueNode[],
  discussions: DiscussionNode[],
  username: string,
): CommunityScoreResult {
  const normalizedUsername = username.toLowerCase();
  const details: CommunityContributionDetail[] = [];

  let externalIssuesCounted = 0;
  let externalDiscussionsCounted = 0;

  for (const issue of issues) {
    if (issue.repository.owner.login.toLowerCase() === normalizedUsername) {
      continue;
    }

    const score = calculateCommunityItemScore(issue);
    details.push({
      type: "issue",
      item: issue,
      score,
    });
    externalIssuesCounted += 1;
  }

  for (const discussion of discussions) {
    if (discussion.repository.owner.login.toLowerCase() === normalizedUsername) {
      continue;
    }

    const score = calculateCommunityItemScore(discussion);
    details.push({
      type: "discussion",
      item: discussion,
      score,
    });
    externalDiscussionsCounted += 1;
  }

  details.sort((a, b) => b.score - a.score);

  const total = details.reduce((sum, detail, index) => {
    return sum + detail.score * getDiminishingWeight(index);
  }, 0);

  return {
    total: sanitizeNumber(total),
    details,
    issuesAnalyzed: issues.length,
    externalIssuesCounted,
    discussionsAnalyzed: discussions.length,
    externalDiscussionsCounted,
  };
}
