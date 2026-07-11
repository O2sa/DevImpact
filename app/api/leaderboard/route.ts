import { NextResponse } from "next/server";
import {
  createCacheStore,
  getCacheConfigFromEnv,
} from "@/lib/cache-store";

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

  // Try to fetch from cache
  try {
    const cacheConfig = getCacheConfigFromEnv();
    const cacheStore = createCacheStore(cacheConfig);

    if (cacheStore.enabled) {
      const cacheKey = buildLeaderboardCacheKey(country, cacheConfig.namespace);
      const cached = await cacheStore.get<LeaderboardResult>(cacheKey);

      if (cached) {
        return NextResponse.json({ success: true, ...cached });
      }
    }
  } catch {
    // Non-fatal: cache read failure should not block the response
    console.warn("Failed to read leaderboard from cache");
  }

  // No cached data found — return empty result
  return NextResponse.json({
    success: true,
    title: country,
    totalFromSource: 0,
    scored: [],
    errors: [],
  });
}