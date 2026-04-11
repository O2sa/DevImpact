interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class InMemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// Singleton cache instance shared across API requests
export const cache = new InMemoryCache();

export const CACHE_TTL = {
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
};
