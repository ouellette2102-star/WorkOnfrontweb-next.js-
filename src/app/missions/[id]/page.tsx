"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getMissionById } from "@/lib/missions-api";
import type { Mission } from "@/types/mission";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReviewForm } from "@/components/reviews/review-form";

const statusLabels: Record<string, string> = {
  CREATED: "Disponible",
  RESERVED: "Réservée",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};

const statusColors: Record<string, string> = {
  CREATED: "bg-green-500/10 text-green-400 border-green-500/20",
  RESERVED: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  IN_PROGRESS: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  COMPLETED: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function MissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const [mission, setMission] = useState<Mission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const missionId = params.id as string;

  const loadMission = useCallback(async () => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    setIsLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const token = await getToken();
      if (!token) {
        setError("Impossible de récupérer le token d'authentification");
        return;
      }

      const data = await getMissionById(token, missionId);
      setMission(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors du chargement";

      // Détecter les 404
      if (message.includes("404") || message.includes("introuvable")) {
        setNotFound(true);
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken, missionId, router]);

  useEffect(() => {
    loadMission();
  }, [loadMission]);

  // Loading state
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 py-12">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 rounded bg-white/10" />
            <div className="rounded-3xl border border-white/10 bg-black/40 p-8">
              <div className="space-y-4">
                <div className="h-6 w-3/4 rounded bg-white/10" />
                <div className="h-4 w-1/2 rounded bg-white/10" />
                <div className="h-24 w-full rounded bg-white/10" />
                <div className="flex gap-4">
                  <div className="h-10 w-32 rounded bg-white/10" />
                  <div className="h-10 w-32 rounded bg-white/10" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (notFound) {
    return (
      <div className="min-h-screen bg-neutral-900 py-12">
        <div className="container mx-auto max-w-3xl px-4">
          <Card className="border-white/10 bg-black/40 p-8 text-center">
            <div className="mb-4 text-6xl">🔍</div>
            <h1 className="mb-2 text-2xl font-bold text-white">
              Mission introuvable
            </h1>
            <p className="mb-6 text-white/70">
              Cette mission n&apos;existe pas ou a été supprimée.
            </p>
            <Link href="/missions">
              <Button className="bg-red-600 hover:bg-red-500">
                ← Retour aux missions
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-neutral-900 py-12">
        <div className="container mx-auto max-w-3xl px-4">
          <Card className="border-red-500/20 bg-red-500/10 p-8 text-center">
            <div className="mb-4 text-6xl">⚠️</div>
            <h1 className="mb-2 text-2xl font-bold text-red-400">
              Erreur de chargement
            </h1>
            <p className="mb-6 text-white/70">{error}</p>
            <div className="flex justify-center gap-4">
              <Button
                onClick={loadMission}
                className="bg-red-600 hover:bg-red-500"
              >
                🔄 Réessayer
              </Button>
              <Link href="/missions">
                <Button variant="outline">← Retour aux missions</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Mission not loaded (shouldn't happen but safe fallback)
  if (!mission) {
    return null;
  }

  // Format helpers
  const formattedRate = mission.hourlyRate
    ? `${mission.hourlyRate.toFixed(2)} $/h`
    : mission.priceCents
      ? `${(mission.priceCents / 100).toFixed(2)} $`
      : "Prix à discuter";

  const formattedDate = mission.startsAt
    ? new Date(mission.startsAt).toLocaleDateString("fr-CA", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Date flexible";

  const formattedCreatedAt = new Date(mission.createdAt).toLocaleDateString(
    "fr-CA",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  // Determine which CTAs to show based on status
  const showChat = ["RESERVED", "IN_PROGRESS", "COMPLETED"].includes(
    mission.status
  );
  const showPay = mission.status === "COMPLETED";
  
  // Show review button if: mission COMPLETED + current user is employer (not worker)
  const isEmployer = mission.employerId === user?.id;
  const canReview = mission.status === "COMPLETED" && isEmployer && mission.workerId && !reviewSubmitted;

  return (
    <div className="min-h-screen bg-neutral-900 py-12">
      <div className="container mx-auto max-w-3xl px-4">
        {/* Back link */}
        <Link
          href="/missions"
          className="mb-6 inline-block text-sm text-white/70 transition hover:text-red-400"
        >
          ← Retour aux missions
        </Link>

        {/* Main card */}
        <Card className="border-white/10 bg-black/40 p-8">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold text-white">{mission.title}</h1>
            <Badge
              className={`${statusColors[mission.status] ?? "bg-gray-500/10 text-gray-400"} shrink-0 text-sm`}
            >
              {statusLabels[mission.status] ?? mission.status}
            </Badge>
          </div>

          {/* Description */}
          {mission.description && (
            <div className="mb-6">
              <h2 className="mb-2 text-lg font-semibold text-white/90">
                Description
              </h2>
              <p className="whitespace-pre-wrap text-white/70">
                {mission.description}
              </p>
            </div>
          )}

          {/* Metadata grid */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Price */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-1 text-sm text-white/60">💰 Budget</div>
              <div className="text-xl font-bold text-green-400">
                {formattedRate}
              </div>
            </div>

            {/* Date */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-1 text-sm text-white/60">📅 Date</div>
              <div className="text-lg font-semibold text-white">
                {formattedDate}
              </div>
            </div>

            {/* City */}
            {mission.city && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="mb-1 text-sm text-white/60">📍 Ville</div>
                <div className="text-lg font-semibold text-white">
                  {mission.city}
                </div>
              </div>
            )}

            {/* Category */}
            {mission.category && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="mb-1 text-sm text-white/60">🏷️ Catégorie</div>
                <div className="text-lg font-semibold capitalize text-white">
                  {mission.category}
                </div>
              </div>
            )}

            {/* Address */}
            {mission.address && (
              <div className="col-span-full rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="mb-1 text-sm text-white/60">🏠 Adresse</div>
                <div className="text-lg font-semibold text-white">
                  {mission.address}
                </div>
              </div>
            )}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-4">
            {showChat && (
              <Link href={`/missions/${mission.id}/chat`}>
                <Button className="bg-blue-600 hover:bg-blue-500">
                  💬 Ouvrir le chat
                </Button>
              </Link>
            )}

            {showPay && (
              <Link href={`/missions/${mission.id}/pay`}>
                <Button className="bg-green-600 hover:bg-green-500">
                  💳 Payer la mission
                </Button>
              </Link>
            )}

            {canReview && !showReviewForm && (
              <Button
                onClick={() => setShowReviewForm(true)}
                className="bg-yellow-600 hover:bg-yellow-500"
              >
                ⭐ Laisser un avis
              </Button>
            )}

            {mission.status === "CREATED" && (
              <Link href={`/missions/available`}>
                <Button variant="outline">🔍 Voir les missions disponibles</Button>
              </Link>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && mission.workerId && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-4 text-lg font-bold text-white">Laisser un avis</h3>
              <ReviewForm
                missionId={mission.id}
                workerId={mission.workerId}
                onSuccess={() => {
                  setShowReviewForm(false);
                  setReviewSubmitted(true);
                }}
                onCancel={() => setShowReviewForm(false)}
              />
            </div>
          )}

          {/* Review submitted confirmation */}
          {reviewSubmitted && (
            <div className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-center">
              <p className="text-green-400">✅ Merci pour votre avis !</p>
              {mission.workerId && (
                <Link
                  href={`/profile/${mission.workerId}`}
                  className="mt-2 inline-block text-sm text-white/70 underline hover:text-white"
                >
                  Voir le profil du worker
                </Link>
              )}
            </div>
          )}

          {/* Footer info */}
          <div className="mt-8 border-t border-white/10 pt-4 text-sm text-white/50">
            <p>Mission créée le {formattedCreatedAt}</p>
            <p className="mt-1">ID: {mission.id}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

