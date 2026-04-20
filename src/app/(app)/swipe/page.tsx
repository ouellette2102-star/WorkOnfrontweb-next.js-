"use client";

declare global { interface Window { __lastDrag?: number } }

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { api, type SwipeCandidate } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { MatchCelebrationModal } from "@/components/match-celebration-modal";
import Link from "next/link";
import {
  MapPin,
  Star,
  Loader2,
  Heart,
  X,
  MessageCircle,
  Users,
  ArrowUp,
  CheckCircle,
  ShieldCheck,
  Quote,
} from "lucide-react";
import { TrustPill } from "@/components/ui/trust-pill";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD = 100; // px offset to trigger
const VELOCITY_THRESHOLD = 500; // px/s velocity to trigger

/**
 * /swipe — Discover pros (employers) or missions (workers)
 *
 * Role-aware: employers swipe through workers, workers swipe through employers.
 * Drag left = PASS, drag right = LIKE, drag up = SUPERLIKE.
 */
export default function SwipePage() {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<
    "left" | "right" | "up" | null
  >(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [matchCelebration, setMatchCelebration] = useState<{
    candidate: SwipeCandidate;
    matchId: string;
  } | null>(null);

  const targetRole = user?.role === "employer" ? "worker" : "employer";
  const pageTitle =
    user?.role === "employer" ? "Trouver un pro" : "Trouver un client";
  const pageSubtitle =
    user?.role === "employer"
      ? "Swipez pour decouvrir les meilleurs travailleurs"
      : "Swipez pour decouvrir des opportunites";

  const {
    data: candidates,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["swipe-candidates", targetRole],
    queryFn: () => api.getSwipeCandidates({ role: targetRole }),
  });

  const { data: matches } = useQuery({
    queryKey: ["swipe-matches"],
    queryFn: () => api.getMatches(),
  });

  const matchCount = matches?.length ?? 0;

  const swipeMutation = useMutation({
    mutationFn: (data: {
      candidateId: string;
      action: "LIKE" | "PASS" | "SUPERLIKE";
      // Carry the candidate through the mutation so onSuccess can surface
      // the right card in the celebration modal (the mutation fn ignores
      // it — backend only sees candidateId + action).
      _candidate: SwipeCandidate;
    }) => api.recordSwipe({ candidateId: data.candidateId, action: data.action }),
    onSuccess: (result, variables) => {
      if (result.matched && result.matchId) {
        setMatchCelebration({
          candidate: variables._candidate,
          matchId: result.matchId,
        });
      }
    },
    onError: () => {
      toast.error("Erreur lors de l'enregistrement");
    },
  });

  const current = candidates?.[currentIndex];
  const remaining = (candidates?.length ?? 0) - currentIndex - 1;

  const advance = useCallback(() => {
    setCurrentIndex((i) => i + 1);
    setExitDirection(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const handleSwipe = useCallback(
    (action: "PASS" | "LIKE" | "SUPERLIKE") => {
      if (!current || swipeMutation.isPending) return;
      setExitDirection(
        action === "PASS" ? "left" : action === "LIKE" ? "right" : "up"
      );
      swipeMutation.mutate({
        candidateId: current.id,
        action,
        _candidate: current,
      });
      setTimeout(advance, 300);
    },
    [current, swipeMutation, advance]
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const { offset, velocity } = info;

      // Up swipe = SUPERLIKE (check first so it takes priority)
      if (
        offset.y < -SWIPE_THRESHOLD ||
        velocity.y < -VELOCITY_THRESHOLD
      ) {
        handleSwipe("SUPERLIKE");
        return;
      }

      // Right swipe = LIKE
      if (
        offset.x > SWIPE_THRESHOLD ||
        velocity.x > VELOCITY_THRESHOLD
      ) {
        handleSwipe("LIKE");
        return;
      }

      // Left swipe = PASS
      if (
        offset.x < -SWIPE_THRESHOLD ||
        velocity.x < -VELOCITY_THRESHOLD
      ) {
        handleSwipe("PASS");
        return;
      }

      // Not enough — snap back
      setDragOffset({ x: 0, y: 0 });
    },
    [handleSwipe]
  );

  // Compute overlay opacity from drag offset
  const likeOpacity = Math.min(Math.max(dragOffset.x / SWIPE_THRESHOLD, 0), 1);
  const passOpacity = Math.min(
    Math.max(-dragOffset.x / SWIPE_THRESHOLD, 0),
    1
  );
  const superlikeOpacity = Math.min(
    Math.max(-dragOffset.y / SWIPE_THRESHOLD, 0),
    1
  );
  const rotation = dragOffset.x * 0.05; // slight tilt

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
          <p className="text-red-600">
            Erreur de chargement. Reessaie plus tard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-workon-bg px-4 pb-24 pt-6">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-workon-ink">{pageTitle}</h1>
            <p className="text-sm text-workon-muted">{pageSubtitle}</p>
          </div>

          {/* Matches badge */}
          <Link
            href="/matches"
            className="relative flex items-center gap-1.5 rounded-2xl border border-workon-border bg-white px-4 py-2 text-sm font-medium text-workon-primary shadow-sm transition hover:bg-workon-primary/5 active:scale-95"
          >
            <Users className="h-4 w-4" />
            <span>Matchs</span>
            {matchCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-workon-accent text-[10px] font-bold text-white">
                {matchCount}
              </span>
            )}
          </Link>
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
              Reviens plus tard pour decouvrir de nouveaux profils.
            </p>
            {matchCount > 0 && (
              <Link
                href="/matches"
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-workon-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-workon-primary/90"
              >
                <Users className="h-4 w-4" />
                Voir mes {matchCount} match{matchCount > 1 ? "s" : ""}
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Progress */}
            <div className="mb-3 flex items-center justify-between text-xs text-workon-muted">
              <span>
                {currentIndex + 1} / {candidates?.length ?? 0}
              </span>
              <span>
                {remaining} restant{remaining > 1 ? "s" : ""}
              </span>
            </div>

            {/* Card */}
            <div className="relative min-h-[520px]">
              <AnimatePresence initial={false}>
                <motion.div
                  key={current.id}
                  drag
                  dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
                  dragElastic={0.9}
                  onDrag={(_, info) => {
                    // Only update state every ~32ms to avoid excessive re-renders
                    const now = Date.now();
                    if (!window.__lastDrag || now - window.__lastDrag > 32) {
                      window.__lastDrag = now;
                      setDragOffset({ x: info.offset.x, y: info.offset.y });
                    }
                  }}
                  onDragEnd={handleDragEnd}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: 0,
                    y: 0,
                    rotateZ: 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.85,
                    x:
                      exitDirection === "left"
                        ? -400
                        : exitDirection === "right"
                          ? 400
                          : 0,
                    y: exitDirection === "up" ? -400 : 0,
                    rotateZ:
                      exitDirection === "left"
                        ? -25
                        : exitDirection === "right"
                          ? 25
                          : 0,
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  style={{ rotate: rotation, touchAction: "none" }}
                  className="relative w-full cursor-grab overflow-hidden rounded-3xl border border-workon-border bg-white shadow-md active:cursor-grabbing"
                >
                  {/* Drag overlays */}
                  {/* LIKE overlay (right) — green */}
                  <div
                    className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-green-500/20"
                    style={{ opacity: likeOpacity }}
                  >
                    <div
                      className="rounded-2xl border-4 border-green-500 px-6 py-3"
                      style={{ opacity: likeOpacity }}
                    >
                      <span className="text-3xl font-black uppercase text-green-500">
                        J&apos;aime
                      </span>
                    </div>
                  </div>

                  {/* PASS overlay (left) — red */}
                  <div
                    className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-red-500/20"
                    style={{ opacity: passOpacity }}
                  >
                    <div
                      className="rounded-2xl border-4 border-red-500 px-6 py-3"
                      style={{ opacity: passOpacity }}
                    >
                      <span className="text-3xl font-black uppercase text-red-500">
                        Passer
                      </span>
                    </div>
                  </div>

                  {/* SUPERLIKE overlay (up) — blue */}
                  <div
                    className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-blue-500/20"
                    style={{ opacity: superlikeOpacity }}
                  >
                    <div
                      className="rounded-2xl border-4 border-blue-500 px-6 py-3"
                      style={{ opacity: superlikeOpacity }}
                    >
                      <span className="text-3xl font-black uppercase text-blue-500">
                        Super
                      </span>
                    </div>
                  </div>

                  {/* 1. Hero photo pleine largeur */}
                  <Link href={`/worker/${current.id}`} className="block relative h-56 bg-gradient-to-br from-workon-primary/20 to-workon-primary/40 overflow-hidden">
                    {current.pictureUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={current.pictureUrl} alt={current.firstName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-6xl font-bold text-workon-primary/60 select-none">
                          {(current.firstName?.[0] ?? "").toUpperCase()}{(current.lastName?.[0] ?? "").toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-3 left-3">
                      <TrustPill variant={
                        current.trustTier === "PREMIUM" ? "premium"
                        : current.trustTier === "TRUSTED" ? "trusted"
                        : current.trustTier === "VERIFIED" ? "verified"
                        : current.reviewCount === 0 ? "nouveau"
                        : "fiable"
                      } />
                    </div>
                  </Link>

                  <div className="p-4 space-y-3">
                    {/* 2. Nom + métier + ville */}
                    <div>
                      <h3 className="font-bold text-lg text-workon-ink leading-tight">
                        {current.firstName} {current.lastName}
                      </h3>
                      <p className="text-sm text-workon-muted mt-0.5 flex items-center gap-1 flex-wrap">
                        {current.jobTitle || current.category || "Professionnel"}
                        {current.city && (
                          <>
                            <span className="text-workon-border">·</span>
                            <span className="inline-flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />{current.city}
                            </span>
                          </>
                        )}
                      </p>
                    </div>

                    {/* 3. Étoiles + avis */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} className={cn("h-4 w-4", i < Math.round(current.avgRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200 fill-gray-200")} />
                        ))}
                      </div>
                      {current.reviewCount > 0 && <span className="text-sm font-semibold text-workon-ink">{current.avgRating.toFixed(1)}</span>}
                      <span className="text-xs text-workon-muted">{current.reviewCount > 0 ? `(${current.reviewCount} avis)` : "Nouveau"}</span>
                    </div>

                    {/* 4. Badges + tarif */}
                    {(current.hourlyRate ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {current.category && (
                          <span className="inline-flex items-center rounded-full border border-workon-border bg-workon-bg px-2.5 py-1 text-[11px] font-medium text-workon-ink">
                            {current.category}
                          </span>
                        )}
                        <span className="inline-flex items-center rounded-full bg-workon-primary/10 px-2.5 py-1 text-[11px] font-semibold text-workon-primary">
                          À partir de {current.hourlyRate} $/h
                        </span>
                      </div>
                    )}

                    {/* 5. Pourquoi choisir */}
                    <div className="rounded-xl bg-workon-bg border border-workon-border p-3 space-y-1.5">
                      <p className="text-[11px] font-semibold text-workon-muted uppercase tracking-wide mb-2">
                        Pourquoi choisir {current.firstName} ?
                      </p>
                      {["Identité vérifiée", "Assurances & conformité", "Contrat sécurisé WorkOn"].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-xs text-workon-ink">
                          <CheckCircle className="h-3.5 w-3.5 text-workon-primary shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>

                    {/* 6. Section avis */}
                    {current.reviewCount > 0 ? (
                      <div>
                        <p className="text-[11px] font-semibold text-workon-muted uppercase tracking-wide mb-2">Avis clients</p>
                        <div className="rounded-xl border border-workon-border bg-workon-bg p-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="flex">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star key={i} className={cn("h-3.5 w-3.5", i < Math.round(current.avgRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200 fill-gray-200")} />
                              ))}
                            </div>
                            <span className="text-xs font-semibold text-workon-ink">{current.avgRating.toFixed(1)}</span>
                            <span className="text-xs text-workon-muted">({current.reviewCount} avis)</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Quote className="h-3.5 w-3.5 text-workon-primary/40 shrink-0 mt-0.5" />
                            <p className="text-xs text-workon-muted italic leading-relaxed">
                              {current.reviewCount === 1 ? "1 client a laissé un avis positif." : `${current.reviewCount} clients ont laissé des avis positifs.`}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-workon-border bg-workon-bg/50 p-3 text-center">
                        <p className="text-xs text-workon-muted">Aucun avis pour le moment</p>
                        <p className="text-[10px] text-workon-muted/60 mt-0.5">Soyez le premier à travailler avec {current.firstName}</p>
                      </div>
                    )}

                    {/* 7. Bio */}
                    {current.bio && (
                      <p className="text-sm leading-relaxed text-workon-muted line-clamp-2 border-t border-workon-border/50 pt-2">
                        {current.bio}
                      </p>
                    )}

                    {/* 8. Footer légal */}
                    <div className="flex items-center gap-1.5 pt-1 text-[10px] text-workon-muted border-t border-workon-border">
                      <ShieldCheck className="h-3 w-3 shrink-0" />
                      Paiement sécurisé par Stripe · WorkOn n&apos;est pas partie au contrat de service
                    </div>

                    {/* 9. Drag hint */}
                    <div className="flex justify-center">
                      <div className="flex items-center gap-3 rounded-full bg-black/5 px-4 py-1.5 text-[10px] text-workon-muted">
                        <span className="flex items-center gap-1"><X className="h-3 w-3" /> Gauche</span>
                        <span className="flex items-center gap-1"><ArrowUp className="h-3 w-3" /> Super</span>
                        <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> Droite</span>
                      </div>
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

      {matchCelebration && (
        <MatchCelebrationModal
          open
          candidate={matchCelebration.candidate}
          matchId={matchCelebration.matchId}
          onDismiss={() => setMatchCelebration(null)}
        />
      )}
    </div>
  );
}
