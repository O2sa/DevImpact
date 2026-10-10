export const WORLDWIDE_SLUG = "worldwide";
export const DEFAULT_COUNTRY_DISPLAY_LIMIT = 500;
export const DEFAULT_WORLDWIDE_DISPLAY_LIMIT = 100;

export function isWorldwideSlug(slug: string): boolean {
  return slug.trim().toLowerCase() === WORLDWIDE_SLUG;
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const trimmed = raw?.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) return fallback;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Number of users to show for a leaderboard.
 * - `worldwide` uses WORLDWIDE_LEADERBOARD_DISPLAY_LIMIT (default 100).
 * - Country leaderboards use LEADERBOARD_DISPLAY_LIMIT (default 500).
 * Missing, non-numeric, zero or negative values fall back to the default.
 */
export function getDisplayLimit(slug: string): number {
  return isWorldwideSlug(slug)
    ? parsePositiveInt(
        process.env.WORLDWIDE_LEADERBOARD_DISPLAY_LIMIT,
        DEFAULT_WORLDWIDE_DISPLAY_LIMIT,
      )
    : parsePositiveInt(process.env.LEADERBOARD_DISPLAY_LIMIT, DEFAULT_COUNTRY_DISPLAY_LIMIT);
}
