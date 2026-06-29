import type { InvoiceResponse } from "@/lib/api-client";

export type InvoiceUiShape = Pick<
  InvoiceResponse,
  | "id"
  | "missionId"
  | "subtotal"
  | "platformFee"
  | "taxes"
  | "tps"
  | "tvq"
  | "total"
  | "currency"
  | "createdAt"
  | "paidAt"
> & {
  status: InvoiceResponse["status"] | (string & {});
  invoiceNumber?: string | null;
  description?: string | null;
  paymentTerms?: string | null;
  supplier?: Partial<InvoiceResponse["supplier"]> | null;
  client?: Partial<InvoiceResponse["client"]> | null;
  review?: Partial<InvoiceResponse["review"]> | null;
};

export type InvoiceFilter = "all" | "action" | "pending" | "paid" | "closed";

const statusMeta: Record<
  InvoiceResponse["status"],
  {
    label: string;
    description: string;
    className: string;
    dotClassName: string;
  }
> = {
  PENDING: {
    label: "En attente",
    description: "Paiement ou confirmation a finaliser.",
    className: "bg-amber-100 text-amber-800 border-amber-200",
    dotClassName: "bg-amber-500",
  },
  PROCESSING: {
    label: "Traitement",
    description: "Paiement en cours de traitement.",
    className: "bg-sky-100 text-sky-800 border-sky-200",
    dotClassName: "bg-sky-500",
  },
  PAID: {
    label: "Payee",
    description: "Facture payee, revue escrow a suivre si requise.",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dotClassName: "bg-emerald-500",
  },
  FAILED: {
    label: "Echouee",
    description: "Paiement a reprendre ou verifier.",
    className: "bg-red-100 text-red-800 border-red-200",
    dotClassName: "bg-red-500",
  },
  CANCELLED: {
    label: "Annulee",
    description: "Facture fermee sans paiement actif.",
    className: "bg-neutral-100 text-neutral-700 border-neutral-200",
    dotClassName: "bg-neutral-500",
  },
  REFUNDED: {
    label: "Remboursee",
    description: "Montant retourne au client.",
    className: "bg-violet-100 text-violet-800 border-violet-200",
    dotClassName: "bg-violet-500",
  },
};

export function getInvoiceStatusMeta(status: InvoiceUiShape["status"]) {
  return (
    statusMeta[status as InvoiceResponse["status"]] ?? {
      label: "A verifier",
      description: "Statut facture non reconnu.",
      className: "bg-neutral-100 text-neutral-700 border-neutral-200",
      dotClassName: "bg-neutral-500",
    }
  );
}

export function formatInvoiceAmount(value: number, currency: string): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency,
  }).format(value);
}

export function formatInvoiceDate(
  value: string | null | undefined,
  fallback = "Aucune date",
): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString("fr-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatInvoiceDateTime(
  value: string | null | undefined,
  fallback = "Aucune date",
): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString("fr-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function getInvoiceSortTime(invoice: InvoiceUiShape): number {
  const value = invoice.paidAt ?? invoice.createdAt;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function getInvoiceDisplayNumber(invoice: InvoiceUiShape): string {
  return invoice.invoiceNumber ?? `#${invoice.id.slice(0, 8)}`;
}

export function getInvoiceTitle(invoice: InvoiceUiShape): string {
  return invoice.description?.trim() || "Mission WorkOn";
}

export function getInvoiceParties(invoice: InvoiceUiShape) {
  return {
    supplier: invoice.supplier?.name?.trim() || "Prestataire",
    client: invoice.client?.name?.trim() || "Client",
  };
}

export function getInvoiceAcceptedCount(invoice: InvoiceUiShape): number {
  return [
    invoice.review?.clientAcceptedAt,
    invoice.review?.workerAcceptedAt,
  ].filter(Boolean).length;
}

export function invoiceNeedsReview(invoice: InvoiceUiShape): boolean {
  if (invoice.status !== "PAID") return false;
  if (invoice.review?.escrowReleasedAt || invoice.review?.clientDisputedAt) return false;
  return getInvoiceAcceptedCount(invoice) < 2;
}

export function getInvoiceReviewState(invoice: InvoiceUiShape) {
  if (invoice.review?.escrowReleasedAt) {
    return {
      label: "Escrow libere",
      detail: formatInvoiceDate(invoice.review.escrowReleasedAt),
      tone: "success" as const,
      actionRequired: false,
    };
  }

  if (invoice.review?.clientDisputedAt) {
    return {
      label: "Litige ouvert",
      detail: invoice.review.disputeReason || "Resolution WorkOn requise",
      tone: "danger" as const,
      actionRequired: true,
    };
  }

  if (invoiceNeedsReview(invoice)) {
    const accepted = getInvoiceAcceptedCount(invoice);
    return {
      label: "Revue requise",
      detail: `${accepted}/2 confirmations`,
      tone: "warning" as const,
      actionRequired: true,
    };
  }

  if (invoice.status === "PAID") {
    return {
      label: "Paiement confirme",
      detail: invoice.paidAt ? formatInvoiceDate(invoice.paidAt) : "Facture payee",
      tone: "success" as const,
      actionRequired: false,
    };
  }

  const meta = getInvoiceStatusMeta(invoice.status);
  return {
    label: meta.label,
    detail: meta.description,
    tone: invoice.status === "FAILED" ? ("danger" as const) : ("neutral" as const),
    actionRequired: invoice.status === "FAILED",
  };
}

export function getInvoiceFilterGroup(invoice: InvoiceUiShape): InvoiceFilter {
  if (invoiceNeedsReview(invoice) || invoice.status === "FAILED") return "action";
  if (invoice.status === "PENDING" || invoice.status === "PROCESSING") return "pending";
  if (invoice.status === "PAID") return "paid";
  return "closed";
}
