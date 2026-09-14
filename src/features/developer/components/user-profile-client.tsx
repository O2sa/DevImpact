"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Route } from "next";
import { useClipboardCopy } from "@/hooks";
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  GitPullRequest,
  MapPin,
  MessageSquare,
  Scale,
  ShieldCheck,
  Star,
  Trophy,
} from "lucide-react";
import { Avatar } from "@/components/layout/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ScoreCard,
  RepoCardItem,
  PullRequestCardItem,
  CommunityCardItem,
} from "@/components/cards";
import { useTranslation } from "@/components/providers/language-provider";
import { getCountryCode, detectCountry } from "@/lib/geo";
import countriesData from "@/data/countries.json";
import type { UserResult } from "../types";

type CountryInfo = {
  slug: string;
  title: string;
};

const countries = countriesData as CountryInfo[];

type Props = {
  user: UserResult;
  location?: string | null;
  countryParam?: string | null;
};

export function UserProfileClient({ user, location, countryParam }: Props) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { copied, copy } = useClipboardCopy();

  const displayName = user.name?.trim() || user.username;
  const githubUrl = `https://github.com/${user.username}`;
  const compareUrl = `/?user1=${encodeURIComponent(user.username)}`;

  // Location & Country detection
  const detectedSlug = detectCountry(location ?? null);
  const rawCountry = (countryParam || searchParams.get("country") || detectedSlug || "")
    .trim()
    .toLowerCase();
  const activeCountrySlug = rawCountry ? rawCountry.replace(/[^a-z0-9_-]/g, "") : null;

  const activeCountryInfo = activeCountrySlug
    ? (countries.find((c) => c.slug.toLowerCase() === activeCountrySlug) ?? {
        slug: activeCountrySlug,
        title: activeCountrySlug
          .split("_")
          .filter(Boolean)
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(" "),
      })
    : null;

  const flagSlug = activeCountryInfo?.slug || detectedSlug;
  const flagCode = flagSlug ? getCountryCode(flagSlug) : null;

  const handleCopyLink = () => copy(window.location.href);

  // Signal stats entries for transparency
  const signalEntries = user.signals
    ? [
        { label: t("signals.reposAnalyzed"), value: user.signals.reposAnalyzed ?? "-" },
        {
          label: t("signals.pullRequestsAnalyzed"),
          value: user.signals.pullRequestsAnalyzed ?? "-",
        },
        {
          label: t("signals.mergedExternalPRs"),
          value: user.signals.mergedExternalPRs ?? "-",
        },
        {
          label: t("signals.ownRepoPRsIgnored"),
          value: user.signals.ownRepoPRsIgnored ?? "-",
        },
        {
          label: t("signals.unmergedPRsIgnored"),
          value: user.signals.unmergedPRsIgnored ?? "-",
        },
        {
          label: t("signals.uniqueExternalPRRepos"),
          value: user.signals.uniqueExternalPRRepos ?? "-",
        },
        {
          label: t("signals.issuesAnalyzed"),
          value: user.signals.issuesAnalyzed ?? "-",
        },
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
      ]
    : [];

  const totalRawSum = Math.max(
    1,
    user.repoScore * 0.45 + user.prScore * 0.45 + user.contributionScore * 0.1,
  );
  const repoWeightPct = Math.round(((user.repoScore * 0.45) / totalRawSum) * 100);
  const prWeightPct = Math.round(((user.prScore * 0.45) / totalRawSum) * 100);
  const contributionWeightPct = Math.max(0, 100 - repoWeightPct - prWeightPct);

  return (
    <div className="animate-fadeIn space-y-6">
      {/* ── Breadcrumb & Back Navigation ────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2">
          {activeCountryInfo ? (
            <Link href={`/leaderboard/${activeCountryInfo.slug}` as Route}>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
                <span>{t("profile.backToCountry", { country: activeCountryInfo.title })}</span>
              </Button>
            </Link>
          ) : (
            <Link href="/leaderboard">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
                <span>{t("profile.backToLeaderboard")}</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"
        >
          <Link href="/" className="transition-colors hover:text-foreground">
            {t("profile.breadcrumbs.home")}
          </Link>
          <span>/</span>
          <Link href="/leaderboard" className="transition-colors hover:text-foreground">
            {t("profile.breadcrumbs.leaderboards")}
          </Link>
          {activeCountryInfo ? (
            <>
              <span>/</span>
              <Link
                href={`/leaderboard/${activeCountryInfo.slug}` as Route}
                className="transition-colors hover:text-foreground"
              >
                {activeCountryInfo.title}
              </Link>
            </>
          ) : null}
          <span>/</span>
          <span className="font-semibold text-foreground">@{user.username}</span>
        </nav>
      </div>

      {/* ── Header Profile Hero Section ────────────────────────────── */}
      <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4 sm:items-center">
            <Avatar
              src={user.avatarUrl}
              alt={t("comparison.avatarAlt", { name: displayName })}
              size={84}
              className="shadow-sm ring-4 ring-primary/20"
            />
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                {t("profile.header.eyebrow")}
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                  {displayName}
                </h1>
                <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
                  @{user.username}
                </span>
              </div>

              {location ? (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  {flagCode ? (
                    <span
                      className={`fi fi-${flagCode} fis inline-block h-3.5 w-3.5 rounded-sm`}
                      title={detectedSlug ?? location}
                    />
                  ) : (
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span>{location}</span>
                </div>
              ) : null}

              <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  aria-label={t("profile.viewOnGithub")}
                >
                  <span>GitHub</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                {user.scoreVersion ? (
                  <span>
                    • {t("results.scoreVersion")}: {user.scoreVersion}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:justify-end sm:gap-2.5">
            <Link href={compareUrl as Route} className="w-full sm:w-auto">
              <Button className="flex w-full items-center justify-center gap-1.5 px-3 text-xs shadow-sm sm:px-4 sm:text-sm">
                <Scale className="h-4 w-4 shrink-0" />
                <span className="truncate sm:hidden">{t("profile.compareShort")}</span>
                <span className="hidden truncate sm:inline">{t("profile.compareWith")}</span>
              </Button>
            </Link>

            <Button
              variant="secondary"
              size="md"
              onClick={handleCopyLink}
              className="flex w-full items-center justify-center gap-1.5 px-3 text-xs sm:px-4 sm:text-sm"
              aria-label={t("profile.copyLink")}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 shrink-0 text-green-500" />
                  <span className="truncate text-green-500 sm:hidden">
                    {t("profile.copiedShort")}
                  </span>
                  <span className="hidden truncate text-green-500 sm:inline">
                    {t("profile.copied")}
                  </span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 shrink-0" />
                  <span className="truncate sm:hidden">{t("profile.shareShort")}</span>
                  <span className="hidden truncate sm:inline">{t("profile.copyLink")}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* ── Score Cards Grid ────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
            {t("profile.scoreOverview")}
          </p>
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {t("profile.title")}
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ScoreCard
            title={t("comparsion.final.score")}
            rawValue={user.finalScore}
            normalizedValue={user.normalizedFinalScore}
            highlight={true}
            helperText={t("tooltip.final")}
          />
          <ScoreCard
            title={t("comparsion.repo.score")}
            rawValue={user.repoScore}
            normalizedValue={user.normalizedRepoScore}
            helperText={t("tooltip.repo")}
          />
          <ScoreCard
            title={t("comparsion.pr.score")}
            rawValue={user.prScore}
            normalizedValue={user.normalizedPRScore}
            helperText={t("tooltip.pr")}
          />
          <ScoreCard
            title={t("comparsion.contribution.score")}
            rawValue={user.contributionScore}
            normalizedValue={user.normalizedContributionScore}
            helperText={t("tooltip.contribution")}
          />
        </div>
      </section>

      {/* ── Score Weighting Distribution ────────────────────────────── */}
      <Card className="border border-border/80 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">{t("profile.scoreDistribution")}</CardTitle>
          </div>
          <CardDescription>{t("methodology.sections.weights.formula")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                {t("breakdown.repo")} (45%)
              </span>
              <span className="font-semibold text-foreground">
                {t("profile.signalShare", { pct: repoWeightPct })}
              </span>
            </div>
            <Progress value={repoWeightPct} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <span className="h-2 w-2 rounded-full bg-cyan-500" />
                {t("breakdown.pr")} (45%)
              </span>
              <span className="font-semibold text-foreground">
                {t("profile.signalShare", { pct: prWeightPct })}
              </span>
            </div>
            <Progress value={prWeightPct} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <span className="h-2 w-2 rounded-full bg-violet-500" />
                {t("breakdown.contribution")} (10%)
              </span>
              <span className="font-semibold text-foreground">
                {t("profile.signalShare", { pct: contributionWeightPct })}
              </span>
            </div>
            <Progress value={contributionWeightPct} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* ── Top Work Section ────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
            {t("topwork.title")}
          </p>
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {t("profile.topWork")}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Top Repositories */}
          <Card className="flex flex-col border border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Star className="h-4 w-4 text-amber-500" />
                {t("topwork.toprepos")}
              </CardTitle>
              <CardDescription>{t("topwork.desc")}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              {user.topRepos.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("empty.repos")}</p>
              ) : (
                user.topRepos
                  .slice(0, 3)
                  .map((repo, idx) => (
                    <RepoCardItem
                      key={`${user.username}-repo-${idx}`}
                      repo={repo}
                      rankIndex={idx}
                      showRank={true}
                    />
                  ))
              )}
            </CardContent>
          </Card>

          {/* Top Pull Requests */}
          <Card className="flex flex-col border border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <GitPullRequest className="h-4 w-4 text-cyan-500" />
                {t("topwork.topprs")}
              </CardTitle>
              <CardDescription>{t("topwork.desc")}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              {user.topPullRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("empty.pullRequests")}</p>
              ) : (
                user.topPullRequests
                  .slice(0, 3)
                  .map((pr, idx) => (
                    <PullRequestCardItem
                      key={`${user.username}-pr-${idx}`}
                      pr={pr}
                      rankIndex={idx}
                      showRank={true}
                    />
                  ))
              )}
            </CardContent>
          </Card>

          {/* Top Community Contributions */}
          <Card className="flex flex-col border border-border/80 shadow-sm md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4 text-violet-500" />
                {t("community.title")}
              </CardTitle>
              <CardDescription>{t("community.comments")}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              {user.topCommunityContributions && user.topCommunityContributions.length > 0 ? (
                user.topCommunityContributions
                  .slice(0, 3)
                  .map((item, idx) => (
                    <CommunityCardItem
                      key={`${user.username}-comm-${idx}`}
                      item={item}
                      rankIndex={idx}
                      showRank={true}
                    />
                  ))
              ) : (
                <p className="text-sm text-muted-foreground">{t("empty.community")}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Transparency Signals ────────────────────────────────────── */}
      {signalEntries.length > 0 ? (
        <details className="group rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-colors open:bg-card">
          <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>{t("signals.title")}</span>
            </div>
            <span className="text-xs text-muted-foreground transition-transform duration-200 group-open:rotate-180">
              ▼
            </span>
          </summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {signalEntries.map((entry) => (
              <div
                key={`${user.username}-${entry.label}`}
                className="rounded-lg border border-border/80 bg-background/60 p-3"
              >
                <p className="text-xs text-muted-foreground">{entry.label}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{entry.value}</p>
              </div>
            ))}
          </div>
        </details>
      ) : null}

      {/* ── Scoring Methodology CTA ─────────────────────────────────── */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-primary" />
            {t("explanations.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground">{t("methodology.cta.description")}</p>
          <Link
            href="/scoring-methodology"
            className="inline-flex items-center whitespace-nowrap rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {t("methodology.cta.button")}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
