import type { LeaderboardUserRow } from "@/lib/db";
import countriesData from "@/data/countries.json";
import type { ScoredLeaderboardEntry } from "../types";

export type CountryInfo = {
  slug: string;
  title: string;
  keywords?: string[];
};

const countries = countriesData as CountryInfo[];

export function formatCountryTitle(country: string): string {
  return country
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function getCountryInfo(country: string): CountryInfo {
  return (
    countries.find((entry) => entry.slug === country) ?? {
      slug: country,
      title: formatCountryTitle(country),
      keywords: [],
    }
  );
}

export function buildLeaderboardCacheKey(country: string, namespace: string): string {
  return `${namespace}:leaderboard:${country.trim().toLowerCase()}`;
}

export function mapRowsToScoredLeaderboardEntries(
  rows: LeaderboardUserRow[],
): ScoredLeaderboardEntry[] {
  const scored: ScoredLeaderboardEntry[] = rows.map((row) => ({
    username: row.username,
    name: row.name,
    avatarUrl: row.avatar_url,
    repoScore: row.repo_score,
    prScore: row.pr_score,
    contributionScore: row.contribution_score,
    finalScore: row.final_score,
    impactRank: 0,
  }));

  scored.sort((a, b) => b.finalScore - a.finalScore);
  scored.forEach((user, index) => {
    user.impactRank = index + 1;
  });

  return scored;
}
