export const DEFAULT_SITE_URL = "http://localhost:3000";
export const SITE_NAME = "DevImpact";
export const SITE_SHORT_NAME = "DevImpact";

function normalizeSiteUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return DEFAULT_SITE_URL;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function getSiteUrl(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.NEXT_PUBLIC_SITE_URL ?? env.SITE_URL ?? DEFAULT_SITE_URL;
  return normalizeSiteUrl(configured);
}

export function getMetadataBase(env: NodeJS.ProcessEnv = process.env): URL {
  return new URL(getSiteUrl(env));
}

export function toAbsoluteUrl(
  path: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const safePath = path.startsWith("/") ? path : `/${path}`;
  return new URL(safePath, getMetadataBase(env)).toString();
}
