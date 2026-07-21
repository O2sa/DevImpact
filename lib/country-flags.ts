import countries from "@/data/countries.json";

type CountryEntry = {
  slug: string;
  title: string;
  isoCode: string;
  keywords: string[];
};

/**
 * Build the slug → ISO 3166-1 alpha-2 mapping from data/countries.json.
 */
const SLUG_TO_ISO: Record<string, string> = {};
for (const entry of countries as CountryEntry[]) {
  if (entry.isoCode) {
    SLUG_TO_ISO[entry.slug] = entry.isoCode;
  }
}

/**
 * Get the ISO 3166-1 alpha-2 code for a country slug.
 */
export function getCountryCode(slug: string): string | null {
  return SLUG_TO_ISO[slug] ?? null;
}