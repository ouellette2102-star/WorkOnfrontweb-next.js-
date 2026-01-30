/**
 * useConsentAction Hook - WorkOn
 * PR-C2: Hook for handling actions that may require consent
 *
 * Provides a wrapper around async actions that:
 * 1. Detects CONSENT_REQUIRED errors
 * 2. Triggers the consent modal
 * 3. Retries the action once after consent is accepted
 */

"use client";

import { useCallback, useState } from "react";
import { useConsent } from "@/components/consent-provider";
import { isConsentRequiredError } from "@/lib/api-consent-handler";

type UseConsentActionOptions = {
  /** Maximum retry attempts after consent (default: 1) */
  maxRetries?: number;
};

type UseConsentActionResult<T> = {
  /** Execute the action with automatic consent handling */
  execute: () => Promise<T | undefined>;
  /** Whether the action is currently executing */
  isLoading: boolean;
  /** Error from the last execution (if any) */
  error: Error | null;
  /** Clear the error state */
  clearError: () => void;
};

/**
 * Hook for executing actions that may require legal consent.
 *
 * @param action - The async action to execute
 * @param options - Configuration options
 * @returns Object with execute function and state
 *
 * @example
 * ```tsx
 * const { execute, isLoading, error } = useConsentAction(
 *   () => createMission(token, payload)
 * );
 *
 * const handleSubmit = async () => {
 *   const result = await execute();
 *   if (result) {
 *     // Success - mission created
 *   }
 * };
 * ```
 */
export function useConsentAction<T>(
  action: () => Promise<T>,
  options: UseConsentActionOptions = {}
): UseConsentActionResult<T> {
  const { maxRetries = 1 } = options;
  const { requireConsent } = useConsent();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (): Promise<T | undefined> => {
    setIsLoading(true);
    setError(null);

    let retryCount = 0;

    const attemptAction = async (): Promise<T | undefined> => {
      try {
        const result = await action();
        return result;
      } catch (e) {
        // Check if this is a CONSENT_REQUIRED error
        if (isConsentRequiredError(e) && retryCount < maxRetries) {
          retryCount++;
          console.log("[useConsentAction] Consent required, showing modal...");

          try {
            // Wait for user to accept consent
            await requireConsent();
            console.log("[useConsentAction] Consent accepted, retrying action...");

            // Retry the action
            return await attemptAction();
          } catch (consentError) {
            // User cancelled or consent failed
            console.log("[useConsentAction] Consent not accepted:", consentError);
            throw consentError;
          }
        }

        // Not a consent error, or max retries reached
        throw e;
      }
    };

    try {
      const result = await attemptAction();
      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [action, maxRetries, requireConsent]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    execute,
    isLoading,
    error,
    clearError,
  };
}

