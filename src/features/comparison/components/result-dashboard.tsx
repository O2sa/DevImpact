"use client";

import { useMemo, useState, useRef } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Check, Copy, ExternalLink, Trophy, Share2, XCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useClipboardCopy } from "@/hooks";
import { Avatar } from "@/components/layout/avatar";
import { ComparisonChart } from "./comparison-chart";
import { TopList } from "./top-list";
import { InsightsList } from "./insights-list";
import { ScoreCard } from "@/components/cards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserResult } from "@/features/developer";
import { useTranslation } from "@/components/providers/language-provider";
import { formatComparisonToMarkdown } from "../format-comparison-to-markdown";
import type { CompareInsights, CompareWinner } from "../types";

type Props = {
  user1: UserResult;
  user2: UserResult;
  winner?: CompareWinner;
  languageWinner?: {
    username: string;
    finalScoreDifference: number;
    percentageDifference: number | null;
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

function getPercentageDifference(winnerScore: number, loserScore: number): number | null {
  if (loserScore <= 0) {
    return winnerScore > loserScore ? null : 0;
  }

  return Math.round(((winnerScore - loserScore) / loserScore) * 100);
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
  const { copied, copy } = useClipboardCopy();
  const { copied: markdownCopied, copy: copyMarkdown } = useClipboardCopy();
  const { copy: copyShare } = useClipboardCopy();
  const [shareState, setShareState] = useState<"idle" | "success" | "error">("idle");
  const shareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setShareFeedback = (state: "success" | "error") => {
    setShareState(state);
    if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
    shareTimerRef.current = setTimeout(() => setShareState("idle"), 2000);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ url });
        setShareFeedback("success");
      } else {
        const success = await copyShare(url);
        setShareFeedback(success ? "success" : "error");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      setShareFeedback("error");
    }
  };

  const methodologyHref = useMemo(() => {
    const query = searchParams.toString();
    return query ? `/scoring-methodology?${query}` : "/scoring-methodology";
  }, [searchParams]);
  const hasLanguageScores = Boolean(user1.languageScores && user2.languageScores);
  const selectedLanguages = useMemo(
    () => user1.languageScores?.selectedLanguages ?? user2.languageScores?.selectedLanguages ?? [],
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
  const winnerDiffPct = winner
    ? winner.percentageDifference
    : overallWinnerUser && loserUser
      ? getPercentageDifference(overallWinnerUser.finalScore, loserUser.finalScore)
      : 0;
  const winnerDiffPoints =
    winner?.finalScoreDifference ??
    (overallWinnerUser && loserUser
      ? Math.round(Math.abs(overallWinnerUser.finalScore - loserUser.finalScore))
      : 0);
  const winnerLeadValue =
    winnerDiffPct === null
      ? t("results.pointsLead", { points: winnerDiffPoints })
      : `${winnerDiffPct}%`;

  const handleCopy = () => {
    copy(
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
  };

  const handleCopyMarkdown = () => {
    copyMarkdown(formatComparisonToMarkdown(user1, user2, winner));
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
              <Link href={`/user/${user.username}` as Route}>
                <Avatar
                  src={user.avatarUrl}
                  alt={t("comparison.avatarAlt", { name: title })}
                  size={28}
                  className="transition-transform hover:scale-105"
                />
              </Link>
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/user/${user.username}` as Route}
                  className="font-semibold text-primary hover:underline"
                >
                  {title}
                </Link>
                <a
                  href={getGithubProfileUrl(user.username)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={t("a11y.openProfile", { name: title })}
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
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
              title={t("comparison.final.score")}
              rawValue={scoreData.final}
              normalizedValue={scoreData.finalNormalized}
              highlight={isWinner}
              helperText={t("tooltip.final")}
            />
            <ScoreCard
              title={t("comparison.repo.score")}
              rawValue={scoreData.repo}
              normalizedValue={scoreData.repoNormalized}
              helperText={t("tooltip.repo")}
            />
            <ScoreCard
              title={t("comparison.pr.score")}
              rawValue={scoreData.pr}
              normalizedValue={scoreData.prNormalized}
              helperText={t("tooltip.pr")}
            />
            <ScoreCard
              title={t("comparison.contribution.score")}
              rawValue={scoreData.contribution}
              normalizedValue={scoreData.contributionNormalized}
              helperText={t("tooltip.contribution")}
            />
          </div>
          {languageScore ? (
            <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
                {t("comparison.language.final.score")}
              </p>
              <p className="mt-1 text-xl font-bold">
                {Math.round(languageScore.normalizedFinalScore ?? languageScore.finalScore)}
                {languageScore.normalizedFinalScore !== undefined ? " / 100" : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("comparison.score")}: {Math.round(languageScore.finalScore)}
              </p>
            </div>
          ) : null}
          <div className="flex justify-end pt-1">
            <Link
              href={`/user/${user.username}` as Route}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <span>{t("profile.viewFullStats")}</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSignalStats = (user: UserResult, idx: number) => {
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
      <Card key={`signal-${user.username}-${idx}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Link href={`/user/${user.username}` as Route}>
              <Avatar
                src={user.avatarUrl}
                alt={t("comparison.avatarAlt", { name: getDisplayName(user) })}
                size={24}
                className="transition-transform hover:scale-105"
              />
            </Link>
            <div className="flex items-center gap-1.5">
              <Link
                href={`/user/${user.username}` as Route}
                className="font-semibold text-primary hover:underline"
              >
                {getDisplayName(user)}
              </Link>
              <a
                href={getGithubProfileUrl(user.username)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-muted-foreground transition-colors hover:text-foreground"
                aria-label={t("a11y.openProfile", { name: getDisplayName(user) })}
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
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
    <div className="animate-fadeIn space-y-6">
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {overallWinnerUser ? (
              <>
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  {/* Winner Avatar with Corner Trophy Badge */}
                  <div className="relative shrink-0">
                    <Link
                      href={`/user/${overallWinnerUser.username}` as Route}
                      className="group block"
                      aria-label={t("a11y.openProfile", {
                        name: getDisplayName(overallWinnerUser),
                      })}
                    >
                      <Avatar
                        src={overallWinnerUser.avatarUrl}
                        alt={t("comparison.avatarAlt", {
                          name: getDisplayName(overallWinnerUser),
                        })}
                        size={56}
                        className="h-12 w-12 object-cover ring-2 ring-primary/30 transition-transform duration-200 group-hover:scale-105 sm:h-14 sm:w-14"
                      />
                    </Link>
                    <div
                      className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm ring-2 ring-background dark:bg-amber-400 dark:text-zinc-950"
                      title={t("banner.winner")}
                    >
                      <Trophy className="h-3.5 w-3.5 fill-current" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
                      {t("banner.winner")}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/user/${overallWinnerUser.username}` as Route}
                        className="truncate text-xl font-bold text-foreground transition-colors hover:text-primary hover:underline sm:text-2xl md:text-3xl"
                      >
                        {getDisplayName(overallWinnerUser)}
                      </Link>
                      <a
                        href={getGithubProfileUrl(overallWinnerUser.username)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={t("a11y.openProfile", {
                          name: getDisplayName(overallWinnerUser),
                        })}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        @{overallWinnerUser.username}
                      </span>
                    </div>

                    {/* Compact Lead Pill on Mobile */}
                    <div className="pt-0.5 sm:hidden">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        <span className="text-muted-foreground">{t("banner.leadby")}:</span>
                        <span>{winnerLeadValue}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bold Stat Block on Desktop */}
                <div className="hidden shrink-0 text-right sm:block">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
                    {t("banner.leadby")}
                  </p>
                  <p className="text-2xl font-bold text-primary md:text-3xl">{winnerLeadValue}</p>
                </div>
              </>
            ) : (
              <div className="flex w-full flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
                    {t("banner.metric")}
                  </p>
                  <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                    {t("banner.tie")}
                  </h2>
                </div>
              </div>
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
                    <Link href={`/user/${languageWinner.username}` as Route}>
                      <Avatar
                        src={winnerAvatar}
                        alt={t("comparison.avatarAlt", { name: winnerName })}
                        size={20}
                        className="transition-transform hover:scale-105"
                      />
                    </Link>
                  ) : null}
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-cyan-700 dark:text-cyan-300">
                    <span>{t("banner.languageWinner")}:</span>
                    <Link
                      href={`/user/${languageWinner.username}` as Route}
                      className="hover:underline"
                    >
                      {winnerName}
                    </Link>
                    <a
                      href={getGithubProfileUrl(languageWinner.username)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={t("a11y.openProfile", { name: winnerName })}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              );
            })()}
            <p className="mt-1 text-xs text-muted-foreground">
              {t("language.focus")}: {languageWinner.selectedLanguages.join(", ")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("banner.leadby")}{" "}
              {languageWinner.percentageDifference === null
                ? t("results.pointsLead", {
                    points: languageWinner.finalScoreDifference,
                  })
                : `${languageWinner.percentageDifference}%`}
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

      <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:justify-end sm:gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleShare}
          className="flex w-full items-center justify-center gap-1.5 px-2 text-xs sm:w-auto sm:px-3 sm:text-sm"
          aria-label={t("results.shareAria")}
        >
          {shareState === "success" ? (
            <>
              <Check className="h-3.5 w-3.5 shrink-0 text-green-500 sm:h-4 sm:w-4" />
              <span className="truncate text-green-500">{t("results.shareSuccess")}</span>
            </>
          ) : shareState === "error" ? (
            <>
              <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive sm:h-4 sm:w-4" />
              <span className="truncate text-destructive">{t("results.shareError")}</span>
            </>
          ) : (
            <>
              <Share2 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span className="truncate">{t("results.share")}</span>
            </>
          )}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopy}
          className="flex w-full items-center justify-center gap-1.5 px-2 text-xs sm:w-auto sm:px-3 sm:text-sm"
          aria-label={t("results.copyAria")}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 shrink-0 text-green-500 sm:h-4 sm:w-4" />
              <span className="truncate text-green-500">{t("results.copied")}</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span className="truncate">{t("results.copy")}</span>
            </>
          )}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopyMarkdown}
          className="flex w-full items-center justify-center gap-1.5 px-2 text-xs sm:w-auto sm:px-3 sm:text-sm"
          aria-label={t("results.copyMarkdownAria")}
        >
          {markdownCopied ? (
            <>
              <Check className="h-3.5 w-3.5 shrink-0 text-green-500 sm:h-4 sm:w-4" />
              <span className="truncate text-green-500">{t("results.copied")}</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span className="truncate">{t("results.copyMarkdown")}</span>
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
        <summary className="cursor-pointer text-sm font-semibold">{t("signals.title")}</summary>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {renderSignalStats(user1, 1)}
          {renderSignalStats(user2, 2)}
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
