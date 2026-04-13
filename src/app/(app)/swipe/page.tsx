"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { api, type SwipeCandidate } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  MapPin,
  Star,
  ShieldCheck,
  Tag,
  User,
  Loader2,
  Heart,
  X,
  MessageCircle,
} from "lucide-react";

/**
 * /swipe — Discover pros (employers) or missions (workers)
 *
 * Role-aware: employers swipe through workers, workers swipe through employers.
 * Uses the existing backend GET /api/v1/swipe/candidates + POST /api/v1/swipe/action.
 * Mutual LIKE creates a SwipeMatch → can start a mission directly.
 */
export default function SwipePage() {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);

  // Employer → find workers | Worker → find employers
  const targetRole = user?.role === "employer" ? "worker" : "employer";
  const pageTitle = user?.role === "employer"
    ? "Trouver un pro"
    : "Trouver un client";
  const pageSubtitle = user?.role === "employer"
    ? "Swipez pour découvrir les meilleurs travailleurs"
    : "Swipez pour découvrir des opportunités";

  const {
    data: candidates,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["swipe-candidates", targetRole],
    queryFn: () => api.getSwipeCandidates({ role: targetRole }),
  });

  const swipeMutation = useMutation({
    mutationFn: (data: { targetUserId: string; action: "LIKE" | "PASS" | "SUPERLIKE" }) =>
      api.recordSwipe(data),
    onSuccess: (result) => {
      if (result.matched) {
        toast.success("🎉 Match ! Vous pouvez maintenant démarrer une mission ensemble.");
      }
    },
    onError: () => {
      toast.error("Erreur lors de l'enregistrement");
    },
  });

  const current = candidates?.[currentIndex];
  const remaining = (candidates?.length ?? 0) - currentIndex - 1;

  const advance = () => {
    setCurrentIndex((i) => i + 1);
    setExitDirection(null);
  };

  const handleSwipe = (action: "PASS" | "LIKE" | "SUPERLIKE") => {
    if (!current) return;
    setExitDirection(action === "PASS" ? "left" : "right");
    swipeMutation.mutate({ targetUserId: current.id, action });
    setTimeout(advance, 300);
  };

  // --- Loading ---
  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-workon-primary" />
      </div>
    );
  }

  // --- Error ---
  if (error) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-600">Erreur de chargement. Réessaie plus tard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-workon-bg px-4 pb-24 pt-6">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-workon-ink">{pageTitle}</h1>
          <p className="text-sm text-workon-muted">{pageSubtitle}</p>
        </div>

        {/* Empty state */}
        {!current ? (
          <div className="rounded-3xl border border-workon-border bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-workon-primary/10">
              <Heart className="h-8 w-8 text-workon-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-workon-ink">
              Tous les profils parcourus !
            </h3>
            <p className="text-sm text-workon-muted">
              Reviens plus tard pour découvrir de nouveaux profils.
            </p>
          </div>
        ) : (
          <>
            {/* Progress */}
            <div className="mb-3 flex items-center justify-between text-xs text-workon-muted">
              <span>{currentIndex + 1} / {candidates?.length ?? 0}</span>
              <span>{remaining} restant{remaining > 1 ? "s" : ""}</span>
            </div>

            {/* Card */}
            <div className="relative h-[460px]">
              <AnimatePresence initial={false}>
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0, x: 0 }}
                  exit={{
                    opacity: 0,
                    scale: 0.85,
                    x: exitDirection === "left" ? -350 : exitDirection === "right" ? 350 : 0,
                    rotateZ: exitDirection === "left" ? -20 : exitDirection === "right" ? 20 : 0,
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="absolute inset-0 overflow-hidden rounded-3xl border border-workon-border bg-white shadow-md"
                >
                  {/* Avatar header */}
                  <div className="flex h-36 items-center justify-center bg-gradient-to-br from-[#134021] to-[#1A5C2E]">
                    {current.pictureUrl ? (
                      <img
                        src={current.pictureUrl}
                        alt={current.firstName}
                        className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-lg"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-workon-bg shadow-lg">
                        <User className="h-10 w-10 text-workon-primary" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h2 className="text-xl font-bold text-workon-ink">
                      {current.firstName} {current.lastName}
                    </h2>

                    {current.city && (
                      <div className="mt-1 flex items-center gap-1 text-sm text-workon-muted">
                        <MapPin className="h-3.5 w-3.5" />
                        {current.city}
                      </div>
                    )}

                    <div className="mt-4 space-y-2">
                      {/* Rating */}
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-workon-ink">
                          {current.avgRating > 0
                            ? `${current.avgRating.toFixed(1)} / 5 (${current.reviewCount} avis)`
                            : "Nouveau profil"}
                        </span>
                      </div>

                      {/* Trust tier */}
                      {current.trustTier && current.trustTier !== "BASIC" && (
                        <div className="flex items-center gap-2 text-sm">
                          <ShieldCheck className="h-4 w-4 text-workon-primary" />
                          <span className="capitalize text-workon-ink">
                            {current.trustTier.toLowerCase()}
                          </span>
                        </div>
                      )}

                      {/* Category */}
                      {current.category && (
                        <div className="flex items-center gap-2 text-sm">
                          <Tag className="h-4 w-4 text-workon-accent" />
                          <span className="rounded-full bg-workon-accent/10 px-2.5 py-0.5 text-xs font-medium text-workon-accent">
                            {current.category}
                          </span>
                        </div>
                      )}

                      {/* Bio */}
                      {current.bio && (
                        <p className="mt-2 text-sm leading-relaxed text-workon-muted line-clamp-3">
                          {current.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Action buttons */}
            <div className="mt-5 flex items-center justify-center gap-4">
              <button
                onClick={() => handleSwipe("PASS")}
                disabled={swipeMutation.isPending}
                className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-workon-border bg-white text-workon-muted shadow-sm transition hover:border-red-300 hover:text-red-500 active:scale-95"
                aria-label="Passer"
              >
                <X className="h-6 w-6" />
              </button>

              <button
                onClick={() => handleSwipe("LIKE")}
                disabled={swipeMutation.isPending}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-workon-primary text-white shadow-lg transition hover:bg-workon-primary/90 active:scale-95"
                aria-label="J'aime"
              >
                <Heart className="h-7 w-7" />
              </button>

              <button
                onClick={() => handleSwipe("SUPERLIKE")}
                disabled={swipeMutation.isPending}
                className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-workon-accent bg-white text-workon-accent shadow-sm transition hover:bg-workon-accent/10 active:scale-95"
                aria-label="Super like — Contacter"
              >
                <MessageCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-3 flex justify-center gap-8 text-[10px] text-workon-muted">
              <span>Passer</span>
              <span>J&apos;aime</span>
              <span>Contacter</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
