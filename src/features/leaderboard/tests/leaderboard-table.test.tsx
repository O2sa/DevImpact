// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { LeaderboardTable } from "../components/leaderboard-table";

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock translations
vi.mock("@/components/providers/language-provider", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "leaderboard.title": "Leaderboard",
        "leaderboard.description": "Leaderboard description",
        "leaderboard.developer": "Developer",
        "leaderboard.impactRank": "Impact Rank",
        "leaderboard.search": "Search",
        "leaderboard.partialErrors": "Partial Errors",
        "comparison.final.score": "Final Score",
        "comparison.repo.score": "Repo Score",
        "comparison.pr.score": "PR Score",
        "comparison.contribution.score": "Contribution Score",
        "a11y.openProfile": "Open profile",
      };

      return translations[key] ?? key;
    },
  }),
}));

// Mock Avatar
vi.mock("@/components/layout/avatar", () => ({
  Avatar: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

// Mock Tooltip components
vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("LeaderboardTable sorting", () => {
  afterEach(() => {
    cleanup();
  });

  const users = [
    {
      username: "alice",
      name: "Alice",
      avatarUrl: "https://example.com/alice.png",
      impactRank: 1,
      finalScore: 80,
      repoScore: 30,
      prScore: 20,
      contributionScore: 40,
    },
    {
      username: "bob",
      name: "Bob",
      avatarUrl: "https://example.com/bob.png",
      impactRank: 2,
      finalScore: 90,
      repoScore: 90,
      prScore: 10,
      contributionScore: 30,
    },
    {
      username: "charlie",
      name: "Charlie",
      avatarUrl: "https://example.com/charlie.png",
      impactRank: 3,
      finalScore: 70,
      repoScore: 50,
      prScore: 80,
      contributionScore: 20,
    },
  ];

  const renderLeaderboard = () =>
    render(
      <LeaderboardTable
        users={users}
        failedUsers={[]}
        title="Global"
        totalFromSource={3}
        usersProcessed={3}
      />,
    );

  test("renders users in default Impact Rank order", () => {
    renderLeaderboard();

    const rows = screen.getAllByRole("row").slice(1);

    expect(rows[0].textContent).toContain("Alice");
    expect(rows[1].textContent).toContain("Bob");
    expect(rows[2].textContent).toContain("Charlie");
  });

  // Small helper so each test is one line of intent
  const displayedNames = () =>
    screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => row.textContent ?? "");

  const expectOrder = (names: string[]) => {
    const rows = displayedNames();
    names.forEach((name, i) => expect(rows[i]).toContain(name));
  };

  test("sorts users by Repo Score highest-first on first click", async () => {
    const user = userEvent.setup();
    renderLeaderboard();

    await user.click(screen.getByRole("button", { name: /repo score/i }));

    expectOrder(["Bob", "Charlie", "Alice"]); // 90, 50, 30
  });

  test("sorts users by Repo Score lowest-first on second click", async () => {
    const user = userEvent.setup();
    renderLeaderboard();

    const button = screen.getByRole("button", { name: /repo score/i });
    await user.click(button); // descending
    await user.click(button); // ascending

    expectOrder(["Alice", "Charlie", "Bob"]); // 30, 50, 90
  });

  test("sorts users by PR Score highest-first", async () => {
    const user = userEvent.setup();
    renderLeaderboard();

    await user.click(screen.getByRole("button", { name: /pr score/i }));

    expectOrder(["Charlie", "Alice", "Bob"]); // 80, 20, 10
  });

  test("sorts users by Final Score highest-first", async () => {
    const user = userEvent.setup();
    renderLeaderboard();

    await user.click(screen.getByRole("button", { name: /final score/i }));

    expectOrder(["Bob", "Alice", "Charlie"]); // 90, 80, 70
  });

  test("sorts users by Contribution Score highest-first", async () => {
    const user = userEvent.setup();
    renderLeaderboard();

    await user.click(screen.getByRole("button", { name: /contribution score/i }));

    expectOrder(["Alice", "Bob", "Charlie"]); // 40, 30, 20
  });

  test("reverses Impact Rank when its header is clicked", async () => {
    const user = userEvent.setup();
    renderLeaderboard();

    await user.click(screen.getByRole("button", { name: /impact rank/i }));

    expectOrder(["Charlie", "Bob", "Alice"]);
  });

  test("filters first, then sorts the filtered users", async () => {
    const user = userEvent.setup();
    renderLeaderboard();

    await user.type(screen.getByPlaceholderText("Search"), "li"); // Alice, Charlie
    await user.click(screen.getByRole("button", { name: /pr score/i }));

    const rows = displayedNames();
    expect(rows).toHaveLength(2);
    expectOrder(["Charlie", "Alice"]);
  });

  test("sets aria-sort correctly", async () => {
    const user = userEvent.setup();
    renderLeaderboard();

    const repoButton = screen.getByRole("button", { name: /repo score/i });
    const repoHeader = repoButton.closest("th");
    const rankHeader = screen.getByRole("button", { name: /impact rank/i }).closest("th");

    expect(rankHeader?.getAttribute("aria-sort")).toBe("ascending");
    expect(repoHeader?.getAttribute("aria-sort")).toBe("none");

    await user.click(repoButton);
    expect(repoHeader?.getAttribute("aria-sort")).toBe("descending");
    expect(rankHeader?.getAttribute("aria-sort")).toBe("none");

    await user.click(repoButton);
    expect(repoHeader?.getAttribute("aria-sort")).toBe("ascending");
  });
});
