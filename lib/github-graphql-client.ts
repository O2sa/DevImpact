import type { SafeApiError } from "@/types/api-response";

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";
const SECONDARY_FALLBACK_WAIT_MS = 60_000;

export type RateLimitSnapshot = {
  limit?: number;
  remaining?: number;
  used?: number;
  resetAt?: number;
  resource?: string;
  retryAfterSeconds?: number;
};

export type GitHubErrorKind =
  | "PRIMARY_RATE_LIMIT"
  | "SECONDARY_RATE_LIMIT"
  | "TIMEOUT"
  | "RESOURCE_LIMIT"
  | "AUTH"
  | "NOT_FOUND"
  | "NETWORK"
  | "UNKNOWN";

export type GraphQLErrorItem = {
  message?: string;
  type?: string;
};

function toFiniteInt(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseRateLimitHeaders(headers: Headers): RateLimitSnapshot {
  return {
    limit: toFiniteInt(headers.get("x-ratelimit-limit")),
    remaining: toFiniteInt(headers.get("x-ratelimit-remaining")),
    used: toFiniteInt(headers.get("x-ratelimit-used")),
    resetAt: toFiniteInt(headers.get("x-ratelimit-reset")),
    resource: headers.get("x-ratelimit-resource") ?? undefined,
    retryAfterSeconds: toFiniteInt(headers.get("retry-after")),
  };
}

function normalizeMessage(value: string): string {
  return value.toLowerCase();
}

function messageIncludes(messages: string[], tokens: string[]): boolean {
  return messages.some((message) =>
    tokens.some((token) => message.includes(token)),
  );
}

function isPrimaryRateLimit(
  status: number,
  messages: string[],
  rateLimit: RateLimitSnapshot,
): boolean {
  if (status === 403 && rateLimit.remaining === 0) {
    return true;
  }

  return (
    rateLimit.remaining === 0 &&
    messageIncludes(messages, ["rate limit", "api rate limit exceeded"])
  );
}

function isSecondaryRateLimit(status: number, messages: string[]): boolean {
  if (status === 403 && messageIncludes(messages, ["secondary rate limit"])) {
    return true;
  }

  return messageIncludes(messages, [
    "secondary rate limit",
    "abuse detection",
    "you have exceeded a secondary rate limit",
  ]);
}

export function classifyGitHubError(input: {
  status: number;
  errors?: GraphQLErrorItem[];
  rateLimit: RateLimitSnapshot;
}): GitHubErrorKind {
  const messages = (input.errors ?? [])
    .map((error) => normalizeMessage(error.message ?? ""))
    .filter(Boolean);

  if (isPrimaryRateLimit(input.status, messages, input.rateLimit)) {
    return "PRIMARY_RATE_LIMIT";
  }

  if (isSecondaryRateLimit(input.status, messages)) {
    return "SECONDARY_RATE_LIMIT";
  }

  if (input.status === 401 || messageIncludes(messages, ["bad credentials"])) {
    return "AUTH";
  }

  if (
    messageIncludes(messages, [
      "could not resolve to a user",
      "not found",
      "could not resolve to a repository",
    ])
  ) {
    return "NOT_FOUND";
  }

  if (
    messageIncludes(messages, [
      "couldn't respond to your request in time",
      "timed out",
      "timeout",
    ])
  ) {
    return "TIMEOUT";
  }

  if (
    messageIncludes(messages, [
      "resource limits were exceeded",
      "resource limit exceeded",
    ])
  ) {
    return "RESOURCE_LIMIT";
  }

  if (input.status >= 500) {
    return "NETWORK";
  }

  return "UNKNOWN";
}

function isRetriable(kind: GitHubErrorKind): boolean {
  return (
    kind === "PRIMARY_RATE_LIMIT" ||
    kind === "SECONDARY_RATE_LIMIT" ||
    kind === "TIMEOUT" ||
    kind === "RESOURCE_LIMIT" ||
    kind === "NETWORK"
  );
}

function getDeterministicJitterMs(attempt: number): number {
  return ((attempt + 1) * 137) % 1000;
}

export function computeRetryDelayMs(
  attempt: number,
  kind: GitHubErrorKind,
  rateLimit: RateLimitSnapshot,
  nowMs: number = Date.now(),
): number {
  if (rateLimit.retryAfterSeconds && rateLimit.retryAfterSeconds > 0) {
    return rateLimit.retryAfterSeconds * 1000;
  }

  if (rateLimit.remaining === 0 && rateLimit.resetAt) {
    const resetDelay = rateLimit.resetAt * 1000 - nowMs;
    if (resetDelay > 0) {
      return resetDelay;
    }
  }

  if (kind === "SECONDARY_RATE_LIMIT") {
    return SECONDARY_FALLBACK_WAIT_MS + getDeterministicJitterMs(attempt);
  }

  const base = 1000 * Math.pow(2, attempt);
  return base + getDeterministicJitterMs(attempt);
}

function waitMs(value: number): Promise<void> {
  if (value <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    setTimeout(resolve, value);
  });
}

