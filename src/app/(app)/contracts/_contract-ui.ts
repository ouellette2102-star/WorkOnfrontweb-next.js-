import type { ContractResponse } from "@/lib/api-client";

export type ContractViewerRole = "employer" | "worker" | "unknown";
export type ContractActionTone = "primary" | "secondary" | "quiet" | "danger";
export type ContractSignatureKey = "client" | "worker";

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

export function getContractParties(contract: ContractResponse) {
  return {
    employer: {
      label: "Client",
      name: formatLocalPartyName(contract.localEmployer, "Client WorkOn"),
      city: contract.localEmployer?.city ?? null,
      detail: contract.localEmployer?.businessName ?? null,
      avatarUrl: contract.localEmployer?.pictureUrl ?? null,
    },
    worker: {
      label: "Professionnel",
      name: formatLocalPartyName(contract.localWorker, "Pro WorkOn"),
      city: contract.localWorker?.city ?? null,
      detail: contract.localWorker?.jobTitle ?? null,
      avatarUrl: contract.localWorker?.pictureUrl ?? null,
      ratingAverage: contract.localWorker?.ratingAverage ?? null,
      reviewCount: contract.localWorker?.reviewCount ?? 0,
    },
  };
}

export function getCounterparty(contract: ContractResponse, role: ContractViewerRole) {
  const parties = getContractParties(contract);

  if (role === "employer") {
    return {
      label: parties.worker.label,
      name: parties.worker.name,
      city: parties.worker.city,
      detail: parties.worker.detail,
    };
  }

  if (role === "worker") {
    return {
      label: parties.employer.label,
      name: parties.employer.name,
      city: parties.employer.city,
      detail: parties.employer.detail,
    };
  }

  return {
    label: "Partie",
    name: parties.employer.name,
    city: parties.employer.city,
    detail: parties.employer.detail,
  };
}

export function getSignatureProgress(contract: ContractResponse) {
  const steps: Array<{
    key: ContractSignatureKey;
    label: string;
    signed: boolean;
    pendingLabel: string;
  }> = [
    {
      key: "client",
      label: "Client",
      signed: contract.signedByEmployer,
      pendingLabel: contract.status === "DRAFT" ? "A envoyer" : "En attente",
    },
    {
      key: "worker",
      label: "Pro",
      signed: contract.signedByWorker,
      pendingLabel: contract.status === "PENDING" ? "Signature requise" : "En attente",
    },
  ];

  const signedCount = steps.filter((step) => step.signed).length;

  return {
    steps,
    signedCount,
    totalCount: steps.length,
    percent: Math.round((signedCount / steps.length) * 100),
    label: `${signedCount}/${steps.length} signatures`,
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

export function getContractTimeframe(contract: ContractResponse) {
  if (contract.startAt && contract.endAt) {
    return `${formatDate(contract.startAt)} au ${formatDate(contract.endAt)}`;
  }

  if (contract.startAt) {
    return `Debut ${formatDate(contract.startAt)}`;
  }

  if (contract.endAt) {
    return `Fin ${formatDate(contract.endAt)}`;
  }

  return "Dates a confirmer";
}

export function getMaterialLabel(value: boolean | null | undefined) {
  if (value === null || typeof value === "undefined") return "Materiel a confirmer";
  return value ? "Materiel fourni" : "Materiel a apporter";
}

export function getContractSortTime(contract: ContractResponse) {
  const time = new Date(contract.updatedAt).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function getContractStatusRank(status: ContractResponse["status"]) {
  const rank: Record<ContractResponse["status"], number> = {
    PENDING: 0,
    DRAFT: 1,
    ACCEPTED: 2,
    COMPLETED: 3,
    REJECTED: 4,
    CANCELLED: 5,
  };

  return rank[status];
}

export function getContractStatusGroup(
  status: ContractResponse["status"],
): "pending" | "active" | "completed" | "closed" {
  if (status === "DRAFT" || status === "PENDING") return "pending";
  if (status === "ACCEPTED") return "active";
  if (status === "COMPLETED") return "completed";
  return "closed";
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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";

  return new Intl.DateTimeFormat("fr-CA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDuration(minutes: number | null | undefined) {
  if (!minutes) return "A confirmer";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function formatRelativeTime(value: string | null | undefined) {
  if (!value) return "date inconnue";

  const date = new Date(value);
  const time = date.getTime();
  if (Number.isNaN(time)) return "date inconnue";

  const diffMs = Date.now() - time;
  const diffMinutes = Math.round(diffMs / 60000);
  const absMinutes = Math.abs(diffMinutes);

  if (absMinutes < 60) {
    return diffMinutes >= 0
      ? `il y a ${Math.max(1, absMinutes)} min`
      : `dans ${Math.max(1, absMinutes)} min`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  const absHours = Math.abs(diffHours);
  if (absHours < 24) {
    return diffHours >= 0
      ? `il y a ${absHours} h`
      : `dans ${absHours} h`;
  }

  const diffDays = Math.round(diffHours / 24);
  const absDays = Math.abs(diffDays);
  if (absDays < 30) {
    return diffDays >= 0
      ? `il y a ${absDays} j`
      : `dans ${absDays} j`;
  }

  return formatDate(value);
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
