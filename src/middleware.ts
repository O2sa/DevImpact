import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isSupportedLocale,
  parseAcceptLanguage,
  supportedLocales,
} from "@/lib/i18n/core";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass APIs, metadata files, and static assets
  if (
    pathname.startsWith("/api") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/favicon.ico" ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Check if pathname already starts with a supported locale (e.g. /en or /ar)
  const pathnameLocale = supportedLocales.find(
    (loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`),
  );

  // If already localized, pass through
  if (pathnameLocale) {
    return NextResponse.next();
  }

  // Determine target locale from cookie, then accept-language, then default
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const hasValidCookie = isSupportedLocale(cookieLocale);
  const locale = hasValidCookie
    ? cookieLocale
    : parseAcceptLanguage(request.headers.get("accept-language"), supportedLocales, DEFAULT_LOCALE);

  // Rewrite /path to /[locale]/path transparently
  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;

  const response = NextResponse.rewrite(rewriteUrl);

  // If cookie wasn't set or was invalid, set it now for persistence
  if (!hasValidCookie) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
}

// Run only on routes that produce HTML or read the cookie. Skip Next.js
// internals, the optimized image endpoint, public static assets, and API
// routes — they don't need a locale cookie and we want their responses
// to stay cacheable.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2|ttf|otf|webmanifest)$).*)",
  ],
};
