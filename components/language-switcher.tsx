"use client";

import { useTranslation } from "./language-provider";
import { cn } from "../lib/utils";

export function LanguageSwitcher() {
  const { locale, setLocale, locales, dir } = useTranslation();
  return (
    <div className={cn("flex items-center gap-2 text-sm", dir === "rtl" && "flex-row-reverse")}>
      <select
        className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
        value={locale}
        onChange={(e) => setLocale(e.target.value as any)}
      >
        {locales.map((l) => (
          <option key={l.value} value={l.value}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
