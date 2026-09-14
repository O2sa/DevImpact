import { NextResponse } from "next/server";
import {
  calculateWinner,
  compareUsers,
  createComparisonInsights,
  resolveLocale,
} from "@/features/comparison/services";
import { formatApiErrorResponse, parseSelectedLanguagesFromSearchParams } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const usernames = searchParams
    .getAll("username")
    .map((username) => username.trim())
    .filter(Boolean);

  if (usernames.length !== 2) {
    return NextResponse.json(
      { success: false, error: "provide exactly two username params" },
      { status: 400 },
    );
  }

  try {
    const locale = resolveLocale(request);
    const selectedLanguages = parseSelectedLanguagesFromSearchParams(searchParams);
    const users = await compareUsers(usernames, selectedLanguages);
    const winnerData = calculateWinner(users);
    const insights = createComparisonInsights(users, locale);
    return NextResponse.json({ success: true, users, ...winnerData, insights });
  } catch (error: unknown) {
    console.error("GitHub score error:", error);
    return formatApiErrorResponse(error);
  }
}
