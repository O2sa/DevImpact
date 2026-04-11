import { NextResponse } from "next/server";
import { fetchGitHubUserData } from "../../../lib/github";
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

    return NextResponse.json({ success: true, users: results });
  } catch (error: any) {
    console.error("GitHub score error:", error);

    let message = "Something went wrong. Please try again later.";
    let status = 500;

    const msg = error?.message ?? "";
    if (msg === "User not found") {
      message =
        "One or more GitHub users could not be found. Please check the usernames and try again.";
      status = 404;
    } else if (
      msg.includes("rate limit") ||
      msg.includes("API rate limit") ||
      error?.status === 403
    ) {
      message =
        "GitHub API rate limit exceeded. Please wait a few minutes and try again.";
      status = 429;
    } else if (
      msg.includes("ENOTFOUND") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("fetch failed")
    ) {
      message =
        "Unable to reach GitHub. Please check your internet connection and try again.";
      status = 503;
    }

    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}
