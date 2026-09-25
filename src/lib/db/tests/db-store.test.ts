import { beforeEach, describe, expect, test, vi } from "vitest";

const mockQuery = vi.fn();

vi.mock("pg", () => {
  class MockPool {
    query = mockQuery;
    on = vi.fn();
  }
  return {
    Pool: MockPool,
  };
});

// Set dummy DATABASE_URL so getPoolConfig does not throw
process.env.DATABASE_URL = "postgresql://dummy:dummy@localhost:5432/dummydb";

import { DatabaseStore } from "../db-store";

describe("DatabaseStore.getExistingUsernames", () => {
  let store: DatabaseStore;

  beforeEach(() => {
    vi.clearAllMocks();
    store = new DatabaseStore();
  });

  test("returns empty Set immediately when input array is empty without querying database", async () => {
    const result = await store.getExistingUsernames([]);
    expect(result.size).toBe(0);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test("returns empty Set when input contains only empty or whitespace strings", async () => {
    const result = await store.getExistingUsernames(["", "   "]);
    expect(result.size).toBe(0);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test("normalizes, deduplicates, and queries database with ANY($1::text[])", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ username: "alice" }, { username: "bob" }],
      rowCount: 2,
    });

    const result = await store.getExistingUsernames([" Alice ", "ALICE", "bob", "Charlie"]);

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [query, params] = mockQuery.mock.calls[0];
    expect(query).toContain(
      "SELECT LOWER(username) AS username FROM github_users WHERE LOWER(username) = ANY($1::text[])",
    );
    expect(params).toEqual([["alice", "bob", "charlie"]]);

    expect(result).toBeInstanceOf(Set);
    expect(result.has("alice")).toBe(true);
    expect(result.has("bob")).toBe(true);
    expect(result.has("charlie")).toBe(false);
  });
});
