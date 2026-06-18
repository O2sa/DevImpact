"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { useTranslation } from "./language-provider";
import { Button } from "./ui/button";

const emptySubscribe = () => () => { };

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { finished: Promise<void> };
};

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const getThemeTransitionMs = () => {
    if (typeof window === "undefined") {
      return 420;
    }

    const value = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue("--theme-transition-duration")
      .trim();

    if (!value) {
      return 420;
    }

    const numeric = Number.parseFloat(value);
    if (!Number.isFinite(numeric)) {
      return 420;
    }

    return value.endsWith("ms") ? Math.round(numeric) + 60 : Math.round(numeric * 1000) + 60;
  };

  const current = resolvedTheme || theme || "light";
  const next = current === "light" ? "dark" : "light";

  const handleToggle = () => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const doc = document as ViewTransitionDocument;
    if (doc.startViewTransition && !prefersReducedMotion) {
      doc.startViewTransition(() => {
        setTheme(next);
      });
      return;
    }

    if (typeof document !== "undefined") {
      const root = document.documentElement;
      const transitionMs = getThemeTransitionMs();
      root.classList.add("theme-transition");
      window.setTimeout(() => {
        root.classList.remove("theme-transition");
      }, transitionMs);
    }

    requestAnimationFrame(() => {
      setTheme(next);
    });
  };

  return (
    <div className="flex items-center">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        className="flex items-center gap-2"
        aria-label={t("theme.toggle")}
      >
        {mounted && current === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </Button>
    </div>
  );
}
