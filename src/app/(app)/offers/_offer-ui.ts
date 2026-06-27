import { formatDistanceToNow } from "date-fns";
import { frCA } from "date-fns/locale";
import type { OfferResponse } from "@/lib/api-client";

export type OfferActionTone = "primary" | "secondary" | "quiet" | "danger";

export const statusConfig: Record<
  OfferResponse["status"],
  {
    label: string;
    description: string;
    badgeClassName: string;
    panelClassName: string;
  }
> = {
  PENDING: {
    label: "En attente",
    description: "Le client compare les propositions.",
    badgeClassName: "border-amber-200 bg-amber-100 text-amber-900",
    panelClassName: "border-amber-200 bg-amber-50",
  },
  ACCEPTED: {
    label: "Acceptee",
    description: "L'offre peut passer au contrat et aux messages.",
    badgeClassName: "border-emerald-200 bg-emerald-100 text-emerald-900",
    panelClassName: "border-emerald-200 bg-emerald-50",
  },
  DECLINED: {
    label: "Refusee",
    description: "L'offre reste disponible dans ton historique.",
    badgeClassName: "border-red-200 bg-red-100 text-red-800",
    panelClassName: "border-red-200 bg-red-50",
  },
};

export function getOfferDisplayId(offerId: string) {
  const compact = offerId.replace(/^offer[_-]?/i, "").replace(/[^a-z0-9]/gi, "");
  return `OF-${compact.slice(0, 6).toUpperCase() || offerId.slice(0, 6).toUpperCase()}`;
}

export function getMissionSummary(offer: OfferResponse) {
  return {
    id: offer.mission?.id ?? offer.missionId,
    title: offer.mission?.title ?? "Mission WorkOn",
    description: offer.mission?.description ?? null,
    category: offer.mission?.category ?? "Mission",
    city: offer.mission?.city ?? null,
    status: offer.mission?.status ?? null,
    budget: offer.mission?.price ?? null,
    createdAt: offer.mission?.createdAt ?? null,
  };
}

export function getOfferAction(offer: OfferResponse): {
  label: string;
  description: string;
  primaryLabel: string;
  tone: OfferActionTone;
} {
  if (offer.status === "ACCEPTED") {
    return {
      label: "Offre acceptee",
      description: "Continue par le contrat, les messages et la coordination de la mission.",
      primaryLabel: "Voir la mission",
      tone: "primary",
    };
  }

  if (offer.status === "DECLINED") {
    return {
      label: "Decision recue",
      description: "Cette proposition est fermee, mais elle reste utile pour suivre ton historique.",
      primaryLabel: "Voir la mission",
      tone: "danger",
    };
  }

  return {
    label: "A suivre",
    description: "Ton offre est chez le client. Garde le contexte a portee de main.",
    primaryLabel: "Voir la mission",
    tone: "secondary",
  };
}

export function getBudgetComparison(offer: OfferResponse): {
  label: string;
  value: string;
  detail: string;
  tone: "neutral" | "above" | "below" | "match";
} {
  const mission = getMissionSummary(offer);

  if (mission.budget === null || mission.budget === undefined) {
    return {
      label: "Budget mission",
      value: "A confirmer",
      detail: "Aucun budget visible",
      tone: "neutral",
    };
  }

  const delta = offer.price - mission.budget;

  if (Math.abs(delta) < 0.01) {
    return {
      label: "Budget mission",
      value: formatCurrency(mission.budget),
      detail: "Offre alignee",
      tone: "match",
    };
  }

  return {
    label: "Ecart budget",
    value: `${delta > 0 ? "+" : "-"}${formatCurrency(Math.abs(delta))}`,
    detail: delta > 0 ? "au-dessus du budget" : "sous le budget",
    tone: delta > 0 ? "above" : "below",
  };
}

export function getOfferLinks(offer: OfferResponse) {
  const missionId = offer.mission?.id ?? offer.missionId;

  return {
    missionHref: missionId ? `/missions/${missionId}` : null,
    messagesHref: missionId ? `/messages/${missionId}` : null,
    contractsHref: "/contracts",
  };
}

export function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "Non defini";

  return new Intl.DateTimeFormat("fr-CA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatRelativeTime(value: string | null | undefined) {
  if (!value) return "Date inconnue";

  return formatDistanceToNow(new Date(value), {
    addSuffix: true,
    locale: frCA,
  });
}
