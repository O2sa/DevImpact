"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  AlertTriangle,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Avatar } from "@/components/layout/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/providers/language-provider";
import { cn } from "@/utils/cn";
import type { ScoredLeaderboardEntry as LeaderboardEntry } from "../types";
import { SearchField } from "./search-field";

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

const PAGE_SIZE = 100;

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
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("impactRank");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (field: SortField) => {
    setPage(1);
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortDirection(field === "impactRank" ? "asc" : "desc");
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

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
            <SearchField
              className="mt-2"
              value={search}
              onChange={handleSearch}
              placeholder={t("leaderboard.search")}
            />
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
                {filtered.length === 0 && search.trim() ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <p>
                          {t("leaderboard.noDevelopersSearch", {
                            query: search,
                          })}
                        </p>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSearch("");
                            setPage(1);
                          }}
                        >
                          {t("leaderboard.clearSearch")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > PAGE_SIZE && (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-border px-2 pt-4 sm:flex-row">
              <p className="text-xs text-muted-foreground">
                {t("leaderboard.pagination", {
                  from: (currentPage - 1) * PAGE_SIZE + 1,
                  to: Math.min(currentPage * PAGE_SIZE, filtered.length),
                  total: filtered.length,
                })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-2.5 text-xs"
                >
                  <ChevronLeft className="mr-1 h-3.5 w-3.5 rtl:rotate-180" />
                  {t("leaderboard.previous")}
                </Button>
                <span className="px-2 text-xs font-medium text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-2.5 text-xs"
                >
                  {t("leaderboard.next")}
                  <ChevronRight className="ml-1 h-3.5 w-3.5 rtl:rotate-180" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
