"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Star, Shield, CheckCircle2, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function WorkerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: worker, isLoading } = useQuery({
    queryKey: ["worker", id],
    queryFn: () => api.getWorker(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-red-accent" />
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="text-center py-12 text-workon-muted">Professionnel non trouvé</div>
    );
  }

  const fullName = worker.fullName || `${worker.firstName} ${worker.lastName}`;

  return (
    <div className="pb-6 bg-workon-bg min-h-screen">
      {/* Hero photo */}
      <div className="relative h-72 bg-gradient-to-b from-workon-primary/10 to-workon-bg">
        {worker.photoUrl ? (
          <img
            src={worker.photoUrl}
            alt={fullName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-workon-muted/30">
            {worker.firstName[0]}
            {worker.lastName[0]}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-workon-bg via-workon-bg/50 to-transparent" />
      </div>

      <div className="px-4 -mt-16 relative space-y-4">
        {/* Name + rating */}
        <div>
          <h1 className="text-2xl font-bold text-workon-ink">{fullName}</h1>
          {worker.jobTitle && (
            <p className="text-workon-muted">
              {worker.jobTitle}
              {worker.city && ` à ${worker.city}`}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4",
                    i < Math.round(worker.averageRating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-200",
                  )}
                />
              ))}
            </div>
            <span className="font-semibold text-workon-ink">{worker.completionPercentage}%</span>
            {worker.badges?.some((b) => b.type === "top_performer") && (
              <span className="rounded-full bg-workon-primary/10 text-workon-primary px-2.5 py-0.5 text-xs font-semibold">
                Top Performer
              </span>
            )}
          </div>
        </div>

        {/* Badges */}
        {worker.badges && worker.badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {worker.badges.map((badge) => (
              <span
                key={badge.label}
                className="inline-flex items-center gap-1 rounded-full border border-workon-border bg-white px-3 py-1 text-sm text-workon-ink"
              >
                <Shield className="h-3.5 w-3.5 text-workon-primary" />
                {badge.label}
              </span>
            ))}
          </div>
        )}

        {/* CTA — Réserver ce professionnel */}
        <Button
          onClick={() => router.push(`/reserve/${worker.id}`)}
          className="w-full h-12 text-base"
        >
          <Shield className="h-4 w-4 mr-2" />
          Réserver ce professionnel
        </Button>

        {/* Why choose section */}
        <div className="space-y-2 pt-2">
          <h2 className="font-semibold text-workon-ink">Pourquoi choisir {worker.firstName}:</h2>
          {["Identité vérifiée", "Assurances & conformité", "Contrat sécurisé WorkOn"].map(
            (text) => (
              <div key={text} className="flex items-center gap-2 text-sm text-workon-muted">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>{text}</span>
              </div>
            ),
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="rounded-xl bg-white border border-workon-border p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-workon-ink">{worker.completedMissions}</p>
            <p className="text-xs text-workon-muted">Missions complétées</p>
          </div>
          <div className="rounded-xl bg-white border border-workon-border p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-workon-ink">{worker.reviewCount}</p>
            <p className="text-xs text-workon-muted">Avis clients</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-workon-muted pt-4 space-y-1">
          <p>WorkOn fournit l&apos;infrastructure de mise en relation et paiement.</p>
          <p>WorkOn n&apos;est pas partie au contrat de service.</p>
          <p>Paiement sécurisé par Stripe.</p>
        </div>
      </div>
    </div>
  );
}
