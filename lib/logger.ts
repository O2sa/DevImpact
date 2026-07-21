type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  INFO: "\x1b[32m", // Green
  WARN: "\x1b[33m", // Yellow
  ERROR: "\x1b[31m", // Red
  DEBUG: "\x1b[34m", // Blue
};

const RESET_COLOR = "\x1b[0m";

function log(level: LogLevel, message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const color = LOG_LEVEL_COLORS[level];
  let logMessage = `${color}[${timestamp}] [${level}]${RESET_COLOR} ${message}`;

  if (data) {
    logMessage += ` ${JSON.stringify(data)}`;
  }

  console.log(logMessage);
}

export const logger = {
  info: (message: string, data?: Record<string, unknown>) => log("INFO", message, data),
  warn: (message: string, data?: Record<string, unknown>) => log("WARN", message, data),
  error: (message: string, data?: Record<string, unknown>) => log("ERROR", message, data),
  debug: (message: string, data?: Record<string, unknown>) => log("DEBUG", message, data),
};