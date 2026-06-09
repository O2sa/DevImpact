"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import yaml from "js-yaml";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/language-provider";

// ─── Types ─────────────────────────────────────────────────────────────

type CommitterEntry = {
  rank: number;
  name: string;
  login: string;
  avatarUrl: string;
  contributions: number;
};

type CommitterYaml = {
  title?: string;
  total_user_count?: number;
  users?: CommitterEntry[];
};

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

type Props = {
  params: Promise<{ country: string }>;
};

// ─── Fetch helpers ─────────────────────────────────────────────────────

async function fetchCommiters(country: string) {
  const url = `https://raw.githubusercontent.com/ashkulz/committers.top/gh-pages/_data/locations/${country}.yml`;
  const res = await fetch(url, {
    headers: { "User-Agent": "DevImpact-Bot" },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${country}`);
  const text = await res.text();
  const data = yaml.load(text) as CommitterYaml;
  if (!data?.users) throw new Error("Invalid data");
  return {
    title: data.title || country,
    totalFromSource: data.total_user_count ?? data.users.length,
    users: data.users,
  };
}

async function fetchScores(logins: string[]) {
  const params = logins
    .map((u) => `username=${encodeURIComponent(u)}`)
    .join("&");
  const res = await fetch(`/api/score?${params}`);
  if (!res.ok) throw new Error("Failed to score users");
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Scoring failed");
  return { scored: json.scored, errors: json.errors };
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
        const data = await fetchCommiters(country);
        if (cancelled) return;
        setTitle(data.title);
        setTotalFromSource(data.totalFromSource);

        const logins = data.users.map((u) => u.login);
        const { scored: apiScored, errors: apiErrors } =
          await fetchScores(logins);
        if (cancelled) return;

        // Build a rank lookup from the original committers data
        const rankMap = new Map(
          data.users.map((u) => [u.login, { rank: u.rank, contributions: u.contributions }])
        );

        const results: ScoredEntry[] = apiScored.map((s: Record<string, unknown>) => {
          const original = rankMap.get(s.username as string) ?? { rank: 0, contributions: 0 };
          return {
            username: s.username as string,
            name: s.name as string | null,
            avatarUrl: s.avatarUrl as string,
            repoScore: s.repoScore as number,
            prScore: s.prScore as number,
            contributionScore: s.contributionScore as number,
            finalScore: s.finalScore as number,
            originalRank: original.rank,
            originalContributions: original.contributions,
            impactRank: 0,
          };
        });

        results.sort((a, b) => b.finalScore - a.finalScore);
        results.forEach((u, idx) => (u.impactRank = idx + 1));

        setScored(results);
        setErrors(apiErrors);
        setLoading(false);
      } catch (err) {
        if (!cancelled)
          setFailed(
            err instanceof Error ? err.message : "Failed to load leaderboard"
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
