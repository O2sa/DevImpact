"use client";

import { useId } from "react";
import { useTranslation } from "@/components/providers";
import { cn } from "@/utils";
import { COMPARISON_PRESETS } from "../config/comparison-presets";

type Preset = (typeof COMPARISON_PRESETS)[number];

interface PresetPillsProps {
  onSelect: (preset: Preset) => void;
  loading: boolean;
  username1: string;
  username2: string;
}

export function PresetPills({ onSelect, loading, username1, username2 }: PresetPillsProps) {
  const { t } = useTranslation();
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="flex animate-fadeIn flex-col items-center gap-3"
    >
      <h2 id={headingId} className="text-sm text-muted-foreground">
        {t("presets.title")}
      </h2>

      <ul className="flex flex-wrap justify-center gap-2" aria-busy={loading}>
        {COMPARISON_PRESETS.map((preset) => {
          const isActive =
            loading && username1 === preset.username1 && username2 === preset.username2;

          return (
            <li key={preset.labelKey}>
              {/* Native <button>: Tab to focus, Enter/Space to activate */}
              <button
                type="button"
                disabled={loading}
                onClick={() => onSelect(preset)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground",
                  "transition-all duration-200 hover:bg-accent",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
                  isActive && "opacity-100 ring-2 ring-ring",
                )}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                  />
                )}
                {t(preset.labelKey)}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
