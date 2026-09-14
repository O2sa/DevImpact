import type { ScoringExplanations } from "../types";

export const SCORING_WEIGHTS = {
  repo: 0.45,
  pr: 0.45,
  contribution: 0.1,
} as const;

export const SCORE_NORMALIZATION_K = {
  repo: 100,
  pr: 300,
  contribution: 100,
} as const;

export const COMMUNITY_CAP_RATIO = 0.3;
export const MS_PER_DAY = 86_400_000;
export const FALLBACK_REFERENCE_DATE = "2026-01-01T00:00:00.000Z";

export const BASE_SCORING_EXPLANATIONS: ScoringExplanations = {
  repo: [
    "Repository score is based on stars, forks, watchers, and activity.",
    "Forked repositories are heavily reduced.",
    "Top repositories contribute most to the repository score.",
  ],
  pr: [
    "Only merged pull requests are counted.",
    "Pull requests to the user's own repositories are ignored.",
    "Repeated pull requests to the same repository use diminishing returns.",
    "Tiny PRs and huge generated PRs are reduced.",
  ],
  contribution: [
    "Contribution score is based on external issues and discussions only.",
    "Commits and pull requests are excluded to avoid double-counting.",
    "Issue and discussion impact is based on repository visibility and discussion activity.",
    "Contribution score is capped so it cannot dominate the final score.",
  ],
  overall: [
    "Final score is weighted 45% repository impact, 45% pull request impact, and 10% community contribution impact.",
  ],
};

export const LANGUAGE_SCORING_EXPLANATIONS: string[] = [
  "Language-focused score is optional and does not replace the overall score.",
  "Repository language match is calculated from GitHub repository language byte distribution.",
  "Pull request language match uses the target repository language distribution as an approximation.",
  "Non-matching repositories are softly reduced instead of fully ignored.",
  "Repositories with missing language data use a neutral language factor.",
  "Language matching is applied to repositories and pull requests only.",
];
