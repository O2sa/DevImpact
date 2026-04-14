import { useCallback, useEffect, useMemo, useState } from "react";

type Messages = Record<string, string>;

export const supportedLocales = ["en", "ar"] as const;
export type Locale = (typeof supportedLocales)[number];
const storageKey = "app-locale";

let enMessagesCache: Messages | null = null;

const localeMeta: Record<Locale, { dir: "ltr" | "rtl"; label: string }> = {
  en: { dir: "ltr", label: "English" },
  ar: { dir: "rtl", label: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" },
};

async function loadMessages(locale: Locale): Promise<Messages> {
  switch (locale) {
    case "ar":
      return (await import("../locales/ar.json")).default;
    case "en":
    default:
      return (await import("../locales/en.json")).default;
  }
}

function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(storageKey) as Locale | null;
  if (stored && supportedLocales.includes(stored)) return stored;
  const nav = navigator.language?.split("-")?.[0]?.toLowerCase();
  if (nav && supportedLocales.includes(nav as Locale)) return nav as Locale;
  return "en";
}

export function useI18nProvider() {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [messages, setMessages] = useState<Messages>(() => {
    if (enMessagesCache) return enMessagesCache;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    enMessagesCache = require("../locales/en.json");
    return enMessagesCache as Messages;
  });
  const [ready, setReady] = useState<boolean>(true);

  const changeLocale = useCallback((next: Locale) => {
    setReady(false);
    loadMessages(next)
      .then((m) => {
        setMessages(m);
        setLocaleState(next);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(storageKey, next);
        }
        setReady(true);
      })
      .catch((err) => {
        console.warn("[i18n] failed to load locale, falling back to en", err);
        if (enMessagesCache) setMessages(enMessagesCache);
        setLocaleState("en");
        setReady(true);
      });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const detected = detectLocale();
    changeLocale(detected);
  }, [changeLocale]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const meta = localeMeta[locale];
    document.documentElement.lang = locale;
    document.documentElement.dir = meta.dir;
  }, [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      changeLocale(next);
    },
    [changeLocale]
  );

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const template = messages[key] ?? key;
      if (ready && !messages[key]) {
        console.warn(`[i18n] Missing translation key "${key}" for locale ${locale}`);
      }
      if (!params) return template;
      return Object.keys(params).reduce(
        (acc, k) => acc.replace(`{${k}}`, String(params[k])),
        template
      );
    },
    [messages, locale, ready]
  );

  const dir = useMemo(() => localeMeta[locale]?.dir ?? "ltr", [locale]);
  const locales = useMemo(
    () => supportedLocales.map((lc) => ({ value: lc, label: localeMeta[lc].label })),
    []
  );

  return { locale, setLocale, t, dir, locales, ready };
}
