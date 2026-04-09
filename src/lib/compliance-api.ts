/**
 * Compliance API client — WorkOn legal consent tracking.
 *
 * Thin wrapper around `apiFetch` so every compliance call shares the
 * same Bearer auth + auto-refresh on 401 + error normalization as the
 * rest of the app. Backward-compatible exports: call sites still pass
 * a `token` string, but we ignore it — `apiFetch` reads the current
 * token from localStorage. Tokens stay in the signature to avoid
 * touching consumers in the same PR.
 *
 * See Phase 5 audit §1.3 "parallel api layers" for the consolidation
 * rationale (PR #93).
 *
 * Conformité: Loi 25 Québec, GDPR, Apple App Store, Google Play
 */

import { apiFetch } from "./api-client";

/**
 * Versions actives des documents légaux. Doit être synchronisé avec
 * le backend (source of truth lives in backend configuration).
 */
export const ACTIVE_LEGAL_VERSIONS = {
  TERMS: "1.0",
  PRIVACY: "1.0",
} as const;

export type LegalDocumentType = keyof typeof ACTIVE_LEGAL_VERSIONS;

export type ConsentStatus = {
  isComplete: boolean;
  documents: Record<
    string,
    {
      accepted: boolean;
      version: string | null;
      acceptedAt: string | null;
      activeVersion: string;
    }
  >;
  missing: string[];
};

export type AcceptConsentResponse = {
  accepted: boolean;
  documentType: string;
  version: string;
  acceptedAt: string;
  alreadyAccepted?: boolean;
};

/**
 * Obtenir les versions actives des documents légaux.
 * Endpoint public — `skipAuth: true` lets `apiFetch` omit the
 * Authorization header even when a token is cached.
 */
export async function getActiveVersions(): Promise<{
  versions: typeof ACTIVE_LEGAL_VERSIONS;
  updatedAt: string;
}> {
  return apiFetch<{
    versions: typeof ACTIVE_LEGAL_VERSIONS;
    updatedAt: string;
  }>("/compliance/versions", { skipAuth: true });
}

/** Vérifier le statut de consentement de l'utilisateur. */
export async function getConsentStatus(_token?: string): Promise<ConsentStatus> {
  void _token;
  return apiFetch<ConsentStatus>("/compliance/status");
}

/** Accepter un document légal. */
export async function acceptDocument(
  _token: string,
  documentType: LegalDocumentType,
  version: string,
): Promise<AcceptConsentResponse> {
  void _token;
  return apiFetch<AcceptConsentResponse>("/compliance/accept", {
    method: "POST",
    body: JSON.stringify({ documentType, version }),
  });
}

/**
 * Accepter tous les documents légaux requis (TERMS + PRIVACY).
 * Called from the onboarding flow.
 */
export async function acceptAllDocuments(
  token: string,
): Promise<{ success: boolean; results: AcceptConsentResponse[] }> {
  const [termsResult, privacyResult] = await Promise.all([
    acceptDocument(token, "TERMS", ACTIVE_LEGAL_VERSIONS.TERMS),
    acceptDocument(token, "PRIVACY", ACTIVE_LEGAL_VERSIONS.PRIVACY),
  ]);

  return {
    success: termsResult.accepted && privacyResult.accepted,
    results: [termsResult, privacyResult],
  };
}
