import { NextResponse } from "next/server";
import { getLeaderboardResult } from "@/features/leaderboard/services";

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
    return NextResponse.json(
      { success: true, ...result },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
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
