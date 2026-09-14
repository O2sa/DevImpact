import type { DiscussionNode, IssueNode, PullRequestNode, RepoNode } from "@/lib/github";
import type { ScoringExplanations, ScoringSignals } from "../types";
import { getTopLanguages, normalizeSelectedLanguages } from "./language-scoring";
import {
  BASE_SCORING_EXPLANATIONS,
  COMMUNITY_CAP_RATIO,
  LANGUAGE_SCORING_EXPLANATIONS,
  SCORE_NORMALIZATION_K,
  SCORING_WEIGHTS,
} from "./scoring-constants";
import {
  normalizeScore,
  resolveReferenceDate,
  roundScore,
  sanitizeNumber,
} from "./scoring-helpers";
import { calculateLanguageRepoScore, calculateRepoScore } from "./repo-scoring";
import { calculateLanguagePRScore, calculatePRScore } from "./pr-scoring";
import { calculateContributionScore } from "./community-scoring";

export * from "./scoring-constants";
export * from "./scoring-helpers";
export * from "./repo-scoring";
export * from "./pr-scoring";
export * from "./community-scoring";

export type TopRepo = {
  name: string;
  url?: string;
  stars: number;
  forks: number;
  watchers: number;
  score: number;
  topLanguages?: {
    name: string;
    percentage: number;
  }[];
};

export type TopPullRequest = {
  repo: string;
  title: string;
  url?: string;
  stars: number;
  score: number;
  additions: number;
  deletions: number;
  topLanguages?: {
    name: string;
    percentage: number;
  }[];
};

export type TopCommunityContribution = {
  type: "issue" | "discussion";
  title: string;
  url?: string;
  repo: string;
  stars: number;
  comments: number;
  score: number;
};

export type TopLanguageRepo = TopRepo & {
  languageMatch: number;
  topLanguages: {
    name: string;
    percentage: number;
  }[];
};

export type TopLanguagePullRequest = TopPullRequest & {
  languageMatch: number;
  topLanguages: {
    name: string;
    percentage: number;
  }[];
};

export type LanguageScores = {
  selectedLanguages: string[];
  repoScore: number;
  prScore: number;
  contributionScore: number;
  finalScore: number;
  normalizedRepoScore: number;
  normalizedPRScore: number;
  normalizedContributionScore: number;
  normalizedFinalScore: number;
  topRepos: TopLanguageRepo[];
  topPullRequests: TopLanguagePullRequest[];
};

export type CalculateUserScoreResult = {
  username: string;
  repoScore: number;
  prScore: number;
  contributionScore: number;
  finalScore: number;
  normalizedRepoScore: number;
  normalizedPRScore: number;
  normalizedContributionScore: number;
  normalizedFinalScore: number;
  scores: {
    repoScore: number;
    prScore: number;
    contributionScore: number;
    finalScore: number;
    normalizedRepoScore: number;
    normalizedPRScore: number;
    normalizedContributionScore: number;
    normalizedFinalScore: number;
  };
  topRepos: TopRepo[];
  topPullRequests: TopPullRequest[];
  topCommunityContributions: TopCommunityContribution[];
  languageScores?: LanguageScores;
  signals: ScoringSignals;
  explanations: ScoringExplanations;
};

