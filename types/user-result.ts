export type UserResult = {
  username: string;
  repoScore: number;
  prScore: number;
  contributionScore: number;
  finalScore: number;
  topRepos: {
    name?: string;
    stars?: number;
    forks?: number;
    watchers?: number;
    score?: number;
  }[];
  topPullRequests: {
    repo?: string;
    stars?: number;
    score?: number;
    title?: string;
    url?: string;
    deletions?: number;
    additions?: number;
  }[];
  isWinner?: boolean;
};
