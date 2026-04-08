/**
 * Client API pour Stripe Connect WorkOn
 * Gère l'onboarding des Workers et les paiements
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3001/api/v1";

/**
 * Helper générique pour les requêtes authentifiées
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
    console.error("[WorkOn Stripe API] Request failed", {
      url,
      status: response.status,
      body: errorBody,
    });

    let errorMessage = `Erreur API ${response.status}`;
    try {
      const parsed = JSON.parse(errorBody);
      errorMessage = parsed?.message ?? parsed?.error ?? errorMessage;
    } catch {
      // Ignore parse errors
    }

    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

/**
 * Créer un lien d'onboarding Stripe Connect (WORKER uniquement)
 */
export async function createOnboardingLink(token: string): Promise<{ url: string }> {
  return authenticatedRequest<{ url: string }>("/payments/connect/onboarding", token, {
    method: "GET",
  });
}

/**
 * Vérifier le statut d'onboarding Stripe (WORKER uniquement)
 */
export async function getOnboardingStatus(
  token: string,
): Promise<{
  onboarded: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirementsNeeded: string[];
}> {
  return authenticatedRequest("/payments/connect/status", token, {
    method: "GET",
  });
}

/**
 * Créer un PaymentIntent pour une mission (EMPLOYER uniquement)
 */
export async function createPaymentIntent(
  token: string,
  missionId: string,
  amountCents: number,
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  return authenticatedRequest("/payments/create-intent", token, {
    method: "POST",
    body: JSON.stringify({ missionId, amountCents }),
  });
}

/**
 * Récupérer l'historique des paiements d'un Worker (WORKER uniquement)
 */
export async function getWorkerPayments(token: string): Promise<WorkerPayment[]> {
  return authenticatedRequest<WorkerPayment[]>("/payments/worker/history", token, {
    method: "GET",
  });
}

export type WorkerPayment = {
  id: string;
  missionId: string;
  missionTitle: string;
  missionCategory: string | null;
  amountCents: number;
  feeCents: number;
  netAmountCents: number;
  currency: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED";
  completedAt: string | null;
  createdAt: string;
};

