import { NextResponse } from "next/server";
import { fetchGitHubUserData } from "@/lib/github";
import { calculateUserScore } from "@/lib/score";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const usernames = searchParams.getAll("username").map((u) => u.trim()).filter(Boolean);

  if (usernames.length === 0) {
    return NextResponse.json(
      { success: false, error: "Provide at least one username" },
      { status: 400 },
    );
  }

  if (usernames.length > 256) {
    return NextResponse.json(
      { success: false, error: "Maximum 256 usernames per request" },
      { status: 400 },
    );
  }

  const scored: Array<{
    username: string;
    name: string | null;
    avatarUrl: string;
    repoScore: number;
    prScore: number;
    contributionScore: number;
    finalScore: number;
  }> = [];

  const errors: string[] = [];

  for (const username of usernames) {
    try {
      const data = await fetchGitHubUserData(username);
      const score = calculateUserScore(data, username);
      scored.push({
        username,
        name: data.name,
        avatarUrl: data.avatarUrl,
        repoScore: Math.round(score.repoScore),
        prScore: Math.round(score.prScore),
        contributionScore: Math.round(score.contributionScore),
        finalScore: Math.round(score.finalScore),
      });
    } catch {
      errors.push(username);
    }
  }

  return NextResponse.json({ success: true, scored, errors });
}
