"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { CompareForm } from "../components/compare-form";
import { ResultDashboard } from "../components/result-dashboard";
import { DashboardSkeleton } from "../components/skeletons";
import { UserResult } from "@/types/user-result";
import { BrandLogo } from "@/components/brand-logo";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { useTranslation } from "@/components/language-provider";
import { ApiResponse, CompareInsights, CompareWinner, SafeApiError } from "@/types/api-response";
import { cn } from "@/lib/utils";
import {
  createComparisonQuery,
  createComparisonRequest,
  isComparisonFetchDuplicate,
  reconcileComparisonData,
  sanitizeSelectedLanguages,
} from "@/lib/compare-request";

type ComparisonData = {
  user1: UserResult;
  user2: UserResult;
  winner?: CompareWinner;
  languageWinner?: {
    username: string;
    finalScoreDifference: number;
    percentageDifference: number | null;
    selectedLanguages: string[];
  };
  insights?: CompareInsights;
  scoreVersion?: string;
};

type CompareOptions = {
  selectedLanguages: string[];
  updateUrl?: boolean;
};

type UsernameErrors = {
  username1: string | null;
  username2: string | null;
};

const EXIT_ANIMATION_MS = 240;

function normalizeUsers(body: ApiResponse): { user1: UserResult; user2: UserResult } | null {
  if (body.users && body.users.length >= 2) {
    return { user1: body.users[0], user2: body.users[1] };
  }

  return null;
}

