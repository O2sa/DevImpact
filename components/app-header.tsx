"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { GithubLink } from "@/components/github-link";
import { useTranslation } from "@/components/language-provider";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container m-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:h-24">
        <Link href="/" className="shrink-0" aria-label="DevImpact home">
          <BrandLogo priority size="md" />
        </Link>

        <nav className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/leaderboard"
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2.5 text-[11px] font-semibold text-foreground shadow-sm transition-all duration-200",
              "hover:-translate-y-0.5 hover:border-cyan-400/40 hover:bg-cyan-500/15",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500/60",
              "sm:px-3 sm:text-xs",
            )}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-300">
              <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="max-w-[84px] truncate sm:max-w-none">
              {t("nav.leaderboard")}
            </span>
          </Link>

          <LanguageSwitcher />
          <ThemeToggle />
          <GithubLink variant="compact" />
        </nav>
      </div>
    </header>
  );
}
