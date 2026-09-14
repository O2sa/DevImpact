import { NextResponse } from "next/server";
import { getUserProfile, UserFetchError } from "@/features/developer/services";
import { normalizeSelectedLanguages } from "@/features/scoring";
import { toSafeApiError } from "@/lib/github";
import type { SafeApiError } from "@/types/api";

export const runtime = "nodejs";

type ClientSafeError = Pick<SafeApiError, "code" | "message" | "targetUsernames">;

function parseSelectedLanguagesFromSearchParams(searchParams: URLSearchParams): string[] {
  const fromRepeated = searchParams.getAll("selectedLanguage");
  const fromCsv = searchParams
    .get("selectedLanguages")
    ?.split(",")
    .map((language) => language.trim())
    .filter(Boolean);

  return normalizeSelectedLanguages([...(fromRepeated ?? []), ...(fromCsv ?? [])]);
}

function toClientSafeError(error: SafeApiError): ClientSafeError {
  return {
    code: error.code,
    message: error.message,
    targetUsernames: error.targetUsernames,
  };
}

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
    case "UNKNOWN":
    default:
      return 500;
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const trimmed = username?.trim();

  if (!trimmed) {
    return NextResponse.json(
      { success: false, error: "Username parameter is required" },
      { status: 400 },
    );
  }

  const { searchParams } = new URL(request.url);
  const selectedLanguages = parseSelectedLanguagesFromSearchParams(searchParams);

  try {
    const { user, location } = await getUserProfile(trimmed, selectedLanguages);
    return NextResponse.json({ success: true, user, location });
  } catch (error: unknown) {
    console.error("User profile fetch error:", error);

    let safeError: SafeApiError;

    if (error instanceof UserFetchError) {
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
