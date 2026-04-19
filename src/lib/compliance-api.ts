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

// ─── Data export + account deletion (Loi 25 / GDPR rights) ─────────────────

/**
 * Shape returned by `GET /compliance/my-data`.
 * Backend may add fields over time; anything unknown stays in `extra`.
 */
export type PersonalDataExport = {
  exportedAt: string;
  user: Record<string, unknown>;
  consents: Array<Record<string, unknown>>;
  missions?: Array<Record<string, unknown>>;
  reviews?: Array<Record<string, unknown>>;
  payments?: Array<Record<string, unknown>>;
  messages?: Array<Record<string, unknown>>;
  [extra: string]: unknown;
};

/**
 * Request a full export of the current user's personal data.
 * Fulfils Loi 25 Art. 27 / GDPR Art. 20 (right to data portability).
 */
export async function getMyData(): Promise<PersonalDataExport> {
  return apiFetch<PersonalDataExport>("/compliance/my-data");
}

export type DeletionRequestResponse = {
  requestedAt: string;
  scheduledFor: string;
  graceDays: number;
  canCancel: boolean;
};

/**
 * Start the 30-day account deletion grace period.
 * The account stays accessible during the grace window; data is
 * purged by a server-side job after `scheduledFor`.
 */
export async function requestAccountDeletion(): Promise<DeletionRequestResponse> {
  return apiFetch<DeletionRequestResponse>("/compliance/delete-account", {
    method: "POST",
  });
}

/**
 * Cancel a pending deletion request while still within the grace period.
 */
export async function cancelAccountDeletion(): Promise<{
  success: boolean;
  message: string;
}> {
  return apiFetch<{ success: boolean; message: string }>(
    "/compliance/delete-account",
    { method: "DELETE" },
  );
}

/**
 * Trigger a browser download of the user's full data as JSON.
 * Used by the /settings/privacy page.
 */
export async function downloadMyDataAsJson(): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("downloadMyDataAsJson must run in the browser");
  }
  const data = await getMyData();
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `workon-mes-donnees-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
