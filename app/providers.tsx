"use client";

import { LanguageProvider } from "@/components/language-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
