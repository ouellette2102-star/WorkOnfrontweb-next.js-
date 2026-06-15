"use client";

import { useState } from "react";
import { loadConnectAndInitialize } from "@stripe/connect-js";
import {
  ConnectComponentsProvider,
  ConnectAccountOnboarding,
} from "@stripe/react-connect-js";
import { api } from "@/lib/api-client";

/**
 * Onboarding Stripe Connect EMBARQUÉ — le worker configure ses paiements
 * DANS WorkOn, aucune redirection vers connect.stripe.com (décision 🔒 2026-06-14).
 *
 * Le client_secret vient de GET /stripe/connect/account-session (backend),
 * qui crée le compte Connect du worker au besoin + une Account Session.
 */

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export function EmbeddedConnectOnboarding({
  onComplete,
}: {
  onComplete?: () => void;
}) {
  const [instance] = useState(() => {
    if (!PUBLISHABLE_KEY) return null;
    return loadConnectAndInitialize({
      publishableKey: PUBLISHABLE_KEY,
      fetchClientSecret: async () => {
        const { clientSecret } = await api.getConnectAccountSession();
        return clientSecret;
      },
    });
  });

  if (!instance) {
    return (
      <p className="text-sm text-workon-muted">
        Configuration des paiements momentanément indisponible. Réessaie plus
        tard.
      </p>
    );
  }

  return (
    <ConnectComponentsProvider connectInstance={instance}>
      <ConnectAccountOnboarding onExit={() => onComplete?.()} />
    </ConnectComponentsProvider>
  );
}
