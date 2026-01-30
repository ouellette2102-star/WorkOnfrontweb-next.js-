/**
 * API Consent Handler - WorkOn
 * PR-C2: Centralized detection of CONSENT_REQUIRED errors
 *
 * Detects 403 CONSENT_REQUIRED responses and provides helpers
 * for triggering the consent modal and retrying failed requests.
 */

/**
 * Error type with consent-specific properties
 */
export type ApiError = Error & {
  status?: number;
  code?: string;
  data?: {
    error?: string;
    missing?: string[];
  };
};

/**
 * Check if an error is a CONSENT_REQUIRED error from the backend
 */
export function isConsentRequiredError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const apiError = error as ApiError;

  // Check for 403 + CONSENT_REQUIRED code
  if (apiError.status === 403) {
    // Check error.data.error === 'CONSENT_REQUIRED'
    if (apiError.data?.error === "CONSENT_REQUIRED") {
      return true;
    }
    // Check error.code === 'CONSENT_REQUIRED'
    if (apiError.code === "CONSENT_REQUIRED") {
      return true;
    }
  }

  return false;
}

/**
 * Extract missing documents from a CONSENT_REQUIRED error
 */
export function getMissingDocuments(error: unknown): string[] {
  if (!isConsentRequiredError(error)) {
    return [];
  }

  const apiError = error as ApiError;
  return apiError.data?.missing ?? ["TERMS", "PRIVACY"];
}

/**
 * Create a standardized CONSENT_REQUIRED error
 */
export function createConsentRequiredError(missing?: string[]): ApiError {
  const error = new Error(
    "Veuillez accepter les conditions d'utilisation pour continuer."
  ) as ApiError;
  error.status = 403;
  error.code = "CONSENT_REQUIRED";
  error.data = {
    error: "CONSENT_REQUIRED",
    missing: missing ?? ["TERMS", "PRIVACY"],
  };
  return error;
}

/**
 * Parse API response and throw CONSENT_REQUIRED error if detected
 */
export async function parseResponseForConsentError(
  response: Response
): Promise<void> {
  if (response.status !== 403) {
    return;
  }

  try {
    const body = await response.clone().json();
    if (body?.error === "CONSENT_REQUIRED") {
      throw createConsentRequiredError(body.missing);
    }
  } catch (e) {
    // If JSON parsing fails, it's not a consent error
    if ((e as ApiError).code === "CONSENT_REQUIRED") {
      throw e;
    }
  }
}

