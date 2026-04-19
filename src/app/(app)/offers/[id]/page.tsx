"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { api, type OfferResponse } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  User,
  MapPin,
  Calendar,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { frCA } from "date-fns/locale";
import { toast } from "sonner";

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  PENDING: {
    label: "En attente",
    className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
  ACCEPTED: {
    label: "Acceptée",
    className: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  DECLINED: {
    label: "Refusée",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
  },
};

export default function OfferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const {
    data: offer,
    isLoading,
    isError,
  } = useQuery<OfferResponse>({
    queryKey: ["offer", id],
    queryFn: () => api.getOfferById(id),
    enabled: !!id,
    retry: 1,
  });

  const acceptMutation = useMutation({
    mutationFn: () => api.acceptOffer(id),
    onSuccess: () => {
      toast.success("Offre acceptée");
      queryClient.invalidateQueries({ queryKey: ["offer", id] });
      queryClient.invalidateQueries({ queryKey: ["my-offers"] });
      if (offer?.missionId) {
        router.push(`/missions/${offer.missionId}`);
      }
    },
    onError: () => toast.error("Impossible d'accepter l'offre"),
  });

  const rejectMutation = useMutation({
    mutationFn: () => api.rejectOffer(id),
    onSuccess: () => {
      toast.success("Offre refusée");
      queryClient.invalidateQueries({ queryKey: ["offer", id] });
      queryClient.invalidateQueries({ queryKey: ["my-offers"] });
    },
    onError: () => toast.error("Impossible de refuser l'offre"),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-workon-primary" />
      </div>
    );
  }

  if (isError || !offer) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-workon-muted">Offre introuvable.</p>
        <Link
          href="/offers"
          className="mt-4 inline-block text-sm text-workon-primary underline"
        >
          Voir toutes mes offres
        </Link>
      </div>
    );
  }

  const status = statusConfig[offer.status] ?? statusConfig.PENDING;
  const isMissionOwner = offer.mission && user?.id !== offer.workerId;
  const isPending = offer.status === "PENDING";
  const isBusy =
    acceptMutation.isPending || rejectMutation.isPending;

  return (
    <div className="px-4 py-6 space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-workon-border transition"
          aria-label="Retour"
        >
          <ArrowLeft className="h-5 w-5 text-workon-muted" />
        </button>
        <h1 className="text-lg font-bold text-workon-ink">Détail de l&apos;offre</h1>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-2">
        <Badge className={`${status.className} text-xs`}>{status.label}</Badge>
        <span className="text-xs text-workon-muted">
          {formatDistanceToNow(new Date(offer.createdAt), {
            addSuffix: true,
            locale: frCA,
          })}
        </span>
      </div>

      {/* Mission info */}
      {offer.mission && (
        <Link href={`/missions/${offer.missionId}`}>
          <div className="rounded-2xl border border-workon-border bg-white p-4 shadow-sm hover:border-workon-primary/30 transition">
            <p className="text-xs text-workon-muted mb-1">Mission</p>
            <h2 className="font-semibold text-workon-ink">{offer.mission.title}</h2>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-workon-muted">
              {offer.mission.category && (
                <span className="flex items-center gap-1">
                  🏷️ {offer.mission.category}
                </span>
              )}
              {offer.mission.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {offer.mission.city}
                </span>
              )}
            </div>
          </div>
        </Link>
      )}

      {/* Offer details card */}
      <div className="rounded-2xl border border-workon-border bg-white p-4 shadow-sm space-y-3">
        {/* Price */}
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-workon-primary" />
          <span className="text-2xl font-bold text-workon-ink">
            {offer.price.toFixed(2)} $
          </span>
        </div>

        {/* Worker */}
        {offer.worker && (
          <div className="flex items-center gap-2 text-sm text-workon-muted">
            <User className="h-4 w-4" />
            <span>
              {offer.worker.firstName} {offer.worker.lastName}
              {offer.worker.city && ` — ${offer.worker.city}`}
            </span>
          </div>
        )}

        {/* Message */}
        {offer.message && (
          <div className="rounded-xl bg-workon-bg p-3">
            <p className="text-xs text-workon-muted mb-1">Message</p>
            <p className="text-sm text-workon-ink whitespace-pre-line">
              {offer.message}
            </p>
          </div>
        )}
      </div>

      {/* Actions — only for mission owner when offer is pending */}
      {isMissionOwner && isPending && (
        <div className="flex gap-3">
          <Button
            className="flex-1 bg-workon-primary text-white hover:bg-workon-primary/90"
            onClick={() => acceptMutation.mutate()}
            disabled={isBusy}
          >
            {acceptMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" /> Accepter
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-red-300 text-red-500 hover:bg-red-50"
            onClick={() => rejectMutation.mutate()}
            disabled={isBusy}
          >
            {rejectMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" /> Décliner
              </>
            )}
          </Button>
        </div>
      )}

      <Link
        href="/offers"
        className="block text-center text-sm text-workon-muted hover:text-workon-primary transition"
      >
        ← Toutes mes offres
      </Link>
    </div>
  );
}
