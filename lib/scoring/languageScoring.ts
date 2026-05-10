import type { RepoLanguages } from "@/types/github";

const MAX_SELECTED_LANGUAGES = 5;

export function normalizeLanguageName(language: string): string {
  return language.trim().toLowerCase();
}

export function normalizeSelectedLanguages(languages?: string[]): string[] {
  if (!languages || languages.length === 0) {
    return [];
  }

  const unique: string[] = [];
  const seen = new Set<string>();

  for (const language of languages) {
    const normalized = normalizeLanguageName(language);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    unique.push(normalized);
    seen.add(normalized);

    if (unique.length >= MAX_SELECTED_LANGUAGES) {
      break;
    }
  }

  return unique;
}

export function getLanguageDistribution(
  languages?: RepoLanguages,
): Record<string, number> {
  const edges = languages?.edges ?? [];
  if (edges.length === 0) {
    return {};
  }

  let totalSize = 0;
  for (const edge of edges) {
    totalSize += Math.max(0, edge.size);
  }

  if (totalSize <= 0) {
    return {};
  }

  const distribution: Record<string, number> = {};
  for (const edge of edges) {
    const normalizedName = normalizeLanguageName(edge.node.name);
    if (!normalizedName) {
      continue;
    }
    const ratio = Math.max(0, edge.size) / totalSize;
    distribution[normalizedName] = (distribution[normalizedName] ?? 0) + ratio;
  }

  return distribution;
}

export function getLanguageMatch(
  languages: RepoLanguages | undefined,
  selectedLanguages: string[],
): number {
  if (selectedLanguages.length === 0) {
    return 1;
  }

  const distribution = getLanguageDistribution(languages);
  const distributionKeys = Object.keys(distribution);
  if (distributionKeys.length === 0) {
    return 0.5;
  }

  let match = 0;
  for (const selectedLanguage of selectedLanguages) {
    match += distribution[selectedLanguage] ?? 0;
  }

  return Math.max(0, Math.min(1, match));
}

export function getLanguageFactor(
  languageMatch: number,
  minFactor = 0.25,
): number {
  const boundedMatch = Math.max(0, Math.min(1, languageMatch));
  const boundedMinFactor = Math.max(0, Math.min(1, minFactor));
  return boundedMinFactor + (1 - boundedMinFactor) * boundedMatch;
}

export function getTopLanguages(
  languages?: RepoLanguages,
  limit = 3,
): { name: string; percentage: number }[] {
  const edges = [...(languages?.edges ?? [])]
    .map((edge) => ({
      name: edge.node.name,
      size: Math.max(0, edge.size),
    }))
    .sort((a, b) => b.size - a.size);

  if (edges.length === 0 || limit <= 0) {
    return [];
  }

  const totalSize = edges.reduce((sum, edge) => sum + edge.size, 0);
  if (totalSize <= 0) {
    return [];
  }

  return edges.slice(0, limit).map((edge) => ({
    name: edge.name,
    percentage: Math.round((edge.size / totalSize) * 100),
  }));
}
