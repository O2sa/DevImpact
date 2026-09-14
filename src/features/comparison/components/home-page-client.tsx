"use client";

import { useMemo } from "react";
import Image from "next/image";
import { CompareForm } from "./compare-form";
import { ResultDashboard } from "./result-dashboard";
import { DashboardSkeleton } from "@/components/layout/skeletons";
import { BrandLogo } from "@/components/layout/brand-logo";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";
import { useTranslation } from "@/components/providers/language-provider";
import { cn } from "@/utils/cn";
import { useComparisonController } from "../hooks";

export function HomePageClient() {
  const { t } = useTranslation();
  const {
    username1,
    username2,
    selectedLanguages,
    handleUsername1Change,
    handleUsername2Change,
    setSelectedLanguages,
    handleCompare,
    reset,
    swapUsers,
    loading,
    data,
    displayData,
    disableDuplicateFetch,
    isRefreshing,
    isExiting,
    generalError,
    usernameErrors,
  } = useComparisonController();

  const skeleton = useMemo(() => <DashboardSkeleton />, []);

  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader />

      <div className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-10">
        <CompareForm
          username1={username1}
          username2={username2}
          selectedLanguages={selectedLanguages}
          setUsername1={handleUsername1Change}
          setUsername2={handleUsername2Change}
          setSelectedLanguages={setSelectedLanguages}
          onSubmit={handleCompare}
          loading={loading}
          reset={reset}
          swapUsers={swapUsers}
          hasData={Boolean(data)}
          disableDuplicateFetch={disableDuplicateFetch}
          username1Error={usernameErrors.username1}
          username2Error={usernameErrors.username2}
        />

        <div className="relative min-h-[28rem]" aria-live="polite">
          {displayData ? (
            <div
              className={cn(
                "transition-all duration-300 ease-out",
                isRefreshing
                  ? "saturate-75 pointer-events-none scale-[0.99] opacity-55 blur-[1px]"
                  : isExiting
                    ? "pointer-events-none -translate-y-2 scale-[0.99] opacity-0 blur-[2px]"
                    : "opacity-100",
              )}
            >
              <ResultDashboard
                key={`${displayData.user1.username}-${displayData.user2.username}-${displayData.user1.finalScore}-${displayData.user2.finalScore}`}
                user1={displayData.user1}
                user2={displayData.user2}
                winner={displayData.winner}
                languageWinner={displayData.languageWinner}
                insights={displayData.insights}
                scoreVersion={displayData.scoreVersion}
              />
            </div>
          ) : loading ? (
            <div className="transition-all duration-300 ease-out">{skeleton}</div>
          ) : null}

          {loading && displayData ? (
            <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-4">
              <div className="rounded-full border border-border/70 bg-background/85 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground shadow-sm backdrop-blur">
                {t("form.compare.ing")}
              </div>
            </div>
          ) : null}

          {!loading && !generalError && !displayData ? (
            <div className="flex animate-fadeIn flex-col items-center justify-center gap-4 py-20 text-center text-muted-foreground">
              <BrandLogo size="xl" />
              <p className="text-lg font-medium">{t("page.empty.title")}</p>
              <p className="text-sm opacity-70">{t("page.empty.description")}</p>
            </div>
          ) : null}

          {!loading && generalError && !displayData ? (
            <div className="mx-auto flex max-w-2xl animate-fadeIn flex-col items-center justify-center gap-5 rounded-3xl border border-destructive/25 bg-gradient-to-b from-destructive/10 via-destructive/5 to-background px-6 py-12 text-center shadow-sm">
              <div className="rounded-2xl bg-background/70 p-2 ring-1 ring-destructive/20">
                <Image
                  src="/error-state.svg"
                  alt=""
                  aria-hidden="true"
                  width={112}
                  height={112}
                  className="h-28 w-28"
                />
              </div>
              <p className="text-xl font-semibold tracking-tight text-foreground">
                {t("error.comparisonFailed")}
              </p>
              <p className="max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
                {generalError}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <AppFooter />
    </main>
  );
}
