import { NextResponse } from "next/server";
import { getUserData } from "../../../lib/github";
import { calculateUserScore } from "../../../lib/score";
import { normalizeSelectedLanguages } from "@/lib/scoring/languageScoring";
import { toSafeApiError } from "@/lib/github-graphql-client";
import { getDatabaseStore } from "@/lib/db-store";
import { createCacheStore, getCacheConfigFromEnv } from "@/lib/cache-store";
import { detectCountry } from "@/lib/location-detector";
import type { CompareInsights, SafeApiError } from "@/types/api-response";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isSupportedLocale,
  parseAcceptLanguage,
  type Locale,
} from "@/lib/i18n-core";
import { GitHubUserData } from "@/types/github";

export const runtime = "nodejs";

class CompareUserFetchError extends Error {
  readonly username: string;
  readonly causeError: unknown;

  constructor(username: string, causeError: unknown) {
    super(`Failed to fetch GitHub data for ${username}`);
    this.name = "CompareUserFetchError";
    this.username = username;
    this.causeError = causeError;
  }
}

type ComparedUserResult = {
  username: string;
  name: string | null;
  avatarUrl: string;
  repoScore: number;
  prScore: number;
  contributionScore: number;
  finalScore: number;
  normalizedRepoScore: number;
  normalizedPRScore: number;
  normalizedContributionScore: number;
  normalizedFinalScore: number;
  topRepos: ReturnType<typeof calculateUserScore>["topRepos"];
  topPullRequests: ReturnType<typeof calculateUserScore>["topPullRequests"];
  topCommunityContributions: ReturnType<
    typeof calculateUserScore
  >["topCommunityContributions"];
  languageScores: ReturnType<typeof calculateUserScore>["languageScores"];
  signals: ReturnType<typeof calculateUserScore>["signals"];
  explanations: ReturnType<typeof calculateUserScore>["explanations"];
};

type ClientSafeError = Pick<
  SafeApiError,
  "code" | "message" | "targetUsernames"
>;

function parseSelectedLanguagesFromSearchParams(
  searchParams: URLSearchParams,
): string[] {
  const fromRepeated = searchParams.getAll("selectedLanguage");
  const fromCsv = searchParams
    .get("selectedLanguages")
    ?.split(",")
    .map((language) => language.trim())
    .filter(Boolean);

  return normalizeSelectedLanguages([
    ...(fromRepeated ?? []),
    ...(fromCsv ?? []),
  ]);
}

function calculateWinner(users: ComparedUserResult[]): {
  winner?: {
    username: string;
    finalScoreDifference: number;
    percentageDifference: number;
  };
  languageWinner?: {
    username: string;
    finalScoreDifference: number;
    percentageDifference: number;
    selectedLanguages: string[];
  };
} {
  if (users.length !== 2) {
    return {};
  }

  const [userA, userB] = users;
  const overallWinner = userA.finalScore >= userB.finalScore ? userA : userB;
  const overallLoser =
    overallWinner.username === userA.username ? userB : userA;
  const overallDifference = Math.abs(userA.finalScore - userB.finalScore);
  const overallPercentage =
    overallLoser.finalScore > 0
      ? (overallDifference / overallLoser.finalScore) * 100
      : 0;

  const result: {
    winner: {
      username: string;
      finalScoreDifference: number;
      percentageDifference: number;
    };
    languageWinner?: {
      username: string;
      finalScoreDifference: number;
      percentageDifference: number;
      selectedLanguages: string[];
    };
  } = {
    winner: {
      username: overallWinner.username,
      finalScoreDifference: Math.round(overallDifference),
      percentageDifference: Math.round(overallPercentage),
    },
  };

  if (userA.languageScores && userB.languageScores) {
    const languageWinner =
      userA.languageScores.finalScore >= userB.languageScores.finalScore
        ? userA
        : userB;
    const languageLoser =
      languageWinner.username === userA.username ? userB : userA;
    const winnerLanguageScores = languageWinner.languageScores!;
    const loserLanguageScores = languageLoser.languageScores!;
    const languageDifference = Math.abs(
      winnerLanguageScores.finalScore - loserLanguageScores.finalScore,
    );
    const languagePercentage =
      loserLanguageScores.finalScore > 0
        ? (languageDifference / loserLanguageScores.finalScore) * 100
        : 0;

    result.languageWinner = {
      username: languageWinner.username,
      finalScoreDifference: Math.round(languageDifference),
      percentageDifference: Math.round(languagePercentage),
      selectedLanguages: winnerLanguageScores.selectedLanguages,
    };
  }

  return result;
}

