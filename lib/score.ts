import type {
  ContributionTotals,
  DiscussionNode,
  IssueNode,
  PullRequestNode,
  ReactionSummary,
  RepoNode,
} from "@/types/github";
import type {
  CommunityContributionDetail,
  PullRequestScoreDetail,
  RepoScoreDetail,
  ScoringExplanations,
  ScoringSignals,
} from "@/types/score";
import {
  getLanguageDistribution,
  getLanguageFactor,
  getLanguageMatch,
  getTopLanguages,
  normalizeSelectedLanguages,
} from "@/lib/scoring/languageScoring";

const MS_PER_DAY = 86_400_000;
const FALLBACK_REFERENCE_DATE = "2026-01-01T00:00:00.000Z";

export function safeLog(value: number): number {
  return Math.log(Math.max(0, value) + 1);
}

export function roundScore(value: number): number {
  return Number.isFinite(value) ? Math.round(value) : 0;
}

export function normalizeScore(score: number, k: number): number {
  const sanitizedScore = sanitizeNumber(score);
  const sanitizedK = Math.max(0, sanitizeNumber(k));
  const denominator = sanitizedScore + sanitizedK;

  if (denominator <= 0) {
    return 0;
  }

  return (100 * sanitizedScore) / denominator;
}

export function getDiminishingWeight(index: number): number {
  const safeIndex = Math.max(0, index);
  return 1 / (safeIndex + 1);
}

export function getRepoRankWeight(index: number): number {
  return index < 5 ? 1 : 0.1;
}

function sanitizeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function parseDate(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function resolveReferenceDate(data: {
  repos: RepoNode[];
  pullRequests: PullRequestNode[];
  referenceDate?: string;
}): Date {
  const timestamps: number[] = [];

  const explicitReference = parseDate(data.referenceDate);
  if (explicitReference) {
    timestamps.push(explicitReference.getTime());
  }

  for (const repo of data.repos) {
    const parsed = parseDate(repo.pushedAt);
    if (parsed) {
      timestamps.push(parsed.getTime());
    }
  }

  for (const pr of data.pullRequests) {
    const parsed = parseDate(pr.repository.pushedAt);
    if (parsed) {
      timestamps.push(parsed.getTime());
    }
  }

  if (timestamps.length === 0) {
    return new Date(FALLBACK_REFERENCE_DATE);
  }

  return new Date(Math.max(...timestamps));
}

function getDaysSince(dateValue: string, referenceDate: Date): number | null {
  const date = parseDate(dateValue);
  if (!date) {
    return null;
  }

  const diff = referenceDate.getTime() - date.getTime();
  return Math.max(0, diff / MS_PER_DAY);
}

function getRepoActivityFactor(
  pushedAt: string | undefined,
  referenceDate: Date,
): number {
  if (!pushedAt) {
    return 0.8;
  }

  const daysSincePush = getDaysSince(pushedAt, referenceDate);
  if (daysSincePush === null) {
    return 0.8;
  }

  if (daysSincePush <= 90) {
    return 1.2;
  }
  if (daysSincePush <= 365) {
    return 1.0;
  }
  if (daysSincePush <= 730) {
    return 0.7;
  }
  return 0.4;
}

function getPullRequestRepoActivityFactor(
  pushedAt: string | undefined,
  referenceDate: Date,
): number {
  if (!pushedAt) {
    return 0.9;
  }

  const daysSincePush = getDaysSince(pushedAt, referenceDate);
  if (daysSincePush === null) {
    return 0.9;
  }

  if (daysSincePush <= 90) {
    return 1.1;
  }
  if (daysSincePush <= 365) {
    return 1.0;
  }
  if (daysSincePush <= 730) {
    return 0.85;
  }
  return 0.7;
}

function calculateRepoScore(
  repos: RepoNode[],
  referenceDate: Date,
): { total: number; details: RepoScoreDetail[] } {
  const details = repos.map((repo) => {
    const baseRepoScore =
      safeLog(repo.stargazerCount) * 5 +
      safeLog(repo.forkCount) * 3 +
      safeLog(repo.watchers.totalCount) * 2;

    let score = baseRepoScore;

    if (repo.isFork === true) {
      score *= 0.2;
    }

    score *= getRepoActivityFactor(repo.pushedAt, referenceDate);

    return { repo, score: sanitizeNumber(score) };
  });

  details.sort((a, b) => b.score - a.score);

  const total = details.reduce((sum, { score }, index) => {
    return sum + score * getRepoRankWeight(index);
  }, 0);

  return { total: sanitizeNumber(total), details };
}

type PRScoreResult = {
  total: number;
  details: PullRequestScoreDetail[];
  mergedExternalPRs: number;
  ownRepoPRsIgnored: number;
  unmergedPRsIgnored: number;
  uniqueExternalPRRepos: number;
};

function calculatePRScore(
  prs: PullRequestNode[],
  username: string,
  referenceDate: Date,
): PRScoreResult {
  const grouped = new Map<string, PullRequestScoreDetail[]>();
  const normalizedUsername = username.toLowerCase();

  let mergedExternalPRs = 0;
  let ownRepoPRsIgnored = 0;
  let unmergedPRsIgnored = 0;

  for (const pr of prs) {
    const repoOwner = pr.repository.owner.login.toLowerCase();

    if (!pr.merged) {
      unmergedPRsIgnored += 1;
      continue;
    }

    if (repoOwner === normalizedUsername) {
      ownRepoPRsIgnored += 1;
      continue;
    }

    const changedLines = Math.max(0, pr.additions) + Math.max(0, pr.deletions);
    const base = safeLog(pr.repository.stargazerCount) * 2;
    const sizeFactor = Math.min(safeLog(changedLines), 5);

    let score = base * sizeFactor;

    if (changedLines < 5) {
      score *= 0.25;
    }

    if (changedLines > 5000) {
      score *= 0.6;
    }

    score *= getPullRequestRepoActivityFactor(pr.repository.pushedAt, referenceDate);
    score = sanitizeNumber(score);

    const repoKey = pr.repository.nameWithOwner;
    const existingScores = grouped.get(repoKey) ?? [];
    existingScores.push({ pr, score });
    grouped.set(repoKey, existingScores);
    mergedExternalPRs += 1;
  }

  let total = 0;
  const allDetails: PullRequestScoreDetail[] = [];

  for (const repoScores of grouped.values()) {
    repoScores.sort((a, b) => b.score - a.score);

    const repoTotal = repoScores.reduce((sum, item, index) => {
      return sum + item.score * getDiminishingWeight(index);
    }, 0);

    total += repoTotal;
    allDetails.push(...repoScores);
  }

  allDetails.sort((a, b) => b.score - a.score);

  return {
    total: sanitizeNumber(total),
    details: allDetails,
    mergedExternalPRs,
    ownRepoPRsIgnored,
    unmergedPRsIgnored,
    uniqueExternalPRRepos: grouped.size,
  };
}

function readReactionTotals(
  reactions?: ReactionSummary,
): { positive: number; neutral: number; negative: number } {
  if (!reactions) {
    return { positive: 0, neutral: 0, negative: 0 };
  }

  const positive =
    reactions.thumbsUp * 1 +
    reactions.heart * 1.2 +
    reactions.hooray * 1.2 +
    reactions.rocket * 1.3;
  const neutral = reactions.eyes * 0.4 + reactions.laugh * 0.2;
  const negative = reactions.thumbsDown * 1.5 + reactions.confused * 1;

  return {
    positive: sanitizeNumber(positive),
    neutral: sanitizeNumber(neutral),
    negative: sanitizeNumber(negative),
  };
}

function calculateCommunityItemScore(
  item: IssueNode | DiscussionNode,
): { score: number; reactionQuality: number; negativeRatio: number } {
  const repoStars = Math.max(0, item.repository.stargazerCount);
  const comments = Math.max(0, item.comments.totalCount);
  const { positive, neutral, negative } = readReactionTotals(item.reactions);

  const reactionQuality = Math.max(0, positive + neutral - negative);
  const reactionTotal = positive + neutral + negative;
  const negativeRatio = reactionTotal > 0 ? negative / reactionTotal : 0;

  let score =
    safeLog(repoStars) *
    safeLog(Math.max(0, comments + reactionQuality));

  if (comments === 0 && reactionQuality === 0) {
    score *= 0.2;
  }

  if (negativeRatio > 0.5) {
    score *= 0.2;
  } else if (negativeRatio > 0.3) {
    score *= 0.6;
  }

  return {
    score: sanitizeNumber(score),
    reactionQuality: sanitizeNumber(reactionQuality),
    negativeRatio: sanitizeNumber(negativeRatio),
  };
}

type CommunityScoreResult = {
  total: number;
  details: CommunityContributionDetail[];
  issuesAnalyzed: number;
  externalIssuesCounted: number;
  discussionsAnalyzed: number;
  externalDiscussionsCounted: number;
};

function calculateContributionScore(
  _contrib: ContributionTotals | undefined,
  issues: IssueNode[],
  discussions: DiscussionNode[],
  username: string,
): CommunityScoreResult {
  const normalizedUsername = username.toLowerCase();
  const details: CommunityContributionDetail[] = [];

  let externalIssuesCounted = 0;
  let externalDiscussionsCounted = 0;

  for (const issue of issues) {
    if (issue.repository.owner.login.toLowerCase() === normalizedUsername) {
      continue;
    }

    const { score } = calculateCommunityItemScore(issue);
    details.push({
      type: "issue",
      item: issue,
      score,
    });
    externalIssuesCounted += 1;
  }

  for (const discussion of discussions) {
    if (
      discussion.repository.owner.login.toLowerCase() === normalizedUsername
    ) {
      continue;
    }

    const { score } = calculateCommunityItemScore(discussion);
    details.push({
      type: "discussion",
      item: discussion,
      score,
    });
    externalDiscussionsCounted += 1;
  }

  details.sort((a, b) => b.score - a.score);

  const total = details.reduce((sum, detail, index) => {
    return sum + detail.score * getDiminishingWeight(index);
  }, 0);

  return {
    total: sanitizeNumber(total),
    details,
    issuesAnalyzed: issues.length,
    externalIssuesCounted,
    discussionsAnalyzed: discussions.length,
    externalDiscussionsCounted,
  };
}

function hasLanguageData(languages: RepoNode["languages"] | undefined): boolean {
  return Object.keys(getLanguageDistribution(languages)).length > 0;
}

function calculateLanguageRepoScore(
  repoDetails: RepoScoreDetail[],
  selectedLanguages: string[],
): {
  total: number;
  details: Array<{
    repo: RepoNode;
    score: number;
    languageMatch: number;
  }>;
  reposWithLanguageData: number;
  averageLanguageMatch: number;
} {
  const details = repoDetails.map((item) => {
    const languageMatch = getLanguageMatch(item.repo.languages, selectedLanguages);
    const languageFactor = getLanguageFactor(languageMatch);
    return {
      repo: item.repo,
      score: sanitizeNumber(item.score * languageFactor),
      languageMatch,
    };
  });

  details.sort((a, b) => b.score - a.score);

  const total = details.reduce((sum, detail, index) => {
    return sum + detail.score * getRepoRankWeight(index);
  }, 0);

  const reposWithLanguageData = details.reduce((count, detail) => {
    return count + (hasLanguageData(detail.repo.languages) ? 1 : 0);
  }, 0);

  const averageLanguageMatch =
    details.length > 0
      ? details.reduce((sum, detail) => sum + detail.languageMatch, 0) / details.length
      : 0;

  return {
    total: sanitizeNumber(total),
    details,
    reposWithLanguageData,
    averageLanguageMatch: sanitizeNumber(averageLanguageMatch),
  };
}

function calculateLanguagePRScore(
  prDetails: PullRequestScoreDetail[],
  selectedLanguages: string[],
): {
  total: number;
  details: Array<{
    pr: PullRequestNode;
    score: number;
    languageMatch: number;
  }>;
  prsWithLanguageData: number;
  averageLanguageMatch: number;
} {
  const grouped = new Map<
    string,
    Array<{ pr: PullRequestNode; score: number; languageMatch: number }>
  >();

  for (const item of prDetails) {
    const languageMatch = getLanguageMatch(
      item.pr.repository.languages,
      selectedLanguages,
    );
    const languageFactor = getLanguageFactor(languageMatch);
    const score = sanitizeNumber(item.score * languageFactor);
    const key = item.pr.repository.nameWithOwner;
    const current = grouped.get(key) ?? [];
    current.push({ pr: item.pr, score, languageMatch });
    grouped.set(key, current);
  }

  let total = 0;
  const details: Array<{ pr: PullRequestNode; score: number; languageMatch: number }> = [];

  for (const repoScores of grouped.values()) {
    repoScores.sort((a, b) => b.score - a.score);
    const repoTotal = repoScores.reduce((sum, item, index) => {
      return sum + item.score * getDiminishingWeight(index);
    }, 0);
    total += repoTotal;
    details.push(...repoScores);
  }

  details.sort((a, b) => b.score - a.score);

  const prsWithLanguageData = details.reduce((count, detail) => {
    return count + (hasLanguageData(detail.pr.repository.languages) ? 1 : 0);
  }, 0);

  const averageLanguageMatch =
    details.length > 0
      ? details.reduce((sum, detail) => sum + detail.languageMatch, 0) / details.length
      : 0;

  return {
    total: sanitizeNumber(total),
    details,
    prsWithLanguageData,
    averageLanguageMatch: sanitizeNumber(averageLanguageMatch),
  };
}

function calculateLanguageContributionScore(
  communityDetails: CommunityContributionDetail[],
  selectedLanguages: string[],
): number {
  const allHaveNoLanguageData = communityDetails.every(
    (detail) => !hasLanguageData(detail.item.repository.languages),
  );

  if (allHaveNoLanguageData) {
    return communityDetails.reduce((sum, detail, index) => {
      return sum + detail.score * getDiminishingWeight(index);
    }, 0);
  }

  const adjusted = communityDetails
    .map((detail) => {
      const languageMatch = getLanguageMatch(
        detail.item.repository.languages,
        selectedLanguages,
      );
      return sanitizeNumber(detail.score * getLanguageFactor(languageMatch));
    })
    .sort((a, b) => b - a);

  return adjusted.reduce((sum, score, index) => {
    return sum + score * getDiminishingWeight(index);
  }, 0);
}

type TopRepo = {
  name: string;
  url?: string;
  stars: number;
  forks: number;
  watchers: number;
  score: number;
};

type TopPullRequest = {
  repo: string;
  title: string;
  url?: string;
  stars: number;
  score: number;
  additions: number;
  deletions: number;
};

type TopCommunityContribution = {
  type: "issue" | "discussion";
  title: string;
  url?: string;
  repo: string;
  stars: number;
  comments: number;
  score: number;
};

type TopLanguageRepo = TopRepo & {
  languageMatch: number;
  topLanguages: {
    name: string;
    percentage: number;
  }[];
};

type TopLanguagePullRequest = TopPullRequest & {
  languageMatch: number;
  topLanguages: {
    name: string;
    percentage: number;
  }[];
};

type LanguageScores = {
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

const scoringExplanations: ScoringExplanations = {
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
    "Negative reactions reduce issue and discussion impact.",
    "Contribution score is capped so it cannot dominate the final score.",
  ],
  overall: [
    "Final score is weighted 45% repository impact, 45% pull request impact, and 10% community contribution impact.",
  ],
};

export function calculateUserScore(
  data: {
    repos: RepoNode[];
    pullRequests: PullRequestNode[];
    contributions?: ContributionTotals;
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
    data.contributions,
    data.issues ?? [],
    data.discussions ?? [],
    username,
  );

  let contributionScore = communityScore.total;
  contributionScore = Math.min(
    contributionScore,
    0.3 * (repoScore.total + prScore.total),
  );
  contributionScore = sanitizeNumber(contributionScore);

  const finalScore =
    repoScore.total * 0.45 + prScore.total * 0.45 + contributionScore * 0.1;

  const normalizedRepoScore = normalizeScore(repoScore.total, 100);
  const normalizedPRScore = normalizeScore(prScore.total, 300);
  const normalizedContributionScore = normalizeScore(contributionScore, 100);
  const normalizedFinalScore =
    normalizedRepoScore * 0.45 +
    normalizedPRScore * 0.45 +
    normalizedContributionScore * 0.1;

  let languageScores: LanguageScores | undefined;
  let languageRepoSignals: Pick<
    ScoringSignals,
    "reposWithLanguageData" | "averageRepoLanguageMatch"
  > = {};
  let languagePRSignals: Pick<
    ScoringSignals,
    "prsWithLanguageData" | "averagePRLanguageMatch"
  > = {};

  if (hasSelectedLanguages) {
    const languageRepoScore = calculateLanguageRepoScore(
      repoScore.details,
      selectedLanguages,
    );
    const languagePRScore = calculateLanguagePRScore(
      prScore.details,
      selectedLanguages,
    );

    let languageContributionScore = sanitizeNumber(
      calculateLanguageContributionScore(communityScore.details, selectedLanguages),
    );
    languageContributionScore = Math.min(
      languageContributionScore,
      0.3 * (languageRepoScore.total + languagePRScore.total),
    );
    languageContributionScore = sanitizeNumber(languageContributionScore);

    const languageFinalScore =
      languageRepoScore.total * 0.45 +
      languagePRScore.total * 0.45 +
      languageContributionScore * 0.1;

    const normalizedLanguageRepoScore = normalizeScore(languageRepoScore.total, 100);
    const normalizedLanguagePRScore = normalizeScore(languagePRScore.total, 300);
    const normalizedLanguageContributionScore = normalizeScore(
      languageContributionScore,
      100,
    );
    const normalizedLanguageFinalScore =
      normalizedLanguageRepoScore * 0.45 +
      normalizedLanguagePRScore * 0.45 +
      normalizedLanguageContributionScore * 0.1;

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
    ...scoringExplanations,
  };

  if (hasSelectedLanguages) {
    explanations.language = [
      "Language-focused score is optional and does not replace the overall score.",
      "Repository language match is calculated from GitHub repository language byte distribution.",
      "Pull request language match uses the target repository language distribution as an approximation.",
      "Non-matching repositories are softly reduced instead of fully ignored.",
      "Repositories with missing language data use a neutral language factor.",
      "Community contribution language matching uses repository language data when available.",
    ];
  }

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
    })),
    topPullRequests: prScore.details.slice(0, 3).map((item) => ({
      repo: item.pr.repository.nameWithOwner,
      title: item.pr.title,
      url: item.pr.url,
      stars: item.pr.repository.stargazerCount,
      score: roundScore(item.score),
      additions: item.pr.additions,
      deletions: item.pr.deletions,
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
