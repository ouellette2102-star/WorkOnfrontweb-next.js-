/**
 * Mode-aware copy dictionary.
 *
 * QA report items #M4, #42, #57: copies and CTAs were leaking across
 * roles ("Trouve des missions" shown to a CLIENT, "appelle un pro"
 * shown to a PRO). This file is the canonical mapping.
 *
 * Usage:
 *   const copy = useCopy();
 *   <h1>{copy.home.greeting("Mathieu")}</h1>
 *
 * The function form is preferred for parameterized strings so the
 * caller never has to do template interpolation by hand.
 */

import { useMode } from "@/contexts/mode-context";

export type Mode = "pro" | "client";

/** Copy structure shared across modes. Keep keys identical between pro/client. */
interface CopyShape {
  home: {
    welcomeBanner: string;
    welcomeCta: string;
  };
  reviews: {
    emptyTitle: string;
    emptyBody: string;
    emptyCta: string;
    emptyCtaHref: string;
  };
  trustPills: string[];
  reservation: {
    actionLabel: string; // "Postuler" (pro side) vs "Réserver" (client side)
  };
}

const PRO_COPY: CopyShape = {
  home: {
    welcomeBanner: "Bienvenue. Trouve ta prochaine mission.",
    welcomeCta: "Parcourir les missions disponibles",
  },
  reviews: {
    emptyTitle: "Aucun avis pour le moment",
    emptyBody: "Complète des missions pour recevoir tes premiers avis.",
    emptyCta: "Trouver des missions",
    emptyCtaHref: "/missions",
  },
  trustPills: ["Paiement Stripe sécurisé", "Contrat auto", "Clients vérifiés"],
  reservation: {
    actionLabel: "Postuler",
  },
};

const CLIENT_COPY: CopyShape = {
  home: {
    welcomeBanner: "Bienvenue. Trouve un pro qualifié.",
    welcomeCta: "Découvrir les pros disponibles",
  },
  reviews: {
    emptyTitle: "Aucun avis pour le moment",
    emptyBody: "Termine ta première mission pour recevoir un avis.",
    emptyCta: "Publier ma première mission",
    emptyCtaHref: "/missions/new",
  },
  trustPills: ["Paiement Stripe sécurisé", "Contrat auto", "Pros vérifiés"],
  reservation: {
    actionLabel: "Réserver",
  },
};

const COPY_BY_MODE: Record<Mode, CopyShape> = {
  pro: PRO_COPY,
  client: CLIENT_COPY,
};

/**
 * Hook returning the copy dictionary for the active mode.
 *
 * Always prefer this over inline strings when the wording differs
 * between PRO and CLIENT views. Add new keys to CopyShape; the
 * compiler will then enforce that both PRO_COPY and CLIENT_COPY
 * provide them.
 */
export function useCopy(): CopyShape {
  const { mode } = useMode();
  return COPY_BY_MODE[mode];
}

/** Non-hook variant for server components or stable lookups. */
export function copyFor(mode: Mode): CopyShape {
  return COPY_BY_MODE[mode];
}
