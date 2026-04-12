"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { api, type SwipeCandidate } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function EmployerDiscoverPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);

  const {
    data: candidates,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["swipe-candidates", "worker"],
    queryFn: () => api.getSwipeCandidates({ role: "worker" }),
  });

  const swipeMutation = useMutation({
    mutationFn: (data: { targetUserId: string; action: "LIKE" | "PASS" | "SUPERLIKE" }) =>
      api.recordSwipe(data),
    onSuccess: (result) => {
      if (result.matched) {
        toast.success("Match ! Vous avez un nouveau match !");
      }
    },
    onError: () => {
      toast.error("Erreur lors de l\u2019enregistrement");
    },
  });

  const currentCandidate = candidates?.[currentIndex];

  const handleNext = () => {
    if (candidates && currentIndex < candidates.length - 1) {
      setCurrentIndex((i) => i + 1);
      setDirection(null);
    } else {
      setCurrentIndex((candidates?.length ?? 0) + 1);
    }
  };

  const handleSwipe = (action: "PASS" | "LIKE" | "SUPERLIKE") => {
    if (!currentCandidate) return;
    setDirection(action === "PASS" ? "left" : "right");
    swipeMutation.mutate({ targetUserId: currentCandidate.id, action });
    setTimeout(handleNext, 300);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-workon-bg">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-workon-bg p-6">
        <div className="mx-auto max-w-2xl rounded-3xl border border-workon-accent/30 bg-workon-accent/5 p-8 text-center shadow-sm">
          <p className="text-workon-accent">Erreur lors du chargement des profils</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-workon-bg p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-workon-ink">
            Découvrir des travailleurs
          </h1>
          <p className="text-lg text-workon-muted">
            Trouvez les meilleurs profils pour vos missions
          </p>
        </div>

        {!currentCandidate ? (
          <div className="rounded-3xl border border-workon-border bg-white p-12 text-center shadow-sm">
            <div className="mb-4 text-6xl">&#x2705;</div>
            <h3 className="mb-2 text-xl font-semibold text-workon-ink">
              Tous les profils parcourus !
            </h3>
            <p className="text-workon-muted">
              Revenez plus tard pour découvrir de nouveaux travailleurs
            </p>
          </div>
        ) : (
          <>
            {/* Progress */}
            <div className="mb-4 flex items-center justify-between text-sm text-workon-muted">
              <span>
                {currentIndex + 1} / {candidates?.length ?? 0}
              </span>
              <span>
                {(candidates?.length ?? 0) - currentIndex - 1} restant(s)
              </span>
            </div>

            {/* Card */}
            <div className="relative h-[520px]">
              <AnimatePresence initial={false}>
                <motion.div
                  key={currentCandidate.id}
                  initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0, x: 0 }}
                  exit={{
                    opacity: 0,
                    scale: 0.8,
                    x: direction === "left" ? -400 : direction === "right" ? 400 : 0,
                    rotateZ: direction === "left" ? -30 : direction === "right" ? 30 : 0,
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="absolute inset-0 overflow-hidden rounded-3xl border-2 border-workon-border bg-white shadow-lg"
                >
                  {/* Avatar area */}
                  <div className="flex h-40 items-center justify-center bg-gradient-to-r from-[#134021] to-[#1A5C2E]">
                    {currentCandidate.pictureUrl ? (
                      <img
                        src={currentCandidate.pictureUrl}
                        alt={currentCandidate.firstName}
                        className="h-24 w-24 rounded-full border-4 border-white object-cover"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-workon-bg text-3xl font-bold text-workon-ink">
                        {currentCandidate.firstName[0]}
                        {currentCandidate.lastName[0]}
                      </div>
                    )}
                  </div>

                  <div className="p-8">
                    <h2 className="mb-1 text-2xl font-bold text-workon-ink">
                      {currentCandidate.firstName} {currentCandidate.lastName}
                    </h2>
                    {currentCandidate.city && (
                      <p className="mb-4 text-workon-muted">
                        {currentCandidate.city}
                      </p>
                    )}

                    <div className="mb-6 space-y-3">
                      {currentCandidate.avgRating > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">&#x2B50;</span>
                          <span className="text-workon-ink/80">
                            {currentCandidate.avgRating.toFixed(1)} / 5
                            {currentCandidate.reviewCount > 0 && (
                              <span className="text-workon-muted"> ({currentCandidate.reviewCount})</span>
                            )}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">&#x2B50;</span>
                          <span className="text-workon-muted">Nouveau profil</span>
                        </div>
                      )}
                      {currentCandidate.trustTier !== "BASIC" && (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">&#x2705;</span>
                          <span className="text-workon-ink/80 capitalize">
                            {currentCandidate.trustTier.toLowerCase()}
                          </span>
                        </div>
                      )}
                      {currentCandidate.category && (
                        <div className="flex flex-wrap gap-2">
                          <span
                            className="rounded-full bg-workon-accent/10 border border-workon-accent/25 px-3 py-1 text-xs font-medium text-workon-accent"
                          >
                            {currentCandidate.category}
                          </span>
                        </div>
                      )}
                      {currentCandidate.bio && (
                        <p className="text-sm text-workon-muted line-clamp-3">
                          {currentCandidate.bio}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleSwipe("PASS")}
                        disabled={swipeMutation.isPending}
                        className="flex-1 rounded-xl border-2 border-workon-border bg-transparent py-5 text-base font-bold text-workon-muted transition hover:bg-workon-bg hover:text-workon-ink"
                      >
                        Passer
                      </Button>
                      <Button
                        onClick={() => handleSwipe("LIKE")}
                        disabled={swipeMutation.isPending}
                        className="flex-1 rounded-xl border-2 border-yellow-500/60 bg-transparent py-5 text-base font-bold text-yellow-400 transition hover:bg-yellow-500/10"
                      >
                        Sauvegarder
                      </Button>
                      <Button
                        onClick={() => handleSwipe("SUPERLIKE")}
                        disabled={swipeMutation.isPending}
                        className="flex-1 rounded-xl bg-workon-primary py-5 text-base font-bold text-white transition hover:bg-workon-primary/90 shadow-sm"
                      >
                        Contacter
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
