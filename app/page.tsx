"use client";

import { Suspense, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CompareForm } from "../components/compare-form";
import { ResultDashboard } from "../components/result-dashboard";
import { DashboardSkeleton } from "../components/skeletons";
import { UserResult } from "@/types/user-result";
import { BrandLogo } from "@/components/brand-logo";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { useTranslation } from "@/components/language-provider";
import {
  ApiResponse,
  CompareInsights,
  CompareWinner,
  SafeApiError,
} from "@/types/api-response";
import { cn } from "@/lib/utils";

type ComparisonData = {
  user1: UserResult;
  user2: UserResult;
  winner?: CompareWinner;
  languageWinner?: {
    username: string;
    finalScoreDifference: number;
    percentageDifference: number;
    selectedLanguages: string[];
  };
  insights?: CompareInsights;
  scoreVersion?: string;
};

type CompareOptions = {
  selectedLanguages: string[];
  updateUrl?: boolean;
};

const EXIT_ANIMATION_MS = 240;

function sanitizeSelectedLanguages(languages: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const language of languages) {
    const trimmed = language.trim();
    const normalized = trimmed.toLowerCase();
    if (!trimmed || seen.has(normalized)) {
      continue;
    }
    output.push(trimmed);
    seen.add(normalized);
    if (output.length >= 5) {
      break;
    }
  }

  return output;
}

function normalizeUsers(body: ApiResponse): { user1: UserResult; user2: UserResult } | null {
  if (body.users && body.users.length >= 2) {
    return { user1: body.users[0], user2: body.users[1] };
  }

  return null;
}

