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

  for (const part of header.split(",")) {
    const tag = part.trim().split(";")[0]?.toLowerCase();
    const primary = tag?.split("-")[0];
    const match = supported.find((locale) => {
      const normalized = locale.toLowerCase();
      return normalized === tag || normalized === primary;
    });

    if (match) return match;
  }

  return fallback;
}

export function getLocaleDir(locale: Locale) {
  return localeMeta[locale].dir;
}
