"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Trophy } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ComparisonChart } from "./comparison-chart";
import { TopList } from "./top-list";
import { InsightsList } from "./insights-list";
import { ScoreCard } from "./score-card";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { UserResult } from "@/types/user-result";
import { useTranslation } from "./language-provider";
import { CompareInsights, CompareWinner } from "@/types/api-response";

type Props = {
  user1: UserResult;
  user2: UserResult;
  winner?: CompareWinner;
  languageWinner?: {
    username: string;
    finalScoreDifference: number;
    percentageDifference: number;
    selectedLanguages: string[];
  };
  insights?: CompareInsights;
  scoreVersion?: string;
};


function formatPercentage(value?: number) {
  if (typeof value !== "number") return "N/A";
  return `${Math.round(value * 100)}%`;
}

function getDisplayName(user: UserResult): string {
  return user.name?.trim() || user.username;
}

function getGithubProfileUrl(username: string): string {
  return `https://github.com/${username}`;
}

export function ResultDashboard({
  user1,
  user2,
  winner,
  languageWinner,
  insights,
  scoreVersion,
}: Props) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);
  const methodologyHref = useMemo(() => {
    const query = searchParams.toString();
    return query ? `/scoring-methodology?${query}` : "/scoring-methodology";
  }, [searchParams]);
  const hasLanguageScores = Boolean(user1.languageScores && user2.languageScores);
  const selectedLanguages = useMemo(
    () =>
      user1.languageScores?.selectedLanguages ??
      user2.languageScores?.selectedLanguages ??
      [],
    [user1.languageScores, user2.languageScores],
  );
  const userByUsername = useMemo(
    () =>
      new Map<string, UserResult>([
        [user1.username, user1],
        [user2.username, user2],
      ]),
    [user1, user2],
  );

  const winnerFromScores =
    user1.finalScore === user2.finalScore
      ? null
      : user1.finalScore > user2.finalScore
        ? user1
        : user2;
  const overallWinnerUser =
    winner?.username === user1.username
      ? user1
      : winner?.username === user2.username
        ? user2
        : winnerFromScores;
  const loserUser =
    overallWinnerUser === user1 ? user2 : overallWinnerUser === user2 ? user1 : null;
  const winnerDiffPct =
    overallWinnerUser && loserUser && loserUser.finalScore > 0
      ? Math.round(
          ((overallWinnerUser.finalScore - loserUser.finalScore) / loserUser.finalScore) *
            100,
        )
      : 0;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(
          {
            user1,
            user2,
            winner,
            languageWinner,
            insights,
            scoreVersion,
          },
          null,
          2,
        ),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const renderScoreGroup = (user: UserResult) => {
    const title = getDisplayName(user);
    const isWinner = user.isWinner;
    const scoreData = {
      final: user.finalScore,
      finalNormalized: user.normalizedFinalScore,
      repo: user.repoScore,
      repoNormalized: user.normalizedRepoScore,
      pr: user.prScore,
      prNormalized: user.normalizedPRScore,
      contribution: user.contributionScore,
      contributionNormalized: user.normalizedContributionScore,
    };
    const languageScore = user.languageScores;

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <Image
                src={user.avatarUrl}
                alt={t("comparison.avatarAlt", { name: title })}
                width={28}
                height={28}
                className="rounded-full ring-1 ring-border"
              />
              <a
                href={getGithubProfileUrl(user.username)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline"
                aria-label={t("a11y.openProfile", { name: title })}
              >
                {title}
              </a>
            </div>
            {isWinner ? (
              <span className="rounded-full bg-primary/15 px-2 py-1 text-xs font-semibold text-primary">
                {t("banner.winner")}
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
          <ScoreCard
            title={t("comparsion.final.score")}
            rawValue={scoreData.final}
            normalizedValue={scoreData.finalNormalized}
            highlight={isWinner}
            helperText={t("tooltip.final")}
          />
          <ScoreCard
            title={t("comparsion.repo.score")}
            rawValue={scoreData.repo}
            normalizedValue={scoreData.repoNormalized}
            helperText={t("tooltip.repo")}
          />
          <ScoreCard
            title={t("comparsion.pr.score")}
            rawValue={scoreData.pr}
            normalizedValue={scoreData.prNormalized}
            helperText={t("tooltip.pr")}
          />
          <ScoreCard
            title={t("comparsion.contribution.score")}
            rawValue={scoreData.contribution}
            normalizedValue={scoreData.contributionNormalized}
            helperText={t("tooltip.contribution")}
          />
          </div>
          {languageScore ? (
            <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
                {t("comparsion.language.final.score")}
              </p>
              <p className="mt-1 text-xl font-bold">
                {Math.round(
                  languageScore.normalizedFinalScore ?? languageScore.finalScore,
                )}
                {languageScore.normalizedFinalScore !== undefined ? " / 100" : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("comparsion.score")}: {Math.round(languageScore.finalScore)}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  };

  const renderSignalStats = (user: UserResult) => {
    if (!user.signals) return null;

    const signalEntries: Array<{ label: string; value: string | number }> = [
      { label: t("signals.reposAnalyzed"), value: user.signals.reposAnalyzed ?? "-" },
      {
        label: t("signals.pullRequestsAnalyzed"),
        value: user.signals.pullRequestsAnalyzed ?? "-",
      },
      { label: t("signals.mergedExternalPRs"), value: user.signals.mergedExternalPRs ?? "-" },
      { label: t("signals.ownRepoPRsIgnored"), value: user.signals.ownRepoPRsIgnored ?? "-" },
      { label: t("signals.unmergedPRsIgnored"), value: user.signals.unmergedPRsIgnored ?? "-" },
      {
        label: t("signals.uniqueExternalPRRepos"),
        value: user.signals.uniqueExternalPRRepos ?? "-",
      },
      { label: t("signals.issuesAnalyzed"), value: user.signals.issuesAnalyzed ?? "-" },
      {
        label: t("signals.externalIssuesCounted"),
        value: user.signals.externalIssuesCounted ?? "-",
      },
      {
        label: t("signals.discussionsAnalyzed"),
        value: user.signals.discussionsAnalyzed ?? "-",
      },
      {
        label: t("signals.externalDiscussionsCounted"),
        value: user.signals.externalDiscussionsCounted ?? "-",
      },
      {
        label: t("signals.reposWithLanguageData"),
        value: user.signals.reposWithLanguageData ?? "-",
      },
      {
        label: t("signals.prsWithLanguageData"),
        value: user.signals.prsWithLanguageData ?? "-",
      },
      {
        label: t("signals.averageRepoLanguageMatch"),
        value: formatPercentage(user.signals.averageRepoLanguageMatch),
      },
      {
        label: t("signals.averagePRLanguageMatch"),
        value: formatPercentage(user.signals.averagePRLanguageMatch),
      },
    ];

    return (
      <Card key={`signal-${user.username}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Image
              src={user.avatarUrl}
              alt={t("comparison.avatarAlt", { name: getDisplayName(user) })}
              width={24}
              height={24}
              className="rounded-full ring-1 ring-border"
            />
            <a
              href={getGithubProfileUrl(user.username)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:underline"
              aria-label={t("a11y.openProfile", { name: getDisplayName(user) })}
            >
              {getDisplayName(user)}
            </a>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {signalEntries.map((entry) => (
            <div
              key={`${user.username}-${entry.label}`}
              className="rounded-lg border border-border p-3"
            >
              <p className="text-xs text-muted-foreground">{entry.label}</p>
              <p className="mt-1 text-sm font-semibold">{entry.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {overallWinnerUser ? (
              <>
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/20 p-3">
                    <Trophy className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("banner.winner")}</p>
                    <a
                      href={getGithubProfileUrl(overallWinnerUser.username)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-3xl font-bold text-primary hover:underline"
                      aria-label={t("a11y.openProfile", {
                        name: getDisplayName(overallWinnerUser),
                      })}
                    >
                      {getDisplayName(overallWinnerUser)}
                    </a>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{t("banner.leadby")}</p>
                  <p className="text-2xl font-bold text-primary">{winnerDiffPct}%</p>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{t("banner.metric")}</p>
                <h2 className="text-xl font-semibold">{t("banner.tie")}</h2>
              </>
            )}
          </div>
          {scoreVersion ? (
            <div className="mt-3">
              <span className="rounded-full border border-border bg-background/80 px-3 py-1 text-xs text-muted-foreground">
                {t("results.scoreVersion")}: {scoreVersion}
              </span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {languageWinner ? (
        <Card className="border border-cyan-500/25 bg-cyan-500/5">
          <CardContent className="p-5">
            {(() => {
              const languageWinnerUser = userByUsername.get(languageWinner.username);
              const winnerName = languageWinnerUser
                ? getDisplayName(languageWinnerUser)
                : languageWinner.username;
              const winnerAvatar = languageWinnerUser?.avatarUrl;
              return (
                <div className="flex items-center gap-2">
                  {winnerAvatar ? (
                    <Image
                      src={winnerAvatar}
                      alt={t("comparison.avatarAlt", { name: winnerName })}
                      width={20}
                      height={20}
                      className="rounded-full ring-1 ring-border"
                    />
                  ) : null}
                  <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">
                    {t("banner.languageWinner")}:{" "}
                    <a
                      href={getGithubProfileUrl(languageWinner.username)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                      aria-label={t("a11y.openProfile", { name: winnerName })}
                    >
                      {winnerName}
                    </a>
                  </p>
                </div>
              );
            })()}
            <p className="mt-1 text-xs text-muted-foreground">
              {t("language.focus")}: {languageWinner.selectedLanguages.join(", ")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("banner.leadby")} {languageWinner.percentageDifference}%
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{t("language.winnerNote")}</p>
          </CardContent>
        </Card>
      ) : null}

      {hasLanguageScores && selectedLanguages.length > 0 ? (
        <Card>
          <CardContent className="p-4 text-sm">
            <p className="font-semibold">
              {t("language.focus")}: {selectedLanguages.join(", ")}
            </p>
            <p className="text-muted-foreground">{t("language.optionalNote")}</p>
          </CardContent>
        </Card>
      ) : null}

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

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("section.overall")}
        </h3>
        <div className="grid gap-4 lg:grid-cols-2">
          {renderScoreGroup(user1)}
          {renderScoreGroup(user2)}
        </div>
      </section>

      <ComparisonChart user1={user1} user2={user2} />

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("section.topOverall")}
        </h3>
        <TopList userResults={[user1, user2]} selectedLanguages={selectedLanguages} />
      </section>

      <InsightsList
        insights={insights}
        user1={user1}
        user2={user2}
        user1Name={getDisplayName(user1)}
        user2Name={getDisplayName(user2)}
      />

      <details className="rounded-xl border border-border bg-card p-4">
        <summary className="cursor-pointer text-sm font-semibold">
          {t("signals.title")}
        </summary>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {renderSignalStats(user1)}
          {renderSignalStats(user2)}
        </div>
      </details>

      <Card>
        <CardHeader>
          <CardTitle>{t("explanations.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("methodology.cta.description")}</p>
          <a
            href={methodologyHref}
            className="inline-flex items-center rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {t("methodology.cta.button")}
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