export function calculateUserScore(
  data: {
    repos: RepoNode[];
    pullRequests: PullRequestNode[];
    issues?: IssueNode[];
    discussions?: DiscussionNode[];
    referenceDate?: string;
    selectedLanguages?: string[];
  },
  username: string,
): CalculateUserScoreResult {
  const selectedLanguages = normalizeSelectedLanguages(data.selectedLanguages);
  const hasSelectedLanguages = selectedLanguages.length > 0;

  const referenceDate = resolveReferenceDate({
    repos: data.repos,
    pullRequests: data.pullRequests,
    referenceDate: data.referenceDate,
  });

  const repoScore = calculateRepoScore(data.repos, referenceDate);
  const prScore = calculatePRScore(data.pullRequests, username, referenceDate);
  const communityScore = calculateContributionScore(
    data.issues ?? [],
    data.discussions ?? [],
    username,
  );

  let contributionScore = communityScore.total;
  contributionScore = Math.min(
    contributionScore,
    COMMUNITY_CAP_RATIO * (repoScore.total + prScore.total),
  );
  contributionScore = sanitizeNumber(contributionScore);

  const finalScore =
    repoScore.total * SCORING_WEIGHTS.repo +
    prScore.total * SCORING_WEIGHTS.pr +
    contributionScore * SCORING_WEIGHTS.contribution;

  const normalizedRepoScore = normalizeScore(repoScore.total, SCORE_NORMALIZATION_K.repo);
  const normalizedPRScore = normalizeScore(prScore.total, SCORE_NORMALIZATION_K.pr);
  const normalizedContributionScore = normalizeScore(
    contributionScore,
    SCORE_NORMALIZATION_K.contribution,
  );
  const normalizedFinalScore =
    normalizedRepoScore * SCORING_WEIGHTS.repo +
    normalizedPRScore * SCORING_WEIGHTS.pr +
    normalizedContributionScore * SCORING_WEIGHTS.contribution;

  let languageScores: LanguageScores | undefined;
  let languageRepoSignals: Pick<
    ScoringSignals,
    "reposWithLanguageData" | "averageRepoLanguageMatch"
  > = {};
  let languagePRSignals: Pick<ScoringSignals, "prsWithLanguageData" | "averagePRLanguageMatch"> =
    {};

  if (hasSelectedLanguages) {
    const languageRepoScore = calculateLanguageRepoScore(repoScore.details, selectedLanguages);
    const languagePRScore = calculateLanguagePRScore(prScore.details, selectedLanguages);

    let languageContributionScore = contributionScore;
    languageContributionScore = Math.min(
      languageContributionScore,
      COMMUNITY_CAP_RATIO * (languageRepoScore.total + languagePRScore.total),
    );
    languageContributionScore = sanitizeNumber(languageContributionScore);

    const languageFinalScore =
      languageRepoScore.total * SCORING_WEIGHTS.repo +
      languagePRScore.total * SCORING_WEIGHTS.pr +
      languageContributionScore * SCORING_WEIGHTS.contribution;

    const normalizedLanguageRepoScore = normalizeScore(
      languageRepoScore.total,
      SCORE_NORMALIZATION_K.repo,
    );
    const normalizedLanguagePRScore = normalizeScore(
      languagePRScore.total,
      SCORE_NORMALIZATION_K.pr,
    );
    const normalizedLanguageContributionScore = normalizeScore(
      languageContributionScore,
      SCORE_NORMALIZATION_K.contribution,
    );
    const normalizedLanguageFinalScore =
      normalizedLanguageRepoScore * SCORING_WEIGHTS.repo +
      normalizedLanguagePRScore * SCORING_WEIGHTS.pr +
      normalizedLanguageContributionScore * SCORING_WEIGHTS.contribution;

    languageScores = {
      selectedLanguages,
      repoScore: sanitizeNumber(languageRepoScore.total),
      prScore: sanitizeNumber(languagePRScore.total),
      contributionScore: languageContributionScore,
      finalScore: sanitizeNumber(languageFinalScore),
      normalizedRepoScore: sanitizeNumber(normalizedLanguageRepoScore),
      normalizedPRScore: sanitizeNumber(normalizedLanguagePRScore),
      normalizedContributionScore: sanitizeNumber(normalizedLanguageContributionScore),
      normalizedFinalScore: sanitizeNumber(normalizedLanguageFinalScore),
      topRepos: languageRepoScore.details.slice(0, 3).map((item) => ({
        name: item.repo.name,
        url: item.repo.url,
        stars: item.repo.stargazerCount,
        forks: item.repo.forkCount,
        watchers: item.repo.watchers.totalCount,
        score: roundScore(item.score),
        languageMatch: sanitizeNumber(item.languageMatch),
        topLanguages: getTopLanguages(item.repo.languages, 3),
      })),
      topPullRequests: languagePRScore.details.slice(0, 3).map((item) => ({
        repo: item.pr.repository.nameWithOwner,
        title: item.pr.title,
        url: item.pr.url,
        stars: item.pr.repository.stargazerCount,
        score: roundScore(item.score),
        additions: item.pr.additions,
        deletions: item.pr.deletions,
        languageMatch: sanitizeNumber(item.languageMatch),
        topLanguages: getTopLanguages(item.pr.repository.languages, 3),
      })),
    };

    languageRepoSignals = {
      reposWithLanguageData: languageRepoScore.reposWithLanguageData,
      averageRepoLanguageMatch: languageRepoScore.averageLanguageMatch,
    };

    languagePRSignals = {
      prsWithLanguageData: languagePRScore.prsWithLanguageData,
      averagePRLanguageMatch: languagePRScore.averageLanguageMatch,
    };
  }

  const explanations: ScoringExplanations = {
    ...BASE_SCORING_EXPLANATIONS,
    ...(hasSelectedLanguages ? { language: LANGUAGE_SCORING_EXPLANATIONS } : {}),
  };

  return {
    username,
    repoScore: sanitizeNumber(repoScore.total),
    prScore: sanitizeNumber(prScore.total),
    contributionScore,
    finalScore: sanitizeNumber(finalScore),
    normalizedRepoScore: sanitizeNumber(normalizedRepoScore),
    normalizedPRScore: sanitizeNumber(normalizedPRScore),
    normalizedContributionScore: sanitizeNumber(normalizedContributionScore),
    normalizedFinalScore: sanitizeNumber(normalizedFinalScore),
    scores: {
      repoScore: sanitizeNumber(repoScore.total),
      prScore: sanitizeNumber(prScore.total),
      contributionScore,
      finalScore: sanitizeNumber(finalScore),
      normalizedRepoScore: sanitizeNumber(normalizedRepoScore),
      normalizedPRScore: sanitizeNumber(normalizedPRScore),
      normalizedContributionScore: sanitizeNumber(normalizedContributionScore),
      normalizedFinalScore: sanitizeNumber(normalizedFinalScore),
    },
    topRepos: repoScore.details.slice(0, 3).map((item) => ({
      name: item.repo.name,
      url: item.repo.url,
      stars: item.repo.stargazerCount,
      forks: item.repo.forkCount,
      watchers: item.repo.watchers.totalCount,
      score: roundScore(item.score),
      topLanguages: getTopLanguages(item.repo.languages, 3),
    })),
    topPullRequests: prScore.details.slice(0, 3).map((item) => ({
      repo: item.pr.repository.nameWithOwner,
      title: item.pr.title,
      url: item.pr.url,
      stars: item.pr.repository.stargazerCount,
      score: roundScore(item.score),
      additions: item.pr.additions,
      deletions: item.pr.deletions,
      topLanguages: getTopLanguages(item.pr.repository.languages, 3),
    })),
    topCommunityContributions: communityScore.details.slice(0, 3).map((item) => ({
      type: item.type,
      title: item.item.title,
      url: item.item.url,
      repo: item.item.repository.nameWithOwner,
      stars: item.item.repository.stargazerCount,
      comments: item.item.comments.totalCount,
      score: roundScore(item.score),
    })),
    languageScores,
    signals: {
      reposAnalyzed: data.repos.length,
      pullRequestsAnalyzed: data.pullRequests.length,
      mergedExternalPRs: prScore.mergedExternalPRs,
      ownRepoPRsIgnored: prScore.ownRepoPRsIgnored,
      unmergedPRsIgnored: prScore.unmergedPRsIgnored,
      uniqueExternalPRRepos: prScore.uniqueExternalPRRepos,
      issuesAnalyzed: communityScore.issuesAnalyzed,
      externalIssuesCounted: communityScore.externalIssuesCounted,
      discussionsAnalyzed: communityScore.discussionsAnalyzed,
      externalDiscussionsCounted: communityScore.externalDiscussionsCounted,
      ...(hasSelectedLanguages ? { selectedLanguages } : {}),
      ...languageRepoSignals,
      ...languagePRSignals,
    },
    explanations,
  };
}
