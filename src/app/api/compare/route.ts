import { NextResponse } from "next/server";
import {
  CompareUserFetchError,
  calculateWinner,
  compareUsers,
  createComparisonInsights,
  parseSelectedLanguagesFromSearchParams,
  resolveLocale,
} from "@/features/comparison";
import { toSafeApiError } from "@/lib/github";
import type { ClientSafeError, SafeApiError } from "@/types/api";

export const runtime = "nodejs";

function toApiErrorStatus(code: ReturnType<typeof toSafeApiError>["code"]): number {
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
    default:
      return 500;
  }
}

function toClientSafeError(error: SafeApiError): ClientSafeError {
  return {
    code: error.code,
    message: error.message,
    targetUsernames: error.targetUsernames,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const usernames = searchParams
    .getAll("username")
    .map((username) => username.trim())
    .filter(Boolean);

  if (usernames.length !== 2) {
    return NextResponse.json(
      { success: false, error: "provide exactly two username params" },
      { status: 400 },
    );
  }

  try {
    const locale = resolveLocale(request);
    const selectedLanguages = parseSelectedLanguagesFromSearchParams(searchParams);
    const users = await compareUsers(usernames, selectedLanguages);
    const winnerData = calculateWinner(users);
    const insights = createComparisonInsights(users, locale);
    return NextResponse.json({ success: true, users, ...winnerData, insights });
  } catch (error: unknown) {
    console.error("GitHub score error:", error);

    let safeError: SafeApiError;

    if (error instanceof CompareUserFetchError) {
      const mappedCause = toSafeApiError(error.causeError);
      if (
        mappedCause.code === "GITHUB_NOT_FOUND" ||
        (error.causeError instanceof Error && error.causeError.message === "User not found")
      ) {
        safeError = {
          code: "GITHUB_NOT_FOUND",
          message: "GitHub user not found",
          targetUsernames: [error.username],
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
}
