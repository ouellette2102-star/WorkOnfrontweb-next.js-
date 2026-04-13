"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { api, type SwipeMatch } from "@/lib/api-client";
import { toast } from "sonner";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  MapPin,
  Loader2,
  Heart,
  Plus,
  Briefcase,
  X,
  Check,
  Users,
} from "lucide-react";

/**
 * /matches — List all swipe matches. Each match can start a mission.
 */
export default function MatchesPage() {
  const queryClient = useQueryClient();
  const [missionModal, setMissionModal] = useState<string | null>(null);
  const [missionForm, setMissionForm] = useState({
    title: "",
    description: "",
    price: "",
  });

  const {
    data: matches,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["swipe-matches"],
    queryFn: () => api.getMatches(),
  });

  const createMission = useMutation({
    mutationFn: ({
      matchId,
      data,
    }: {
      matchId: string;
      data: { title: string; description?: string; price?: number; category: string };
    }) => api.createMissionFromMatch(matchId, data),
    onSuccess: () => {
      toast.success("Mission creee avec succes !");
      setMissionModal(null);
      setMissionForm({ title: "", description: "", price: "" });
      queryClient.invalidateQueries({ queryKey: ["swipe-matches"] });
    },
    onError: () => {
      toast.error("Erreur lors de la creation de la mission");
    },
  });

  const handleCreateMission = (matchId: string) => {
    if (!missionForm.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    createMission.mutate({
      matchId,
      data: {
        title: missionForm.title,
        description: missionForm.description,
        category: "other",
        price: missionForm.price ? parseFloat(missionForm.price) : 0,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-workon-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-600">
            Erreur de chargement. Reessaie plus tard.
          </p>
        </div>
      </div>
    );
  }

  const activeMatches = matches?.filter((m) => m.status === "ACTIVE") ?? [];

  return (
    <div className="min-h-screen bg-workon-bg px-4 pb-24 pt-6">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/swipe"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-workon-border bg-white text-workon-muted transition hover:text-workon-primary active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-workon-ink">Mes matchs</h1>
            <p className="text-sm text-workon-muted">
              {activeMatches.length} match
              {activeMatches.length > 1 ? "s" : ""} actif
              {activeMatches.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Empty state */}
        {activeMatches.length === 0 ? (
          <div className="rounded-3xl border border-workon-border bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-workon-primary/10">
              <Users className="h-8 w-8 text-workon-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-workon-ink">
              Aucun match pour le moment
            </h3>
            <p className="mb-4 text-sm text-workon-muted">
              Continuez a swiper pour trouver des profils compatibles.
            </p>
            <Link
              href="/swipe"
              className="inline-flex items-center gap-2 rounded-2xl bg-workon-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-workon-primary/90"
            >
              <Heart className="h-4 w-4" />
              Decouvrir des profils
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeMatches.map((match, index) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl border border-workon-border bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  {match.matchedUser.pictureUrl ? (
                    <img
                      src={match.matchedUser.pictureUrl}
                      alt={match.matchedUser.firstName}
                      className="h-14 w-14 rounded-full border-2 border-workon-primary/20 object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-workon-primary/20 bg-workon-primary/5">
                      <User className="h-7 w-7 text-workon-primary" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-workon-ink">
                      {match.matchedUser.firstName}{" "}
                      {match.matchedUser.lastName}
                    </h3>
                    {match.matchedUser.city && (
                      <div className="flex items-center gap-1 text-xs text-workon-muted">
                        <MapPin className="h-3 w-3" />
                        {match.matchedUser.city}
                      </div>
                    )}
                    <p className="mt-0.5 text-[10px] text-workon-muted">
                      Match le{" "}
                      {new Date(match.createdAt).toLocaleDateString("fr-CA", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => setMissionModal(match.id)}
                    className="flex items-center gap-1.5 rounded-xl bg-workon-accent px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-workon-accent/90 active:scale-95"
                  >
                    <Briefcase className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Creer une</span> mission
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Mission creation modal */}
      <AnimatePresence>
        {missionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
            onClick={(e) => {
              if (e.target === e.currentTarget) setMissionModal(null);
            }}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
            >
              {/* Modal header */}
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-workon-ink">
                  Creer une mission
                </h2>
                <button
                  onClick={() => setMissionModal(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-workon-bg text-workon-muted transition hover:text-workon-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-workon-ink">
                    Titre *
                  </label>
                  <input
                    type="text"
                    value={missionForm.title}
                    onChange={(e) =>
                      setMissionForm((f) => ({ ...f, title: e.target.value }))
                    }
                    placeholder="Ex: Renovation cuisine"
                    className="w-full rounded-xl border border-workon-border bg-workon-bg px-4 py-2.5 text-sm text-workon-ink placeholder:text-workon-muted/50 focus:border-workon-primary focus:outline-none focus:ring-1 focus:ring-workon-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-workon-ink">
                    Description
                  </label>
                  <textarea
                    value={missionForm.description}
                    onChange={(e) =>
                      setMissionForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Decrivez la mission en quelques mots..."
                    rows={3}
                    className="w-full resize-none rounded-xl border border-workon-border bg-workon-bg px-4 py-2.5 text-sm text-workon-ink placeholder:text-workon-muted/50 focus:border-workon-primary focus:outline-none focus:ring-1 focus:ring-workon-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-workon-ink">
                    Budget (CAD)
                  </label>
                  <input
                    type="number"
                    value={missionForm.price}
                    onChange={(e) =>
                      setMissionForm((f) => ({ ...f, price: e.target.value }))
                    }
                    placeholder="500"
                    min="0"
                    step="1"
                    className="w-full rounded-xl border border-workon-border bg-workon-bg px-4 py-2.5 text-sm text-workon-ink placeholder:text-workon-muted/50 focus:border-workon-primary focus:outline-none focus:ring-1 focus:ring-workon-primary"
                  />
                </div>

                <button
                  onClick={() => handleCreateMission(missionModal)}
                  disabled={createMission.isPending || !missionForm.title.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-workon-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-workon-primary/90 active:scale-[0.98] disabled:opacity-50"
                >
                  {createMission.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Confirmer la mission
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
