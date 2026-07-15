import countries from "@/data/countries.json";

// ─── Types ─────────────────────────────────────────────────────────────

type CountryEntry = {
  slug: string;
  title: string;
};

// ─── Keyword mapping ────────────────────────────────────────────────────
//
// GitHub's "location" field is free text. Users might write:
//   - "Riyadh, Saudi Arabia"
//   - "Saudi Arabia"
//   - "Jeddah"
//   - "KSA"
//   - "🇸🇦"
//   - "Earth" (unmatchable)
//   - "" or null (absent)
//
// This mapping converts those variations into country slugs
// that match the slugs in data/countries.json.
//
// Keywords are pulled from committers.top presets via data/countries.json.

type CountryEntry2 = {
  slug: string;
  title: string;
  keywords?: string[];
};

type CountryMapping = {
  slug: string;
  keywords: string[];
};

// Build COUNTRY_MAPPINGS from countries.json with keywords
const COUNTRY_MAPPINGS: CountryMapping[] = (
  countries as CountryEntry2[]
)
  .filter((country) => country.keywords && country.keywords.length > 0)
  .map((country) => ({
    slug: country.slug,
    keywords: country.keywords || [],
  }));

// ─── Validate all slugs exist in countries.json ───────────────────────

const VALID_SLUGS = new Set(
  (countries as CountryEntry[]).map((c) => c.slug),
);

// Validate on import in development
if (process.env.NODE_ENV === "development") {
  for (const mapping of COUNTRY_MAPPINGS) {
    if (!VALID_SLUGS.has(mapping.slug)) {
      console.warn(
        `[location-detector] Warning: slug "${mapping.slug}" not found in data/countries.json`,
      );
    }
  }
}

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
