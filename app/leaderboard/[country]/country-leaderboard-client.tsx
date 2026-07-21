"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/language-provider";
import type { LeaderboardResult } from "@/lib/leaderboard";

type Props = {
  countryTitle: string;
  initialLeaderboard: LeaderboardResult;
  initialError?: string | null;
};

export function CountryLeaderboardClient({
  countryTitle,
  initialLeaderboard,
  initialError = null,
}: Props) {
  const { t } = useTranslation();
  const [title] = useState(initialLeaderboard.title || countryTitle);
  const [totalFromSource] = useState(initialLeaderboard.totalFromSource);
  const [scored] = useState(initialLeaderboard.scored);
  const [errors] = useState(initialLeaderboard.errors);
  const [failed] = useState<string | null>(initialError);
  const [loading] = useState(false);

  if (failed) {
    return (
      <main className="flex min-h-screen flex-col">
        <AppHeader />
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
          <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-5 rounded-3xl border border-destructive/25 bg-gradient-to-b from-destructive/10 via-destructive/5 to-background px-6 py-12 text-center shadow-sm">
            <p className="text-lg font-semibold tracking-tight text-foreground">
              {t("leaderboard.error.title")}
            </p>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground">
              {failed}
            </p>
            <Link href="/leaderboard">
              <Button variant="ghost">{t("leaderboard.back")}</Button>
            </Link>
          </div>
        </div>
        <AppFooter />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10">
        <div className="flex items-center gap-3">
          <Link href="/leaderboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4 rtl:-scale-x-100" />
              {t("leaderboard.back")}
            </Button>
          </Link>
        </div>

        <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background px-6 py-8 shadow-sm">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
              {t("leaderboard.header.eyebrow")}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {t("leaderboard.country.title", { title })}
            </h1>
            <p className="text-sm leading-7 text-muted-foreground sm:text-base">
              {t("leaderboard.country.description", { title })}
            </p>
          </div>
        </section>

        {scored.length > 0 ? (
          <div className="animate-fadeIn">
            <LeaderboardTable
              users={scored}
              failedUsers={errors}
              title={title}
              totalFromSource={totalFromSource}
              usersProcessed={scored.length}
            />
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center gap-2 py-20">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              {t("leaderboard.loading")}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <p className="text-lg font-medium text-muted-foreground">
              {t("leaderboard.noDevelopersFor", { title })}
            </p>
            <Link href="/leaderboard">
              <Button variant="secondary">{t("leaderboard.back")}</Button>
            </Link>
          </div>
        )}
      </div>
      <AppFooter />
    </main>
  );
}
