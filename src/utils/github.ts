export function cleanGitHubUsername(input: string): string {
  const trimmed = input.trim().replace(/^@+/, "").replace(/\/+$/, "");
  if (!trimmed) return "";

  const url = tryParseGitHubUrl(trimmed);
  if (!url) return trimmed;

  return url.pathname.split("/").filter(Boolean)[0] ?? "";
}

function tryParseGitHubUrl(input: string): URL | null {
  const urlInput = input.startsWith("github.com/") ? `https://${input}` : input;

  try {
    const url = new URL(urlInput);
    return url.hostname === "github.com" || url.hostname === "www.github.com" ? url : null;
  } catch {
    return null;
  }
}