function createComparisonInsights(
  users: ComparedUserResult[],
  locale: Locale,
): CompareInsights | undefined {
  if (users.length !== 2) {
    return undefined;
  }

  const [user1, user2] = users;
  const user1Name = user1.name || user1.username;
  const user2Name = user2.name || user2.username;

  const finalLeader = user1.finalScore >= user2.finalScore ? user1 : user2;
  const finalFollower = finalLeader.username === user1.username ? user2 : user1;
  const finalDiff = Math.abs(user1.finalScore - user2.finalScore);

  const repoLeader = user1.repoScore >= user2.repoScore ? user1 : user2;
  const prLeader = user1.prScore >= user2.prScore ? user1 : user2;
  const contributionLeader =
    user1.contributionScore >= user2.contributionScore ? user1 : user2;

  const user1Strengths: string[] = [];
  const user2Strengths: string[] = [];

  if (repoLeader.username === user1.username) {
    user1Strengths.push(
      locale === "ar"
        ? "أثر أقوى في المستودعات ووضوح أعلى للمشاريع."
        : "Stronger repository impact and project visibility.",
    );
  } else {
    user2Strengths.push(
      locale === "ar"
        ? "أثر أقوى في المستودعات ووضوح أعلى للمشاريع."
        : "Stronger repository impact and project visibility.",
    );
  }

  if (prLeader.username === user1.username) {
    user1Strengths.push(
      locale === "ar"
        ? "أثر أعلى من طلبات السحب الخارجية المدمجة."
        : "Higher merged external pull request impact.",
    );
  } else {
    user2Strengths.push(
      locale === "ar"
        ? "أثر أعلى من طلبات السحب الخارجية المدمجة."
        : "Higher merged external pull request impact.",
    );
  }

  if (contributionLeader.username === user1.username) {
    user1Strengths.push(
      locale === "ar"
        ? "أثر أعلى من المساهمات الخارجية في المشاكل والنقاشات."
        : "Higher external issue/discussion contribution impact.",
    );
  } else {
    user2Strengths.push(
      locale === "ar"
        ? "أثر أعلى من المساهمات الخارجية في المشاكل والنقاشات."
        : "Higher external issue/discussion contribution impact.",
    );
  }

  const recommendationsForUser = (target: ComparedUserResult): string[] => {
    const recommendations: string[] = [];

    if (target.repoScore < repoLeader.repoScore) {
      recommendations.push(
        locale === "ar"
          ? "التركيز على عدد أقل من المستودعات العامة عالية الجودة مع نشاط مستمر."
          : "Invest in fewer high-quality public repositories with sustained activity.",
      );
    }
    if (target.prScore < prLeader.prScore) {
      recommendations.push(
        locale === "ar"
          ? "زيادة المساهمات المدمجة في مستودعات خارجية ذات وصول مجتمعي أوسع."
          : "Increase merged contributions to external repositories with broader community reach.",
      );
    }
    if (target.contributionScore < contributionLeader.contributionScore) {
      recommendations.push(
        locale === "ar"
          ? "المشاركة بشكل أكبر في المشاكل والنقاشات الخارجية عالية الأثر لتحسين الحضور المجتمعي."
          : "Participate more in high-signal external issues/discussions to improve community impact.",
      );
    }
    if (recommendations.length === 0) {
      recommendations.push(
        locale === "ar"
          ? "الحفاظ على الاستمرارية بين المستودعات وطلبات السحب والمشاركة المجتمعية الخارجية."
          : "Maintain consistency across repositories, pull requests, and external community engagement.",
      );
    }

    return recommendations;
  };

  return {
    summary:
      locale === "ar"
        ? `${finalLeader.name || finalLeader.username} يتصدر حاليًا درجة الأثر المفتوح المصدر بفارق ${finalDiff} نقطة عن ${finalFollower.name || finalFollower.username}.`
        : `${finalLeader.name || finalLeader.username} currently has the higher public open-source impact score by ${finalDiff} points over ${finalFollower.name || finalFollower.username}.`,
    keyDifferences: [
      locale === "ar"
        ? `${repoLeader.name || repoLeader.username} يتصدر أثر المستودعات (${repoLeader.repoScore} مقابل ${repoLeader.username === user1.username ? user2.repoScore : user1.repoScore}).`
        : `${repoLeader.name || repoLeader.username} leads repository impact (${repoLeader.repoScore} vs ${repoLeader.username === user1.username ? user2.repoScore : user1.repoScore}).`,
      locale === "ar"
        ? `${prLeader.name || prLeader.username} يتصدر أثر طلبات السحب (${prLeader.prScore} مقابل ${prLeader.username === user1.username ? user2.prScore : user1.prScore}).`
        : `${prLeader.name || prLeader.username} leads pull request impact (${prLeader.prScore} vs ${prLeader.username === user1.username ? user2.prScore : user1.prScore}).`,
      locale === "ar"
        ? `${contributionLeader.name || contributionLeader.username} يتصدر أثر مساهمات المجتمع (${contributionLeader.contributionScore} مقابل ${contributionLeader.username === user1.username ? user2.contributionScore : user1.contributionScore}).`
        : `${contributionLeader.name || contributionLeader.username} leads community contribution impact (${contributionLeader.contributionScore} vs ${contributionLeader.username === user1.username ? user2.contributionScore : user1.contributionScore}).`,
    ],
    user1Strengths:
      user1Strengths.length > 0
        ? user1Strengths
        : [
            locale === "ar"
              ? "أثر عام متوازن عبر أهم أبعاد التقييم."
              : "Balanced overall impact across major scoring dimensions.",
          ],
    user2Strengths:
      user2Strengths.length > 0
        ? user2Strengths
        : [
            locale === "ar"
              ? "أثر عام متوازن عبر أهم أبعاد التقييم."
              : "Balanced overall impact across major scoring dimensions.",
          ],
    recommendations: {
      user1: recommendationsForUser(user1),
      user2: recommendationsForUser(user2),
    },
    confidenceNote:
      locale === "ar"
        ? `هذه المقارنة حتمية ومبنية على إشارات GitHub العامة الملتقطة لكل من ${user1Name} و${user2Name}.`
        : `This comparison is deterministic and based on public GitHub signals captured for ${user1Name} and ${user2Name}.`,
  };
}

