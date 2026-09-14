"use client";

import type { ReactNode } from "react";
import type { UserResult } from "@/features/developer/types";

export type LanguageEntry = {
  name: string;
  percentage: number;
};

export type LanguageMeta = {
  languageMatch?: number;
  topLanguages?: LanguageEntry[];
};

export function formatLanguageMatch(value?: number): string {
  if (value === undefined) {
    return "N/A";
  }
  return `${Math.round(value * 100)}%`;
}

import { getLanguageColor, normalizeLanguageName } from "@/lib/languages";

export { getLanguageColor, normalizeLanguageName };

export function StatChip({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-background/80 px-2.5 py-1 text-xs">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

export function LanguageBreakdown({ topLanguages }: { topLanguages?: LanguageEntry[] }) {
  if (!topLanguages || topLanguages.length === 0) {
    return null;
  }

  const normalized = topLanguages.slice(0, 5).filter((language) => language.percentage > 0);

  if (normalized.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted/80 shadow-inner">
        {normalized.map((language) => {
          const color = getLanguageColor(language.name);
          return (
            <div
              key={`bar-${language.name}-${language.percentage}`}
              className="transition-all duration-300 first:rounded-l-full last:rounded-r-full hover:opacity-90"
              style={{
                backgroundColor: color,
                width: `${Math.max(0, Math.min(100, language.percentage))}%`,
              }}
              title={`${language.name}: ${language.percentage}%`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-[11px] text-muted-foreground">
        {normalized.map((language) => {
          const color = getLanguageColor(language.name);
          return (
            <span
              key={`legend-${language.name}-${language.percentage}`}
              className="inline-flex items-center gap-1.5 font-medium text-foreground/90"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full shadow-sm"
                style={{ backgroundColor: color }}
              />
              <span>{language.name}</span>
              <span className="text-muted-foreground">{language.percentage}%</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function SelectedLanguageRow({
  topLanguages,
  selectedLanguages,
  label,
}: {
  topLanguages?: LanguageEntry[];
  selectedLanguages?: string[];
  label: string;
}) {
  if (
    !topLanguages ||
    topLanguages.length === 0 ||
    !selectedLanguages ||
    selectedLanguages.length === 0
  ) {
    return null;
  }

  const languageMap = new Map<string, number>();
  for (const language of topLanguages) {
    languageMap.set(normalizeLanguageName(language.name), language.percentage);
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
      <span className="text-muted-foreground">{label}:</span>
      {selectedLanguages.map((language) => {
        const percentage = languageMap.get(normalizeLanguageName(language)) ?? 0;
        const color = getLanguageColor(language);
        return (
          <span
            key={`${language}-${percentage}`}
            className="shadow-xs inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-2.5 py-0.5 font-medium text-foreground"
          >
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <span>
              {language} {percentage}%
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function findRepoLanguageMeta(
  user: UserResult,
  repo: UserResult["topRepos"][number],
): LanguageMeta {
  const languageRepos = user.languageScores?.topRepos ?? [];
  const byUrl = repo.url
    ? languageRepos.find((item) => item.url && item.url === repo.url)
    : undefined;
  const byName = languageRepos.find((item) => item.name === repo.name);
  const match = byUrl ?? byName;

  return {
    languageMatch: match?.languageMatch ?? repo.languageMatch,
    topLanguages: match?.topLanguages ?? repo.topLanguages,
  };
}

export function findPrLanguageMeta(
  user: UserResult,
  pr: UserResult["topPullRequests"][number],
): LanguageMeta {
  const languagePrs = user.languageScores?.topPullRequests ?? [];
  const byUrl = pr.url ? languagePrs.find((item) => item.url && item.url === pr.url) : undefined;
  const byTitleAndRepo = languagePrs.find(
    (item) => item.title === pr.title && item.repo === pr.repo,
  );
  const match = byUrl ?? byTitleAndRepo;

  return {
    languageMatch: match?.languageMatch ?? pr.languageMatch,
    topLanguages: match?.topLanguages ?? pr.topLanguages,
  };
}
