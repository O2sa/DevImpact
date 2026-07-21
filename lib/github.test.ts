import "dotenv/config";


import {describe, expect, it} from "vitest";
import {parseCountEnv} from "./github";


describe("parseCountEnv", () => {
  it("uses fallback for undefined", () => {
    expect(parseCountEnv(undefined, 30, 100)).toBe(30);
  });

  it("parses a valid value", () => {
    expect(parseCountEnv("50", 30, 100)).toBe(50);
  });

  it("uses fallback for non-numeric input", () => {
    expect(parseCountEnv("abc", 30, 100)).toBe(30);
  });

  it("uses fallback for zero", () => {
    expect(parseCountEnv("0", 30, 100)).toBe(30);
  });

  it("uses fallback for negative values", () => {
    expect(parseCountEnv("-5", 30, 100)).toBe(30);
  });

  it("clamps values above the maximum", () => {
    expect(parseCountEnv("500", 30, 100)).toBe(100);
  });
});