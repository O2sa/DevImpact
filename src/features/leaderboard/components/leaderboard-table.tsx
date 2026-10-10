"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Search, AlertTriangle, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Avatar } from "@/components/layout/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/components/providers/language-provider";
import { cn } from "@/utils/cn";
import type { ScoredLeaderboardEntry as LeaderboardEntry } from "../types";
type Props = {
  users: LeaderboardEntry[];
  failedUsers: string[];
  title: string;
  countrySlug?: string;
  totalFromSource: number;
  usersProcessed: number;
};

type SortField = "impactRank" | "finalScore" | "repoScore" | "prScore" | "contributionScore";

type SortDirection = "asc" | "desc";

function SortIcon({
  field,
  sortField,
  sortDirection,
}: {
  field: SortField;
  sortField: SortField;
  sortDirection: SortDirection;
}) {
  if (field !== sortField) {
    return <ArrowUpDown className="h-4 w-4" aria-hidden="true" />;
  }

  return sortDirection === "asc" ? (
    <ArrowUp className="h-4 w-4" aria-hidden="true" />
  ) : (
    <ArrowDown className="h-4 w-4" aria-hidden="true" />
  );
}

function getGithubProfileUrl(username: string): string {
  return `https://github.com/${username}`;
}

export function LeaderboardTable({
  users,
  failedUsers,
  title,
  countrySlug,
  totalFromSource,
  usersProcessed,
}: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("impactRank");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortDirection(field === "impactRank" ? "asc" : "desc");
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filteredUsers = q
      ? users.filter(
          (u) =>
            u.username.toLowerCase().includes(q) || (u.name && u.name.toLowerCase().includes(q)),
        )
      : users;

    return [...filteredUsers].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const dir = sortDirection === "asc" ? 1 : -1;

      const result =
        typeof aValue === "number" && typeof bValue === "number"
          ? aValue - bValue
          : String(aValue).localeCompare(String(bValue), undefined, { sensitivity: "base" });

      return result !== 0 ? result * dir : a.impactRank - b.impactRank;
    });
  }, [users, search, sortField, sortDirection]);

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
                  <span className="inline-flex cursor-default items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="h-3 w-3" />
                    {t("leaderboard.partialErrors", {
                      count: failedUsers.length,
                    })}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">{failedUsers.join(", ")}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {users.length > 0 && (
            <div className="relative mt-2 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="h-9 pl-9"
                placeholder={t("leaderboard.search")}
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              />
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th
                    className="px-3 py-3 text-start font-semibold text-muted-foreground"
                    aria-sort={
                      sortField === "impactRank"
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <button
                      type="button"
                      onClick={() => handleSort("impactRank")}
                      className="inline-flex items-center gap-2 hover:text-foreground"
                    >
                      {t("leaderboard.impactRank")}
                      <SortIcon
                        field="impactRank"
                        sortField={sortField}
                        sortDirection={sortDirection}
                      />
                    </button>
                  </th>
                  <th className="px-3 py-3 text-start font-semibold text-muted-foreground">
                    {t("leaderboard.developer")}
                  </th>

                  <th
                    className="px-3 py-3 text-start font-semibold text-muted-foreground"
                    aria-sort={
                      sortField === "finalScore"
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <button
                      type="button"
                      onClick={() => handleSort("finalScore")}
                      className="inline-flex items-center gap-2 hover:text-foreground"
                    >
                      {t("comparison.final.score")}
                      <SortIcon
                        field="finalScore"
                        sortField={sortField}
                        sortDirection={sortDirection}
                      />
                    </button>
                  </th>

                  <th
                    className="px-3 py-3 text-start font-semibold text-muted-foreground"
                    aria-sort={
                      sortField === "repoScore"
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <button
                      type="button"
                      onClick={() => handleSort("repoScore")}
                      className="inline-flex items-center gap-2 hover:text-foreground"
                    >
                      {t("comparison.repo.score")}
                      <SortIcon
                        field="repoScore"
                        sortField={sortField}
                        sortDirection={sortDirection}
                      />
                    </button>
                  </th>

                  <th
                    className="px-3 py-3 text-start font-semibold text-muted-foreground"
                    aria-sort={
                      sortField === "prScore"
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <button
                      type="button"
                      onClick={() => handleSort("prScore")}
                      className="inline-flex items-center gap-2 hover:text-foreground"
                    >
                      {t("comparison.pr.score")}
                      <SortIcon
                        field="prScore"
                        sortField={sortField}
                        sortDirection={sortDirection}
                      />
                    </button>
                  </th>

                  <th
                    className="px-3 py-3 text-start font-semibold text-muted-foreground"
                    aria-sort={
                      sortField === "contributionScore"
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <button
                      type="button"
                      onClick={() => handleSort("contributionScore")}
                      className="inline-flex items-center gap-2 hover:text-foreground"
                    >
                      {t("comparison.contribution.score")}
                      <SortIcon
                        field="contributionScore"
                        sortField={sortField}
                        sortDirection={sortDirection}
                      />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
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
                      {(() => {
                        const profileUrl = (
                          countrySlug
                            ? `/user/${user.username}?country=${encodeURIComponent(countrySlug)}`
                            : `/user/${user.username}`
                        ) as Route;

                        return (
                          <div className="flex items-center gap-2">
                            <Link href={profileUrl}>
                              <Avatar
                                src={user.avatarUrl}
                                alt={user.name || user.username}
                                size={32}
                                className="transition-transform hover:scale-105"
                              />
                            </Link>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <Link
                                  href={profileUrl}
                                  className="truncate font-semibold text-primary hover:underline"
                                >
                                  {user.name || user.username}
                                </Link>
                                <a
                                  href={getGithubProfileUrl(user.username)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-muted-foreground transition-colors hover:text-foreground"
                                  aria-label={t("a11y.openProfile", {
                                    name: user.name || user.username,
                                  })}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                              <p className="truncate text-xs text-muted-foreground">
                                @{user.username}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-3 text-start">
                      <span className="font-bold text-primary">{user.finalScore}</span>
                    </td>
                    <td className="px-3 py-3 text-start font-mono text-xs">{user.repoScore}</td>
                    <td className="px-3 py-3 text-start font-mono text-xs">{user.prScore}</td>
                    <td className="px-3 py-3 text-start font-mono text-xs">
                      {user.contributionScore}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
