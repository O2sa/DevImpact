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

type Props = {
  user1: UserResult;
  user2: UserResult;
};

export function ResultDashboard({ user1, user2 }: Props) {
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

  const getInsights = () => {
    const insights = [];
    if (user1.repoScore > user2.repoScore) {
      insights.push(
        `${user1.username} has stronger repository portfolio with ${user1.repoScore} vs ${user2.repoScore}`,
      );
    } else if (user2.repoScore > user1.repoScore) {
      insights.push(
        `${user2.username} has stronger repository portfolio with ${user2.repoScore} vs ${user1.repoScore}`,
      );
    } else {
      insights.push(`Both developers have equal repository strength`);
    }

    if (user1.prScore > user2.prScore) {
      insights.push(
        `${user1.username} leads in pull request impact (${user1.prScore} vs ${user2.prScore})`,
      );
    } else if (user2.prScore > user1.prScore) {
      insights.push(
        `${user2.username} leads in pull request impact (${user2.prScore} vs ${user1.prScore})`,
      );
    } else {
      insights.push(`Both developers have equal pull request impact`);
    }

    if (user1.contributionScore > user2.contributionScore) {
      insights.push(`${user1.username} shows higher contribution activity`);
    } else if (user2.contributionScore > user1.contributionScore) {
      insights.push(`${user2.username} shows higher contribution activity`);
    } else {
      insights.push(`Both developers have similar contribution levels`);
    }

    return insights;
  };

  const repoDiff =
    Math.max(user1.repoScore, user2.repoScore) -
    Math.min(user1.repoScore, user2.repoScore);
  const prDiff =
    Math.max(user1.prScore, user2.prScore) -
    Math.min(user1.prScore, user2.prScore);

  const handleCopy = async () => {
    const summary = {
      comparison: {
        [user1.username]: {
          finalScore: user1.finalScore,
          repoScore: user1.repoScore,
          prScore: user1.prScore,
          contributionScore: user1.contributionScore,
        },
        [user2.username]: {
          finalScore: user2.finalScore,
          repoScore: user2.repoScore,
          prScore: user2.prScore,
          contributionScore: user2.contributionScore,
        },
        winner: winner?.username ?? "tie",
        leadBy: winner ? `${diffPct}%` : "0%",
        insights: getInsights(),
      },
    };
    await navigator.clipboard.writeText(JSON.stringify(summary, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                  <p className="text-sm text-muted-foreground">Winner</p>
                  <p className="text-3xl font-bold">{winner.username}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Lead by</p>
                <p className="text-2xl font-bold text-primary">{diffPct}%</p>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-white/80">
                Metric
              </p>
              <h2 className="text-xl font-semibold">
                It's a tie — both developers are evenly matched.
              </h2>
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
          aria-label="Copy comparison results to clipboard"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-green-500">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy Result
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <ScoreCard
          title={user1.username}
          value={user1.finalScore}
          highlight={user1.isWinner}
          subtitle="Final score"
        />
        <ScoreCard
          title={user2.username}
          value={user2.finalScore}
          highlight={user2.isWinner}
          subtitle="Final score"
        />
        <ScoreCard title="Repo diff" value={repoDiff} />
        <ScoreCard title="PR diff" value={prDiff} />
      </div>

      <ComparisonTable user1={user1} user2={user2} />
      <ComparisonChart user1={user1} user2={user2} />
      <BreakdownBars user1={user1} user2={user2} />

      <TopList userResults={[user1, user2]} />

      <InsightsList insights={getInsights()} />
    </div>
  );
}
