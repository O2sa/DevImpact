"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button, Icon } from "./ui/button";
import { useSyncExternalStore } from "react";
import { useTranslation } from "./language-provider";
import { FaGithub } from "react-icons/fa";

const emptySubscribe = () => () => { };

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
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
      <a href="https://github.com/O2sa/DevImpact"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub Repository">
        <Icon
          type="button"
          variant="ghost"
          size="sm"
          className="flex items-center gap-2"
        >
          <FaGithub className="text-black dark:text-white" />
        </Icon>
      </a>


    </div>



  );
}
