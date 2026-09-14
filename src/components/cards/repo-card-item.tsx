"use client";

import { Eye, GitFork, Star } from "lucide-react";
import { useTranslation } from "@/components/providers/language-provider";
import type { UserResult } from "@/features/developer/types";
import {
  formatLanguageMatch,
  LanguageBreakdown,
  SelectedLanguageRow,
  StatChip,
} from "./work-card-helpers";

export type RepoCardItemProps = {
  repo: UserResult["topRepos"][number];
  rankIndex?: number;
  selectedLanguages?: string[];
  showRank?: boolean;
  className?: string;
};

export function RepoCardItem({
  repo,
  rankIndex,
  selectedLanguages,
  showRank = true,
  className = "",
}: RepoCardItemProps) {
  const { t } = useTranslation();
  const repoName = repo.name || t("untitled");

  return (
    <article
      className={`rounded-xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/25 p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            {showRank && typeof rankIndex === "number" ? (
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                #{rankIndex + 1}
              </span>
            ) : null}

            {repo.url ? (
              <a
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-words font-semibold leading-snug text-primary hover:underline"
                aria-label={t("a11y.openRepo", { name: repoName })}
              >
                {repoName}
              </a>
            ) : (
              <p className="break-words font-semibold leading-snug">{repoName}</p>
            )}
          </div>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <StatChip
              icon={<Star className="h-3 w-3" />}
              label={t("topwork.stars")}
              value={repo.stars ?? 0}
            />
            <StatChip
              icon={<GitFork className="h-3 w-3" />}
              label={t("topwork.forks")}
              value={repo.forks ?? 0}
            />
            <StatChip
              icon={<Eye className="h-3 w-3" />}
              label={t("topwork.watchers")}
              value={repo.watchers ?? 0}
            />
          </div>

          <LanguageBreakdown topLanguages={repo.topLanguages} />

          {selectedLanguages && selectedLanguages.length > 0 ? (
            <SelectedLanguageRow
              topLanguages={repo.topLanguages}
              selectedLanguages={selectedLanguages}
              label={t("topwork.selectedLang")}
            />
          ) : null}

          {typeof repo.languageMatch === "number" ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {t("language.match")}: {formatLanguageMatch(repo.languageMatch)}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 rounded-lg border border-primary/25 bg-primary/5 px-2.5 py-1.5 text-right sm:px-3 sm:py-2">
          <p className="text-lg font-bold text-primary sm:text-xl">{repo.score ?? 0}</p>
          <p className="text-[10px] text-muted-foreground sm:text-[11px]">
            {t("comparsion.score")}
          </p>
        </div>
      </div>
    </article>
  );
}
