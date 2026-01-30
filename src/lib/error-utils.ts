/**
 * Error Utilities
 * PR-28: Ops & monitoring minimum
 *
 * Normalisation des erreurs runtime pour une UX cohérente.
 * Messages utilisateur clairs et actionnables.
 */

export type ErrorCode =
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "BACKEND_UNAVAILABLE"
  | "AUTH_EXPIRED"
  | "AUTH_REQUIRED"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "CONSENT_REQUIRED"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "UNKNOWN";

export type NormalizedError = {
  code: ErrorCode;
  message: string;
  userMessage: string;
  retryable: boolean;
  details?: string;
};

/**
 * Error messages for users (Sparkly-compatible, sobres et courts)
 */
const USER_MESSAGES: Record<ErrorCode, string> = {
  NETWORK_ERROR: "Connexion impossible. Vérifiez votre réseau.",
  TIMEOUT: "Le serveur n'a pas répondu. Réessayez.",
  BACKEND_UNAVAILABLE: "Service temporairement indisponible.",
  AUTH_EXPIRED: "Votre session a expiré. Reconnectez-vous.",
  AUTH_REQUIRED: "Connexion requise.",
  NOT_FOUND: "Cette ressource n'existe pas.",
  FORBIDDEN: "Vous n'avez pas accès à cette ressource.",
  CONSENT_REQUIRED: "Veuillez accepter les conditions d'utilisation.",
  VALIDATION_ERROR: "Données invalides. Vérifiez votre saisie.",
  RATE_LIMITED: "Trop de requêtes. Patientez un moment.",
  SERVER_ERROR: "Une erreur est survenue. Réessayez.",
  UNKNOWN: "Une erreur inattendue est survenue.",
};

/**
 * Retryable errors
 */
const RETRYABLE: Set<ErrorCode> = new Set([
  "NETWORK_ERROR",
  "TIMEOUT",
  "BACKEND_UNAVAILABLE",
  "SERVER_ERROR",
  "RATE_LIMITED",
]);

/**
 * Normalize an error from any source into a consistent format
 */
export function normalizeError(error: unknown): NormalizedError {
  // Already normalized
  if (isNormalizedError(error)) {
    return error;
  }

  // HTTP Response errors
  if (error instanceof Response) {
    return normalizeHttpError(error.status, error.statusText);
  }

  // Fetch/network errors
  if (error instanceof TypeError) {
    if (error.message.includes("fetch")) {
      return createError("NETWORK_ERROR", error.message);
    }
  }

  // AbortError (timeout)
  if (error instanceof DOMException && error.name === "AbortError") {
    return createError("TIMEOUT", "Request aborted");
  }

  // Generic Error
  if (error instanceof Error) {
    // Check for common patterns
    const msg = error.message.toLowerCase();

    if (msg.includes("network") || msg.includes("fetch failed")) {
      return createError("NETWORK_ERROR", error.message);
    }

    if (msg.includes("timeout") || msg.includes("aborted")) {
      return createError("TIMEOUT", error.message);
    }

    if (msg.includes("unauthorized") || msg.includes("401")) {
      return createError("AUTH_EXPIRED", error.message);
    }

    if (msg.includes("forbidden") || msg.includes("403")) {
      return createError("FORBIDDEN", error.message);
    }

    if (msg.includes("not found") || msg.includes("404")) {
      return createError("NOT_FOUND", error.message);
    }

    return createError("UNKNOWN", error.message);
  }

  // Unknown
  return createError("UNKNOWN", String(error));
}

/**
 * Normalize HTTP status code to error
 */
export function normalizeHttpError(
  status: number,
  statusText?: string
): NormalizedError {
  const details = statusText ?? `HTTP ${status}`;

  switch (status) {
    case 400:
      return createError("VALIDATION_ERROR", details);
    case 401:
      return createError("AUTH_EXPIRED", details);
    case 403:
      return createError("FORBIDDEN", details);
    case 404:
      return createError("NOT_FOUND", details);
    case 408:
      return createError("TIMEOUT", details);
    case 429:
      return createError("RATE_LIMITED", details);
    case 500:
    case 502:
    case 503:
    case 504:
      return createError("BACKEND_UNAVAILABLE", details);
    default:
      if (status >= 500) {
        return createError("SERVER_ERROR", details);
      }
      return createError("UNKNOWN", details);
  }
}

/**
 * Create a normalized error object
 */
function createError(code: ErrorCode, details?: string): NormalizedError {
  return {
    code,
    message: details ?? code,
    userMessage: USER_MESSAGES[code],
    retryable: RETRYABLE.has(code),
    details,
  };
}

/**
 * Type guard for normalized errors
 */
export function isNormalizedError(error: unknown): error is NormalizedError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "userMessage" in error
  );
}

/**
 * Get user-friendly message from any error
 */
export function getUserMessage(error: unknown): string {
  const normalized = normalizeError(error);
  return normalized.userMessage;
}

/**
 * Check if an error is retryable
 */
export function isRetryable(error: unknown): boolean {
  const normalized = normalizeError(error);
  return normalized.retryable;
}



