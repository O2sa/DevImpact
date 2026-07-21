"use client";

import { useTranslation } from "@/components/language-provider";

type Props = {
  countryCount: number;
};

export function LeaderboardHero({ countryCount }: Props) {
  const { t } = useTranslation();

  return (
    <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background px-6 py-8 shadow-sm">
      <div className="max-w-3xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
          {t("leaderboard.page.eyebrow")}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("leaderboard.page.title")}
        </h1>
        <p className="text-sm leading-7 text-muted-foreground sm:text-base">
          {t("leaderboard.page.description")}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("leaderboard.page.count", { count: countryCount })}
        </p>
      </div>
    </section>
  );
}
