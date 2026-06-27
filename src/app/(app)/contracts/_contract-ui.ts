import type { ContractResponse } from "@/lib/api-client";

export type ContractViewerRole = "employer" | "worker" | "unknown";
export type ContractActionTone = "primary" | "secondary" | "quiet" | "danger";

export const statusConfig: Record<
  ContractResponse["status"],
  {
    label: string;
    description: string;
    badgeClassName: string;
    panelClassName: string;
  }
> = {
  DRAFT: {
    label: "Brouillon",
    description: "Pret a etre envoye",
    badgeClassName: "border-neutral-200 bg-neutral-100 text-neutral-800",
    panelClassName: "border-neutral-200 bg-neutral-50",
  },
  PENDING: {
    label: "Signature requise",
    description: "En attente du pro",
    badgeClassName: "border-amber-200 bg-amber-100 text-amber-900",
    panelClassName: "border-amber-200 bg-amber-50",
  },
  ACCEPTED: {
    label: "Actif",
    description: "Contrat signe",
    badgeClassName: "border-emerald-200 bg-emerald-100 text-emerald-900",
    panelClassName: "border-emerald-200 bg-emerald-50",
  },
  REJECTED: {
    label: "Refuse",
    description: "Signature refusee",
    badgeClassName: "border-red-200 bg-red-100 text-red-800",
    panelClassName: "border-red-200 bg-red-50",
  },
  COMPLETED: {
    label: "Complete",
    description: "Mission fermee",
    badgeClassName: "border-blue-200 bg-blue-100 text-blue-900",
    panelClassName: "border-blue-200 bg-blue-50",
  },
  CANCELLED: {
    label: "Annule",
    description: "Contrat annule",
    badgeClassName: "border-stone-200 bg-stone-100 text-stone-700",
    panelClassName: "border-stone-200 bg-stone-50",
  },
};

export function getViewerRole(
  contract: ContractResponse,
  userId?: string | null,
): ContractViewerRole {
  if (!userId) return "unknown";

  const isEmployer =
    contract.localEmployerId === userId ||
    contract.employerId === userId ||
    contract.employer?.id === userId ||
    contract.employer?.clerkId === userId;

  if (isEmployer) return "employer";

  const isWorker =
    contract.localWorkerId === userId ||
    contract.workerId === userId ||
    contract.worker?.id === userId ||
    contract.worker?.clerkId === userId;

  return isWorker ? "worker" : "unknown";
}

export function getContractDisplayId(contractId: string) {
  const compact = contractId.replace(/^contract[_-]?/i, "").replace(/[^a-z0-9]/gi, "");
  return `CT-${compact.slice(0, 6).toUpperCase() || contractId.slice(0, 6).toUpperCase()}`;
}

export function getMissionSummary(contract: ContractResponse) {
  const localMission = contract.localMission;
  const id = localMission?.id ?? contract.localMissionId ?? contract.mission?.id ?? contract.missionId;

  return {
    id,
    title: localMission?.title ?? contract.mission?.title ?? "Mission WorkOn",
    category: localMission?.category ?? null,
    city: localMission?.city ?? null,
    address: localMission?.address ?? null,
    description: localMission?.description ?? null,
    durationMinutes: localMission?.durationMinutes ?? null,
    materialProvided: localMission?.materialProvided ?? null,
  };
}

export function getCounterparty(contract: ContractResponse, role: ContractViewerRole) {
  if (role === "employer") {
    return {
      label: "Professionnel",
      name: formatLocalPartyName(contract.localWorker, "Pro WorkOn"),
      city: contract.localWorker?.city ?? null,
      detail: contract.localWorker?.jobTitle ?? null,
    };
  }

  if (role === "worker") {
    return {
      label: "Client",
      name: formatLocalPartyName(contract.localEmployer, "Client WorkOn"),
      city: contract.localEmployer?.city ?? null,
      detail: contract.localEmployer?.businessName ?? null,
    };
  }

  return {
    label: "Partie",
    name: formatLocalPartyName(contract.localEmployer, "Participant WorkOn"),
    city: contract.localEmployer?.city ?? null,
    detail: contract.localEmployer?.businessName ?? null,
  };
}

export function getContractAction(
  contract: ContractResponse,
  role: ContractViewerRole,
): {
  label: string;
  description: string;
  needsAction: boolean;
  tone: ContractActionTone;
} {
  if (contract.status === "DRAFT") {
    return role === "employer"
      ? {
          label: "Envoyer au pro",
          description: "Le contrat attend ton envoi.",
          needsAction: true,
          tone: "primary",
        }
      : {
          label: "Voir le brouillon",
          description: "Le client prepare le contrat.",
          needsAction: false,
          tone: "quiet",
        };
  }

  if (contract.status === "PENDING") {
    return role === "worker"
      ? {
          label: "Verifier et signer",
          description: "Ta signature est requise pour activer la mission.",
          needsAction: true,
          tone: "primary",
        }
      : {
          label: "Suivre la signature",
          description: "Le contrat est chez le pro.",
          needsAction: false,
          tone: "secondary",
        };
  }

  if (contract.status === "ACCEPTED") {
    return role === "employer"
      ? {
          label: "Marquer termine",
          description: "La mission peut etre completee quand le travail est livre.",
          needsAction: true,
          tone: "primary",
        }
      : {
          label: "Suivre le contrat",
          description: "Le contrat est actif.",
          needsAction: false,
          tone: "secondary",
        };
  }

  if (contract.status === "REJECTED") {
    return {
      label: "Voir la decision",
      description: "Le contrat a ete refuse.",
      needsAction: false,
      tone: "danger",
    };
  }

  if (contract.status === "CANCELLED") {
    return {
      label: "Voir l'historique",
      description: "Le contrat a ete annule.",
      needsAction: false,
      tone: "quiet",
    };
  }

  return {
    label: "Voir le recu",
    description: "Le contrat est complete.",
    needsAction: false,
    tone: "secondary",
  };
}

export function getContractLinks(contract: ContractResponse) {
  const missionId = contract.localMissionId ?? contract.missionId;

  return {
    missionHref: missionId ? `/missions/${missionId}` : null,
    messagesHref: missionId ? `/messages/${missionId}` : null,
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

export function formatDuration(minutes: number | null | undefined) {
  if (!minutes) return "A confirmer";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

function formatLocalPartyName(
  party:
    | ContractResponse["localEmployer"]
    | ContractResponse["localWorker"]
    | null
    | undefined,
  fallback: string,
) {
  const fullName = [party?.firstName, party?.lastName].filter(Boolean).join(" ").trim();
  return fullName || fallback;
}
