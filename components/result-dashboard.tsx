"use client";

import { useState } from "react";
import { ComparisonTable } from "./comparison-table";
import { ComparisonChart } from "./comparison-chart";
import { BreakdownBars } from "./breakdown-bars";
import { TopList } from "./top-list";
import { InsightsList } from "./insights-list";
import { ScoreCard } from "./score-card";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Check, Copy, Trophy } from "lucide-react";
import { UserResult } from "@/types/user-result";
import { useTranslation } from "./language-provider";

type Props = {
  user1: UserResult;
  user2: UserResult;
};

export function ResultDashboard({ user1, user2 }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const winner =
    user1.finalScore === user2.finalScore
      ? null
      : user1.finalScore > user2.finalScore
        ? user1
        : user2;
  const loser = winner === user1 ? user2 : user1;
  const diffPct = winner
    ? Math.round(
      ((winner.finalScore - loser.finalScore) / loser.finalScore) * 100,
    )
    : 0;
  const repoDiff =
    Math.max(user1.repoScore, user2.repoScore) -
    Math.min(user1.repoScore, user2.repoScore);
  const prDiff =
    Math.max(user1.prScore, user2.prScore) -
    Math.min(user1.prScore, user2.prScore);


  const getInsights = () => {
    const insights: string[] = [];

    const user1DisplayName = user1.name || user1.username;
    const user2DisplayName = user2.name || user1.username;

    if (user1.repoScore > user2.repoScore) {
      insights.push(
        t("insights.repo.leader", {
          username: user1DisplayName,
          score: user1.repoScore,
          other: user2.repoScore,
        })
      );
    } else if (user2.repoScore > user1.repoScore) {
      insights.push(
        t("insights.repo.leader", {
          username: user2DisplayName,
          score: user2.repoScore,
          other: user1.repoScore,
        })
      );
    } else {
      insights.push(t("insights.equal.repo"));
    }

    if (user1.prScore > user2.prScore) {
      insights.push(
        t("insights.pr.leader", {
          username: user1DisplayName,
          score: user1.prScore,
          other: user2.prScore,
        })
      );
    } else if (user2.prScore > user1.prScore) {
      insights.push(
        t("insights.pr.leader", {
          username: user2DisplayName,
          score: user2.prScore,
          other: user1.prScore,
        })
      );
    } else {
      insights.push(t("insights.equal.pr"));
    }

    if (user1.contributionScore > user2.contributionScore) {
      insights.push(t("insights.contribution.leader", { username: user1DisplayName }));
    } else if (user2.contributionScore > user1.contributionScore) {
      insights.push(t("insights.contribution.leader", { username: user2DisplayName }));
    } else {
      insights.push(t("insights.equal.contribution"));
    }

    return insights;
  };

  const handleCopy = async () => {
    try {
      const summary = {
        comparison: {
          user1,
          user2,
          winner: winner
            ? {
              username: winner.username,
              name: winner.name || winner.username,
              finalScore: winner.finalScore,
            }
            : "tie",
          leadBy: winner ? `${diffPct}%` : "0%",
          insights: getInsights(),
        },
      };
      await navigator.clipboard.writeText(JSON.stringify(summary, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <CardContent className="flex items-center justify-between p-6">
          {winner ? (
            <>
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/20 p-3">
                  <Trophy className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("banner.winner")}
                  </p>
                  <p className="text-3xl font-bold">
                    {winner.name || winner.username}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {t("banner.leadby")}
                </p>
                <p className="text-2xl font-bold text-primary">{diffPct}%</p>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-white/80">{t("banner.metric")}</p>
              <h2 className="text-xl font-semibold">{t("banner.tie")}</h2>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopy}
          className="flex items-center gap-2"
          aria-label={t("results.copyAria")}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-green-500">{t("results.copied")}</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              {t("results.copy")}
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <ScoreCard
          title={user1.name || user1.username}
          value={user1.finalScore}
          highlight={user1.isWinner}
          subtitle={t("comparsion.final.score")}
        />
        <ScoreCard
          title={user2.name || user2.username}
          value={user2.finalScore}
          highlight={user2.isWinner}
          subtitle={t("comparsion.final.score")}
        />
        <ScoreCard title={t("comparsion.repo.diff")} value={repoDiff} />
        <ScoreCard title={t("comparsion.pr.diff")} value={prDiff} />
      </div>

      <ComparisonTable user1={user1} user2={user2} />
      <ComparisonChart user1={user1} user2={user2} />
      <BreakdownBars user1={user1} user2={user2} />

      <TopList userResults={[user1, user2]} />

      <InsightsList insights={getInsights()} />
    </div>
  );
}
