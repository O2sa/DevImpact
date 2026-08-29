"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Route } from "next";
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  GitFork,
  GitPullRequest,
  MapPin,
  MessageSquare,
  Scale,
  ShieldCheck,
  Star,
  Trophy,
} from "lucide-react";
import { Avatar } from "@/components/avatar";
import { ScoreCard } from "@/components/score-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "@/components/language-provider";
import { getCountryCode } from "@/lib/country-flags";
import { detectCountry } from "@/lib/location-detector";
import countriesData from "@/data/countries.json";
import type { UserResult } from "@/types/user-result";

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

type LanguageEntry = {
  name: string;
  percentage: number;
};

function getLanguageColor(name: string): string {
  const normalized = name.trim().toLowerCase();
  if (normalized === "typescript") return "bg-sky-500";
  if (normalized === "javascript") return "bg-amber-400";
  if (normalized === "python") return "bg-blue-500";
  if (normalized === "go") return "bg-cyan-500";
  if (normalized === "rust") return "bg-orange-500";
  if (normalized === "java") return "bg-red-500";
  if (normalized === "c#") return "bg-violet-500";
  if (normalized === "php") return "bg-indigo-500";
  if (normalized === "ruby") return "bg-rose-500";
  if (normalized === "swift") return "bg-orange-400";
  if (normalized === "kotlin") return "bg-fuchsia-500";
  if (normalized === "c++") return "bg-blue-700";
  return "bg-slate-500";
}

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-background/80 px-2.5 py-1 text-xs">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

