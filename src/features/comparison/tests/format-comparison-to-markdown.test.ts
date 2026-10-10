import { describe, expect, test } from "vitest";
import { formatComparisonToMarkdown } from "@/features/comparison/format-comparison-to-markdown";
import type { UserResult } from "@/features/developer";
import type { CompareWinner } from "@/features/comparison/types";

function comparisonUser(overrides: Partial<UserResult> & Pick<UserResult, "username">) {
  return {
    username: overrides.username,
    name: overrides.name ?? null,
    finalScore: overrides.finalScore ?? 0,
    repoScore: overrides.repoScore ?? 0,
    prScore: overrides.prScore ?? 0,
    contributionScore: overrides.contributionScore ?? 0,
    normalizedFinalScore: overrides.normalizedFinalScore,
    normalizedRepoScore: overrides.normalizedRepoScore,
    normalizedPRScore: overrides.normalizedPRScore,
    normalizedContributionScore: overrides.normalizedContributionScore,
  };
}

describe("formatComparisonToMarkdown", () => {
  test("formats the score comparison, winner badge, and attribution", () => {
    const user1 = comparisonUser({
      username: "alice",
      name: "Alice",
      finalScore: 82.456,
      normalizedFinalScore: 82.4,
      repoScore: 30.123,
      normalizedRepoScore: 30.6,
      prScore: 25.456,
      normalizedPRScore: 25.4,
      contributionScore: 26.877,
      normalizedContributionScore: 26.4,
    });
    const user2 = comparisonUser({
      username: "bob",
      name: "Bob",
      finalScore: 70.2,
      normalizedFinalScore: 70.1,
      repoScore: 25.1,
      normalizedRepoScore: 25.2,
      prScore: 20.2,
      normalizedPRScore: 20.3,
      contributionScore: 24.9,
      normalizedContributionScore: 24.6,
    });
    const winner: CompareWinner = {
      username: "alice",
      finalScoreDifference: 12,
      percentageDifference: 17,
    };

    expect(formatComparisonToMarkdown(user1, user2, winner)).toBe(
      [
        "| Metric | Alice 🏆 Winner | Bob |",
        "| --- | ---: | ---: |",
        "| Final score | 82.46 | 70.20 |",
        "| Normalized final score | 82 / 100 | 70 / 100 |",
        "| Repository score | 30.12 | 25.10 |",
        "| Normalized repository score | 31 / 100 | 25 / 100 |",
        "| Pull request score | 25.46 | 20.20 |",
        "| Normalized pull request score | 25 / 100 | 20 / 100 |",
        "| Community contribution score | 26.88 | 24.90 |",
        "| Normalized community contribution score | 26 / 100 | 25 / 100 |",
        "",
        "_Generated with [DevImpact](https://github.com/O2sa/DevImpact)_",
      ].join("\n"),
    );
  });

  test("falls back to usernames and score ranking when display names and winner are absent", () => {
    const user1 = comparisonUser({ username: "alice", finalScore: 1 });
    const user2 = comparisonUser({ username: "bob", finalScore: 2 });

    expect(formatComparisonToMarkdown(user1, user2)).toContain(
      "| Metric | alice | bob 🏆 Winner |",
    );
    expect(formatComparisonToMarkdown(user1, user2)).toContain(
      "| Normalized final score | — | — |",
    );
  });

  test("escapes table delimiters and line breaks in display names", () => {
    const user1 = comparisonUser({ username: "alice", name: "Alice | A\nDev", finalScore: 1 });
    const user2 = comparisonUser({ username: "bob" });

    expect(formatComparisonToMarkdown(user1, user2)).toContain(
      "| Metric | Alice \\| A<br>Dev 🏆 Winner | bob |",
    );
  });
});
