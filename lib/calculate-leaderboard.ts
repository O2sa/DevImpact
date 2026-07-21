import yaml from "js-yaml";
import { getUserData } from "@/lib/github";
import { calculateUserScore } from "@/lib/score";
import { createCacheStore, getCacheConfigFromEnv } from "@/lib/cache-store";
import { getDatabaseStore, type DatabaseStore } from "@/lib/db-store";
import { detectCountry } from "@/lib/location-detector";

// ─── Types ─────────────────────────────────────────────────────────────

type LeaderboardSourceEntry = {
  rank: number;
  name: string;
  login: string;
  avatarUrl: string;
  contributions: number;
};

type LeaderboardSourceYaml = {
  title?: string;
  total_user_count?: number;
  users?: LeaderboardSourceEntry[];
};

export type ScoredEntry = {
  username: string;
  name: string | null;
  avatarUrl: string;
  repoScore: number;
  prScore: number;
  contributionScore: number;
  finalScore: number;
  impactRank: number;
};

export type LeaderboardResult = {
  title: string;
  totalFromSource: number;
  scored: ScoredEntry[];
  errors: string[];
};

export type LeaderboardMeta = {
  newUsers: number;
  refreshedUsers: number;
  skippedExisting: number;
  errors: number;
  totalInDb: number;
  failedUsernames?: string[];
  totalFetchTime?: number;
  successfulFetches?: number;
  userFetchErrors?: { username: string; errors: { part: string; reason: string }[] }[];
};

export type CalculateLeaderboardResponse = LeaderboardResult & {
  _meta: LeaderboardMeta;
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

function getSourceUrl(country: string): string {
  const template = process.env.LEADERBOARD_SOURCE_URL_TEMPLATE?.trim();
  if (!template) {
    throw new Error("Missing LEADERBOARD_SOURCE_URL_TEMPLATE environment variable");
  }

  return template.replace("{country}", encodeURIComponent(country));
}

// ─── Core logic ─────────────────────────────────────────────────────────

export async function fetchCommittersFromTop(
  country: string,
): Promise<{ title: string; totalFromSource: number; users: LeaderboardSourceEntry[] }> {
  const url = getSourceUrl(country);
  const res = await fetch(url, {
    headers: { "User-Agent": "DevImpact-Bot" },
  });
  if (!res.ok) {
    throw new Error(`Leaderboard source returned ${res.status} for "${country}"`);
  }
  const text = await res.text();
  const data = yaml.load(text) as LeaderboardSourceYaml;
  if (!data?.users) {
    throw new Error(`Invalid or empty leaderboard source data for "${country}"`);
  }
  return {
    title: data.title || country,
    totalFromSource: data.total_user_count ?? data.users.length,
    users: data.users,
  };
}

export async function seedNewUsers(
  db: DatabaseStore,
  users: LeaderboardSourceEntry[],
  seedLimit: number,
  staleDays: number,
): Promise<{
  newUsersCount: number;
  skippedExistingCount: number;
  errors: { username: string; reason: string }[];
  fetchMetrics: { duration: number; errors: { part: string; reason: string }[] }[];
}> {
  const errors: { username: string; reason: string }[] = [];
  let newUsersCount = 0;
  let skippedExistingCount = 0;
  const fetchMetrics: { duration: number; errors: { part: string; reason: string }[] }[] = [];

  const usersToSeed = users.slice(0, seedLimit);

  for (const user of usersToSeed) {
    try {
      const exists = await db.userExists(user.login);
      if (exists) {
        skippedExistingCount += 1;
        continue;
      }

      const { data, metrics } = await getUserData(user.login, { cacheInRedis: false, withMetrics: true });
      fetchMetrics.push(metrics);
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
        staleDays,
      });

      newUsersCount += 1;
    } catch (e) {
      errors.push({ username: user.login, reason: e instanceof Error ? e.message : String(e) });
    }
  }

  return { newUsersCount, skippedExistingCount, errors, fetchMetrics };
}

