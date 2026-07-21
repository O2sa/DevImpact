import { NextResponse } from "next/server";
import { calculateLeaderboard } from "@/lib/calculate-leaderboard";

export const runtime = "nodejs";

function isCalculateLeaderboardDisabled(): boolean {
  const raw =
    process.env.DISABLE_CALCULATE_LEADERBOARD_ENDPOINT?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}

export async function POST(request: Request) {
  if (isCalculateLeaderboardDisabled()) {
    return NextResponse.json(
      { success: false, error: "Not found" },
      { status: 404 },
    );
  }

  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country")?.trim();

  if (!country) {
    return NextResponse.json(
      { success: false, error: "Provide a country parameter" },
      { status: 400 },
    );
  }

  try {
    const result = await calculateLeaderboard(country);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to calculate leaderboard",
      },
      { status: 502 },
    );
  }
}