export class GitHubApiError extends Error {
  readonly kind: GitHubErrorKind;
  readonly status: number;
  readonly rateLimit: RateLimitSnapshot;
  readonly retriable: boolean;
  readonly retryAfterMs?: number;

  constructor(params: {
    message: string;
    kind: GitHubErrorKind;
    status: number;
    rateLimit: RateLimitSnapshot;
    retryAfterMs?: number;
  }) {
    super(params.message);
    this.name = "GitHubApiError";
    this.kind = params.kind;
    this.status = params.status;
    this.rateLimit = params.rateLimit;
    this.retriable = isRetriable(params.kind);
    this.retryAfterMs = params.retryAfterMs;
  }
}

class RequestScheduler {
  private readonly maxConcurrency: number;
  private activeCount = 0;
  private readonly queue: Array<() => void> = [];

  constructor(maxConcurrency: number) {
    this.maxConcurrency = Math.max(1, maxConcurrency);
  }

  schedule<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const runTask = () => {
        this.activeCount += 1;
        task()
          .then(resolve)
          .catch(reject)
          .finally(() => {
            this.activeCount -= 1;
            this.runNext();
          });
      };

      this.queue.push(runTask);
      this.runNext();
    });
  }

  private runNext(): void {
    if (this.activeCount >= this.maxConcurrency) {
      return;
    }

    const next = this.queue.shift();
    if (!next) {
      return;
    }

    next();
  }
}

type GraphQLSuccessResponse<TData> = {
  data?: TData;
  errors?: GraphQLErrorItem[];
};

type GitHubGraphQLClientOptions = {
  token: string;
  maxRetries?: number;
  maxConcurrency?: number;
  baseDelayMs?: number;
  fetchImpl?: typeof fetch;
};

type ExecuteQueryParams<TVariables extends Record<string, unknown>> = {
  operationName: string;
  query: string;
  variables: TVariables;
};

export class GitHubGraphQLClient {
  private readonly token: string;
  private readonly maxRetries: number;
  private readonly baseDelayMs: number;
  private readonly scheduler: RequestScheduler;
  private readonly fetchImpl: typeof fetch;
  private lastRateLimit: RateLimitSnapshot = {};

  constructor(options: GitHubGraphQLClientOptions) {
    this.token = options.token;
    this.maxRetries = Math.max(0, options.maxRetries ?? 3);
    this.baseDelayMs = Math.max(0, options.baseDelayMs ?? 120);
    this.scheduler = new RequestScheduler(options.maxConcurrency ?? 2);
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async execute<TData, TVariables extends Record<string, unknown>>(
    params: ExecuteQueryParams<TVariables>,
  ): Promise<TData> {
    return this.scheduler.schedule(() => this.executeWithRetries<TData, TVariables>(params));
  }

  private async executeWithRetries<
    TData,
    TVariables extends Record<string, unknown>,
  >(params: ExecuteQueryParams<TVariables>): Promise<TData> {
    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        await this.applyAdaptiveDelay();
        return await this.executeOnce<TData, TVariables>(params);
      } catch (error: unknown) {
        const normalizedError = this.normalizeError(error);
        const shouldRetry =
          normalizedError.retriable && attempt < this.maxRetries;

        console.warn("github_graphql_error", {
          operationName: params.operationName,
          attempt: attempt + 1,
          classification: normalizedError.kind,
          status: normalizedError.status,
          retryAfterMs: normalizedError.retryAfterMs,
          rateLimit: normalizedError.rateLimit,
          shouldRetry,
        });

        if (!shouldRetry) {
          throw normalizedError;
        }

        const delayMs = computeRetryDelayMs(
          attempt,
          normalizedError.kind,
          normalizedError.rateLimit,
        );
        await waitMs(delayMs);
      }
    }

