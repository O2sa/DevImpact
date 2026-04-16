"use client";

import { useTranslation } from "@/components/language-provider";
import { cn } from "@/lib/utils";

export function AppFooter() {
  const { t, dir } = useTranslation();

  return (
    <footer className="relative mt-10 border-t border-border/80 py-10 text-sm text-muted-foreground">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(30,185,229,0.12),transparent_70%)] dark:bg-[radial-gradient(circle_at_top,rgba(30,185,229,0.18),transparent_72%)]" />

      <div className="container relative mx-auto max-w-7xl px-4">
        <div
          className={cn(
            "flex flex-col gap-8 md:items-end md:justify-between md:flex-row",
          )}
        >
          <div
            className={cn(
              "space-y-3 text-center md:text-start",
            )}
          >
            <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.34em] text-muted-foreground/75">
              {t("footer.eyebrow")}
            </span>
            <div className="space-y-3">
              <span className="block text-3xl font-semibold tracking-tight sm:text-4xl">
                <span className="bg-gradient-to-r from-[#113764] via-[#1C4F94] to-[#414AED] bg-clip-text text-transparent dark:from-[#A7CEFF] dark:via-[#6FB2FF] dark:to-[#7C85FF]">
                  Dev
                </span>
                <span className="bg-gradient-to-r from-[#1EB5EC] via-[#1EB9E5] to-[#01FFF9] bg-clip-text text-transparent dark:from-[#76E4FF] dark:via-[#55D7FF] dark:to-[#9AFFF7]">
                  Impact
                </span>
              </span>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground ">
                {t("footer.description")}
              </p>
            </div>
          </div>

          <div
            className={cn(
              "flex flex-col items-center gap-3 md:items-end",
            )}
          >
            <span className="rounded-full border border-border/70 bg-background/75 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground shadow-sm backdrop-blur">
              {t("footer.tag")}
            </span>
            <p
              className={cn(
                "max-w-sm text-center text-sm leading-6 text-muted-foreground md:text-end",
              )}
            >
              {t("footer.note")}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "mt-8 flex flex-col gap-3 border-t border-border/70 pt-4 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground/75 md:items-center md:justify-between",
            dir === "rtl" ? "md:flex-row-reverse" : "md:flex-row"
          )}
        >
          <span>{t("footer.summary")}</span>
          <span>{t("footer.tagline")}</span>
        </div>
      </div>
    </footer>
  );
}
