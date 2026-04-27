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
