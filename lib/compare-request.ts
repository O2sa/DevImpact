const MAX_SELECTED_LANGUAGES = 5;
export type ComparisonPresentationRequest = {
  user1: string;
  user2: string;
  selectedLanguages: string[];
  fetchKey: string;
};
type ComparisonUser = {
  username: string;
};
type ComparisonData<TUser extends ComparisonUser> = {
  user1: TUser;
  user2: TUser;
};
function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}
export function sanitizeSelectedLanguages(languages: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const language of languages) {
    const trimmed = language.trim();
    const normalized = trimmed.toLowerCase();
    if (!trimmed || seen.has(normalized)) {
      continue;
    }

    output.push(trimmed);
    seen.add(normalized);
    if (output.length >= MAX_SELECTED_LANGUAGES) {
      break;
    }
  }
  return output;
}
export function createComparisonRequest(
  user1: string,
  user2: string,
  selectedLanguages: string[],
): ComparisonPresentationRequest {
  const sanitizedLanguages = sanitizeSelectedLanguages(selectedLanguages);
  const canonicalUsers = [normalizeUsername(user1), normalizeUsername(user2)].sort();
  const canonicalLanguages = sanitizedLanguages.map((language) => language.toLowerCase()).sort();
  return {
    user1: user1.trim(),
    user2: user2.trim(),
    selectedLanguages: sanitizedLanguages,
    fetchKey: JSON.stringify({
      users: canonicalUsers,
      selectedLanguages: canonicalLanguages,
    }),
  };
}
export function createComparisonQuery(request: ComparisonPresentationRequest): string {
  const params = new URLSearchParams();
  params.append("username", request.user1);
  params.append("username", request.user2);
  for (const language of request.selectedLanguages) {
    params.append("selectedLanguage", language);
  }
  return params.toString();
}
export function isComparisonFetchDuplicate(
  currentFetchKey: string,
  lastFetchedKey: string | null,
  inFlightFetchKey: string | null,
  hasData: boolean,
): boolean {
  return lastFetchedKey === currentFetchKey && (hasData || inFlightFetchKey === currentFetchKey);
}
export function swapComparisonRequest(
  request: ComparisonPresentationRequest,
): ComparisonPresentationRequest {
  return createComparisonRequest(request.user2, request.user1, request.selectedLanguages);
}
export function reconcileComparisonData<
  TUser extends ComparisonUser,
  TData extends ComparisonData<TUser>,
>(
  data: TData,
  responseFetchKey: string,
  latestRequest: ComparisonPresentationRequest,
): TData | null {
  if (responseFetchKey !== latestRequest.fetchKey) {
    return null;
  }

  const users = [data.user1, data.user2];
  const firstUsername = normalizeUsername(latestRequest.user1);
  const secondUsername = normalizeUsername(latestRequest.user2);
  if (!firstUsername || !secondUsername || firstUsername === secondUsername) {
    return null;
  }

  const first = users.find((user) => normalizeUsername(user.username) === firstUsername);
  const second = users.find((user) => normalizeUsername(user.username) === secondUsername);
  if (!first || !second || first === second) {
    return null;
  }
  return {
    ...data,
    user1: first,
    user2: second,
  };
}
