import { NextResponse } from "next/server";
import yaml from "js-yaml";
import { fetchGitHubUserData } from "@/lib/github";
import { calculateUserScore } from "@/lib/score";
import { createCacheStore, getCacheConfigFromEnv } from "@/lib/cache-store";
import { getDatabaseStore } from "@/lib/db-store";
import { detectCountry } from "@/lib/location-detector";

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

function getEnvInt(key: string, fallback: number): number {
  const raw = process.env[key]?.trim();
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getStaleDays(): number {
  return getEnvInt("LEADERBOARD_USER_STALE_DAYS", 30);
}

function getSeedLimit(): number {
  return getEnvInt("LEADERBOARD_SEED_LIMIT", 256);
}

function getRefreshLimit(): number {
  return getEnvInt("LEADERBOARD_REFRESH_LIMIT", 500);
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

  // Ensure database schema exists
  const db = getDatabaseStore();
  await db.initializeSchema();

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

  // ── 2a. Seed NEW users from committers.top ───────────────────────────
  const errors: string[] = [];
  const seedLimit = getSeedLimit();
  const usersToSeed = committersData.users.slice(0, seedLimit);
  let newUsersCount = 0;
  let skippedExistingCount = 0;

  for (const user of usersToSeed) {
    try {
      const exists = await db.userExists(user.login);
      if (exists) {
        skippedExistingCount += 1;
        continue;
      }

      const data = await fetchGitHubUserData(user.login);
      const score = calculateUserScore(data, user.login);
      const countryDetected = detectCountry(data.location);

      await db.upsertUser({
        username: data.login,
        name: data.name,
        avatarUrl: data.avatarUrl,
        location: data.location,
        country: countryDetected,
        rawData: data,
        scores: score,
        repoScore: Math.round(score.repoScore),
        prScore: Math.round(score.prScore),
        contributionScore: Math.round(score.contributionScore),
        finalScore: Math.round(score.finalScore),
        staleDays: getStaleDays(),
      });

      newUsersCount += 1;
    } catch {
      errors.push(user.login);
    }
  }

  // ── 2b. Refresh STALE users from DB top N ───────────────────────────
  const refreshLimit = getRefreshLimit();
  const topUsers = await db.getTopUsers(country, refreshLimit);
  let refreshedCount = 0;

  for (const row of topUsers) {
    // Check if stale
    if (row.stale_after >= new Date()) {
      continue; // still fresh
    }

    try {
      const data = await fetchGitHubUserData(row.username);
      const score = calculateUserScore(data, row.username);
      const countryDetected = detectCountry(data.location);

      await db.upsertUser({
        username: data.login,
        name: data.name,
        avatarUrl: data.avatarUrl,
        location: data.location,
        country: countryDetected,
        rawData: data,
        scores: score,
        repoScore: Math.round(score.repoScore),
        prScore: Math.round(score.prScore),
        contributionScore: Math.round(score.contributionScore),
        finalScore: Math.round(score.finalScore),
        staleDays: getStaleDays(),
      });

      refreshedCount += 1;
    } catch {
      errors.push(row.username);
    }
  }

  // ── 3. Build & cache the leaderboard result ──────────────────────────
  const allUsers = await db.getLeaderboard(country, getEnvInt("LEADERBOARD_DISPLAY_LIMIT", 500));
  const totalCount = await db.getLeaderboardCount(country);

  // Build rank lookup from original committers data
  const rankMap = new Map(
    committersData.users.map((u) => [
      u.login,
      { rank: u.rank, contributions: u.contributions },
    ]),
  );

  const scored: ScoredEntry[] = allUsers.map((row) => {
    const original = rankMap.get(row.username) ?? { rank: 0, contributions: 0 };
    return {
      username: row.username,
      name: row.name,
      avatarUrl: row.avatar_url,
      repoScore: row.repo_score,
      prScore: row.pr_score,
      contributionScore: row.contribution_score,
      finalScore: row.final_score,
      originalRank: original.rank,
      originalContributions: original.contributions,
      impactRank: 0,
    };
  });

  // Sort and assign impactRank
  scored.sort((a, b) => b.finalScore - a.finalScore);
  scored.forEach((u, idx) => (u.impactRank = idx + 1));

  const result: LeaderboardResult = {
    title: committersData.title,
    totalFromSource: totalCount,
    scored,
    errors: [...new Set(errors)], // deduplicate
  };

  // ── 4. Invalidate Redis cache (lazy rebuild on next GET) ─────────────
  try {
    const cacheConfig = getCacheConfigFromEnv();
    const cacheStore = createCacheStore(cacheConfig);
    if (cacheStore.enabled && cacheStore.del) {
      const cacheKey = buildLeaderboardCacheKey(country, cacheConfig.namespace);
      await cacheStore.del(cacheKey);
    }
  } catch {
    // Non-fatal: cache invalidation failure should not block the response
    console.warn("Failed to invalidate leaderboard cache");
  }

  return NextResponse.json({
    success: true,
    ...result,
    _meta: {
      newUsers: newUsersCount,
      refreshedUsers: refreshedCount,
      skippedExisting: skippedExistingCount,
      errors: errors.length,
      totalInDb: totalCount,
    },
  });
}