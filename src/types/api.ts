export type SafeApiErrorCode =
  | "RATE_LIMITED"
  | "TEMPORARY_THROTTLE"
  | "GITHUB_TIMEOUT"
  | "GITHUB_RESOURCE_LIMIT"
  | "GITHUB_AUTH"
  | "GITHUB_NOT_FOUND"
  | "NETWORK"
  | "UNKNOWN";

export type SafeApiRateLimit = {
  limit?: number;
  remaining?: number;
  used?: number;
  resetAt?: number;
  resource?: string;
};

export type SafeApiError = {
  code: SafeApiErrorCode;
  message: string;
  retryAfterSeconds?: number;
  targetUsernames?: string[];
  rateLimit?: SafeApiRateLimit;
};

export type ClientSafeError = Pick<SafeApiError, "code" | "message" | "targetUsernames">;

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  errorDetails?: SafeApiError;
};
