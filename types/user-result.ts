export type UserResult = {
  username: string;
  name?: string;
  avatarUrl?: string;
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
    deletions?: number;
    additions?: number;
    url?: string;
  }[];
  isWinner?: boolean;
};
