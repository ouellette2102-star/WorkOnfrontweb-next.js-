/**
 * Logger minimal
 * PR-28: Ops & monitoring minimum
 *
 * Règles:
 * - DEV: logs verbose autorisés
 * - PROD: erreurs critiques uniquement
 * - JAMAIS de données sensibles (tokens, PII, payloads complets)
 */

const isDev = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";

type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = {
  [key: string]: string | number | boolean | null | undefined;
};

/**
 * Sanitize context to remove sensitive data
 */
function sanitize(context: LogContext): LogContext {
  const sensitiveKeys = [
    "token",
    "authorization",
    "password",
    "secret",
    "apiKey",
    "api_key",
    "accessToken",
    "refreshToken",
    "bearer",
  ];

  const sanitized: LogContext = {};

  for (const [key, value] of Object.entries(context)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some((s) => lowerKey.includes(s));

    if (isSensitive) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Format log message
 */
function formatLog(
  level: LogLevel,
  category: string,
  message: string,
  context?: LogContext
): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${category}]`;

  if (context && Object.keys(context).length > 0) {
    const safeContext = sanitize(context);
    return `${prefix} ${message} ${JSON.stringify(safeContext)}`;
  }

  return `${prefix} ${message}`;
}

/**
 * Logger instance
 */
export const logger = {
  /**
   * Debug logs - DEV only
   */
  debug(category: string, message: string, context?: LogContext): void {
    if (isDev && !isTest) {
      console.debug(formatLog("debug", category, message, context));
    }
  },

  /**
   * Info logs - DEV only
   */
  info(category: string, message: string, context?: LogContext): void {
    if (isDev && !isTest) {
      console.info(formatLog("info", category, message, context));
    }
  },

  /**
   * Warning logs - DEV only (consider upgrading to PROD for specific warnings)
   */
  warn(category: string, message: string, context?: LogContext): void {
    if (isDev && !isTest) {
      console.warn(formatLog("warn", category, message, context));
    }
  },

  /**
   * Error logs - ALWAYS (both DEV and PROD)
   * Use sparingly in PROD, only for critical errors
   */
  error(category: string, message: string, context?: LogContext): void {
    if (!isTest) {
      console.error(formatLog("error", category, message, context));
    }
  },

  /**
   * Critical error - ALWAYS logged
   * For errors that need immediate attention
   */
  critical(category: string, message: string, context?: LogContext): void {
    if (!isTest) {
      console.error(formatLog("error", category, `🚨 CRITICAL: ${message}`, context));
    }
  },
};

/**
 * Create a scoped logger for a specific category
 */
export function createLogger(category: string) {
  return {
    debug: (message: string, context?: LogContext) =>
      logger.debug(category, message, context),
    info: (message: string, context?: LogContext) =>
      logger.info(category, message, context),
    warn: (message: string, context?: LogContext) =>
      logger.warn(category, message, context),
    error: (message: string, context?: LogContext) =>
      logger.error(category, message, context),
    critical: (message: string, context?: LogContext) =>
      logger.critical(category, message, context),
  };
}