export async function refreshStaleUsers(
  db: DatabaseStore,
  country: string,
  refreshLimit: number,
  staleDays: number,
): Promise<{
  refreshedCount: number;
  errors: { username: string; reason: string }[];
  fetchMetrics: { duration: number; errors: { part: string; reason: string }[] }[];
}> {
  const errors: { username: string; reason: string }[] = [];
  let refreshedCount = 0;
  const fetchMetrics: { duration: number; errors: { part: string; reason: string }[] }[] = [];

  const topUsers = await db.getTopUsers(country, refreshLimit);

  for (const row of topUsers) {
    if (row.stale_after >= new Date()) {
      continue;
    }

    try {
      const { data, metrics } = await getUserData(row.username, { cacheInRedis: false, withMetrics: true });
      fetchMetrics.push(metrics);
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
        staleDays,
      });

      refreshedCount += 1;
    } catch (e) {
      errors.push({ username: row.username, reason: e instanceof Error ? e.message : String(e) });
    }
  }

  return { refreshedCount, errors, fetchMetrics };
}

export async function buildLeaderboardResult(
  db: DatabaseStore,
  country: string,
  sourceData: { title: string },
  errors: string[],
): Promise<{ result: LeaderboardResult; meta: LeaderboardMeta }> {
  const allUsers = await db.getLeaderboard(country, getEnvInt("LEADERBOARD_DISPLAY_LIMIT", 500));
  const totalCount = await db.getLeaderboardCount(country);

  const scored: ScoredEntry[] = allUsers.map((row) => ({
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
  scored.forEach((u, idx) => (u.impactRank = idx + 1));

  const result: LeaderboardResult = {
    title: sourceData.title,
    totalFromSource: totalCount,
    scored,
    errors: [...new Set(errors)],
  };

  const meta: LeaderboardMeta = {
    newUsers: 0,
    refreshedUsers: 0,
    skippedExisting: 0,
    errors: errors.length,
    totalInDb: totalCount,
  };

  return { result, meta };
}

export async function invalidateLeaderboardCache(country: string): Promise<void> {
  try {
    const cacheConfig = getCacheConfigFromEnv();
    const cacheStore = createCacheStore(cacheConfig);
    if (cacheStore.enabled && cacheStore.del) {
      const cacheKey = buildLeaderboardCacheKey(country, cacheConfig.namespace);
      await cacheStore.del(cacheKey);
    }
  } catch {
    console.warn("Failed to invalidate leaderboard cache");
  }
}

// ─── Orchestrator ───────────────────────────────────────────────────────

export async function calculateLeaderboard(
  country: string,
  overrides?: {
    seedLimit?: number;
    refreshLimit?: number;
    staleDays?: number;
    displayLimit?: number;
  },
): Promise<CalculateLeaderboardResponse> {
  const db = getDatabaseStore();
  await db.initializeSchema();

  const staleDays = overrides?.staleDays ?? getStaleDays();
  const seedLimit = overrides?.seedLimit ?? getSeedLimit();
  const refreshLimit = overrides?.refreshLimit ?? getRefreshLimit();

  // 1. Fetch source users
  const sourceData = await fetchCommittersFromTop(country);

  // 2a. Seed new users
  const seedResult = await seedNewUsers(db, sourceData.users, seedLimit, staleDays);

  // 2b. Refresh stale users from DB top N
  const refreshResult = await refreshStaleUsers(db, country, refreshLimit, staleDays);

  // 3. Build leaderboard result
  const allErrors = [...seedResult.errors.map(e => e.username), ...refreshResult.errors.map(e => e.username)];
  const { result, meta } = await buildLeaderboardResult(
    db,
    country,
    sourceData,
    allErrors,
  );

  meta.newUsers = seedResult.newUsersCount;
  meta.refreshedUsers = refreshResult.refreshedCount;
  meta.skippedExisting = seedResult.skippedExistingCount;
  meta.failedUsernames = allErrors;

  const allFetchMetrics = [...seedResult.fetchMetrics, ...refreshResult.fetchMetrics];
  meta.totalFetchTime = allFetchMetrics.reduce((sum, m) => sum + m.duration, 0);
  meta.successfulFetches = allFetchMetrics.filter(m => m.errors.length === 0).length;

  const userFetchErrors: LeaderboardMeta['userFetchErrors'] = [];
  seedResult.errors.forEach(e => userFetchErrors.push({ username: e.username, errors: [{ part: 'seed', reason: e.reason }] }));
  refreshResult.errors.forEach(e => userFetchErrors.push({ username: e.username, errors: [{ part: 'refresh', reason: e.reason }] }));
  allFetchMetrics.forEach((m, i) => {
    if (m.errors.length > 0) userFetchErrors.push({ username: allErrors[i] ?? 'unknown', errors: m.errors });
  });
  meta.userFetchErrors = userFetchErrors;

  // 4. Invalidate Redis cache
  await invalidateLeaderboardCache(country);

  return {
    ...result,
    _meta: meta,
  };
}