function resolveLocale(request: Request): Locale {
  const cookieHeader = request.headers.get("cookie");
  const localeFromCookie = cookieHeader
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${LOCALE_COOKIE}=`))
    ?.split("=")[1];

  if (isSupportedLocale(localeFromCookie)) {
    return localeFromCookie;
  }

  return parseAcceptLanguage(
    request.headers.get("accept-language"),
    ["en", "ar"],
    DEFAULT_LOCALE,
  );
}

async function compareUsers(
  usernames: string[],
  selectedLanguages: string[],
): Promise<ComparedUserResult[]> {
  const results: ComparedUserResult[] = [];

  for (const username of usernames) {
    let data: Awaited<GitHubUserData>;
    try {
      const { data: userData, metrics } = await getUserData(username, {
        cacheInRedis: true,
        withMetrics: true,
      });
      data = userData;
      console.log(metrics);
    } catch (error: unknown) {
      throw new CompareUserFetchError(username, error);
    }

    const score = calculateUserScore(
      {
        ...data,
        selectedLanguages,
      },
      username,
    );

    results.push({
      username: data.login,
      name: data.name,
      avatarUrl: data.avatarUrl,
      repoScore: Math.round(score.repoScore),
      prScore: Math.round(score.prScore),
      contributionScore: Math.round(score.contributionScore),
      finalScore: Math.round(score.finalScore),
      normalizedRepoScore: Math.round(score.normalizedRepoScore),
      normalizedPRScore: Math.round(score.normalizedPRScore),
      normalizedContributionScore: Math.round(
        score.normalizedContributionScore,
      ),
      normalizedFinalScore: Math.round(score.normalizedFinalScore),
      topRepos: score.topRepos,
      topPullRequests: score.topPullRequests,
      topCommunityContributions: score.topCommunityContributions,
      languageScores: score.languageScores,
      signals: score.signals,
      explanations: score.explanations,
    });

    // ── Fire-and-forget: detect country & upsert into DB ──────────────
    const country = detectCountry(data.location);
    if (country) {
      const staleDays = parseInt(
        process.env.GITHUB_USER_STALE_DAYS ?? "14",
        10,
      );

      const db = getDatabaseStore();
      db.upsertUser({
        username: data.login,
        name: data.name,
        avatarUrl: data.avatarUrl,
        location: data.location,
        country,
        rawData: data,
        scores: score,
        repoScore: Math.round(score.repoScore),
        prScore: Math.round(score.prScore),
        contributionScore: Math.round(score.contributionScore),
        finalScore: Math.round(score.finalScore),
        staleDays,
      })
        .then(() => {
          // Invalidate Redis cache for this country
          const cacheConfig = getCacheConfigFromEnv();
          const cacheStore = createCacheStore(cacheConfig);
          if (cacheStore.enabled && cacheStore.del) {
            const key = `${cacheConfig.namespace}:leaderboard:${country}`;
            cacheStore.del(key).catch(() => {});
          }
        })
        .catch((err: unknown) => {
          console.warn("Failed to upsert user from compare:", err);
        });
    }
  }

  return results;
}

function toApiErrorStatus(
  code: ReturnType<typeof toSafeApiError>["code"],
): number {
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
    const selectedLanguages =
      parseSelectedLanguagesFromSearchParams(searchParams);
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
        (error.causeError instanceof Error &&
          error.causeError.message === "User not found")
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
