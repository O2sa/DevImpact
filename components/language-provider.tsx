"use client";

import { createContext, useContext } from "react";
import { useI18nProvider, type Locale } from "../lib/i18n";
import { I18nContextValue } from "../types/i18n";



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