function LanguageBreakdown({ topLanguages }: { topLanguages?: LanguageEntry[] }) {
  if (!topLanguages || topLanguages.length === 0) return null;

  const normalized = topLanguages.slice(0, 4).filter((lang) => lang.percentage > 0);

  if (normalized.length === 0) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
        {normalized.map((lang, idx) => (
          <div
            key={`${lang.name}-${idx}`}
            style={{ width: `${lang.percentage * 100}%` }}
            className={getLanguageColor(lang.name)}
            title={`${lang.name}: ${Math.round(lang.percentage * 100)}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
        {normalized.map((lang, idx) => (
          <span key={`${lang.name}-${idx}`} className="flex items-center gap-1">
            <span className={`inline-block h-2 w-2 rounded-full ${getLanguageColor(lang.name)}`} />
            {lang.name} {Math.round(lang.percentage * 100)}%
          </span>
        ))}
      </div>
    </div>
  );
}

export function UserProfileClient({ user, location, countryParam }: Props) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);

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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

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
          <div className="flex flex-wrap items-center gap-2.5 sm:justify-end">
            <Link href={compareUrl as Route}>
              <Button className="flex items-center gap-1.5 shadow-sm">
                <Scale className="h-4 w-4" />
                <span>{t("profile.compareWith")}</span>
              </Button>
            </Link>

            <Button
              variant="secondary"
              size="md"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5"
              aria-label={t("profile.copyLink")}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-green-500">{t("profile.copied")}</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>{t("profile.copyLink")}</span>
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

        <div className="grid gap-6 lg:grid-cols-3">
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
                user.topRepos.slice(0, 3).map((repo, idx) => (
                  <article
                    key={`${user.username}-repo-${idx}`}
                    className="rounded-xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/25 p-4 transition-colors hover:border-primary/35"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                            #{idx + 1}
                          </span>
                          {repo.url ? (
                            <a
                              href={repo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate font-semibold text-primary hover:underline"
                              aria-label={t("a11y.openRepo", {
                                name: repo.name || t("untitled"),
                              })}
                            >
                              {repo.name || t("untitled")}
                            </a>
                          ) : (
                            <p className="truncate font-semibold">{repo.name || t("untitled")}</p>
                          )}
                        </div>

                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          <StatChip
                            icon={<Star className="h-3 w-3" />}
                            label={t("topwork.stars")}
                            value={repo.stars ?? 0}
                          />
                          <StatChip
                            icon={<GitFork className="h-3 w-3" />}
                            label={t("topwork.forks")}
                            value={repo.forks ?? 0}
                          />
                        </div>

                        <LanguageBreakdown topLanguages={repo.topLanguages} />
                      </div>

                      <div className="rounded-lg border border-primary/25 bg-primary/5 px-2.5 py-1.5 text-right">
                        <p className="text-lg font-bold text-primary">{repo.score ?? 0}</p>
                        <p className="text-[10px] text-muted-foreground">{t("comparsion.score")}</p>
                      </div>
                    </div>
                  </article>
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
                user.topPullRequests.slice(0, 3).map((pr, idx) => (
                  <article
                    key={`${user.username}-pr-${idx}`}
                    className="rounded-xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/25 p-4 transition-colors hover:border-primary/35"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                            #{idx + 1}
                          </span>
                          {pr.url ? (
                            <a
                              href={pr.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate font-semibold text-primary hover:underline"
                              aria-label={t("a11y.openPullRequest", {
                                title: pr.title || t("untitled"),
                              })}
                            >
                              {pr.title || t("untitled")}
                            </a>
                          ) : (
                            <p className="truncate font-semibold">{pr.title || t("untitled")}</p>
                          )}
                        </div>

                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                          {t("topwork.inRepo", {
                            repo: pr.repo || t("unknown.repo"),
                          })}
                        </p>

                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          <StatChip
                            icon={<Star className="h-3 w-3" />}
                            label={t("topwork.pr.repo.stars")}
                            value={pr.stars ?? 0}
                          />
                          <div className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-background/80 px-2.5 py-1 text-xs">
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              +{pr.additions ?? 0}
                            </span>
                            <span className="text-muted-foreground">/</span>
                            <span className="font-semibold text-red-600 dark:text-red-400">
                              -{pr.deletions ?? 0}
                            </span>
                          </div>
                        </div>

                        <LanguageBreakdown topLanguages={pr.topLanguages} />
                      </div>

                      <div className="rounded-lg border border-primary/25 bg-primary/5 px-2.5 py-1.5 text-right">
                        <p className="text-lg font-bold text-primary">{pr.score ?? 0}</p>
                        <p className="text-[10px] text-muted-foreground">{t("comparsion.score")}</p>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </CardContent>
          </Card>

          {/* Top Community Contributions */}
          <Card className="flex flex-col border border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4 text-violet-500" />
                {t("community.title")}
              </CardTitle>
              <CardDescription>{t("community.comments")}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              {user.topCommunityContributions && user.topCommunityContributions.length > 0 ? (
                user.topCommunityContributions.slice(0, 3).map((item, idx) => (
                  <article
                    key={`${user.username}-comm-${idx}`}
                    className="rounded-xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/25 p-4 transition-colors hover:border-primary/35"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                            #{idx + 1}
                          </span>
                          <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">
                            {item.type === "issue"
                              ? t("community.issue")
                              : t("community.discussion")}
                          </span>
                        </div>

                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1.5 block truncate font-semibold text-primary hover:underline"
                            aria-label={t("a11y.openCommunityContribution", {
                              title: item.title,
                            })}
                          >
                            {item.title}
                          </a>
                        ) : (
                          <p className="mt-1.5 truncate font-semibold">{item.title}</p>
                        )}

                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                          {item.repo}
                        </p>

                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          <StatChip
                            icon={<Star className="h-3 w-3" />}
                            label={t("topwork.stars")}
                            value={item.stars}
                          />
                          <StatChip
                            icon={<MessageSquare className="h-3 w-3" />}
                            label={t("community.comments")}
                            value={item.comments}
                          />
                        </div>
                      </div>

                      <div className="rounded-lg border border-primary/25 bg-primary/5 px-2.5 py-1.5 text-right">
                        <p className="text-lg font-bold text-primary">{item.score}</p>
                        <p className="text-[10px] text-muted-foreground">{t("comparsion.score")}</p>
                      </div>
                    </div>
                  </article>
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
