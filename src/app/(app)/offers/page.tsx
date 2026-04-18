"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type OfferResponse } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { frCA } from "date-fns/locale";

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: "En attente", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  ACCEPTED: { label: "Acceptée", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  DECLINED: { label: "Refusée", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function MyOffersPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: offers, isLoading } = useQuery({
    queryKey: ["my-offers"],
    queryFn: () => api.getMyOffers(),
    enabled: isAuthenticated,
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-workon-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-workon-ink">Mes offres</h1>
        <p className="text-sm text-workon-muted">
          Suivez le statut de vos propositions
        </p>
      </div>

      {!offers || offers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="mb-4 h-12 w-12 text-workon-muted/40" />
          <h3 className="mb-2 text-lg font-semibold text-workon-ink">Aucune offre</h3>
          <p className="text-sm text-workon-muted">
            Vos offres apparaîtront ici quand vous proposerez vos services
          </p>
          <Link
            href="/missions/mine"
            className="mt-4 rounded-xl bg-workon-primary px-6 py-2 text-sm font-semibold text-white hover:bg-workon-primary/90"
          >
            Trouver des missions
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer: OfferResponse) => {
            const status = statusConfig[offer.status] || statusConfig.PENDING;
            return (
              <Link key={offer.id} href={`/missions/${offer.missionId}`}>
                <div className="rounded-2xl border border-workon-border bg-white p-4 transition hover:border-workon-primary/30 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-workon-ink">
                        {offer.mission?.title ?? "Mission"}
                      </h3>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-workon-muted">
                        {offer.mission?.category && <span>🏷️ {offer.mission.category}</span>}
                        {offer.mission?.city && <span>📍 {offer.mission.city}</span>}
                        <span>
                          {formatDistanceToNow(new Date(offer.createdAt), {
                            addSuffix: true,
                            locale: frCA,
                          })}
                        </span>
                      </div>
                      {offer.message && (
                        <p className="mt-2 truncate text-sm text-workon-muted">
                          {offer.message}
                        </p>
                      )}
                    </div>
                    <div className="ml-3 text-right">
                      <p className="text-lg font-bold text-green-400">
                        {offer.price.toFixed(2)} $
                      </p>
                      <Badge className={`mt-1 ${status.className} text-[10px]`}>
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
