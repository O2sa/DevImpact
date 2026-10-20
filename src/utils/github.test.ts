import { describe, expect, test } from "vitest";
import { cleanGitHubUsername } from "./github";

describe("cleanGitHubUsername", () => {
  test.each([
    [" @octocat ", "octocat"],
    ["https://github.com/octocat/", "octocat"],
    ["github.com/torvalds", "torvalds"],
    ["octocat/", "octocat"],
    ["https://example.com/octocat", "https://example.com/octocat"],
  ])("cleans %j", (input, expected) => {
    expect(cleanGitHubUsername(input)).toBe(expected);
  });
});
