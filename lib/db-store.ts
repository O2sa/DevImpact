import { Pool, PoolConfig } from "pg";

// ─── Types ─────────────────────────────────────────────────────────────

export type GitHubUserRow = {
  username: string;
  name: string | null;
  avatar_url: string;
  location: string | null;
  country: string | null;
  raw_data: unknown;
  scores: unknown;
  repo_score: number;
  pr_score: number;
  contribution_score: number;
  final_score: number;
  fetched_at: Date;
  stale_after: Date;
  created_at: Date;
  updated_at: Date;
};

export type UpsertUserParams = {
  username: string;
  name: string | null;
  avatarUrl: string;
  location: string | null;
  country: string | null;
  rawData: unknown;
  scores: unknown;
  repoScore: number;
  prScore: number;
  contributionScore: number;
  finalScore: number;
  staleDays: number;
};

// ─── Connection pool (singleton) ───────────────────────────────────────

type DbGlobalState = typeof globalThis & {
  __devimpactDbPool?: Pool;
};

function getPoolConfig(): PoolConfig {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error(
      "Missing DATABASE_URL environment variable. " +
        "Set it to a PostgreSQL connection string, e.g. " +
        "postgresql://user:password@localhost:5432/devimpact",
    );
  }

  return {
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  };
}

let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;

  const globalState = globalThis as DbGlobalState;
  if (!globalState.__devimpactDbPool) {
    globalState.__devimpactDbPool = new Pool(getPoolConfig());

    globalState.__devimpactDbPool.on("error", (err) => {
      console.error("Unexpected database pool error:", err);
    });
  }

  pool = globalState.__devimpactDbPool;
  return pool;
}

// ─── DatabaseStore class ───────────────────────────────────────────────

export class DatabaseStore {
  // ── Schema ──────────────────────────────────────────────────────────

  async initializeSchema(): Promise<void> {
    const client = getPool();
    await client.query(`
      CREATE TABLE IF NOT EXISTS github_users (
        username           VARCHAR(255) PRIMARY KEY,
        name               TEXT,
        avatar_url         TEXT,
        location           TEXT,
        country            VARCHAR(100),
        raw_data           JSONB,
        scores             JSONB,
        repo_score         INTEGER DEFAULT 0,
        pr_score           INTEGER DEFAULT 0,
        contribution_score INTEGER DEFAULT 0,
        final_score        INTEGER DEFAULT 0,
        fetched_at         TIMESTAMPTZ DEFAULT NOW(),
        stale_after        TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
        created_at         TIMESTAMPTZ DEFAULT NOW(),
        updated_at         TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_github_users_country
        ON github_users(country);

      CREATE INDEX IF NOT EXISTS idx_github_users_country_score
        ON github_users(country, final_score DESC);

      CREATE INDEX IF NOT EXISTS idx_github_users_stale
        ON github_users(stale_after)
        WHERE country IS NOT NULL;
    `);
  }

  // ── User operations ─────────────────────────────────────────────────

  async upsertUser(params: UpsertUserParams): Promise<void> {
    const client = getPool();
    await client.query(
      `
      INSERT INTO github_users (
        username, name, avatar_url, location, country,
        raw_data, scores,
        repo_score, pr_score, contribution_score, final_score,
        fetched_at, stale_after, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6::jsonb, $7::jsonb,
        $8, $9, $10, $11,
        NOW(), NOW() + ($12 || ' days')::INTERVAL, NOW()
      )
      ON CONFLICT (username) DO UPDATE SET
        name              = EXCLUDED.name,
        avatar_url        = EXCLUDED.avatar_url,
        location          = EXCLUDED.location,
        country           = EXCLUDED.country,
        raw_data          = EXCLUDED.raw_data,
        scores            = EXCLUDED.scores,
        repo_score        = EXCLUDED.repo_score,
        pr_score          = EXCLUDED.pr_score,
        contribution_score = EXCLUDED.contribution_score,
        final_score       = EXCLUDED.final_score,
        fetched_at        = EXCLUDED.fetched_at,
        stale_after       = EXCLUDED.stale_after,
        updated_at        = EXCLUDED.updated_at
      `,
      [
        params.username,
        params.name,
        params.avatarUrl,
        params.location,
        params.country,
        JSON.stringify(params.rawData),
        JSON.stringify(params.scores),
        params.repoScore,
        params.prScore,
        params.contributionScore,
        params.finalScore,
        params.staleDays,
      ],
    );
  }

  async getUser(username: string): Promise<GitHubUserRow | null> {
    const client = getPool();
    const result = await client.query(
      "SELECT * FROM github_users WHERE LOWER(username) = LOWER($1)",
      [username],
    );
    return result.rows[0] ?? null;
  }

  async userExists(username: string): Promise<boolean> {
    const client = getPool();
    const result = await client.query(
      "SELECT 1 FROM github_users WHERE LOWER(username) = LOWER($1)",
      [username],
    );
    return (result.rowCount ?? 0) > 0;
  }

  // ── Leaderboard operations ──────────────────────────────────────────

  async getLeaderboard(
    country: string,
    limit: number = 500,
  ): Promise<GitHubUserRow[]> {
    const client = getPool();
    const result = await client.query(
      `SELECT * FROM github_users
       WHERE country = $1
       ORDER BY final_score DESC
       LIMIT $2`,
      [country, limit],
    );
    return result.rows;
  }

  async getLeaderboardCount(country: string): Promise<number> {
    const client = getPool();
    const result = await client.query(
      "SELECT COUNT(*) FROM github_users WHERE country = $1",
      [country],
    );
    return Number(result.rows[0].count);
  }

  /**
   * Returns stale users in a country, ordered by score descending.
   * These are users whose data needs to be refreshed from GitHub.
   */
  async getTopStaleUsers(
    country: string,
    limit: number = 500,
  ): Promise<GitHubUserRow[]> {
    const client = getPool();
    const result = await client.query(
      `SELECT * FROM github_users
       WHERE country = $1 AND stale_after < NOW()
       ORDER BY final_score DESC
       LIMIT $2`,
      [country, limit],
    );
    return result.rows;
  }

  /**
   * Returns the top-scoring users in a country regardless of staleness.
   * Used to determine which users to check for refresh.
   */
  async getTopUsers(
    country: string,
    limit: number = 500,
  ): Promise<GitHubUserRow[]> {
    const client = getPool();
    const result = await client.query(
      `SELECT * FROM github_users
       WHERE country = $1
       ORDER BY final_score DESC
       LIMIT $2`,
      [country, limit],
    );
    return result.rows;
  }

  // ── Health check ────────────────────────────────────────────────────

  async ping(): Promise<boolean> {
    try {
      const client = getPool();
      await client.query("SELECT 1");
      return true;
    } catch {
      return false;
    }
  }
}

// ─── Singleton export ──────────────────────────────────────────────────

let defaultStore: DatabaseStore | undefined;

export function getDatabaseStore(): DatabaseStore {
  if (!defaultStore) {
    defaultStore = new DatabaseStore();
  }
  return defaultStore;
}