import { NextResponse } from "next/server";
import { fetchGitHubUserData } from "../../../lib/github";
import { calculateUserScore } from "../../../lib/score";
import { normalizeSelectedLanguages } from "@/lib/scoring/languageScoring";

export const runtime = "nodejs";

type CompareRequestBody = {
  username1?: string;
  username2?: string;
  selectedLanguages?: string[];
};

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

function parseSelectedLanguagesFromSearchParams(
  searchParams: URLSearchParams,
): string[] {
  const fromRepeated = searchParams.getAll("selectedLanguage");
  const fromCsv = searchParams
    .get("selectedLanguages")
    ?.split(",")
    .map((language) => language.trim())
    .filter(Boolean);

  return normalizeSelectedLanguages([...(fromRepeated ?? []), ...(fromCsv ?? [])]);
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
  const overallLoser = overallWinner.username === userA.username ? userB : userA;
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
    const languageLoser = languageWinner.username === userA.username ? userB : userA;
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

async function compareUsers(
  usernames: string[],
  selectedLanguages: string[],
): Promise<ComparedUserResult[]> {
  return Promise.all(
    usernames.map(async (username) => {
      const data = await fetchGitHubUserData(username);
      const score = calculateUserScore(
        {
          ...data,
          selectedLanguages,
        },
        username,
      );

      return {
        username,
        name: data.name,
        avatarUrl: data.avatarUrl,
        repoScore: Math.round(score.repoScore),
        prScore: Math.round(score.prScore),
        contributionScore: Math.round(score.contributionScore),
        finalScore: Math.round(score.finalScore),
        normalizedRepoScore: Math.round(score.normalizedRepoScore),
        normalizedPRScore: Math.round(score.normalizedPRScore),
        normalizedContributionScore: Math.round(score.normalizedContributionScore),
        normalizedFinalScore: Math.round(score.normalizedFinalScore),
        topRepos: score.topRepos,
        topPullRequests: score.topPullRequests,
        topCommunityContributions: score.topCommunityContributions,
        languageScores: score.languageScores,
        signals: score.signals,
        explanations: score.explanations,
      };
    }),
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const usernames = searchParams
    .getAll("username")
    .map((username) => username.trim())
    .filter(Boolean);

  if (usernames.length === 0) {
    return NextResponse.json(
      { success: false, error: "provide at least one username param" },
      { status: 400 },
    );
  }

  try {
    const selectedLanguages = parseSelectedLanguagesFromSearchParams(searchParams);
    const users = await compareUsers(usernames, selectedLanguages);
    const winnerData = calculateWinner(users);
    return NextResponse.json({ success: true, users, ...winnerData });
  } catch (error: unknown) {
    console.error("GitHub score error:", error);
    const message =
      error instanceof Error && error.message === "User not found"
        ? "GitHub user not found"
        : "Failed to calculate score";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: CompareRequestBody;

  try {
    body = (await request.json()) as CompareRequestBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const usernames = [body.username1, body.username2]
    .map((username) => username?.trim() ?? "")
    .filter(Boolean);

  if (usernames.length !== 2) {
    return NextResponse.json(
      {
        success: false,
        error: "Provide username1 and username2 in the request body",
      },
      { status: 400 },
    );
  }

  const selectedLanguages = normalizeSelectedLanguages(body.selectedLanguages);

  try {
    const users = await compareUsers(usernames, selectedLanguages);
    const winnerData = calculateWinner(users);
    return NextResponse.json({ success: true, users, ...winnerData });
  } catch (error: unknown) {
    console.error("GitHub score error:", error);
    const message =
      error instanceof Error && error.message === "User not found"
        ? "GitHub user not found"
        : "Failed to calculate score";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
