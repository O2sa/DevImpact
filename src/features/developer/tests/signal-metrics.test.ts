import { describe, expect, it } from "vitest";
import type { ScoringSignals } from "@/features/scoring";
import en from "@/locales/en.json";
import ar from "@/locales/ar.json";
import { getSignalMetricEntries } from "../signal-metrics";

const signals: ScoringSignals = {
  reposAnalyzed: 0,
  pullRequestsAnalyzed: 2,
  mergedExternalPRs: 3,
  ownRepoPRsIgnored: 4,
  unmergedPRsIgnored: 5,
  uniqueExternalPRRepos: 6,
  issuesAnalyzed: 7,
  externalIssuesCounted: 8,
  discussionsAnalyzed: 9,
  externalDiscussionsCounted: 10,
  reposWithLanguageData: 11,
};

describe("getSignalMetricEntries", () => {
  it.each([en, ar])("preserves metric order, zeroes and translated labels", (messages) => {
    const entries = getSignalMetricEntries(signals, (key) => messages[key as keyof typeof en]);

    expect(entries).toEqual([
      { label: messages["signals.reposAnalyzed"], value: 0 },
      { label: messages["signals.pullRequestsAnalyzed"], value: 2 },
      { label: messages["signals.mergedExternalPRs"], value: 3 },
      { label: messages["signals.ownRepoPRsIgnored"], value: 4 },
      { label: messages["signals.unmergedPRsIgnored"], value: 5 },
      { label: messages["signals.uniqueExternalPRRepos"], value: 6 },
      { label: messages["signals.issuesAnalyzed"], value: 7 },
      { label: messages["signals.externalIssuesCounted"], value: 8 },
      { label: messages["signals.discussionsAnalyzed"], value: 9 },
      { label: messages["signals.externalDiscussionsCounted"], value: 10 },
    ]);
  });

  it("returns no entries when signals are absent", () => {
    expect(getSignalMetricEntries(undefined, (key) => key)).toEqual([]);
  });

  it("retains the fallback for incomplete cached signals without mutating input", () => {
    const incomplete = Object.freeze({ reposAnalyzed: 0 }) as ScoringSignals;
    const entries = getSignalMetricEntries(incomplete, (key) => key);
    expect(entries[0].value).toBe(0);
    expect(entries.slice(1).every((entry) => entry.value === "-")).toBe(true);
    expect(incomplete).toEqual({ reposAnalyzed: 0 });
  });
});