function HomePageInner() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUsernames = searchParams.getAll("username");
  const initialUsername1 = initialUsernames[0] ?? "";
  const initialUsername2 = initialUsernames[1] ?? "";
  const initialSelectedLanguages = sanitizeSelectedLanguages(
    searchParams.getAll("selectedLanguage"),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username1, setUsername1] = useState(initialUsername1);
  const [username2, setUsername2] = useState(initialUsername2);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    initialSelectedLanguages,
  );
  const [data, setData] = useState<ComparisonData | null>(null);
  const [displayData, setDisplayData] = useState<ComparisonData | null>(null);
  const lastFetchedKeyRef = useRef<string | null>(null);
  const inFlightFetchKeyRef = useRef<string | null>(null);
  const inFlightPromiseRef = useRef<Promise<void> | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const localizeErrorMessage = (message?: string, details?: SafeApiError) => {
    if (details) {
      switch (details.code) {
        case "RATE_LIMITED":
          return t("error.rateLimited", {
            seconds: details.retryAfterSeconds ?? 60,
          });
        case "TEMPORARY_THROTTLE":
          return t("error.tempThrottle", {
            seconds: details.retryAfterSeconds ?? 60,
          });
        case "GITHUB_TIMEOUT":
          return t("error.timeout");
        case "GITHUB_RESOURCE_LIMIT":
          return t("error.resourceLimit");
        case "GITHUB_AUTH":
          return t("error.missingToken");
        case "GITHUB_NOT_FOUND":
          return t("error.userNotFound");
        case "NETWORK":
          return t("error.fetchFailed");
        default:
          break;
      }
    }

    switch (message) {
      case "provide exactly two username params":
        return t("error.missingUsername");
      case "GitHub user not found":
        return t("error.userNotFound");
      case "Failed to calculate score":
        return t("error.calculateFailed");
      case "Comparison failed":
        return t("error.comparisonFailed");
      case "Failed to fetch":
        return t("error.fetchFailed");
      case "Missing GITHUB_TOKEN":
        return t("error.missingToken");
      default:
        return t("error.generic");
    }
  };

  const createFetchKey = (
    u1: string,
    u2: string,
    options: CompareOptions,
  ) =>
    JSON.stringify({
      u1,
      u2,
      selectedLanguages: [...sanitizeSelectedLanguages(options.selectedLanguages)].sort(),
    });

  const handleCompare = async (
    u1: string,
    u2: string,
    options: CompareOptions,
  ) => {
    const sanitizedLanguages = sanitizeSelectedLanguages(options.selectedLanguages);
    const fetchKey = createFetchKey(u1, u2, options);

    if (inFlightFetchKeyRef.current === fetchKey && inFlightPromiseRef.current) {
      return inFlightPromiseRef.current;
    }

    lastFetchedKeyRef.current = fetchKey;

    const requestPromise = (async () => {
      if (options.updateUrl !== false) {
        const params = new URLSearchParams();
        params.append("username", u1);
        params.append("username", u2);
        for (const language of sanitizedLanguages) {
          params.append("selectedLanguage", language);
        }
        router.push(`/?${params.toString()}`, { scroll: false });
      }

      setLoading(true);
      setError(null);

      try {
        const requestParams = new URLSearchParams();
        requestParams.append("username", u1);
        requestParams.append("username", u2);
        for (const language of sanitizedLanguages) {
          requestParams.append("selectedLanguage", language);
        }

        const res = await fetch(`/api/compare?${requestParams.toString()}`);

        const body: ApiResponse = await res.json();
        if (!res.ok) {
          setData(null);
          setError(localizeErrorMessage(body.error, body.errorDetails));
          return;
        }
        const users = normalizeUsers(body);

        if (!body.success || !users) {
          setData(null);
          setError(localizeErrorMessage(body.error || "Comparison failed", body.errorDetails));
          return;
        }

        const winnerUsername =
          body.winner?.username ??
          (users.user1.finalScore > users.user2.finalScore
            ? users.user1.username
            : users.user2.finalScore > users.user1.finalScore
              ? users.user2.username
              : undefined);

        const nextData: ComparisonData = {
          user1: { ...users.user1, isWinner: winnerUsername === users.user1.username },
          user2: { ...users.user2, isWinner: winnerUsername === users.user2.username },
          winner: body.winner,
          languageWinner: body.languageWinner,
          insights: body.insights,
          scoreVersion: body.scoreVersion,
        };

        setData(nextData);
        setDisplayData(nextData);
      } catch (err: unknown) {
        setData(null);
        setError(localizeErrorMessage(err instanceof Error ? err.message : undefined));
      } finally {
        if (inFlightFetchKeyRef.current === fetchKey) {
          inFlightFetchKeyRef.current = null;
          inFlightPromiseRef.current = null;
        }
        setLoading(false);
      }
    })();

    inFlightFetchKeyRef.current = fetchKey;
    inFlightPromiseRef.current = requestPromise;

    return requestPromise;
  };

  const syncToUrl = useEffectEvent(
    (u1: string, u2: string, languages: string[]) => {
      setUsername1(u1);
      setUsername2(u2);
      setSelectedLanguages(languages);

      if (!u1 || !u2) {
        lastFetchedKeyRef.current = null;
        setData(null);
        setError(null);
        return;
      }

      const nextKey = createFetchKey(u1, u2, {
        selectedLanguages: languages,
      });

      if (
        lastFetchedKeyRef.current === nextKey &&
        (data || inFlightFetchKeyRef.current === nextKey)
      ) {
        return;
      }

      void handleCompare(u1, u2, {
        selectedLanguages: languages,
        updateUrl: false,
      });
    },
  );

  useEffect(() => {
    const params = searchParams.getAll("username");
    const urlLanguages = sanitizeSelectedLanguages(searchParams.getAll("selectedLanguage"));
    syncToUrl(
      params[0] ?? "",
      params[1] ?? "",
      urlLanguages,
    );
  }, [searchParams]);

  useEffect(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (data) {
      setDisplayData(data);
      return;
    }

    if (loading || !displayData) {
      return;
    }

    hideTimerRef.current = window.setTimeout(() => {
      setDisplayData(null);
      hideTimerRef.current = null;
    }, EXIT_ANIMATION_MS);

    return () => {
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [data, displayData, loading]);

  const skeleton = useMemo(() => <DashboardSkeleton />, []);
  const isRefreshing = loading && Boolean(displayData);
  const isExiting = !loading && !data && Boolean(displayData);

  const reset = () => {
    setLoading(false);
    setData(null);
    setError(null);
    inFlightFetchKeyRef.current = null;
    inFlightPromiseRef.current = null;
    setUsername1("");
    setUsername2("");
    setSelectedLanguages([]);
    router.push("/", { scroll: false });
  };

  const swapUsers = () => {
    const nextUsername1 = username2;
    const nextUsername2 = username1;

    setUsername1(nextUsername1);
    setUsername2(nextUsername2);
    router.push(
      `/?username=${encodeURIComponent(nextUsername1)}&username=${encodeURIComponent(nextUsername2)}`,
      { scroll: false },
    );

    if (!data) return;
    setData((current) => (current ? { ...current, user1: current.user2, user2: current.user1 } : current));
  };

  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader />

      <div className="w-full flex-1 max-w-6xl mx-auto px-4 py-10 space-y-6">
        <CompareForm
          username1={username1}
          username2={username2}
          selectedLanguages={selectedLanguages}
          setUsername1={setUsername1}
          setUsername2={setUsername2}
          setSelectedLanguages={setSelectedLanguages}
          onSubmit={handleCompare}
          loading={loading}
          reset={reset}
          swapUsers={swapUsers}
          hasData={Boolean(data)}
          error={error}
        />

        <div className="relative min-h-[28rem]" aria-live="polite">
          {displayData ? (
            <div
              className={cn(
                "transition-all duration-300 ease-out",
                isRefreshing
                  ? "pointer-events-none scale-[0.99] opacity-55 blur-[1px] saturate-75"
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
            <div className="transition-all duration-300 ease-out">
              {skeleton}
            </div>
          ) : null}

          {loading && displayData ? (
            <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-4">
              <div className="rounded-full border border-border/70 bg-background/85 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground shadow-sm backdrop-blur">
                {t("form.compare.ing")}
              </div>
            </div>
          ) : null}

          {!loading && !error && !displayData ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center text-muted-foreground animate-fadeIn">
              <BrandLogo size="xl" />
              <p className="text-lg font-medium">{t("page.empty.title")}</p>
              <p className="text-sm opacity-70">{t("page.empty.description")}</p>
            </div>
          ) : null}
        </div>
      </div>

      <AppFooter />
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <HomePageInner />
    </Suspense>
  );
}
