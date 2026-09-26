import { createCacheStore, getCacheConfigFromEnv, type CacheStore } from "@/lib/cache";
import type { UserProfileResponse } from "../types";

let cacheStore: CacheStore | undefined;

function getStore(): CacheStore {
  if (!cacheStore) {
    cacheStore = createCacheStore(getCacheConfigFromEnv());
  }
  return cacheStore;
}

export function buildProfileCacheKey(username: string, selectedLanguages: string[] = []): string {
  const config = getCacheConfigFromEnv();
  const normalizedUser = username.trim().toLowerCase();
  if (!selectedLanguages || selectedLanguages.length === 0) {
    return `${config.namespace}:profile:${normalizedUser}`;
  }
  const langKey = selectedLanguages
    .map((l) => l.trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join(",");
  return `${config.namespace}:profile:${normalizedUser}:${langKey}`;
}

export async function getCachedProfile(
  username: string,
  selectedLanguages: string[] = [],
): Promise<UserProfileResponse | null> {
  const store = getStore();
  if (!store.enabled) {
    return null;
  }
  try {
    const key = buildProfileCacheKey(username, selectedLanguages);
    const cached = await store.get<UserProfileResponse>(key);
    return cached ?? null;
  } catch {
    return null;
  }
}

export async function setCachedProfile(
  username: string,
  profile: UserProfileResponse,
  selectedLanguages: string[] = [],
  ttlSeconds?: number,
): Promise<void> {
  const store = getStore();
  if (!store.enabled) {
    return;
  }
  try {
    const key = buildProfileCacheKey(username, selectedLanguages);
    const ttl = ttlSeconds ?? getCacheConfigFromEnv().ttlSeconds;
    await store.set(key, profile, ttl);
  } catch {
    // Non-fatal
  }
}

export async function invalidateProfileCache(username: string): Promise<void> {
  const store = getStore();
  if (!store.enabled || !store.del) {
    return;
  }
  try {
    const key = buildProfileCacheKey(username, []);
    await store.del(key);
  } catch {
    // Non-fatal
  }
}