export function HomePageClient() {
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
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [usernameErrors, setUsernameErrors] = useState<UsernameErrors>({
    username1: null,
    username2: null,
  });
  const [username1, setUsername1] = useState(initialUsername1);
  const [username2, setUsername2] = useState(initialUsername2);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(initialSelectedLanguages);
  const [data, setData] = useState<ComparisonData | null>(null);
  const [displayData, setDisplayData] = useState<ComparisonData | null>(null);
  const [disableDuplicateFetch, setDisableDuplicateFetch] = useState(false);
  const lastFetchedKeyRef = useRef<string | null>(null);
  const inFlightFetchKeyRef = useRef<string | null>(null);
  const inFlightPromiseRef = useRef<Promise<void> | null>(null);
  const latestRequestRef = useRef(
    createComparisonRequest(initialUsername1, initialUsername2, initialSelectedLanguages),
  );
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

  const createNotFoundFieldMessage = (username: string): string => {
    const localizedPrefix = t("error.userNotFound");
    return `${localizedPrefix}: ${username}`;
  };

  const resetErrors = () => {
    setGeneralError(null);
    setUsernameErrors({
      username1: null,
      username2: null,
    });
  };

  const applyApiError = (requestUser1: string, requestUser2: string, body: ApiResponse) => {
    const details = body.errorDetails;
    const localizedMessage = localizeErrorMessage(body.error, details);

    if (details?.code === "GITHUB_NOT_FOUND" && details.targetUsernames?.length) {
      const requestedUsernames = [
        {
          key: "username1" as const,
          value: requestUser1,
        },
        {
          key: "username2" as const,
          value: requestUser2,
        },
      ];

      const nextErrors: UsernameErrors = { username1: null, username2: null };

      for (const targetUsername of details.targetUsernames) {
        const normalizedTarget = targetUsername.trim().toLowerCase();
        const match = requestedUsernames.find(
          (entry) => entry.value.trim().toLowerCase() === normalizedTarget,
        );

        if (match) {
          nextErrors[match.key] = createNotFoundFieldMessage(match.value);
        }
      }

      if (nextErrors.username1 || nextErrors.username2) {
        setUsernameErrors(nextErrors);
        setGeneralError(null);
        return;
      }
    }

    setUsernameErrors({
      username1: null,
      username2: null,
    });
    setGeneralError(localizedMessage);
  };

  const handleCompare = async (u1: string, u2: string, options: CompareOptions) => {
    const request = createComparisonRequest(u1, u2, options.selectedLanguages);
    latestRequestRef.current = request;
    const fetchKey = request.fetchKey;

    if (inFlightFetchKeyRef.current === fetchKey && inFlightPromiseRef.current) {
      return inFlightPromiseRef.current;
    }

    // If we've already fetched this exact comparison and have the data, skip.
    if (lastFetchedKeyRef.current === fetchKey && data) {
      const reconciled = reconcileComparisonData(data, fetchKey, request);
      if (reconciled) {
        setData(reconciled);
        setDisplayData(reconciled);
      }
      return Promise.resolve();
    }

    lastFetchedKeyRef.current = fetchKey;

    // update duplicate fetch state for current form values
    const currentFetchKey = createComparisonRequest(
      username1,
      username2,
      selectedLanguages,
    ).fetchKey;
    setDisableDuplicateFetch(
      isComparisonFetchDuplicate(
        currentFetchKey,
        lastFetchedKeyRef.current,
        inFlightFetchKeyRef.current,
        Boolean(data),
      ),
    );

    const requestPromise = (async () => {
      if (options.updateUrl !== false) {
        router.push(`/?${createComparisonQuery(request)}`, { scroll: false });
      }

      setLoading(true);
      resetErrors();

      try {
        const res = await fetch(`/api/compare?${createComparisonQuery(request)}`);

        const body: ApiResponse = await res.json();
        if (!res.ok) {
          if (latestRequestRef.current.fetchKey !== fetchKey) {
            return;
          }
          setData(null);
          applyApiError(latestRequestRef.current.user1, latestRequestRef.current.user2, body);
          return;
        }
        const users = normalizeUsers(body);

        if (!body.success || !users) {
          if (latestRequestRef.current.fetchKey !== fetchKey) return;
          setData(null);
          applyApiError(latestRequestRef.current.user1, latestRequestRef.current.user2, body);
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

        const reconciled = reconcileComparisonData(nextData, fetchKey, latestRequestRef.current);
        if (!reconciled) {
          if (latestRequestRef.current.fetchKey === fetchKey) {
            setData(null);
            setGeneralError(t("error.generic"));
          }
          return;
        }

        setData(reconciled);
        setDisplayData(reconciled);
      } catch (err: unknown) {
        if (latestRequestRef.current.fetchKey !== fetchKey) {
          return;
        }
        setData(null);
        setUsernameErrors({
          username1: null,
          username2: null,
        });
        setGeneralError(localizeErrorMessage(err instanceof Error ? err.message : undefined));
      } finally {
        if (inFlightFetchKeyRef.current === fetchKey) {
          inFlightFetchKeyRef.current = null;
          inFlightPromiseRef.current = null;
          setLoading(false);
        }
      }
    })();

    inFlightFetchKeyRef.current = fetchKey;
    inFlightPromiseRef.current = requestPromise;

    // mark duplicate fetch disabled while request is in-flight
    setDisableDuplicateFetch(
      isComparisonFetchDuplicate(
        currentFetchKey,
        lastFetchedKeyRef.current,
        inFlightFetchKeyRef.current,
        Boolean(data),
      ),
    );

    return requestPromise;
  };

  const syncToUrl = useEffectEvent((u1: string, u2: string, languages: string[]) => {
    setUsername1(u1);
    setUsername2(u2);
    setSelectedLanguages(languages);

    if (!u1 || !u2) {
      latestRequestRef.current = createComparisonRequest(u1, u2, languages);
      lastFetchedKeyRef.current = null;
      setData(null);
      resetErrors();
      setDisableDuplicateFetch(false);
      return;
    }

    void handleCompare(u1, u2, {
      selectedLanguages: languages,
      updateUrl: false,
    });
  });

  useEffect(() => {
    const params = searchParams.getAll("username");
    const urlLanguages = sanitizeSelectedLanguages(searchParams.getAll("selectedLanguage"));
    queueMicrotask(() => {
      syncToUrl(params[0] ?? "", params[1] ?? "", urlLanguages);
    });
  }, [searchParams]);

  useEffect(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (data) {
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

  useEffect(() => {
    const currentFetchKey = createComparisonRequest(
      username1,
      username2,
      selectedLanguages,
    ).fetchKey;

    const lastKey = lastFetchedKeyRef.current;
    const inFlightKey = inFlightFetchKeyRef.current;

    const disabled = isComparisonFetchDuplicate(
      currentFetchKey,
      lastKey,
      inFlightKey,
      Boolean(data),
    );
    setDisableDuplicateFetch(disabled);
  }, [username1, username2, selectedLanguages, data, loading]);

  const handleUsername1Change = (value: string) => {
    setUsername1(value);
    if (usernameErrors.username1) {
      setUsernameErrors((current) => ({ ...current, username1: null }));
    }
  };

  const handleUsername2Change = (value: string) => {
    setUsername2(value);
    if (usernameErrors.username2) {
      setUsernameErrors((current) => ({ ...current, username2: null }));
    }
  };

  const reset = () => {
    setLoading(false);
    setData(null);
    resetErrors();
    inFlightFetchKeyRef.current = null;
    inFlightPromiseRef.current = null;
    latestRequestRef.current = createComparisonRequest("", "", []);
    setDisableDuplicateFetch(false);
    setUsername1("");
    setUsername2("");
    setSelectedLanguages([]);
    router.push("/", { scroll: false });
  };

  const swapUsers = () => {
    const nextUsername1 = username2;
    const nextUsername2 = username1;
    const nextRequest = createComparisonRequest(nextUsername1, nextUsername2, selectedLanguages);
    latestRequestRef.current = nextRequest;

    setUsername1(nextUsername1);
    setUsername2(nextUsername2);
    router.push(`/?${createComparisonQuery(nextRequest)}`, { scroll: false });

    setData((current) =>
      current ? reconcileComparisonData(current, nextRequest.fetchKey, nextRequest) : current,
    );
    setDisplayData((current) =>
      current ? reconcileComparisonData(current, nextRequest.fetchKey, nextRequest) : current,
    );
  };

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
