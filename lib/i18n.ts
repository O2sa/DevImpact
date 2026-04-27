import { useCallback, useEffect, useMemo, useState } from "react";
import arMessages from "../locales/ar.json";
import enMessages from "../locales/en.json";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isSupportedLocale,
  localeMeta,
  supportedLocales,
  type Locale,
} from "./i18n-core";

export {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  getLocaleDir,
  isSupportedLocale,
  parseAcceptLanguage,
  supportedLocales,
  type Locale,
} from "./i18n-core";

type Messages = Record<string, string>;

const cookieMaxAge = 60 * 60 * 24 * 365;
const messagesByLocale: Record<Locale, Messages> = {
  en: enMessages,
  ar: arMessages,
};

async function loadMessages(locale: Locale): Promise<Messages> {
  return messagesByLocale[locale];
}

function persistLocale(locale: Locale) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(LOCALE_COOKIE, locale);
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${cookieMaxAge}; samesite=lax`;
}

export function useI18nProvider(initialLocale: Locale = DEFAULT_LOCALE) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [messages, setMessages] = useState<Messages>(() => messagesByLocale[initialLocale]);
  const [ready, setReady] = useState<boolean>(true);

  const changeLocale = useCallback((next: Locale) => {
    setReady(false);
    loadMessages(next)
      .then((m) => {
        setMessages(m);
        setLocaleState(next);
        persistLocale(next);
        setReady(true);
      })
      .catch((err) => {
        console.warn("[i18n] failed to load locale, falling back to en", err);
        setMessages(messagesByLocale[DEFAULT_LOCALE]);
        setLocaleState(DEFAULT_LOCALE);
        setReady(true);
      });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem(LOCALE_COOKIE);
    if (isSupportedLocale(stored) && stored !== locale) {
      changeLocale(stored);
    }
  }, [changeLocale, locale]);

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
