import { NextResponse } from "next/server";
import { getLeaderboardResult } from "@/lib/leaderboard";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country")?.trim();

  if (!country) {
    return NextResponse.json(
      { success: false, error: "Provide a country parameter" },
      { status: 400 },
    );
  }

  try {
    const result = await getLeaderboardResult(country);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("Leaderboard DB query failed:", err);

    return NextResponse.json({
      success: true,
      title: country,
      totalFromSource: 0,
      scored: [],
      errors: [],
    });
  }
}
