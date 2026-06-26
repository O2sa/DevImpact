import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { GithubLink } from "@/components/github-link";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container m-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:h-24">
        <Link href="/" className="shrink-0" aria-label="DevImpact home">
          <BrandLogo priority size="md" />
        </Link>

        <div className="flex gap-4 [&>*:last-child]:-ml-4">
          <LanguageSwitcher />
          <ThemeToggle />
          <GithubLink variant="compact" />
        </div>
      </div>
    </header>
  );
}
