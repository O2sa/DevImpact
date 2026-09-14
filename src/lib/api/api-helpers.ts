import { NextResponse } from "next/server";
import { normalizeSelectedLanguages } from "@/features/scoring";
import { toSafeApiError } from "@/lib/github";
import type { ClientSafeError, SafeApiError } from "@/types/api";

export function toApiErrorStatus(code: ReturnType<typeof toSafeApiError>["code"]): number {
  switch (code) {
    case "RATE_LIMITED":
    case "TEMPORARY_THROTTLE":
      return 429;
    case "GITHUB_TIMEOUT":
    case "GITHUB_RESOURCE_LIMIT":
    case "GITHUB_AUTH":
      return code === "GITHUB_AUTH" ? 401 : 503;
    case "GITHUB_NOT_FOUND":
      return 404;
    case "NETWORK":
      return 503;
    case "UNKNOWN":
    default:
      return 500;
  }
}

export function toClientSafeError(error: SafeApiError): ClientSafeError {
  return {
    code: error.code,
    message: error.message,
    targetUsernames: error.targetUsernames,
  };
}

export function parseSelectedLanguagesFromSearchParams(searchParams: URLSearchParams): string[] {
  const fromRepeated = searchParams.getAll("selectedLanguage");
  const fromCsv = searchParams
    .get("selectedLanguages")
    ?.split(",")
    .map((language) => language.trim())
    .filter(Boolean);

  return normalizeSelectedLanguages([...(fromRepeated ?? []), ...(fromCsv ?? [])]);
}

/**
 * Standardized API error response handler for route handlers.
 * Translates UserFetchError, CompareUserFetchError, and generic exceptions
 * into structured ClientSafeError responses with proper HTTP status codes.
 */
export function formatApiErrorResponse(error: unknown): NextResponse {
  let safeError: SafeApiError;

  const isFetchError =
    error !== null &&
    typeof error === "object" &&
    "causeError" in error &&
    "username" in error &&
    typeof (error as { username: unknown }).username === "string";

  if (isFetchError) {
    const fetchErr = error as { username: string; causeError: unknown };
    const mappedCause = toSafeApiError(fetchErr.causeError);
    if (
      mappedCause.code === "GITHUB_NOT_FOUND" ||
      (fetchErr.causeError instanceof Error && fetchErr.causeError.message === "User not found")
    ) {
      safeError = {
        code: "GITHUB_NOT_FOUND",
        message: "GitHub user not found",
        targetUsernames: [fetchErr.username],
        rateLimit: mappedCause.rateLimit,
      };
    } else {
      safeError = mappedCause;
    }
  } else {
    safeError =
      error instanceof Error && error.message === "User not found"
        ? { code: "GITHUB_NOT_FOUND", message: "GitHub user not found" }
        : toSafeApiError(error);
  }

  const clientSafeError = toClientSafeError(safeError);

  return NextResponse.json(
    {
      success: false,
      error: clientSafeError.message,
      errorDetails: clientSafeError,
    },
    { status: toApiErrorStatus(safeError.code) },
  );
}
