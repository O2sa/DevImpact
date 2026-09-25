import { NextResponse } from "next/server";
import { getUserProfile } from "@/features/developer/services";
import { formatApiErrorResponse, parseSelectedLanguagesFromSearchParams } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const trimmed = username?.trim();

  if (!trimmed) {
    return NextResponse.json(
      { success: false, error: "Username parameter is required" },
      { status: 400 },
    );
  }

  const { searchParams } = new URL(request.url);
  const selectedLanguages = parseSelectedLanguagesFromSearchParams(searchParams);

  try {
    const { user, location } = await getUserProfile(trimmed, selectedLanguages);
    return NextResponse.json(
      { success: true, user, location },
      {
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error: unknown) {
    console.error("User profile fetch error:", error);
    return formatApiErrorResponse(error);
  }
}
