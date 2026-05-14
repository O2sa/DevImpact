"use client";

import { FaGithub } from "react-icons/fa";

import { cn } from "@/lib/utils";

type GithubLinkProps = {
  variant?: "compact" | "prominent";
};

export function GithubLink({ variant = "compact" }: GithubLinkProps) {
  const isProminent = variant === "prominent";

  return (
    <a
      href="https://github.com/O2sa/DevImpact"
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
          <FaGithub className="h-3.5 w-3.5" aria-hidden="true" />
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
