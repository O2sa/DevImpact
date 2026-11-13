import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { LOCALE_COOKIE } from "@/lib/i18n/core";

describe("middleware transparent locale rewrite", () => {
  it("rewrites / to /[defaultLocale] and sets cookie when no cookie exists", () => {
    const req = new NextRequest("http://localhost:3000/");
    const res = middleware(req);

    expect(res.headers.get("x-middleware-rewrite")).toBe("http://localhost:3000/en");
    expect(res.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("rewrites /leaderboard to /ar/leaderboard when app-locale cookie is ar", () => {
    const req = new NextRequest("http://localhost:3000/leaderboard", {
      headers: {
        cookie: `${LOCALE_COOKIE}=ar`,
      },
    });
    const res = middleware(req);

    expect(res.headers.get("x-middleware-rewrite")).toBe("http://localhost:3000/ar/leaderboard");
  });

  it("rewrites / based on Accept-Language when no cookie exists", () => {
    const req = new NextRequest("http://localhost:3000/scoring-methodology", {
      headers: {
        "accept-language": "ar-SA,ar;q=0.9,en;q=0.8",
      },
    });
    const res = middleware(req);

    expect(res.headers.get("x-middleware-rewrite")).toBe(
      "http://localhost:3000/ar/scoring-methodology",
    );
    expect(res.cookies.get(LOCALE_COOKIE)?.value).toBe("ar");
  });

  it("passes through without rewrite if path already starts with supported locale", () => {
    const req = new NextRequest("http://localhost:3000/ar/leaderboard");
    const res = middleware(req);

    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("passes through without rewrite for manifest.webmanifest and metadata files", () => {
    const manifestReq = new NextRequest("http://localhost:3000/manifest.webmanifest");
    expect(middleware(manifestReq).headers.get("x-middleware-rewrite")).toBeNull();

    const robotsReq = new NextRequest("http://localhost:3000/robots.txt");
    expect(middleware(robotsReq).headers.get("x-middleware-rewrite")).toBeNull();

    const sitemapReq = new NextRequest("http://localhost:3000/sitemap.xml");
    expect(middleware(sitemapReq).headers.get("x-middleware-rewrite")).toBeNull();

    const faviconReq = new NextRequest("http://localhost:3000/favicon.ico");
    expect(middleware(faviconReq).headers.get("x-middleware-rewrite")).toBeNull();
  });
});
