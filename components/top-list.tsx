import type { ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  GitFork,
  GitPullRequest,
  MessageSquare,
  Star,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { UserResult } from "@/types/user-result";
import { useTranslation } from "./language-provider";

type Props = {
  userResults: UserResult[];
  selectedLanguages?: string[];
};

type LanguageEntry = {
  name: string;
  percentage: number;
};

type LanguageMeta = {
  languageMatch?: number;
  topLanguages?: LanguageEntry[];
};

function formatLanguageMatch(value?: number): string {
  if (value === undefined) {
    return "N/A";
  }
  return `${Math.round(value * 100)}%`;
}

function normalizeLanguageName(value: string): string {
  return value.trim().toLowerCase();
}

function getLanguageColor(name: string): string {
  const normalized = normalizeLanguageName(name);
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

function StatChip({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-background/80 px-2.5 py-1 text-xs">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

function LanguageBreakdown({
  topLanguages,
}: {
  topLanguages?: LanguageEntry[];
}) {
  if (!topLanguages || topLanguages.length === 0) {
    return null;
  }

  const normalized = topLanguages
    .slice(0, 5)
    .filter((language) => language.percentage > 0);

  if (normalized.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
        {normalized.map((language) => (
          <div
            key={`bar-${language.name}-${language.percentage}`}
            className={getLanguageColor(language.name)}
            style={{
              width: `${Math.max(0, Math.min(100, language.percentage))}%`,
            }}
            title={`${language.name} ${language.percentage}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {normalized.map((language) => (
          <span
            key={`legend-${language.name}-${language.percentage}`}
            className="inline-flex items-center gap-1"
          >
            <span
              className={`h-2 w-2 rounded-full ${getLanguageColor(language.name)}`}
            />
            <span>
              {language.name} {language.percentage}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function SelectedLanguageRow({
  topLanguages,
  selectedLanguages,
  label,
}: {
  topLanguages?: LanguageEntry[];
  selectedLanguages: string[];
  label: string;
}) {
  if (!topLanguages || topLanguages.length === 0 || selectedLanguages.length === 0) {
    return null;
  }

  const languageMap = new Map<string, number>();
  for (const language of topLanguages) {
    languageMap.set(normalizeLanguageName(language.name), language.percentage);
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
      <span className="text-muted-foreground">{label}:</span>
      {selectedLanguages.map((language) => {
        const percentage = languageMap.get(normalizeLanguageName(language)) ?? 0;
        return (
          <span
            key={`${language}-${percentage}`}
            className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary"
          >
            {language} {percentage}%
          </span>
        );
      })}
    </div>
  );
}

function findRepoLanguageMeta(
  user: UserResult,
  repo: UserResult["topRepos"][number],
): LanguageMeta {
  const languageRepos = user.languageScores?.topRepos ?? [];
  const byUrl = repo.url
    ? languageRepos.find((item) => item.url && item.url === repo.url)
    : undefined;
  const byName = languageRepos.find((item) => item.name === repo.name);
  const match = byUrl ?? byName;

  return {
    languageMatch: match?.languageMatch ?? repo.languageMatch,
    topLanguages: match?.topLanguages ?? repo.topLanguages,
  };
}

function findPrLanguageMeta(
  user: UserResult,
  pr: UserResult["topPullRequests"][number],
): LanguageMeta {
  const languagePrs = user.languageScores?.topPullRequests ?? [];
  const byUrl = pr.url
    ? languagePrs.find((item) => item.url && item.url === pr.url)
    : undefined;
  const byTitleAndRepo = languagePrs.find(
    (item) => item.title === pr.title && item.repo === pr.repo,
  );
  const match = byUrl ?? byTitleAndRepo;

  return {
    languageMatch: match?.languageMatch ?? pr.languageMatch,
    topLanguages: match?.topLanguages ?? pr.topLanguages,
  };
}

export function TopList({ userResults, selectedLanguages = [] }: Props) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {userResults.map((user) => (
        <Card key={`top-${user.username}`}>
          <CardHeader>
            <CardTitle className="text-lg">
              {t("topwork.titleForUser", { username: user.name || user.username })}
            </CardTitle>
            <CardDescription>{t("topwork.desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <section>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Star className="h-4 w-4" /> {t("topwork.toprepos")}
              </h4>
              <div className="space-y-3">
                {user.topRepos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("empty.repos")}</p>
                ) : (
                  user.topRepos.slice(0, 3).map((repo, index) => {
                    const languageMeta = findRepoLanguageMeta(user, repo);
                    return (
                      <article
                        key={`${user.username}-repo-${index}`}
                        className="rounded-xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/25 p-4 transition-colors hover:border-primary/35"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            {repo.url ? (
                              <a
                                href={repo.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-primary hover:underline"
                                aria-label={t("a11y.openRepo", {
                                  name: repo.name || t("untitled"),
                                })}
                              >
                                {repo.name || t("untitled")}
                              </a>
                            ) : (
                              <p className="font-semibold">{repo.name || t("untitled")}</p>
                            )}

                            <div className="mt-2 flex flex-wrap gap-1.5">
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
                              <StatChip
                                icon={<Eye className="h-3 w-3" />}
                                label={t("topwork.watchers")}
                                value={repo.watchers ?? 0}
                              />
                            </div>

                            <LanguageBreakdown topLanguages={languageMeta.topLanguages} />
                            <SelectedLanguageRow
                              topLanguages={languageMeta.topLanguages}
                              selectedLanguages={selectedLanguages}
                              label={t("topwork.selectedLang")}
                            />

                            {typeof languageMeta.languageMatch === "number" ? (
                              <p className="mt-2 text-xs text-muted-foreground">
                                {t("language.match")}: {formatLanguageMatch(languageMeta.languageMatch)}
                              </p>
                            ) : null}
                          </div>

                          <div className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-right">
                            <p className="text-xl font-bold text-primary">{repo.score ?? 0}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {t("comparsion.score")}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>

            <section>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <GitPullRequest className="h-4 w-4" /> {t("topwork.topprs")}
              </h4>
              <div className="space-y-3">
                {user.topPullRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("empty.pullRequests")}</p>
                ) : (
                  user.topPullRequests.slice(0, 3).map((pr, index) => {
                    const languageMeta = findPrLanguageMeta(user, pr);
                    return (
                      <article
                        key={`${user.username}-pr-${index}`}
                        className="rounded-xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/25 p-4 transition-colors hover:border-primary/35"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            {pr.url ? (
                              <a
                                href={pr.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-primary hover:underline"
                                aria-label={t("a11y.openPullRequest", {
                                  title: pr.title || t("untitled"),
                                })}
                              >
                                {pr.title || t("untitled")}
                              </a>
                            ) : (
                              <p className="font-semibold">{pr.title || t("untitled")}</p>
                            )}

                            <p className="mt-1 text-xs font-medium text-muted-foreground">
                              {pr.repo || t("unknown.repo")}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <StatChip
                                icon={<Star className="h-3 w-3" />}
                                label={t("topwork.stars")}
                                value={pr.stars ?? 0}
                              />
                              <StatChip
                                icon={<ArrowUp className="h-3 w-3 text-emerald-600" />}
                                label={t("topwork.pr.additions")}
                                value={pr.additions ?? 0}
                              />
                              <StatChip
                                icon={<ArrowDown className="h-3 w-3 text-rose-600" />}
                                label={t("topwork.pr.deletions")}
                                value={pr.deletions ?? 0}
                              />
                            </div>

                            <LanguageBreakdown topLanguages={languageMeta.topLanguages} />
                            <SelectedLanguageRow
                              topLanguages={languageMeta.topLanguages}
                              selectedLanguages={selectedLanguages}
                              label={t("topwork.selectedLang")}
                            />

                            {typeof languageMeta.languageMatch === "number" ? (
                              <p className="mt-2 text-xs text-muted-foreground">
                                {t("language.match")}: {formatLanguageMatch(languageMeta.languageMatch)}
                              </p>
                            ) : null}
                          </div>

                          <div className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-right">
                            <p className="text-xl font-bold text-primary">{pr.score ?? 0}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {t("comparsion.score")}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>

            <section>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <MessageSquare className="h-4 w-4" /> {t("community.title")}
              </h4>
              {user.topCommunityContributions && user.topCommunityContributions.length > 0 ? (
                <div className="space-y-3">
                  {user.topCommunityContributions.slice(0, 3).map((item, index) => (
                    <article
                      key={`${user.username}-community-${index}`}
                      className="rounded-xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/25 p-4 transition-colors hover:border-primary/35"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-secondary-foreground">
                            {item.type === "issue"
                              ? t("community.issue")
                              : t("community.discussion")}
                          </span>

                          {item.url ? (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 block font-semibold text-primary hover:underline"
                              aria-label={t("a11y.openCommunityContribution", {
                                title: item.title,
                              })}
                            >
                              {item.title}
                            </a>
                          ) : (
                            <p className="mt-2 font-semibold">{item.title}</p>
                          )}

                          <p className="mt-1 text-xs font-medium text-muted-foreground">
                            {item.repo}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-1.5">
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

                        <div className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-right">
                          <p className="text-xl font-bold text-primary">{item.score}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {t("comparsion.score")}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("empty.community")}</p>
              )}
            </section>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
