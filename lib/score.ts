import type {
  ContributionTotals,
  PullRequestNode,
  RepoNode,
} from "@/types/github";
import { PullRequestScoreDetail, RepoScoreDetail } from "@/types/score";

const LOG = Math.log;



function calculateRepoScore(
  repos: RepoNode[]
): { total: number; details: RepoScoreDetail[] } {
  const details = repos.map((repo) => {

    const score = LOG(repo.stargazerCount + 1) * 5 +
      LOG(repo.forkCount + 1) * 3 +
      LOG(repo.watchers.totalCount + 1) * 2
    return { repo, score: Math.round(score) };
  });

  details.sort((a, b) => b.score - a.score);

  const total = details.reduce((sum, { score }, index) => {
    const weight = index < 5 ? 1 : 0.1;
    return sum + score * weight;
  }, 0);

  return { total, details };
}

function calculatePRScore(
  prs: PullRequestNode[],
  username: string
): { total: number; details: PullRequestScoreDetail[] } {
  const grouped: Record<string, PullRequestScoreDetail[]> = {};

  for (const pr of prs) {
    const repoOwner = pr.repository.owner.login.toLowerCase();
    if (repoOwner === username.toLowerCase()) continue; // ignore own repos
    if (!pr.merged) continue; // only merged PRs

    const base = LOG(pr.repository.stargazerCount + 1) * 2;
    const sizeFactor = LOG(pr.additions + pr.deletions + 1);
    const score = base * sizeFactor;

    const repoKey = pr.repository.nameWithOwner;
    grouped[repoKey] ||= [];
    grouped[repoKey].push({ pr, score: Math.round(score) });
  }

  let total = 0;
  const allDetails: PullRequestScoreDetail[] = [];

  for (const repoScores of Object.values(grouped)) {
    repoScores.sort((a, b) => b.score - a.score);
    const repoTotal = repoScores.reduce(
      (sum, item, i) => sum + item.score * (1 / (i + 1)),
      0
    );
    total += repoTotal;
    allDetails.push(...repoScores);
  }

  allDetails.sort((a, b) => b.score - a.score);

  return { total, details: allDetails };
}

function calculateContributionScore(contrib: ContributionTotals): number {
  return (
    contrib.totalCommitContributions * 0.5 +
    contrib.totalPullRequestContributions * 2 +
    contrib.totalIssueContributions * 0.3
  );
}

export function calculateUserScore(
  data: {
    repos: RepoNode[];
    pullRequests: PullRequestNode[];
    contributions: ContributionTotals;
  },
  username: string
): {
  repoScore: number;
  prScore: number;
  contributionScore: number;
  finalScore: number;
  topRepos: { name: string; stars: number; forks: number; score: number }[];
  topPullRequests: { repo: string; title: string; url: string; stars: number; score: number }[];
} {
  const repoScore = calculateRepoScore(data.repos);
  const prScore = calculatePRScore(data.pullRequests, username);
  let contributionScore = calculateContributionScore(data.contributions);
  contributionScore = Math.min(contributionScore, 0.3 * (repoScore.total + prScore.total))


  const finalScore =
    repoScore.total * 0.4 + prScore.total * 0.4 + contributionScore * 0.2;

  return {
    repoScore: repoScore.total,
    prScore: prScore.total,
    contributionScore,
    finalScore,
    topRepos: repoScore.details.slice(0, 3).map((item) => ({
      name: item.repo.name,
      stars: item.repo.stargazerCount,
      forks: item.repo.forkCount,
      score: item.score,
      watchers: item.repo.watchers.totalCount,
    })),
    topPullRequests: prScore.details.slice(0, 3).map((item) => ({
      repo: item.pr.repository.nameWithOwner,
      title: item.pr.title,
      url: item.pr.url,
      stars: item.pr.repository.stargazerCount,
      score: item.score,
      additions: item.pr.additions,
      deletions: item.pr.deletions,
    })),
  };
}
