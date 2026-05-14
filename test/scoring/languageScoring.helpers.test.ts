import { describe, expect, test } from "vitest";
import {
  getLanguageDistribution,
  getLanguageFactor,
  getLanguageMatch,
  getTopLanguages,
  normalizeSelectedLanguages,
} from "@/lib/scoring/languageScoring";
import { makeRepoLanguages } from "@/test/fixtures/github";

describe("language scoring helpers", () => {
  test("normalizeSelectedLanguages removes duplicates, trims, and lowercases", () => {
    const normalized = normalizeSelectedLanguages([
      " TypeScript ",
      "typescript",
      "JAVASCRIPT",
      " ",
      "Python",
      "Go",
      "Rust",
      "Java",
    ]);

    expect(normalized).toEqual(["typescript", "javascript", "python", "go", "rust"]);
  });

  test("getLanguageDistribution returns percentages", () => {
    const distribution = getLanguageDistribution(
      makeRepoLanguages([
        { size: 700, name: "TypeScript" },
        { size: 200, name: "CSS" },
        { size: 100, name: "JavaScript" },
      ]),
    );

    expect(distribution.typescript).toBeCloseTo(0.7, 10);
    expect(distribution.css).toBeCloseTo(0.2, 10);
    expect(distribution.javascript).toBeCloseTo(0.1, 10);
  });

  test("getLanguageMatch returns the selected-language sum", () => {
    const match = getLanguageMatch(
      makeRepoLanguages([
        { size: 700, name: "TypeScript" },
        { size: 200, name: "CSS" },
        { size: 100, name: "JavaScript" },
      ]),
      ["typescript", "javascript"],
    );

    expect(match).toBeCloseTo(0.8, 10);
  });

  test("getLanguageMatch returns 1 when selected languages are empty", () => {
    expect(getLanguageMatch(undefined, [])).toBe(1);
  });

  test("getLanguageMatch returns 0 when repo language data is missing", () => {
    expect(getLanguageMatch(undefined, ["typescript"])).toBe(0);
    expect(getLanguageMatch(makeRepoLanguages([]), ["typescript"])).toBe(0);
  });

  test("getLanguageFactor applies soft penalty", () => {
    expect(getLanguageFactor(1)).toBeCloseTo(1, 10);
    expect(getLanguageFactor(0.7)).toBeCloseTo(0.775, 10);
    expect(getLanguageFactor(0.3)).toBeCloseTo(0.475, 10);
    expect(getLanguageFactor(0)).toBeCloseTo(0.25, 10);
  });

  test("getTopLanguages returns sorted rounded percentages", () => {
    const top = getTopLanguages(
      makeRepoLanguages([
        { size: 700, name: "TypeScript" },
        { size: 200, name: "CSS" },
        { size: 100, name: "JavaScript" },
      ]),
    );

    expect(top).toEqual([
      { name: "TypeScript", percentage: 70 },
      { name: "CSS", percentage: 20 },
      { name: "JavaScript", percentage: 10 },
    ]);
  });
});
