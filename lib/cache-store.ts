import { createClient } from "redis";

export const DEFAULT_GITHUB_CACHE_TTL_SECONDS = 604_800;
export const DEFAULT_CACHE_NAMESPACE = "devimpact:v1";

type CacheLogger = Pick<Console, "info" | "warn">;
type AppRedisClient = ReturnType<typeof createClient>;

export type CacheConfig = {
  enabled: boolean;
  redisUrl?: string;
  namespace: string;
  ttlSeconds: number;
  connectTimeoutMs: number;
};

export interface CacheStore {
  readonly enabled: boolean;
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del?(key: string): Promise<void>;
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return undefined;
}

function parsePositiveInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
}

export function getCacheConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): CacheConfig {
  const redisUrl = env.REDIS_URL?.trim() || undefined;
  const enabledFromEnv = parseBoolean(env.REDIS_ENABLED);
  const enabled = enabledFromEnv ?? Boolean(redisUrl);

  return {
    enabled,
    redisUrl,
    namespace:
      env.REDIS_CACHE_NAMESPACE?.trim() ||
      env.CACHE_NAMESPACE?.trim() ||
      DEFAULT_CACHE_NAMESPACE,
    ttlSeconds:
      parsePositiveInt(env.REDIS_CACHE_TTL_SECONDS) ??
      parsePositiveInt(env.CACHE_TTL_SECONDS) ??
      DEFAULT_GITHUB_CACHE_TTL_SECONDS,
    connectTimeoutMs: parsePositiveInt(env.REDIS_CONNECT_TIMEOUT_MS) ?? 1_500,
  };
}

class NoopCacheStore implements CacheStore {
  readonly enabled = false;

  async get<T>(key: string): Promise<T | undefined> {
    void key;
    return undefined;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    void key;
    void value;
    void ttlSeconds;
    return;
  }
}

type RedisGlobalState = typeof globalThis & {
  __devimpactRedisClient?: AppRedisClient;
  __devimpactRedisConnectPromise?: Promise<AppRedisClient | null>;
};

class RedisJsonCacheStore implements CacheStore {
  readonly enabled = true;
  private readonly config: CacheConfig;
  private readonly logger: CacheLogger;

  constructor(config: CacheConfig, logger: CacheLogger) {
    this.config = config;
    this.logger = logger;
  }

  async get<T>(key: string): Promise<T | undefined> {
    const client = await this.getClient();
    if (!client) {
      return undefined;
    }

    const raw = await client.get(key);
    if (!raw) {
      return undefined;
    }

    try {
      return JSON.parse(raw) as T;
    } catch (error: unknown) {
      this.logger.warn("cache-corrupt", {
        key,
        message: error instanceof Error ? error.message : String(error),
      });
      await this.safeDelete(client, key);
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const client = await this.getClient();
    if (!client) {
      return;
    }

    const ttl = ttlSeconds ?? this.config.ttlSeconds;
    await client.set(key, JSON.stringify(value), { EX: ttl });
  }

  async del(key: string): Promise<void> {
    const client = await this.getClient();
    if (!client) {
      return;
    }
    await this.safeDelete(client, key);
  }

  private async getClient(): Promise<AppRedisClient | null> {
    const globalState = globalThis as RedisGlobalState;
    if (globalState.__devimpactRedisClient?.isOpen) {
      return globalState.__devimpactRedisClient;
    }

    if (!globalState.__devimpactRedisConnectPromise) {
      globalState.__devimpactRedisConnectPromise = this.connect();
    }

    const client = await globalState.__devimpactRedisConnectPromise;
    if (!client) {
      globalState.__devimpactRedisConnectPromise = undefined;
    } else {
      globalState.__devimpactRedisClient = client;
    }
    return client;
  }

  private async connect(): Promise<AppRedisClient | null> {
    if (!this.config.redisUrl) {
      return null;
    }

    const client = createClient({
      url: this.config.redisUrl,
      socket: {
        connectTimeout: this.config.connectTimeoutMs,
      },
    });

    client.on("error", (error: unknown) => {
      this.logger.warn("cache-redis-error", {
        message: error instanceof Error ? error.message : String(error),
      });
    });

    try {
      await client.connect();
      this.logger.info("cache-connected", {
        namespace: this.config.namespace,
      });
      return client;
    } catch (error: unknown) {
      this.logger.warn("cache-connect-fail", {
        message: error instanceof Error ? error.message : String(error),
      });
      try {
        await client.disconnect();
      } catch {
        // best effort cleanup
      }
      return null;
    }
  }

  private async safeDelete(client: AppRedisClient, key: string): Promise<void> {
    try {
      await client.del(key);
    } catch {
      // best effort delete
    }
  }
}

export function createCacheStore(
  config: CacheConfig = getCacheConfigFromEnv(),
  logger: CacheLogger = console,
): CacheStore {
  if (!config.enabled || !config.redisUrl) {
    logger.info("cache-disabled", {
      enabled: config.enabled,
      hasRedisUrl: Boolean(config.redisUrl),
    });
    return new NoopCacheStore();
  }

  return new RedisJsonCacheStore(config, logger);
}
