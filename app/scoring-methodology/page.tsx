"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { useTranslation } from "@/components/language-provider";
import { ScoringMethodologyFlow } from "@/components/scoring/scoring-methodology-flow";
import { ScoringMethodologySection } from "@/components/scoring/scoring-methodology-section";

export default function ScoringMethodologyPage() {
  const { t, dir } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const backIconClass = dir === "rtl" ? "rotate-180" : "";

  const handleBack = () => {
    const query = searchParams.toString();
    if (query) {
      router.push(`/?${query}`);
      return;
    }

    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  };

  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader />
      <div className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-10">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          aria-label={t("methodology.back")}
        >
          <ArrowLeft className={`h-4 w-4 ${backIconClass}`} />
          {t("methodology.back")}
        </button>

        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t("methodology.title")}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            {t("methodology.intro")}
          </p>
        </header>

        <ScoringMethodologyFlow />

        <section className="grid gap-4 lg:grid-cols-2">
          <ScoringMethodologySection
            title={t("methodology.sections.components.title")}
            points={[
              t("methodology.sections.components.repo"),
              t("methodology.sections.components.pr"),
              t("methodology.sections.components.contribution"),
              t("methodology.sections.components.final"),
            ]}
          />
          <ScoringMethodologySection
            title={t("methodology.sections.weights.title")}
            description={t("methodology.sections.weights.description")}
            points={[
              t("methodology.sections.weights.formula"),
              t("methodology.sections.weights.repoWeight"),
              t("methodology.sections.weights.prWeight"),
              t("methodology.sections.weights.contributionWeight"),
            ]}
          />
          <ScoringMethodologySection
            title={t("methodology.sections.diminishing.title")}
            points={[
              t("methodology.sections.diminishing.repo"),
              t("methodology.sections.diminishing.pr"),
            ]}
          />
          <ScoringMethodologySection
            title={t("methodology.sections.adjustments.title")}
            points={[
              t("methodology.sections.adjustments.fork"),
              t("methodology.sections.adjustments.activity"),
              t("methodology.sections.adjustments.size"),
              t("methodology.sections.adjustments.contributionCap"),
            ]}
          />
          <ScoringMethodologySection
            title={t("methodology.sections.normalization.title")}
            points={[
              t("methodology.sections.normalization.formula"),
              t("methodology.sections.normalization.usage"),
            ]}
          />
          <ScoringMethodologySection
            title={t("methodology.sections.signals.title")}
            points={[
              t("methodology.sections.signals.purpose"),
              t("methodology.sections.signals.examples"),
            ]}
          />
        </section>
      </div>
      <AppFooter />
    </main>
  );
}
