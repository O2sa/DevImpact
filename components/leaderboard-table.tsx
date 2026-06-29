"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertTriangle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useTranslation } from "./language-provider";
import { cn } from "@/lib/utils";

type LeaderboardEntry = {
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
  users: LeaderboardEntry[];
  failedUsers: string[];
  title: string;
  totalFromSource: number;
  usersProcessed: number;
};

const PAGE_SIZE = 25;

function RankChangeIndicator({
  impactRank,
  originalRank,
}: {
  impactRank: number;
  originalRank: number;
}) {
  const change = originalRank - impactRank;
  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <TrendingUp className="h-3 w-3" />+{change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-rose-600 dark:text-rose-400">
        <TrendingDown className="h-3 w-3" />
        {change}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
      <Minus className="h-3 w-3" />
    </span>
  );
}

function getGithubProfileUrl(username: string): string {
  return `https://github.com/${username}`;
}

export function LeaderboardTable({
  users,
  failedUsers,
  title,
  totalFromSource,
  usersProcessed,
}: Props) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.trim().toLowerCase();
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        (u.name && u.name.toLowerCase().includes(q)),
    );
  }, [users, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (users.length === 0) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {t("leaderboard.title")} — {title}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <CardDescription>
              {t("leaderboard.description", {
                processed: usersProcessed,
                total: totalFromSource,
              })}
            </CardDescription>
            {failedUsers.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300 cursor-default">
                    <AlertTriangle className="h-3 w-3" />
                    {t("leaderboard.partialErrors", { count: failedUsers.length })}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">{failedUsers.join(", ")}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {filtered.length > PAGE_SIZE && (
            <div className="relative mt-2 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="h-9 pl-9"
                placeholder={t("leaderboard.search")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-3 text-left font-semibold text-muted-foreground">
                    {t("leaderboard.impactRank")}
                  </th>
                  <th className="px-3 py-3 text-left font-semibold text-muted-foreground">
                    {t("leaderboard.developer")}
                  </th>
                  <th className="px-3 py-3 text-right font-semibold text-muted-foreground">
                    {t("comparsion.final.score")}
                  </th>
                  <th className="px-3 py-3 text-right font-semibold text-muted-foreground">
                    {t("comparsion.repo.score")}
                  </th>
                  <th className="px-3 py-3 text-right font-semibold text-muted-foreground">
                    {t("comparsion.pr.score")}
                  </th>
                  <th className="px-3 py-3 text-right font-semibold text-muted-foreground">
                    {t("comparsion.contribution.score")}
                  </th>
                  <th className="px-3 py-3 text-right font-semibold text-muted-foreground">
                    {t("leaderboard.committersRank")}
                  </th>
                  <th className="px-3 py-3 text-right font-semibold text-muted-foreground">
                    {t("leaderboard.change")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paged.map((user) => (
                  <tr
                    key={user.username}
                    className={cn(
                      "border-b border-border/50 transition-colors hover:bg-muted/30",
                      user.impactRank <= 3 && "bg-primary/5",
                    )}
                  >
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                          user.impactRank === 1
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                            : user.impactRank === 2
                              ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              : user.impactRank === 3
                                ? "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300"
                                : "bg-muted text-muted-foreground",
                        )}
                      >
                        {user.impactRank}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Image
                          src={user.avatarUrl}
                          alt={user.name || user.username}
                          width={32}
                          height={32}
                          className="rounded-full ring-1 ring-border"
                        />
                        <div className="min-w-0">
                          <a
                            href={getGithubProfileUrl(user.username)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary hover:underline"
                          >
                            {user.name || user.username}
                          </a>
                          <p className="text-xs text-muted-foreground">
                            {user.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="font-bold text-primary">
                        {user.finalScore}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs">
                      {user.repoScore}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs">
                      {user.prScore}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs">
                      {user.contributionScore}
                    </td>
                    <td className="px-3 py-3 text-right text-muted-foreground">
                      #{user.originalRank}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <RankChangeIndicator
                        impactRank={user.impactRank}
                        originalRank={user.originalRank}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                {t("leaderboard.pagination", {
                  from: page * PAGE_SIZE + 1,
                  to: Math.min((page + 1) * PAGE_SIZE, filtered.length),
                  total: filtered.length,
                })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4 rtl:-scale-x-100" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
