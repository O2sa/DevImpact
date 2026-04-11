interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL_MS = 5 * 60 * 1000;

export function getCached<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.data as T;
}

export function getStale<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  return entry.data as T;
}

export function setCached<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS) {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function cacheStats() {
  let valid = 0;
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.expiresAt) {
      store.delete(key);
    } else {
      valid++;
    }
  }
  return { size: valid };
}
