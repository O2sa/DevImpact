export interface BaseDeveloper {
  username: string;
  name: string | null;
  avatarUrl: string;
  location?: string | null;
}

export interface BaseRepository {
  name: string;
  owner: string;
  url: string;
  stargazerCount?: number;
  forkCount?: number;
  primaryLanguage?: string | null;
}
