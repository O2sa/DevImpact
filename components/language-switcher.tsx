"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "./language-provider";
import { cn } from "../lib/utils";

export function LanguageSwitcher() {
  const { locale, setLocale, locales, dir } = useTranslation();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const currentLocale = locales.find((item) => item.value === locale);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  function onSelect(nextLocale: (typeof locales)[number]["value"]) {
    setLocale(nextLocale);
    setOpen(false);
  }

  return (
    <div
      ref={wrapperRef}
      dir={dir}
      className={cn("relative flex items-center gap-2 text-sm", dir === "rtl" && "flex-row-reverse")}
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select language"
        className={cn(
          "flex h-9 min-w-[140px] items-center justify-between rounded-lg border border-input bg-background px-3 text-sm text-foreground transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-primary/60",
          open && "ring-2 ring-primary/60"
        )}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{currentLocale?.label ?? locale}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
        >
          <path
            d="M6 9L12 15L18 9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Language options"
          className={cn(
            "absolute top-full z-30 mt-1 max-h-60 min-w-[140px] overflow-auto rounded-lg border border-input bg-background p-1 text-sm text-popover-foreground shadow-md flex flex-col gap-1",
            dir === "rtl" ? "left-0" : "right-0"
          )}
        >
          {locales.map((item) => {
            const isSelected = item.value === locale;
            return (
              <li key={item.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    "flex w-full items-center rounded-md px-2 py-1.5 text-left transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-primary/40",
                    isSelected && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => onSelect(item.value)}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
