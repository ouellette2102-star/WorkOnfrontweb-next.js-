"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Inbox,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  ArrowRight,
  X,
  CheckCircle2,
  Crown,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

type Delivery = {
  id: string;
  leadId: string;
  deliveredAt: string;
  openedAt: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  convertedToMissionId: string | null;
  lead: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    category: string | null;
    city: string | null;
    description: string | null;
    budgetCents: number | null;
    createdAt: string;
  };
};

export default function LeadsInboxPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["leads-mine"],
    queryFn: () => api.getMyLeads(),
    refetchInterval: 30_000,
  });

  const acceptMutation = useMutation({
    mutationFn: (deliveryId: string) => api.acceptLeadDelivery(deliveryId),
    onSuccess: (res) => {
      toast.success("Lead accepté — mission créée", {
        description: `Redirection vers la mission`,
      });
      qc.invalidateQueries({ queryKey: ["leads-mine"] });
      router.push(`/missions/${res.mission.id}`);
    },
    onError: (err) => {
      toast.error("Impossible d'accepter ce lead", {
        description: err instanceof Error ? err.message : "Erreur inconnue",
      });
    },
  });

  const declineMutation = useMutation({
    mutationFn: (deliveryId: string) => api.declineLeadDelivery(deliveryId),
    onSuccess: () => {
      toast.success("Lead décliné");
      qc.invalidateQueries({ queryKey: ["leads-mine"] });
    },
    onError: (err) => {
      toast.error("Impossible de décliner", {
        description: err instanceof Error ? err.message : "Erreur inconnue",
      });
    },
  });

  const openMutation = useMutation({
    mutationFn: (deliveryId: string) => api.markLeadDeliveryOpened(deliveryId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-workon-muted" />
      </div>
    );
  }

  const deliveries = data?.deliveries ?? [];
  const usage = data?.usage ?? { used: 0, limit: 0 };
  const isLocked = usage.limit === 0;
  const atLimit =
    usage.limit !== null && usage.used >= usage.limit;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-workon-primary/10 flex items-center justify-center">
          <Inbox className="h-6 w-6 text-workon-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-workon-ink font-heading">
            Mes leads entrants
          </h1>
          <p className="text-sm text-workon-muted">
            Demandes clients qui vous sont dispatchées automatiquement
          </p>
        </div>
      </div>

      {/* Usage / plan banner */}
      <div
        className={`rounded-2xl p-4 flex items-center justify-between text-sm shadow-card border ${
          isLocked
            ? "bg-workon-primary-subtle border-workon-primary/30"
            : atLimit
              ? "bg-amber-50 border-amber-200"
              : "bg-white border-workon-border"
        }`}
      >
        <div className="flex items-center gap-2">
          <Crown
            className={`h-4 w-4 ${
              isLocked || atLimit ? "text-workon-primary" : "text-workon-muted"
            }`}
          />
          <span className="text-workon-ink">
            {isLocked ? (
              <>
                Les leads sont réservés aux abonnés Pro et Business.
              </>
            ) : usage.limit === null ? (
              <>
                Leads ce mois : <strong>{usage.used}</strong> · illimités
              </>
            ) : (
              <>
                Leads ce mois : <strong>{usage.used}</strong> / {usage.limit}
              </>
            )}
          </span>
        </div>
        {(isLocked || atLimit) && (
          <Link
            href="/pricing"
            className="text-xs font-medium text-workon-primary hover:underline shrink-0"
          >
            {isLocked ? "Voir les plans →" : "Upgrader →"}
          </Link>
        )}
      </div>

      {/* Empty state */}
      {deliveries.length === 0 && !isLocked && (
        <div className="rounded-3xl bg-white border border-workon-border p-8 text-center shadow-card">
          <Inbox className="h-10 w-10 text-workon-muted mx-auto mb-3" />
          <p className="text-sm font-semibold text-workon-ink">
            Pas encore de leads
          </p>
          <p className="text-xs text-workon-muted mt-1">
            Dès qu&apos;une demande correspond à ta zone et ta catégorie, elle
            apparaîtra ici.
          </p>
        </div>
      )}

      {/* Deliveries */}
      {deliveries.length > 0 && (
        <div className="space-y-3">
          {deliveries.map((d) => (
            <DeliveryCard
              key={d.id}
              delivery={d}
              onOpen={() => {
                if (!d.openedAt) openMutation.mutate(d.id);
              }}
              onAccept={() => acceptMutation.mutate(d.id)}
              onDecline={() => declineMutation.mutate(d.id)}
              pending={
                acceptMutation.isPending || declineMutation.isPending
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DeliveryCard({
  delivery,
  onOpen,
  onAccept,
  onDecline,
  pending,
}: {
  delivery: Delivery;
  onOpen: () => void;
  onAccept: () => void;
  onDecline: () => void;
  pending: boolean;
}) {
  const { lead } = delivery;
  const isAccepted = Boolean(delivery.acceptedAt);
  const isDeclined = Boolean(delivery.declinedAt);
  const isProcessed = isAccepted || isDeclined;
  const isNew = !delivery.openedAt && !isProcessed;

  return (
    <div
      className={`rounded-2xl border p-4 shadow-card transition-colors ${
        isAccepted
          ? "bg-green-50 border-green-200"
          : isDeclined
            ? "bg-workon-bg-cream border-workon-border opacity-60"
            : "bg-white border-workon-border"
      }`}
      onMouseEnter={onOpen}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold text-workon-ink truncate">
              {lead.name}
            </p>
            {isNew && (
              <span className="shrink-0 rounded-full bg-workon-primary text-white text-[10px] font-bold px-2 py-0.5">
                NOUVEAU
              </span>
            )}
          </div>
          <p className="text-xs text-workon-muted mt-0.5">
            Reçu{" "}
            {formatDistanceToNow(new Date(delivery.deliveredAt), {
              addSuffix: true,
              locale: fr,
            })}
          </p>
        </div>
        {isAccepted && delivery.convertedToMissionId && (
          <Link
            href={`/missions/${delivery.convertedToMissionId}`}
            className="shrink-0 flex items-center gap-1 text-xs font-medium text-green-700 hover:underline"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Mission
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-workon-gray">
        {lead.category && (
          <div className="flex items-center gap-1.5">
            <span className="rounded-full bg-workon-primary/10 text-workon-primary px-2 py-0.5">
              {lead.category}
            </span>
          </div>
        )}
        {lead.city && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{lead.city}</span>
          </div>
        )}
        {lead.budgetCents !== null && lead.budgetCents > 0 && (
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3 w-3 shrink-0" />
            <span>Budget : {(lead.budgetCents / 100).toFixed(0)} $</span>
          </div>
        )}
        {lead.phone && (
          <a
            href={`tel:${lead.phone}`}
            className="flex items-center gap-1.5 text-workon-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="h-3 w-3 shrink-0" />
            <span className="truncate">{lead.phone}</span>
          </a>
        )}
        {lead.email && (
          <a
            href={`mailto:${lead.email}`}
            className="flex items-center gap-1.5 text-workon-primary hover:underline col-span-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{lead.email}</span>
          </a>
        )}
      </div>

      {lead.description && (
        <p className="mt-3 text-sm text-workon-ink leading-relaxed">
          {lead.description}
        </p>
      )}

      {!isProcessed && (
        <div className="mt-4 flex gap-2">
          <Button
            onClick={onDecline}
            disabled={pending}
            variant="outline"
            className="flex-1"
          >
            <X className="h-4 w-4 mr-1" /> Décliner
          </Button>
          <Button
            onClick={onAccept}
            disabled={pending}
            variant="hero"
            className="flex-1"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Accepter
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      )}

      {isDeclined && (
        <p className="mt-3 text-xs text-workon-muted">
          Décliné{" "}
          {formatDistanceToNow(new Date(delivery.declinedAt!), {
            addSuffix: true,
            locale: fr,
          })}
        </p>
      )}
    </div>
  );
}
