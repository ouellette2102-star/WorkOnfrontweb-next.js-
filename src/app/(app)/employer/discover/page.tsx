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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <p className="text-red-400">Erreur lors du chargement des profils</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-white">
            D\u00e9couvrir des travailleurs
          </h1>
          <p className="text-lg text-white/70">
            Trouvez les meilleurs profils pour vos missions
          </p>
        </div>

        {!currentCandidate ? (
          <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-12 text-center backdrop-blur">
            <div className="mb-4 text-6xl">&#x2705;</div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              Tous les profils parcourus !
            </h3>
            <p className="text-white/70">
              Revenez plus tard pour d\u00e9couvrir de nouveaux travailleurs
            </p>
          </div>
        ) : (
          <>
            {/* Progress */}
            <div className="mb-4 flex items-center justify-between text-sm text-white/70">
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
                  className="absolute inset-0 overflow-hidden rounded-3xl border-2 border-white/10 bg-neutral-900 shadow-2xl"
                >
                  {/* Avatar area */}
                  <div className="flex h-40 items-center justify-center bg-gradient-to-r from-green-600 to-emerald-500">
                    {currentCandidate.pictureUrl ? (
                      <img
                        src={currentCandidate.pictureUrl}
                        alt={currentCandidate.firstName}
                        className="h-24 w-24 rounded-full border-4 border-white object-cover"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-neutral-800 text-3xl font-bold text-white">
                        {currentCandidate.firstName[0]}
                        {currentCandidate.lastName[0]}
                      </div>
                    )}
                  </div>

                  <div className="p-8">
                    <h2 className="mb-1 text-2xl font-bold text-white">
                      {currentCandidate.firstName} {currentCandidate.lastName}
                    </h2>
                    {currentCandidate.city && (
                      <p className="mb-4 text-white/60">
                        {currentCandidate.city}
                      </p>
                    )}

                    <div className="mb-6 space-y-3">
                      {currentCandidate.avgRating > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">&#x2B50;</span>
                          <span className="text-white/80">
                            {currentCandidate.avgRating.toFixed(1)} / 5
                            {currentCandidate.reviewCount > 0 && (
                              <span className="text-white/40"> ({currentCandidate.reviewCount})</span>
                            )}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">&#x2B50;</span>
                          <span className="text-white/60">Nouveau profil</span>
                        </div>
                      )}
                      {currentCandidate.trustTier !== "BASIC" && (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">&#x2705;</span>
                          <span className="text-white/80 capitalize">
                            {currentCandidate.trustTier.toLowerCase()}
                          </span>
                        </div>
                      )}
                      {currentCandidate.category && (
                        <div className="flex flex-wrap gap-2">
                          <span
                            className="rounded-full bg-green-600/20 px-3 py-1 text-xs font-medium text-green-400"
                          >
                            {currentCandidate.category}
                          </span>
                        </div>
                      )}
                      {currentCandidate.bio && (
                        <p className="text-sm text-white/60 line-clamp-3">
                          {currentCandidate.bio}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleSwipe("PASS")}
                        disabled={swipeMutation.isPending}
                        className="flex-1 rounded-xl border-2 border-red-500 bg-transparent py-5 text-base font-bold text-red-500 transition hover:bg-red-500 hover:text-white"
                      >
                        Passer
                      </Button>
                      <Button
                        onClick={() => handleSwipe("LIKE")}
                        disabled={swipeMutation.isPending}
                        className="flex-1 rounded-xl border-2 border-yellow-500 bg-transparent py-5 text-base font-bold text-yellow-500 transition hover:bg-yellow-500 hover:text-white"
                      >
                        Sauvegarder
                      </Button>
                      <Button
                        onClick={() => handleSwipe("SUPERLIKE")}
                        disabled={swipeMutation.isPending}
                        className="flex-1 rounded-xl bg-green-600 py-5 text-base font-bold text-white transition hover:bg-green-500"
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
