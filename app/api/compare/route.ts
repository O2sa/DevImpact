import { NextResponse } from "next/server";
import { fetchGitHubUserData } from "../../../lib/github";
import { calculateUserScore } from "../../../lib/score";

export const runtime = "nodejs";

function classifyError(error: any): { message: string; status: number } {
  const msg = error?.message ?? "";

  if (msg === "User not found") {
    return { message: "GitHub user not found. Please check the username and try again.", status: 404 };
  }

  if (msg.includes("rate limit") || error?.status === 403) {
    return {
      message: "GitHub API rate limit exceeded. Please wait a few minutes and try again.",
      status: 429,
    };
  }

  if (msg.includes("Bad credentials") || error?.status === 401) {
    return { message: "GitHub API authentication error. Please contact the administrator.", status: 500 };
  }

  if (error?.code === "ENOTFOUND" || error?.code === "ETIMEDOUT") {
    return { message: "Unable to reach GitHub. Please check your connection and try again.", status: 503 };
  }

  return { message: "Something went wrong while fetching data. Please try again later.", status: 500 };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const usernames = searchParams.getAll("username");

  if (usernames.length === 0) {
    return NextResponse.json(
      { success: false, error: "Please provide at least one GitHub username." },
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
    const { message, status } = classifyError(error);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
