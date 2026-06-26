import { describe, expect, test } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/seo";

function makeEnv(values: Record<string, string>): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "test",
    ...values,
  };
}

describe("seo helpers", () => {
  test("getSiteUrl uses NEXT_PUBLIC_SITE_URL when valid", () => {
    const result = getSiteUrl(makeEnv({
      NEXT_PUBLIC_SITE_URL: "https://devimpact.example.com/",
    }));

    expect(result).toBe("https://devimpact.example.com");
  });

  test("getSiteUrl falls back when url is invalid", () => {
    const result = getSiteUrl(makeEnv({
      NEXT_PUBLIC_SITE_URL: "invalid-url",
    }));

    expect(result).toBe("http://localhost:3000");
  });

  test("toAbsoluteUrl builds absolute path", () => {
    const result = toAbsoluteUrl("/scoring-methodology", makeEnv({
      NEXT_PUBLIC_SITE_URL: "https://devimpact.example.com",
    }));

    expect(result).toBe("https://devimpact.example.com/scoring-methodology");
  });
});

describe("seo routes", () => {
  test("robots includes sitemap url", () => {
    const result = robots();
    expect(result.sitemap).toContain("/sitemap.xml");
  });

  test("sitemap includes key public pages", async () => {
    const result = await sitemap();
    const urls = result.map((entry) => entry.url);

    expect(urls).toContain("http://localhost:3000/");
    expect(urls).toContain("http://localhost:3000/scoring-methodology");
  });
});
