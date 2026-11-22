import type { I18nContextValue } from "@/lib/i18n";
import type { ScoringSignals } from "@/features/scoring";

const SIGNAL_METRICS = [
  "reposAnalyzed",
  "pullRequestsAnalyzed",
  "mergedExternalPRs",
  "ownRepoPRsIgnored",
  "unmergedPRsIgnored",
  "uniqueExternalPRRepos",
  "issuesAnalyzed",
  "externalIssuesCounted",
  "discussionsAnalyzed",
  "externalDiscussionsCounted",
] as const satisfies readonly (keyof ScoringSignals)[];

export function getSignalMetricEntries(
  signals: ScoringSignals | undefined,
  t: I18nContextValue["t"],
): Array<{ label: string; value: number | string }> {
  if (!signals) return [];

  return SIGNAL_METRICS.map((metric) => ({
    label: t(`signals.${metric}`),
    value: signals[metric] ?? "-",
  }));
}
