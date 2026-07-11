"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/language-provider";

// ─── Types ─────────────────────────────────────────────────────────────

type ScoredEntry = {
  username: string;
  name: string | null;
  avatarUrl: string;
  repoScore: number;
  prScore: number;
  contributionScore: number;
  finalScore: number;
  originalRank: number;
  originalContributions: number;
  impactRank: number;
};

type LeaderboardApiResponse = {
  success: boolean;
  title: string;
  totalFromSource: number;
  scored: ScoredEntry[];
  errors: string[];
};

type Props = {
  params: Promise<{ country: string }>;
};

// ─── Fetch helpers ─────────────────────────────────────────────────────

async function fetchLeaderboard(country: string): Promise<LeaderboardApiResponse> {
  const res = await fetch(`/api/leaderboard?country=${encodeURIComponent(country)}`);
  if (!res.ok) throw new Error(`Failed to fetch leaderboard for ${country}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to load leaderboard");
  return json;
}

// ─── Component ─────────────────────────────────────────────────────────

export default function CountryLeaderboardPage({ params }: Props) {
  const { country } = use(params);
  const { t } = useTranslation();

  const [title, setTitle] = useState("");
  const [totalFromSource, setTotalFromSource] = useState(0);
  const [scored, setScored] = useState<ScoredEntry[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await fetchLeaderboard(country);
        if (cancelled) return;

        setTitle(data.title);
        setTotalFromSource(data.totalFromSource);
        setScored(data.scored);
        setErrors(data.errors);
        setLoading(false);
      } catch (err) {
        if (!cancelled)
          setFailed(
            err instanceof Error ? err.message : "Failed to load leaderboard",
          );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [country]);

  if (failed) {
    return (
      <main className="flex min-h-screen flex-col">
        <AppHeader />
        <div className="w-full flex-1 max-w-6xl mx-auto px-4 py-10">
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
      <div className="w-full flex-1 max-w-6xl mx-auto px-4 py-10 space-y-6">
        {/* Back navigation */}
        <div className="flex items-center gap-3">
          <Link href="/leaderboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4 rtl:-scale-x-100" />
              {t("leaderboard.back")}
            </Button>
          </Link>
        </div>

        {/* Leaderboard table */}
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

        {/* Scoring progress indicator */}
        {loading && scored.length > 0 && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              {t("leaderboard.loading")}
            </span>
          </div>
        )}
      </div>
      <AppFooter />
    </main>
  );
}