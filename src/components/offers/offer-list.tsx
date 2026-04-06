"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type OfferResponse } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, User } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { frCA } from "date-fns/locale";

type Props = {
  missionId: string;
  isEmployer: boolean;
};

const statusLabels: Record<string, { label: string; className: string }> = {
  PENDING: { label: "En attente", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  ACCEPTED: { label: "Acceptée", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  DECLINED: { label: "Refusée", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export function OfferList({ missionId, isEmployer }: Props) {
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data: offers, isLoading } = useQuery({
    queryKey: ["offers", missionId],
    queryFn: () => api.getOffersForMission(missionId),
  });

  const handleAccept = async (offerId: string) => {
    setActionLoading(offerId);
    try {
      await api.acceptOffer(offerId);
      toast.success("Offre acceptée !");
      queryClient.invalidateQueries({ queryKey: ["offers", missionId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (offerId: string) => {
    setActionLoading(offerId);
    try {
      await api.rejectOffer(offerId);
      toast.success("Offre refusée");
      queryClient.invalidateQueries({ queryKey: ["offers", missionId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-white/40" />
      </div>
    );
  }

  if (!offers || offers.length === 0) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/5 p-4 text-center text-sm text-white/40">
        Aucune offre pour le moment
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white/70">
        {offers.length} offre{offers.length > 1 ? "s" : ""} reçue{offers.length > 1 ? "s" : ""}
      </h3>
      {offers.map((offer: OfferResponse) => {
        const status = statusLabels[offer.status] || statusLabels.PENDING;
        const isActionable = isEmployer && offer.status === "PENDING";
        const loading = actionLoading === offer.id;

        return (
          <div
            key={offer.id}
            className="rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <User className="h-4 w-4 text-white/60" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {offer.worker?.firstName} {offer.worker?.lastName}
                  </p>
                  {offer.worker?.city && (
                    <p className="text-xs text-white/40">📍 {offer.worker.city}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-400">
                  {offer.price.toFixed(2)} $
                </p>
                <Badge className={`${status.className} text-[10px]`}>
                  {status.label}
                </Badge>
              </div>
            </div>

            {offer.message && (
              <p className="mt-2 text-sm text-white/60">{offer.message}</p>
            )}

            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-white/30">
                {formatDistanceToNow(new Date(offer.createdAt), {
                  addSuffix: true,
                  locale: frCA,
                })}
              </span>

              {isActionable && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(offer.id)}
                    disabled={loading}
                    className="h-8 border-red-500/20 text-red-400 hover:bg-red-500/10"
                  >
                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="mr-1 h-3 w-3" />}
                    Refuser
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAccept(offer.id)}
                    disabled={loading}
                    className="h-8 bg-green-600 hover:bg-green-500"
                  >
                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
                    Accepter
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
