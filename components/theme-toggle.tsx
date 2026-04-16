"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const THEME_TRANSITION_MS = 520;

  const current = resolvedTheme || theme || "light";
  const next = current === "light" ? "dark" : "light";

  const handleToggle = () => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.classList.add("theme-transition");
      window.setTimeout(() => {
        root.classList.remove("theme-transition");
      }, THEME_TRANSITION_MS);
    }

    requestAnimationFrame(() => {
      setTheme(next);
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      className="flex items-center gap-2"
      aria-label="Toggle color mode"
    >
      {mounted && current === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </Button>
  );
}
