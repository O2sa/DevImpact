"use client";

import Link from "next/link";
import type { Route } from "next";
import { ExternalLink, GitPullRequest, MessageSquare, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserResult } from "@/features/developer";
import {
  RepoCardItem,
  PullRequestCardItem,
  CommunityCardItem,
  findRepoLanguageMeta,
  findPrLanguageMeta,
} from "@/components/cards";
import { useTranslation } from "@/components/providers/language-provider";

type Props = {
  userResults: UserResult[];
  selectedLanguages?: string[];
};

export function TopList({ userResults, selectedLanguages = [] }: Props) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {userResults.map((user, idx) => (
        <Card key={`top-${user.username}-${idx}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex min-w-0 items-center gap-1.5">
                <Link
                  href={`/user/${user.username}` as Route}
                  className="truncate font-semibold text-primary hover:underline"
                >
                  {t("topwork.titleForUser", { username: user.name || user.username })}
                </Link>
                <a
                  href={`https://github.com/${encodeURIComponent(user.username.trim())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-shrink-0 items-center text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={t("a11y.openProfile", { name: user.name || user.username })}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
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
                    const enrichedRepo = { ...repo, ...languageMeta };
                    return (
                      <RepoCardItem
                        key={`${user.username}-repo-${index}`}
                        repo={enrichedRepo}
                        rankIndex={index}
                        selectedLanguages={selectedLanguages}
                        showRank={true}
                      />
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
                    const enrichedPr = { ...pr, ...languageMeta };
                    return (
                      <PullRequestCardItem
                        key={`${user.username}-pr-${index}`}
                        pr={enrichedPr}
                        rankIndex={index}
                        selectedLanguages={selectedLanguages}
                        showRank={true}
                      />
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
                    <CommunityCardItem
                      key={`${user.username}-community-${index}`}
                      item={item}
                      rankIndex={index}
                      showRank={true}
                    />
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
