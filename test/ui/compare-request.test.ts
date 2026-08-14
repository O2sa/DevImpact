import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createComparisonQuery,
  createComparisonRequest,
  isComparisonFetchDuplicate,
  reconcileComparisonData,
  sanitizeSelectedLanguages,
  swapComparisonRequest,
} from "@/lib/compare-request";

function comparison(user1: string, user2: string) {
  return {
    user1: { username: user1, score: 1 },
    user2: { username: user2, score: 2 },
    marker: "preserved",
  };
}
describe("comparison request identity", () => {
  test("treats a username swap and language reordering as the same fetch", () => {
    const original = createComparisonRequest(" Alice ", "BOB", ["TypeScript", "Rust"]);
    const swapped = createComparisonRequest("bob", "alice", ["rust", "typescript"]);

    expect(swapped.fetchKey).toBe(original.fetchKey);
  });

  test("keeps true user and language changes distinct", () => {
    const original = createComparisonRequest("alice", "bob", ["TypeScript"]);

    expect(createComparisonRequest("alice", "carol", ["TypeScript"]).fetchKey).not.toBe(original.fetchKey);
    expect(createComparisonRequest("alice", "bob", ["Rust"]).fetchKey).not.toBe(original.fetchKey);
  });

  test("preserves ordered presentation and sanitized languages in the query", () => {
    const request = createComparisonRequest(" bob ", "alice", [
      " TypeScript ",
      "typescript",
      "Rust",
      "",
    ]);
    const params = new URLSearchParams(createComparisonQuery(request));

    expect(params.getAll("username")).toEqual(["bob", "alice"]);
    expect(params.getAll("selectedLanguage")).toEqual(["TypeScript", "Rust"]);
  });

  test("keeps sanitizer limits and case-insensitive deduplication", () => {
    expect(
      sanitizeSelectedLanguages([" A ", "a", "B", "C", "D", "E", "F"]),
    ).toEqual(["A", "B", "C", "D", "E"]);
  });

  test("two swaps restore the original presentation and identity", () => {
    const original = createComparisonRequest("alice", "bob", ["Go", "Rust"]);
    const restored = swapComparisonRequest(swapComparisonRequest(original));

    expect(restored).toEqual(original);
  });

  test("preserves duplicate-submit disabling for data and in-flight requests", () => {
    const original = createComparisonRequest("alice", "bob", ["Go"]);
    const swapped = swapComparisonRequest(original);

    expect(isComparisonFetchDuplicate(swapped.fetchKey, original.fetchKey, null, true)).toBe(
      true,
    );
    expect(isComparisonFetchDuplicate(swapped.fetchKey, original.fetchKey, original.fetchKey, false)).toBe(true);
    expect(isComparisonFetchDuplicate(swapped.fetchKey, null, null, false)).toBe(false);
  });
});

describe("comparison response reconciliation", () => {
  test("reorders history data to the latest presentation without refetching", () => {
    const original = createComparisonRequest("alice", "bob", ["Go"]);
    const history = createComparisonRequest("bob", "alice", ["Go"]);
    const data = comparison("alice", "bob");

    const nextData = reconcileComparisonData(data, original.fetchKey, history);
    const nextDisplayData = reconcileComparisonData(data, original.fetchKey, history);

    expect(nextData?.user1.username).toBe("bob");
    expect(nextData?.user2.username).toBe("alice");
    expect(nextDisplayData).toEqual(nextData);
    expect(nextData?.marker).toBe("preserved");
  });

  test("uses the latest presentation when a swap occurs in flight", () => {
    const started = createComparisonRequest("alice", "bob", ["Go"]);
    const latest = swapComparisonRequest(started);
    const response = comparison("alice", "bob");

    expect(reconcileComparisonData(response, started.fetchKey, latest)).toMatchObject({
      user1: { username: "bob" },
      user2: { username: "alice" },
    });
  });

  test("rejects a completion for a different latest canonical identity", () => {
    const started = createComparisonRequest("alice", "bob", ["Go"]);
    const latest = createComparisonRequest("alice", "carol", ["Go"]);

    expect(
      reconcileComparisonData(comparison("alice", "bob"), started.fetchKey, latest),
    ).toBeNull();
  });

  test("rejects malformed responses that cannot satisfy the latest order", () => {
    const latest = createComparisonRequest("alice", "bob", []);

    expect(
      reconcileComparisonData(comparison("alice", "carol"), latest.fetchKey, latest),
    ).toBeNull();
  });

  test("binds asynchronous completion to the latest presentation ref", () => {
    const source = readFileSync(
      resolve(process.cwd(), "components", "home-page-client.tsx"),
      "utf8",
    );

    expect(source).toMatch(
      /reconcileComparisonData\(\s*nextData,\s*fetchKey,\s*latestRequestRef\.current/,
    );
    expect(source).toMatch(/if \(!body\.success \|\| !users\) \{\s*if \(latestRequestRef\.current\.fetchKey !== fetchKey\)/);
    expect(source).toMatch(/const reset = \(\) => \{[\s\S]*?latestRequestRef\.current = createComparisonRequest\("", "", \[\]\)/);
    expect(source).toMatch(/if \(!res\.ok\) \{\s*if \(latestRequestRef\.current\.fetchKey !== fetchKey\)/);
    expect(source).toMatch(/catch \(err: unknown\) \{\s*if \(latestRequestRef\.current\.fetchKey !== fetchKey\)/);
    expect(source).toMatch(/applyApiError\(latestRequestRef\.current\.user1, latestRequestRef\.current\.user2, body\)/);
    expect(source).toMatch(/if \(!reconciled\) \{\s*if \(latestRequestRef\.current\.fetchKey === fetchKey\) \{\s*setData\(null\);\s*setGeneralError\(t\("error\.generic"\)\)/);
  });
});
