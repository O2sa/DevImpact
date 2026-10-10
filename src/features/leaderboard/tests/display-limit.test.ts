import { afterEach, describe, expect, test, vi } from "vitest";
import {
  DEFAULT_COUNTRY_DISPLAY_LIMIT,
  DEFAULT_WORLDWIDE_DISPLAY_LIMIT,
  getDisplayLimit,
  isWorldwideSlug,
} from "../services/display-limit";

describe("display limits", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("detects the worldwide slug case-insensitively", () => {
    expect(isWorldwideSlug("worldwide")).toBe(true);
    expect(isWorldwideSlug(" Worldwide ")).toBe(true);
    expect(isWorldwideSlug("egypt")).toBe(false);
  });

  test("uses WORLDWIDE_LEADERBOARD_DISPLAY_LIMIT for worldwide", () => {
    vi.stubEnv("WORLDWIDE_LEADERBOARD_DISPLAY_LIMIT", "250");
    vi.stubEnv("LEADERBOARD_DISPLAY_LIMIT", "10");
    expect(getDisplayLimit("worldwide")).toBe(250);
    expect(getDisplayLimit("egypt")).toBe(10);
  });

  test.each(["", "abc", "0", "-5", "12.5", "10abc"])(
    "falls back to the default when the worldwide value is %j",
    (value) => {
      vi.stubEnv("WORLDWIDE_LEADERBOARD_DISPLAY_LIMIT", value);
      expect(getDisplayLimit("worldwide")).toBe(DEFAULT_WORLDWIDE_DISPLAY_LIMIT);
    },
  );
  test("falls back to defaults when variables are unset", () => {
    vi.stubEnv("WORLDWIDE_LEADERBOARD_DISPLAY_LIMIT", "");
    vi.stubEnv("LEADERBOARD_DISPLAY_LIMIT", "");
    expect(getDisplayLimit("worldwide")).toBe(DEFAULT_WORLDWIDE_DISPLAY_LIMIT);
    expect(getDisplayLimit("egypt")).toBe(DEFAULT_COUNTRY_DISPLAY_LIMIT);
  });
});
