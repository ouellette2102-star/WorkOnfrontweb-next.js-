/**
 * Compliance API Client - WorkOn
 *
 * Gestion du consentement légal côté frontend.
 *
 * Conformité: Loi 25 Québec, GDPR, Apple App Store, Google Play
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3001/api/v1";

/**
 * Versions actives des documents légaux
 * DOIT être synchronisé avec le backend
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
 * Helper pour les requêtes authentifiées
 */
async function authenticatedRequest<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE_URL}${normalizedPath}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    let errorData;
    try {
      errorData = JSON.parse(errorBody);
    } catch {
      errorData = { message: `Erreur API ${response.status}` };
    }

    const error = new Error(errorData?.message ?? `Erreur API ${response.status}`) as Error & {
      status?: number;
      data?: unknown;
    };
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  return response.json() as Promise<T>;
}

/**
 * Obtenir les versions actives des documents légaux
 * (endpoint public, pas besoin d'auth)
 */
export async function getActiveVersions(): Promise<{
  versions: typeof ACTIVE_LEGAL_VERSIONS;
  updatedAt: string;
}> {
  const response = await fetch(`${API_BASE_URL}/compliance/versions`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Impossible de récupérer les versions légales");
  }

  return response.json();
}

/**
 * Vérifier le statut de consentement de l'utilisateur
 */
export async function getConsentStatus(token: string): Promise<ConsentStatus> {
  return authenticatedRequest<ConsentStatus>("/compliance/status", token);
}

/**
 * Accepter un document légal
 */
export async function acceptDocument(
  token: string,
  documentType: LegalDocumentType,
  version: string,
): Promise<AcceptConsentResponse> {
  return authenticatedRequest<AcceptConsentResponse>("/compliance/accept", token, {
    method: "POST",
    body: JSON.stringify({ documentType, version }),
  });
}

/**
 * Accepter tous les documents légaux requis
 * (TERMS + PRIVACY avec leurs versions actives)
 */
export async function acceptAllDocuments(
  token: string,
): Promise<{ success: boolean; results: AcceptConsentResponse[] }> {
  const results: AcceptConsentResponse[] = [];

  // Accepter TERMS
  const termsResult = await acceptDocument(
    token,
    "TERMS",
    ACTIVE_LEGAL_VERSIONS.TERMS,
  );
  results.push(termsResult);

  // Accepter PRIVACY
  const privacyResult = await acceptDocument(
    token,
    "PRIVACY",
    ACTIVE_LEGAL_VERSIONS.PRIVACY,
  );
  results.push(privacyResult);

  return {
    success: results.every((r) => r.accepted),
    results,
  };
}

