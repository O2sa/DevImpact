export type CountryInfo = {
  slug: string;
  title: string;
  isoCode?: string;
  keywords?: string[];
};

export type ScoredLeaderboardEntry = {
  username: string;
  name: string | null;
  avatarUrl: string;
  repoScore: number;
  prScore: number;
  contributionScore: number;
  finalScore: number;
  impactRank: number;
};

export type LeaderboardResult = {
  title: string;
  totalFromSource: number;
  scored: ScoredLeaderboardEntry[];
  errors: string[];
};

export type LeaderboardMeta = {
  newUsers: number;
  refreshedUsers: number;
  skippedExisting: number;
  errors: number;
  totalInDb: number;
  failedUsernames?: string[];
  totalFetchTime?: number;
  successfulFetches?: number;
  userFetchErrors?: { username: string; errors: { part: string; reason: string }[] }[];
};

export type CalculateLeaderboardResponse = LeaderboardResult & {
  _meta: LeaderboardMeta;
};
