"use client";

import { createContext, useContext } from "react";
import { useI18nProvider, type Locale } from "../lib/i18n";

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
  locales: { value: Locale; label: string }[];
  ready: boolean;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const value = useI18nProvider(initialLocale);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used inside LanguageProvider");
  return ctx;
}
