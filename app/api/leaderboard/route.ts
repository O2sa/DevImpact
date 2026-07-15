import { NextResponse } from "next/server";
import {
  createCacheStore,
  getCacheConfigFromEnv,
} from "@/lib/cache-store";
import { getDatabaseStore } from "@/lib/db-store";

export const runtime = "nodejs";

// ─── Types ─────────────────────────────────────────────────────────────

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

function getDisplayLimit(): number {
  const raw = process.env.LEADERBOARD_DISPLAY_LIMIT?.trim();
  if (!raw) return 500;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 500;
}

// ─── GET handler ───────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country")?.trim();

  if (!country) {
    return NextResponse.json(
      { success: false, error: "Provide a country parameter" },
      { status: 400 },
    );
  }

  // ── 1. Try Redis cache first ─────────────────────────────────────────
  const cacheConfig = getCacheConfigFromEnv();
  const cacheStore = createCacheStore(cacheConfig);

  if (cacheStore.enabled) {
    try {
      const cacheKey = buildLeaderboardCacheKey(country, cacheConfig.namespace);
      const cached = await cacheStore.get<LeaderboardResult>(cacheKey);
      if (cached) {
        return NextResponse.json({ success: true, ...cached });
      }
    } catch {
      console.warn("Failed to read leaderboard from cache");
    }
  }

  // ── 2. Cache miss — query PostgreSQL ─────────────────────────────────
  try {
    const db = getDatabaseStore();
    const displayLimit = getDisplayLimit();

    // Ensure schema exists (idempotent)
    await db.initializeSchema();

    const rows = await db.getLeaderboard(country, displayLimit);
    const totalCount = await db.getLeaderboardCount(country);

    if (rows.length === 0) {
      // No data for this country at all — return empty
      return NextResponse.json({
        success: true,
        title: country,
        totalFromSource: 0,
        scored: [],
        errors: [],
      });
    }

    const scored: ScoredEntry[] = rows.map((row) => ({
      username: row.username,
      name: row.name,
      avatarUrl: row.avatar_url,
      repoScore: row.repo_score,
      prScore: row.pr_score,
      contributionScore: row.contribution_score,
      finalScore: row.final_score,
      originalRank: 0,
      originalContributions: 0,
      impactRank: 0,
    }));

    // Sort and assign impactRank
    scored.sort((a, b) => b.finalScore - a.finalScore);
    scored.forEach((u, idx) => (u.impactRank = idx + 1));

    const result: LeaderboardResult = {
      title: country,
      totalFromSource: totalCount,
      scored,
      errors: [],
    };

    // ── 3. Warm the Redis cache ──────────────────────────────────────────
    if (cacheStore.enabled) {
      try {
        const cacheKey = buildLeaderboardCacheKey(country, cacheConfig.namespace);
        await cacheStore.set(cacheKey, result, cacheConfig.ttlSeconds);
      } catch {
        // Non-fatal: cache write failure should not block the response
      }
    }

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("Leaderboard DB query failed:", err);

    // Fallback: return empty data on error
    return NextResponse.json({
      success: true,
      title: country,
      totalFromSource: 0,
      scored: [],
      errors: [],
    });
  }
}