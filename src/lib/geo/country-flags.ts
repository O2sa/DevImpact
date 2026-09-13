import countries from "@/data/countries.json";

type CountryEntry = {
  slug: string;
  title: string;
  isoCode: string;
  keywords: string[];
};

const SLUG_TO_ISO: Record<string, string> = {};
for (const entry of countries as CountryEntry[]) {
  if (entry.isoCode) {
    SLUG_TO_ISO[entry.slug] = entry.isoCode;
  }
}

export function getCountryCode(slug: string): string | null {
  return SLUG_TO_ISO[slug] ?? null;
}
