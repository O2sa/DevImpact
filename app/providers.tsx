"use client";

import { LanguageProvider } from "@/components/language-provider";
import type { Locale } from "@/lib/i18n-core";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";

export default function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  return (
    <ThemeProvider>
      <LanguageProvider initialLocale={initialLocale}>
        <TooltipProvider>{children}</TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
