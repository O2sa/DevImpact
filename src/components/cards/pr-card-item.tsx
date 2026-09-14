"use client";

import { ArrowDown, ArrowUp, Star } from "lucide-react";
import { useTranslation } from "@/components/providers/language-provider";
import type { UserResult } from "@/features/developer/types";
import {
  formatLanguageMatch,
  LanguageBreakdown,
  SelectedLanguageRow,
  StatChip,
} from "./work-card-helpers";

export type PullRequestCardItemProps = {
  pr: UserResult["topPullRequests"][number];
  rankIndex?: number;
  selectedLanguages?: string[];
  showRank?: boolean;
  className?: string;
};

export function PullRequestCardItem({
  pr,
  rankIndex,
  selectedLanguages,
  showRank = true,
  className = "",
}: PullRequestCardItemProps) {
  const { t } = useTranslation();
  const prTitle = pr.title || t("untitled");
  const targetRepo = pr.repo || t("unknown.repo");

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

            {pr.url ? (
              <a
                href={pr.url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-words font-semibold leading-snug text-primary hover:underline"
                aria-label={t("a11y.openPullRequest", { title: prTitle })}
              >
                {prTitle}
              </a>
            ) : (
              <p className="break-words font-semibold leading-snug">{prTitle}</p>
            )}
          </div>

          <p className="mt-1 break-words text-xs font-medium text-muted-foreground">
            {t("topwork.inRepo", { repo: targetRepo })}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <StatChip
              icon={<Star className="h-3 w-3" />}
              label={t("topwork.pr.repo.stars")}
              value={pr.stars ?? 0}
            />
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-2.5 py-1 text-xs">
              <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                <ArrowUp className="h-3 w-3" />+{pr.additions ?? 0}
              </span>
              <span className="text-muted-foreground">/</span>
              <span className="inline-flex items-center gap-0.5 font-semibold text-rose-600 dark:text-rose-400">
                <ArrowDown className="h-3 w-3" />-{pr.deletions ?? 0}
              </span>
            </div>
          </div>

          <LanguageBreakdown topLanguages={pr.topLanguages} />

          {selectedLanguages && selectedLanguages.length > 0 ? (
            <SelectedLanguageRow
              topLanguages={pr.topLanguages}
              selectedLanguages={selectedLanguages}
              label={t("topwork.selectedLang")}
            />
          ) : null}

          {typeof pr.languageMatch === "number" ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {t("language.match")}: {formatLanguageMatch(pr.languageMatch)}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 rounded-lg border border-primary/25 bg-primary/5 px-2.5 py-1.5 text-right sm:px-3 sm:py-2">
          <p className="text-lg font-bold text-primary sm:text-xl">{pr.score ?? 0}</p>
          <p className="text-[10px] text-muted-foreground sm:text-[11px]">
            {t("comparsion.score")}
          </p>
        </div>
      </div>
    </article>
  );
}
