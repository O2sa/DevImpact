import { NextResponse } from "next/server";
import { calculateLeaderboard } from "@/lib/calculate-leaderboard";

export const runtime = "nodejs";

export async function POST(request: Request) {
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