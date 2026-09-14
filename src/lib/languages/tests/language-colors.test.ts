import { describe, expect, it } from "vitest";
import { getLanguageColor, GITHUB_LANGUAGE_COLORS } from "../github-colors";

describe("GitHub Language Colors", () => {
  it("returns canonical GitHub colors for popular languages", () => {
    expect(getLanguageColor("TypeScript")).toBe("#3178c6");
    expect(getLanguageColor("JavaScript")).toBe("#f1e05a");
    expect(getLanguageColor("Python")).toBe("#3572A5");
    expect(getLanguageColor("Go")).toBe("#00ADD8");
    expect(getLanguageColor("Rust")).toBe("#dea584");
    expect(getLanguageColor("C++")).toBe("#f34b7d");
    expect(getLanguageColor("C#")).toBe("#178600");
    expect(getLanguageColor("HTML")).toBe("#e34c26");
    expect(getLanguageColor("CSS")).toBe("#563d7c");
    expect(getLanguageColor("Vue")).toBe("#41b883");
    expect(getLanguageColor("Svelte")).toBe("#ff3e00");
    expect(getLanguageColor("Kotlin")).toBe("#A97BFF");
    expect(getLanguageColor("Swift")).toBe("#F05138");
    expect(getLanguageColor("Ruby")).toBe("#701516");
    expect(getLanguageColor("PHP")).toBe("#4F5D95");
  });

  it("handles aliases and casing gracefully", () => {
    expect(getLanguageColor("ts")).toBe(GITHUB_LANGUAGE_COLORS.typescript);
    expect(getLanguageColor("js")).toBe(GITHUB_LANGUAGE_COLORS.javascript);
    expect(getLanguageColor("py")).toBe(GITHUB_LANGUAGE_COLORS.python);
    expect(getLanguageColor("golang")).toBe(GITHUB_LANGUAGE_COLORS.go);
    expect(getLanguageColor("rs")).toBe(GITHUB_LANGUAGE_COLORS.rust);
    expect(getLanguageColor("cpp")).toBe(GITHUB_LANGUAGE_COLORS["c++"]);
    expect(getLanguageColor("csharp")).toBe(GITHUB_LANGUAGE_COLORS["c#"]);
    expect(getLanguageColor("  TYPESCRIPT  ")).toBe("#3178c6");
  });

  it("produces deterministic fallback color for unknown languages", () => {
    const unknownColor1 = getLanguageColor("CustomObscureLang");
    const unknownColor2 = getLanguageColor("customobscurelang");
    expect(unknownColor1).toMatch(/^hsl\(\d+,\s*65%,\s*48%\)$/);
    expect(unknownColor1).toBe(unknownColor2);
  });

  it("handles empty or blank language strings", () => {
    expect(getLanguageColor("")).toBe("#8b949e");
    expect(getLanguageColor("   ")).toBe("#8b949e");
  });
});
