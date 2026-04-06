/**
 * DEPRECATED: This file is a backward-compatibility shim.
 * All endpoints have been consolidated into api-client.ts.
 * Original archived at: src/legacy/api/stripe-api.ts
 *
 * New code should use: import { api } from "@/lib/api-client"
 */

import { api, type WorkerPayment } from "./api-client";
import { getAccessToken } from "./auth";

export type { WorkerPayment };

export async function createOnboardingLink(_token?: string): Promise<{ url: string }> {
  return api.getStripeOnboardingLink();
}

export async function getOnboardingStatus(_token?: string) {
  return api.getStripeOnboardingStatus();
}

export async function createPaymentIntent(
  _token: string,
  missionId: string,
  amountCents: number,
) {
  return api.createPaymentIntent({ missionId, amount: amountCents });
}

export async function getWorkerPayments(_token?: string): Promise<WorkerPayment[]> {
  return api.getWorkerPaymentHistory();
}
