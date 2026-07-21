import countries from "@/data/countries.json";

// ─── Types ─────────────────────────────────────────────────────────────

type CountryEntry = {
  slug: string;
  title: string;
  isoCode: string;
  keywords: string[];
};

// ─── Build keyword mapping from data/countries.json ────────────────────

type CountryMapping = {
  slug: string;
  keywords: string[];
};

const COUNTRY_MAPPINGS: CountryMapping[] = (countries as CountryEntry[])
  .filter((c) => c.keywords.length > 0)
  .map((c) => ({
    slug: c.slug,
    keywords: c.keywords,
  }));

// ─── Helpers ───────────────────────────────────────────────────────────

/**
 * Checks if a keyword appears as a whole word (or phrase) within the text.
 * This prevents false matches like "uk" matching inside "mukalla".
 */
function matchesKeyword(text: string, keyword: string): boolean {
  // Escape regex special characters in the keyword
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Match as a whole word — surrounded by word boundaries or non-alphanumeric chars
  const regex = new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, "i");
  return regex.test(text);
}

// ─── Detection function ────────────────────────────────────────────────

/**
 * Attempts to detect a country from a GitHub user's free-text location field.
 *
 * @param location - The raw `location` field from the GitHub API (can be null/empty).
 * @returns A normalized country slug (e.g. "saudi-arabia") or null if unmatchable.
 */
export function detectCountry(location: string | null): string | null {
  if (!location || !location.trim()) {
    return null;
  }

  const normalized = location.trim().toLowerCase();

  for (const mapping of COUNTRY_MAPPINGS) {
    for (const keyword of mapping.keywords) {
      if (matchesKeyword(normalized, keyword)) {
        return mapping.slug;
      }
    }
  }

  return null;
}