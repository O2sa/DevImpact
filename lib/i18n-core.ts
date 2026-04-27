export const supportedLocales = ["en", "ar"] as const;
export type Locale = (typeof supportedLocales)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "app-locale";

export const localeMeta: Record<Locale, { dir: "ltr" | "rtl"; label: string }> = {
  en: { dir: "ltr", label: "English" },
  ar: { dir: "rtl", label: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" },
};

export function isSupportedLocale(value: string | null | undefined): value is Locale {
  return supportedLocales.includes(value as Locale);
}

export function parseAcceptLanguage<T extends string>(
  header: string | null | undefined,
  supported: readonly T[],
  fallback: T
): T {
  if (!header) return fallback;

  // Parse "lang;q=0.5" entries, drop q=0 (explicit rejection), and pick
  // the highest-q supported language. RFC 9110 §12.5.4: missing q
  // defaults to 1.0. A header like "en;q=0.1, ar;q=1" must select ar.
  const parsed: { tag: string; primary: string; q: number }[] = [];
  for (const part of header.split(",")) {
    const segments = part.trim().split(";");
    const tag = segments[0]?.toLowerCase().trim();
    if (!tag) continue;

    let q = 1;
    for (const param of segments.slice(1)) {
      const [key, value] = param.split("=").map((s) => s.trim().toLowerCase());
      if (key === "q") {
        const num = Number(value);
        if (!Number.isNaN(num)) q = num;
      }
    }

    if (q <= 0) continue;
    parsed.push({ tag, primary: tag.split("-")[0], q });
  }

  parsed.sort((a, b) => b.q - a.q);

  for (const entry of parsed) {
    const match = supported.find((locale) => {
      const normalized = locale.toLowerCase();
      return normalized === entry.tag || normalized === entry.primary;
    });
    if (match) return match;
  }

  return fallback;
}

export function getLocaleDir(locale: Locale) {
  return localeMeta[locale].dir;
}
