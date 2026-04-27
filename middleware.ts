import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isSupportedLocale,
  parseAcceptLanguage,
  supportedLocales,
} from "./lib/i18n-core";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;

  if (!isSupportedLocale(cookieLocale)) {
    const locale = parseAcceptLanguage(
      request.headers.get("accept-language"),
      supportedLocales,
      DEFAULT_LOCALE
    );

    response.cookies.set(LOCALE_COOKIE, locale, { path: "/" });
  }

  return response;
}

// Run only on routes that produce HTML or read the cookie. Skip Next.js
// internals, the optimized image endpoint, public static assets, and API
// routes — they don't need a locale cookie and we want their responses
// to stay cacheable.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2|ttf|otf)$).*)",
  ],
};
