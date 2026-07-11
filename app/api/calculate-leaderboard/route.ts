import { NextResponse } from "next/server";
import yaml from "js-yaml";
import { fetchGitHubUserData } from "@/lib/github";
import { calculateUserScore } from "@/lib/score";
import { createCacheStore, getCacheConfigFromEnv } from "@/lib/cache-store";

export const runtime = "nodejs";

// ─── Types ─────────────────────────────────────────────────────────────

type CommitterEntry = {
  rank: number;
  name: string;
  login: string;
  avatarUrl: string;
  contributions: number;
};

type CommitterYaml = {
  title?: string;
  total_user_count?: number;
  users?: CommitterEntry[];
};

type ScoredEntry = {
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

type LeaderboardResult = {
  title: string;
  totalFromSource: number;
  scored: ScoredEntry[];
  errors: string[];
};

// ─── Helpers ────────────────────────────────────────────────────────────

function buildLeaderboardCacheKey(country: string, namespace: string): string {
  return `${namespace}:leaderboard:${country.trim().toLowerCase()}`;
}

// ─── POST handler ──────────────────────────────────────────────────────

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country")?.trim();

  if (!country) {
    return NextResponse.json(
      { success: false, error: "Provide a country parameter" },
      { status: 400 },
    );
  }

  // ── 1. Fetch committers from committers.top ──────────────────────────
  let committersData: {
    title: string;
    totalFromSource: number;
    users: CommitterEntry[];
  };
  try {
    const url = `https://raw.githubusercontent.com/ashkulz/committers.top/gh-pages/_data/locations/${country}.yml`;
    const res = await fetch(url, {
      headers: { "User-Agent": "DevImpact-Bot" },
    });
    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch committers data for "${country}"`,
        },
        { status: 502 },
      );
    }
    const text = await res.text();
    const data = yaml.load(text) as CommitterYaml;
    if (!data?.users) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid or empty committers data for "${country}"`,
        },
        { status: 502 },
      );
    }
    committersData = {
      title: data.title || country,
      totalFromSource: data.total_user_count ?? data.users.length,
      users: data.users,
    };
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to fetch committers data",
      },
      { status: 502 },
    );
  }

  // ── 2. Calculate scores for all users ────────────────────────────────
  const scored: ScoredEntry[] = [];
  const errors: string[] = [];

  // Build rank lookup from original committers data
  const rankMap = new Map(
    committersData.users.map((u) => [
      u.login,
      { rank: u.rank, contributions: u.contributions },
    ]),
  );

  for (const user of committersData.users) {
    try {
      const data = await fetchGitHubUserData(user.login);
      const score = calculateUserScore(data, user.login);
      const original = rankMap.get(user.login) ?? { rank: 0, contributions: 0 };
      scored.push({
        username: user.login,
        name: data.name,
        avatarUrl: data.avatarUrl,
        repoScore: Math.round(score.repoScore),
        prScore: Math.round(score.prScore),
        contributionScore: Math.round(score.contributionScore),
        finalScore: Math.round(score.finalScore),
        originalRank: original.rank,
        originalContributions: original.contributions,
        impactRank: 0,
      });
    } catch {
      errors.push(user.login);
    }
  }

  // Sort by finalScore descending and assign impactRank
  scored.sort((a, b) => b.finalScore - a.finalScore);
  scored.forEach((u, idx) => (u.impactRank = idx + 1));

  const result: LeaderboardResult = {
    title: committersData.title,
    totalFromSource: committersData.totalFromSource,
    scored,
    errors,
  };

  // ── 3. Store in Redis cache ──────────────────────────────────────────
  try {
    const cacheConfig = getCacheConfigFromEnv();
    const cacheStore = createCacheStore(cacheConfig);
    if (cacheStore.enabled) {
      const cacheKey = buildLeaderboardCacheKey(country, cacheConfig.namespace);
      await cacheStore.set(cacheKey, result, cacheConfig.ttlSeconds);
    }
  } catch {
    // Non-fatal: cache write failure should not block the response
    console.warn("Failed to cache leaderboard result");
  }

  return NextResponse.json({ success: true, ...result });
}
