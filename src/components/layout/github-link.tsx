"use client";

import { cn } from "@/utils/cn";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

type GithubLinkProps = {
  variant?: "compact" | "prominent";
};

export function GithubLink({ variant = "compact" }: GithubLinkProps) {
  const isProminent = variant === "prominent";

  const githubRepoUrl =
    process.env.NEXT_PUBLIC_GITHUB_REPO_URL || "https://github.com/O2sa/DevImpact";
  return (
    <a
      href={githubRepoUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="GitHub repository"
      className={cn(
        "group relative inline-flex items-center justify-center overflow-hidden rounded-lg border border-border/70 bg-background/70 text-foreground shadow-sm backdrop-blur transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-cyan-400/40 hover:bg-background hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500/60",
        "dark:hover:border-cyan-300/35 dark:hover:shadow-[0_16px_30px_rgba(2,6,23,0.36)]",
        isProminent ? "h-10 px-4" : "h-9 w-9 px-0",
      )}
    >
      <span
        className={cn(
          "absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/10 to-sky-500/0 opacity-0 transition-opacity duration-200 group-hover:opacity-100",
          isProminent && "via-cyan-400/12",
        )}
      />
      <span className="relative flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#1EB5EC] via-[#1EB9E5] to-[#01FFF9] text-white shadow-[0_8px_18px_rgba(30,181,236,0.28)] transition-transform duration-200 group-hover:scale-105 dark:from-[#76E4FF] dark:via-[#55D7FF] dark:to-[#9AFFF7] dark:text-slate-950">
          <GitHubIcon className="h-3.5 w-3.5" />
        </span>
        {isProminent ? (
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            GitHub
          </span>
        ) : null}
      </span>
    </a>
  );
}
