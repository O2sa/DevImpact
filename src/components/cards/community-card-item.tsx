"use client";

import { MessageSquare, Star } from "lucide-react";
import { useTranslation } from "@/components/providers/language-provider";
import type { UserResult } from "@/features/developer/types";
import { StatChip } from "./work-card-helpers";

export type CommunityCardItemProps = {
  item: NonNullable<UserResult["topCommunityContributions"]>[number];
  rankIndex?: number;
  showRank?: boolean;
  className?: string;
};

export function CommunityCardItem({
  item,
  rankIndex,
  showRank = true,
  className = "",
}: CommunityCardItemProps) {
  const { t } = useTranslation();
  const itemTitle = item.title || t("untitled");

  return (
    <article
      className={`rounded-xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/25 p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {showRank && typeof rankIndex === "number" ? (
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                #{rankIndex + 1}
              </span>
            ) : null}

            <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground sm:text-[11px]">
              {item.type === "issue" ? t("community.issue") : t("community.discussion")}
            </span>
          </div>

          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 block break-words font-semibold leading-snug text-primary hover:underline"
              aria-label={t("a11y.openCommunityContribution", {
                title: itemTitle,
              })}
            >
              {itemTitle}
            </a>
          ) : (
            <p className="mt-1.5 break-words font-semibold leading-snug">{itemTitle}</p>
          )}

          <p className="mt-1 break-words text-xs font-medium text-muted-foreground">
            {item.repo || t("unknown.repo")}
          </p>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <StatChip
              icon={<Star className="h-3 w-3" />}
              label={t("topwork.stars")}
              value={item.stars ?? 0}
            />
            <StatChip
              icon={<MessageSquare className="h-3 w-3" />}
              label={t("community.comments")}
              value={item.comments ?? 0}
            />
          </div>
        </div>

        <div className="shrink-0 rounded-lg border border-primary/25 bg-primary/5 px-2.5 py-1.5 text-right sm:px-3 sm:py-2">
          <p className="text-lg font-bold text-primary sm:text-xl">{item.score ?? 0}</p>
          <p className="text-[10px] text-muted-foreground sm:text-[11px]">
            {t("comparsion.score")}
          </p>
        </div>
      </div>
    </article>
  );
}