    throw new GitHubApiError({
      message: "Unexpected retry exhaustion",
      kind: "UNKNOWN",
      status: 500,
      rateLimit: this.lastRateLimit,
    });
  }

  private async executeOnce<TData, TVariables extends Record<string, unknown>>(
    params: ExecuteQueryParams<TVariables>,
  ): Promise<TData> {
    const response = await this.fetchImpl(GITHUB_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `bearer ${this.token}`,
      },
      body: JSON.stringify({
        query: params.query,
        variables: params.variables,
        operationName: params.operationName,
      }),
    });

    const rateLimit = parseRateLimitHeaders(response.headers);
    this.lastRateLimit = rateLimit;

    const payload = (await response.json()) as GraphQLSuccessResponse<TData>;
    if (!response.ok || (payload.errors && payload.errors.length > 0)) {
      const kind = classifyGitHubError({
        status: response.status,
        errors: payload.errors,
        rateLimit,
      });
      throw new GitHubApiError({
        message:
          payload.errors?.map((error) => error.message).filter(Boolean).join(" | ") ||
          `GitHub GraphQL request failed with status ${response.status}`,
        kind,
        status: response.status,
        rateLimit,
        retryAfterMs: rateLimit.retryAfterSeconds
          ? rateLimit.retryAfterSeconds * 1000
          : undefined,
      });
    }

    if (!payload.data) {
      throw new GitHubApiError({
        message: "GitHub GraphQL response did not include data",
        kind: "UNKNOWN",
        status: response.status,
        rateLimit,
      });
    }

    console.info("github_graphql_success", {
      operationName: params.operationName,
      rateLimit,
    });

    return payload.data;
  }

  private normalizeError(error: unknown): GitHubApiError {
    if (error instanceof GitHubApiError) {
      return error;
    }

    const message = error instanceof Error ? error.message : "Unknown network error";
    return new GitHubApiError({
      message,
      kind: "NETWORK",
      status: 503,
      rateLimit: this.lastRateLimit,
    });
  }

  private async applyAdaptiveDelay(): Promise<void> {
    const now = Date.now();
    const rateLimit = this.lastRateLimit;
    let delayMs = this.baseDelayMs;

    if (rateLimit.remaining === 0 && rateLimit.resetAt) {
      delayMs = Math.max(delayMs, rateLimit.resetAt * 1000 - now);
    } else if (
      typeof rateLimit.remaining === "number" &&
      typeof rateLimit.resetAt === "number"
    ) {
      const secondsToReset = Math.max(1, rateLimit.resetAt - Math.floor(now / 1000));
      const budgetPerSecond = rateLimit.remaining / secondsToReset;

      if (budgetPerSecond < 0.25) {
        delayMs = Math.max(delayMs, 4_000);
      } else if (budgetPerSecond < 0.5) {
        delayMs = Math.max(delayMs, 2_500);
      } else if (budgetPerSecond < 1) {
        delayMs = Math.max(delayMs, 1_200);
      } else if (budgetPerSecond < 2) {
        delayMs = Math.max(delayMs, 500);
      }
    }

    await waitMs(delayMs);
  }
}

export function toSafeApiError(error: unknown): SafeApiError {
  if (!(error instanceof GitHubApiError)) {
    return {
      code: "UNKNOWN",
      message: "Unexpected error while processing GitHub data.",
    };
  }

  const rateLimit = error.rateLimit;
  const retryAfterSeconds =
    error.retryAfterMs !== undefined
      ? Math.max(1, Math.ceil(error.retryAfterMs / 1000))
      : undefined;

  switch (error.kind) {
    case "PRIMARY_RATE_LIMIT":
      return {
        code: "RATE_LIMITED",
        message: `GitHub API is rate limiting requests. Please retry in ${retryAfterSeconds ?? "a while"} seconds.`,
        retryAfterSeconds,
        rateLimit,
      };
    case "SECONDARY_RATE_LIMIT":
      return {
        code: "TEMPORARY_THROTTLE",
        message: `GitHub API temporarily throttled requests. Please retry in ${retryAfterSeconds ?? "about a minute"}.`,
        retryAfterSeconds,
        rateLimit,
      };
    case "TIMEOUT":
      return {
        code: "GITHUB_TIMEOUT",
        message: "GitHub API timed out while processing the request. Please try again shortly.",
        retryAfterSeconds,
        rateLimit,
      };
    case "RESOURCE_LIMIT":
      return {
        code: "GITHUB_RESOURCE_LIMIT",
        message: "GitHub API resource limits were reached for this query. Please retry shortly.",
        retryAfterSeconds,
        rateLimit,
      };
    case "AUTH":
      return {
        code: "GITHUB_AUTH",
        message: "GitHub authentication failed. Check GitHub token configuration.",
        rateLimit,
      };
    case "NOT_FOUND":
      return {
        code: "GITHUB_NOT_FOUND",
        message: "GitHub user not found.",
        rateLimit,
      };
    case "NETWORK":
      return {
        code: "NETWORK",
        message: "Network issue while reaching GitHub API. Please try again.",
        retryAfterSeconds,
        rateLimit,
      };
    default:
      return {
        code: "UNKNOWN",
        message: "Unexpected GitHub API error. Please try again.",
        retryAfterSeconds,
        rateLimit,
      };
  }
}
