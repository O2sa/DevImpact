"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/components/providers/language-provider";
import type { UserResult } from "@/features/developer";
import type { SafeApiError } from "@/types/api";
import type { CompareInsights, CompareWinner, ComparisonResponse } from "../types";
import {
  createComparisonQuery,
  createComparisonRequest,
  isComparisonFetchDuplicate,
  reconcileComparisonData,
  sanitizeSelectedLanguages,
} from "../services/compare-request";

export type ComparisonData = {
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

export type CompareOptions = {
  selectedLanguages: string[];
  updateUrl?: boolean;
};

export type UsernameErrors = {
  username1: string | null;
  username2: string | null;
};

const EXIT_ANIMATION_MS = 240;

function normalizeUsers(body: ComparisonResponse): { user1: UserResult; user2: UserResult } | null {
  if (body.users && body.users.length >= 2) {
    return { user1: body.users[0], user2: body.users[1] };
  }

  return null;
}

function parseUsernamesFromSearchParams(searchParams: {
  getAll: (name: string) => string[];
  get: (name: string) => string | null;
}): [string, string] {
  const repeated = searchParams
    .getAll("username")
    .map((u) => u.trim())
    .filter(Boolean);
  const u1 =
    repeated[0] || searchParams.get("username1")?.trim() || searchParams.get("user1")?.trim() || "";
  const u2 =
    repeated[1] || searchParams.get("username2")?.trim() || searchParams.get("user2")?.trim() || "";
  return [u1, u2];
}

export function useComparisonController() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [initialUsername1, initialUsername2] = parseUsernamesFromSearchParams(searchParams);
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

  const applyApiError = (requestUser1: string, requestUser2: string, body: ComparisonResponse) => {
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

        const body: ComparisonResponse = await res.json();
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
    const [u1, u2] = parseUsernamesFromSearchParams(searchParams);
    const urlLanguages = sanitizeSelectedLanguages(searchParams.getAll("selectedLanguage"));
    queueMicrotask(() => {
      syncToUrl(u1, u2, urlLanguages);
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

  return {
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
  };
}
