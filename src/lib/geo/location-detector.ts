import countries from "@/data/countries.json";

type CountryEntry = {
  slug: string;
  title: string;
  isoCode: string;
  keywords: string[];
};

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

function matchesKeyword(text: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, "i");
  return regex.test(text);
}

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
