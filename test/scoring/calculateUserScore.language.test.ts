import { describe, expect, test } from "vitest";

import { calculateUserScore } from "@/lib/score";
import { getLanguageFactor } from "@/lib/scoring/languageScoring";
import {
  makeContributions,
  makePullRequest,
  makeRepo,
  makeRepoLanguages,
  makeUserScoreInput,
} from "@/test/fixtures/github";

describe("calculateUserScore - language scoring", () => {
  test("languageScores is undefined when selectedLanguages is empty", () => {
    const result = calculateUserScore(
      makeUserScoreInput({
        repos: [makeRepo()],
        pullRequests: [],
        selectedLanguages: [],
      }),
      "octocat",
    );

    expect(result.languageScores).toBeUndefined();
  });

  test("languageScores exists when selectedLanguages is provided", () => {
    const result = calculateUserScore(
      makeUserScoreInput({
        repos: [makeRepo()],
        pullRequests: [],
        selectedLanguages: ["TypeScript"],
      }),
      "octocat",
    );

    expect(result.languageScores).toBeDefined();
    expect(result.languageScores?.selectedLanguages).toEqual(["typescript"]);
  });

  test("languageRepoScore equals normal repo score on full match", () => {
    const repo = makeRepo({
      languages: makeRepoLanguages([{ size: 1000, name: "TypeScript" }]),
    });
    const result = calculateUserScore(
      makeUserScoreInput({
        repos: [repo],
        pullRequests: [],
        selectedLanguages: ["TypeScript"],
      }),
      "octocat",
    );

    expect(result.languageScores?.repoScore).toBeCloseTo(result.repoScore, 10);
  });

  test("languageRepoScore is reduced on partial language match", () => {
    const repo = makeRepo({
      languages: makeRepoLanguages([
        { size: 700, name: "TypeScript" },
        { size: 300, name: "Go" },
      ]),
    });
    const result = calculateUserScore(
      makeUserScoreInput({
        repos: [repo],
        pullRequests: [],
        selectedLanguages: ["TypeScript"],
      }),
      "octocat",
    );

    expect(result.languageScores?.repoScore ?? 0).toBeLessThan(result.repoScore);
  });

  test("languageRepoScore uses minFactor when language does not match", () => {
    const repo = makeRepo({
      languages: makeRepoLanguages([{ size: 1000, name: "Rust" }]),
    });
    const result = calculateUserScore(
      makeUserScoreInput({
        repos: [repo],
        pullRequests: [],
        selectedLanguages: ["TypeScript"],
      }),
      "octocat",
    );

    expect(result.languageScores?.repoScore).toBeCloseTo(
      result.repoScore * getLanguageFactor(0),
      10,
    );
  });

  test("missing language data uses neutral factor", () => {
    const repo = makeRepo({
      languages: makeRepoLanguages([]),
    });
    const result = calculateUserScore(
      makeUserScoreInput({
        repos: [repo],
        pullRequests: [],
        selectedLanguages: ["TypeScript"],
      }),
      "octocat",
    );

    expect(result.languageScores?.repoScore).toBeCloseTo(
      result.repoScore * getLanguageFactor(0.5),
      10,
    );
  });

  test("topLanguageRepos includes languageMatch and topLanguages", () => {
    const repo = makeRepo({
      languages: makeRepoLanguages([
        { size: 700, name: "TypeScript" },
        { size: 300, name: "JavaScript" },
      ]),
    });
    const result = calculateUserScore(
      makeUserScoreInput({
        repos: [repo],
        pullRequests: [],
        selectedLanguages: ["TypeScript"],
      }),
      "octocat",
    );

    expect(result.languageScores?.topRepos[0].languageMatch).toBeCloseTo(0.7, 10);
    expect(result.languageScores?.topRepos[0].topLanguages).toEqual([
      { name: "TypeScript", percentage: 70 },
      { name: "JavaScript", percentage: 30 },
    ]);
  });

  test("languagePRScore equals normal PR score on full match", () => {
    const pr = makePullRequest({
      repository: {
        nameWithOwner: "external-owner/repo",
        stargazerCount: 50,
        owner: { login: "external-owner" },
        pushedAt: "2026-05-01T00:00:00.000Z",
        languages: makeRepoLanguages([{ size: 1000, name: "TypeScript" }]),
      },
    });
    const result = calculateUserScore(
      makeUserScoreInput({
        repos: [],
        pullRequests: [pr],
        selectedLanguages: ["TypeScript"],
      }),
      "octocat",
    );

    expect(result.languageScores?.prScore).toBeCloseTo(result.prScore, 10);
  });

  test("languagePRScore uses target repository language match", () => {
    const matching = makePullRequest({
      title: "matching",
      repository: {
        nameWithOwner: "external-owner/repo-a",
        stargazerCount: 50,
        owner: { login: "external-owner" },
        pushedAt: "2026-05-01T00:00:00.000Z",
        languages: makeRepoLanguages([{ size: 1000, name: "TypeScript" }]),
      },
    });
    const nonMatching = makePullRequest({
      title: "non-matching",
      repository: {
        nameWithOwner: "external-owner/repo-b",
        stargazerCount: 50,
        owner: { login: "external-owner" },
        pushedAt: "2026-05-01T00:00:00.000Z",
        languages: makeRepoLanguages([{ size: 1000, name: "Rust" }]),
      },
    });
    const result = calculateUserScore(
      makeUserScoreInput({
        repos: [],
        pullRequests: [matching, nonMatching],
        selectedLanguages: ["TypeScript"],
      }),
      "octocat",
    );

    expect(result.languageScores?.topPullRequests[0].title).toBe("matching");
  });

  test("own repo PRs and unmerged PRs remain ignored in language mode", () => {
    const ownRepoPr = makePullRequest({
      repository: {
        nameWithOwner: "octocat/repo",
        stargazerCount: 100,
        owner: { login: "octocat" },
        pushedAt: "2026-05-01T00:00:00.000Z",
        languages: makeRepoLanguages([{ size: 1000, name: "TypeScript" }]),
      },
    });
    const unmergedPr = makePullRequest({
      merged: false,
      repository: {
        nameWithOwner: "external-owner/repo",
        stargazerCount: 100,
        owner: { login: "external-owner" },
        pushedAt: "2026-05-01T00:00:00.000Z",
        languages: makeRepoLanguages([{ size: 1000, name: "TypeScript" }]),
      },
    });

    const result = calculateUserScore(
      makeUserScoreInput({
        repos: [],
        pullRequests: [ownRepoPr, unmergedPr],
        selectedLanguages: ["TypeScript"],
      }),
      "octocat",
    );

    expect(result.prScore).toBe(0);
    expect(result.languageScores?.prScore).toBe(0);
  });

  test("diminishing returns still apply after language adjustment", () => {
    const pr1 = makePullRequest({
      additions: 200,
      deletions: 50,
      repository: {
        nameWithOwner: "external-owner/repo",
        stargazerCount: 90,
        owner: { login: "external-owner" },
        pushedAt: "2026-05-01T00:00:00.000Z",
        languages: makeRepoLanguages([{ size: 1000, name: "TypeScript" }]),
      },
    });
    const pr2 = makePullRequest({
      additions: 100,
      deletions: 20,
      repository: {
        nameWithOwner: "external-owner/repo",
        stargazerCount: 90,
        owner: { login: "external-owner" },
        pushedAt: "2026-05-01T00:00:00.000Z",
        languages: makeRepoLanguages([{ size: 1000, name: "TypeScript" }]),
      },
    });
    const result = calculateUserScore(
      makeUserScoreInput({
        repos: [],
        pullRequests: [pr1, pr2],
        selectedLanguages: ["TypeScript"],
      }),
      "octocat",
    );

    const top = result.languageScores?.topPullRequests ?? [];
    expect(top).toHaveLength(2);
    expect((result.languageScores?.prScore ?? 0)).toBeLessThanOrEqual(result.prScore);
  });

  test("topLanguagePullRequests includes languageMatch and topLanguages", () => {
    const pr = makePullRequest({
      repository: {
        nameWithOwner: "external-owner/repo",
        stargazerCount: 50,
        owner: { login: "external-owner" },
        pushedAt: "2026-05-01T00:00:00.000Z",
        languages: makeRepoLanguages([
          { size: 800, name: "TypeScript" },
          { size: 200, name: "JavaScript" },
        ]),
      },
    });
    const result = calculateUserScore(
      makeUserScoreInput({
        repos: [],
        pullRequests: [pr],
        selectedLanguages: ["TypeScript"],
      }),
      "octocat",
    );

    expect(result.languageScores?.topPullRequests[0].languageMatch).toBeCloseTo(0.8, 10);
    expect(result.languageScores?.topPullRequests[0].topLanguages).toEqual([
      { name: "TypeScript", percentage: 80 },
      { name: "JavaScript", percentage: 20 },
    ]);
  });

  test("languageFinalScore uses 45/45/10 weights and never NaN", () => {
    const result = calculateUserScore(
      makeUserScoreInput({
        repos: [
          makeRepo({
            stargazerCount: 80,
            forkCount: 15,
            watchers: { totalCount: 8 },
            languages: makeRepoLanguages([{ size: 1000, name: "TypeScript" }]),
          }),
        ],
        pullRequests: [
          makePullRequest({
            additions: 160,
            deletions: 40,
            repository: {
              nameWithOwner: "external-owner/repo",
              stargazerCount: 70,
              owner: { login: "external-owner" },
              pushedAt: "2026-05-01T00:00:00.000Z",
              languages: makeRepoLanguages([{ size: 1000, name: "TypeScript" }]),
            },
          }),
        ],
        contributions: makeContributions(),
        selectedLanguages: ["TypeScript"],
      }),
      "octocat",
    );

    const languageScores = result.languageScores;
    expect(languageScores).toBeDefined();
    expect(languageScores?.finalScore).toBeCloseTo(
      (languageScores?.repoScore ?? 0) * 0.45 +
        (languageScores?.prScore ?? 0) * 0.45 +
        (languageScores?.contributionScore ?? 0) * 0.1,
      10,
    );
    expect(Number.isNaN(languageScores?.finalScore ?? 0)).toBe(false);
    expect(Number.isFinite(languageScores?.finalScore ?? 0)).toBe(true);
  });
});
