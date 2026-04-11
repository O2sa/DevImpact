import { NextResponse } from "next/server";
import { fetchGitHubUserData, RateLimitError } from "../../../lib/github";
import { calculateUserScore } from "../../../lib/score";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const usernames = searchParams.getAll("username");

  if (usernames.length === 0) {
    return NextResponse.json(
      { success: false, error: "provide at least one username param" },
      { status: 400 }
    );
  }

  try {
    const results = await Promise.all(
      usernames.map(async (username) => {
        const data = await fetchGitHubUserData(username);
        const score = calculateUserScore(data, username);

        return {
          username,
          repoScore: Math.round(score.repoScore),
          prScore: Math.round(score.prScore),
          contributionScore: Math.round(score.contributionScore),
          finalScore: Math.round(score.finalScore),
          topRepos: score.topRepos,
          topPullRequests: score.topPullRequests,
        };
      })
    );

    return NextResponse.json(
      { success: true, users: results },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } }
    );
  } catch (error: any) {
    console.error("GitHub score error:", error);

    if (error instanceof RateLimitError) {
      return NextResponse.json(
        {
          success: false,
          error: "GitHub API rate limit exceeded. Please try again later.",
          retryAfter: error.retryAfter,
        },
        {
          status: 429,
          headers: { "Retry-After": String(error.retryAfter) },
        }
      );
    }

    const message =
      error?.message === "User not found"
        ? "GitHub user not found"
        : "Failed to calculate score";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
