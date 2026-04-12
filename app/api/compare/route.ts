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
          name: data.name,
          avatarUrl: data.avatarUrl,
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
  } catch (error: unknown) {
    console.error("GitHub score error:", error);
    const message =
      error instanceof Error && error.message === "User not found"
        ? "GitHub user not found"
        : "Failed to calculate score";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
