import { PullRequestNode, RepoNode } from "./github";

export type RepoScoreDetail = {
  repo: RepoNode;
  score: number;
};

export type PullRequestScoreDetail = {
  pr: PullRequestNode;
  score: number;
};
