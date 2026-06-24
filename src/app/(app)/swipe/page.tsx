"use client";

declare global {
  interface Window {
    __lastDrag?: number;
  }
}

import Link from "next/link";
import { useCallback, useMemo, useState, type ComponentType } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import {
  ArrowUp,
  Briefcase,
  CheckCircle,
  ChevronRight,
  Clock3,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { MatchCelebrationModal } from "@/components/match-celebration-modal";
import { TrustPill } from "@/components/ui/trust-pill";
import { api, type SwipeCandidate } from "@/lib/api-client";
import { useMode } from "@/contexts/mode-context";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 500;

export default function SwipePage() {
  const { mode } = useMode();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<
    "left" | "right" | "up" | null
  >(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [matchCelebration, setMatchCelebration] = useState<{
    candidate: SwipeCandidate;
    matchId: string;
  } | null>(null);

  // Acting-as: the Pro/Client mode drives discovery — client mode finds
  // workers, pro mode finds clients. (Was gated on the locked role, which
  // showed the worker-recruiting view to client accounts.)
  const targetRole = mode === "client" ? "worker" : "employer";
  const isHiring = targetRole === "worker";
  const pageTitle = isHiring ? "Trouver un pro" : "Trouver un client";
  const pageSubtitle = isHiring
    ? "Des profils qualifiés avec preuves de confiance."
    : "Des opportunités pertinentes pour remplir ton horaire.";

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

  const { data: matchBadge } = useQuery({
    queryKey: ["swipe-matches-unread-count"],
    queryFn: () => api.getNotificationUnreadCount("swipe_match"),
    refetchInterval: 20_000,
  });

  const matchCount = matchBadge?.count ?? 0;
  const hasAnyMatch = (matches?.length ?? 0) > 0;

  const swipeMutation = useMutation({
    mutationFn: (data: {
      candidateId: string;
      action: "LIKE" | "PASS" | "SUPERLIKE";
      _candidate: SwipeCandidate;
    }) =>
      api.recordSwipe({ candidateId: data.candidateId, action: data.action }),
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
  const nextCandidate = candidates?.[currentIndex + 1];
  const remaining = Math.max((candidates?.length ?? 0) - currentIndex - 1, 0);
  const progress =
    candidates && candidates.length > 0
      ? Math.min(100, ((currentIndex + 1) / candidates.length) * 100)
      : 0;

  const stackStats = useMemo(
    () => ({
      total: candidates?.length ?? 0,
      premium:
        candidates?.filter((candidate) =>
          ["PREMIUM", "TRUSTED"].includes(candidate.trustTier),
        ).length ?? 0,
      local:
        candidates?.filter((candidate) => Boolean(candidate.city)).length ?? 0,
    }),
    [candidates],
  );

  const advance = useCallback(() => {
    setCurrentIndex((i) => i + 1);
    setExitDirection(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const handleSwipe = useCallback(
    (action: "PASS" | "LIKE" | "SUPERLIKE") => {
      if (!current || swipeMutation.isPending) return;
      setExitDirection(
        action === "PASS" ? "left" : action === "LIKE" ? "right" : "up",
      );
      swipeMutation.mutate({
        candidateId: current.id,
        action,
        _candidate: current,
      });
      setTimeout(advance, 300);
    },
    [advance, current, swipeMutation],
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const { offset, velocity } = info;

      if (offset.y < -SWIPE_THRESHOLD || velocity.y < -VELOCITY_THRESHOLD) {
        handleSwipe("SUPERLIKE");
        return;
      }

      if (offset.x > SWIPE_THRESHOLD || velocity.x > VELOCITY_THRESHOLD) {
        handleSwipe("LIKE");
        return;
      }

      if (offset.x < -SWIPE_THRESHOLD || velocity.x < -VELOCITY_THRESHOLD) {
        handleSwipe("PASS");
        return;
      }

      setDragOffset({ x: 0, y: 0 });
    },
    [handleSwipe],
  );

  const likeOpacity = Math.min(Math.max(dragOffset.x / SWIPE_THRESHOLD, 0), 1);
  const passOpacity = Math.min(
    Math.max(-dragOffset.x / SWIPE_THRESHOLD, 0),
    1,
  );
  const superlikeOpacity = Math.min(
    Math.max(-dragOffset.y / SWIPE_THRESHOLD, 0),
    1,
  );
  const rotation = dragOffset.x * 0.045;

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-workon-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-6 pb-28">
        <div className="mx-auto max-w-md rounded-[28px] border border-workon-accent/25 bg-workon-accent-subtle p-8 text-center">
          <p className="font-semibold text-workon-accent">
            Erreur de chargement.
          </p>
          <p className="mt-1 text-sm text-workon-stone">
            Réessaie plus tard ou vérifie ta connexion.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-5 px-4 py-5 pb-28">
      <header className="workon-dark-panel overflow-hidden rounded-[28px] p-5 shadow-lg shadow-workon-primary/15">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">
              <Sparkles className="h-3.5 w-3.5 text-workon-gold" />
              Matching WorkOn
            </p>
            <h1 className="mt-2 font-heading text-2xl font-bold leading-tight text-white">
              {pageTitle}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              {pageSubtitle}
            </p>
          </div>

          <Link
            href="/matches"
            className="relative inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 text-sm font-bold text-white transition hover:bg-white/15"
          >
            <Users className="h-4 w-4" />
            Matchs
            {matchCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-workon-copper px-1 text-[10px] font-black text-white">
                {matchCount}
              </span>
            )}
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <HeroMetric
            label="Pile"
            value={String(stackStats.total)}
            icon={Briefcase}
          />
          <HeroMetric
            label="Confiance"
            value={String(stackStats.premium)}
            icon={ShieldCheck}
          />
          <HeroMetric label="Local" value={String(stackStats.local)} icon={MapPin} />
        </div>
      </header>

      {!current ? (
        <EmptySwipeState hasAnyMatch={hasAnyMatch} matchCount={matchCount} />
      ) : (
        <>
          <section className="workon-premium-card rounded-[24px] p-4">
            <div className="flex items-center justify-between gap-4 text-xs font-bold text-workon-stone">
              <span>
                Profil {currentIndex + 1} / {candidates?.length ?? 0}
              </span>
              <span>
                {remaining} restant{remaining > 1 ? "s" : ""}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-workon-bg-cream">
              <div
                className="h-full rounded-full bg-workon-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </section>

          <ActionDock
            disabled={swipeMutation.isPending}
            onPass={() => handleSwipe("PASS")}
            onLike={() => handleSwipe("LIKE")}
            onSuperLike={() => handleSwipe("SUPERLIKE")}
          />

          <section className="relative min-h-[690px]">
            {nextCandidate && <StackPreview candidate={nextCandidate} />}

            <AnimatePresence initial={false}>
              <motion.article
                key={current.id}
                drag
                dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
                dragElastic={0.88}
                onDrag={(_, info) => {
                  const now = Date.now();
                  if (!window.__lastDrag || now - window.__lastDrag > 32) {
                    window.__lastDrag = now;
                    setDragOffset({ x: info.offset.x, y: info.offset.y });
                  }
                }}
                onDragEnd={handleDragEnd}
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0, rotateZ: 0 }}
                exit={{
                  opacity: 0,
                  scale: 0.86,
                  x:
                    exitDirection === "left"
                      ? -420
                      : exitDirection === "right"
                        ? 420
                        : 0,
                  y: exitDirection === "up" ? -420 : 0,
                  rotateZ:
                    exitDirection === "left"
                      ? -20
                      : exitDirection === "right"
                        ? 20
                        : 0,
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                style={{ rotate: rotation, touchAction: "none" }}
                className="relative z-10 w-full cursor-grab overflow-hidden rounded-[32px] border border-workon-line bg-white shadow-xl shadow-workon-ink/10 active:cursor-grabbing"
              >
                <SwipeOverlay
                  tone="like"
                  opacity={likeOpacity}
                  label="Matcher"
                />
                <SwipeOverlay tone="pass" opacity={passOpacity} label="Passer" />
                <SwipeOverlay
                  tone="super"
                  opacity={superlikeOpacity}
                  label="Prioritaire"
                />

                <CandidateHero candidate={current} isHiring={isHiring} />

                <div className="space-y-4 p-4">
                  <CandidateSummary candidate={current} />
                  <CandidateStats candidate={current} />
                  <WhyMatch candidate={current} isHiring={isHiring} />
                  <ReviewSignal candidate={current} />

                  {current.bio && (
                    <p className="line-clamp-3 rounded-2xl border border-workon-border bg-workon-bg px-4 py-3 text-sm leading-relaxed text-workon-stone">
                      {current.bio}
                    </p>
                  )}

                  <div className="flex items-start gap-2 border-t border-workon-border pt-3 text-[11px] font-medium leading-relaxed text-workon-stone">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-workon-trust-green" />
                    Paiement sécurisé, contrat protégé et messagerie déverrouillée
                    après match.
                  </div>

                  <div className="flex justify-center">
                    <div className="grid grid-cols-3 rounded-full bg-workon-bg px-3 py-2 text-[10px] font-bold text-workon-stone">
                      <span className="flex items-center gap-1 px-2">
                        <X className="h-3 w-3" />
                        Gauche
                      </span>
                      <span className="flex items-center gap-1 px-2">
                        <ArrowUp className="h-3 w-3" />
                        Priorité
                      </span>
                      <span className="flex items-center gap-1 px-2">
                        <Heart className="h-3 w-3" />
                        Droite
                      </span>
                    </div>
                  </div>
                </div>
              </motion.article>
            </AnimatePresence>
          </section>

        </>
      )}

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

function CandidateHero({
  candidate,
  isHiring,
}: {
  candidate: SwipeCandidate;
  isHiring: boolean;
}) {
  return (
    <div className="relative min-h-[190px] overflow-hidden bg-workon-surface-dark sm:min-h-[220px]">
      {candidate.pictureUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={candidate.pictureUrl}
          alt={`${candidate.firstName} ${candidate.lastName}`}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-workon-primary to-workon-forest-deep">
          <span className="font-heading text-7xl font-bold text-white/35">
            {getInitials(candidate)}
          </span>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/[0.78] via-black/[0.24] to-black/[0.18]" />

      <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
        <TrustPill
          variant={getTrustVariant(candidate)}
          label={getTrustLabel(candidate)}
          className="border-white/20 bg-white/[0.92] text-workon-ink"
        />
        <span className="rounded-full border border-white/15 bg-white/[0.12] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur">
          {isHiring ? "Profil pro" : "Client potentiel"}
        </span>
      </div>

      <div className="absolute inset-x-4 bottom-4">
        <Link
          href={`/worker/${candidate.id}`}
          className="group inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.12] px-3 py-1.5 text-xs font-bold text-white backdrop-blur transition hover:bg-white/[0.18]"
        >
          Voir profil
          <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
        </Link>
        <h2 className="mt-3 font-heading text-3xl font-bold leading-tight text-white">
          {candidate.firstName} {candidate.lastName}
        </h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-white/78">
          <span>{candidate.jobTitle || candidate.category || "Professionnel"}</span>
          {candidate.city && (
            <>
              <span className="text-white/30">·</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {candidate.city}
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function CandidateSummary({ candidate }: { candidate: SwipeCandidate }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {candidate.category && (
            <span className="rounded-full bg-workon-primary-subtle px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-workon-primary">
              {formatCategory(candidate.category)}
            </span>
          )}
          <span className="rounded-full bg-workon-bg px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-workon-stone">
            {candidate.reviewCount > 0 ? "Avis vérifiés" : "Nouveau réseau"}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }, (_, index) => (
              <Star
                key={index}
                className={cn(
                  "h-4 w-4",
                  index < Math.round(safeRating(candidate.avgRating))
                    ? "fill-workon-gold text-workon-gold"
                    : "fill-workon-stone-subtle text-workon-stone-subtle",
                )}
              />
            ))}
          </div>
          <span className="text-sm font-bold text-workon-ink">
            {candidate.reviewCount > 0
              ? safeRating(candidate.avgRating).toFixed(1)
              : "Nouveau"}
          </span>
          <span className="text-xs font-medium text-workon-muted">
            {candidate.reviewCount > 0
              ? `${candidate.reviewCount} avis`
              : "aucun avis encore"}
          </span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-[10px] font-bold uppercase tracking-wide text-workon-stone">
          À partir de
        </p>
        <p className="font-heading text-2xl font-bold leading-none text-workon-copper">
          {formatRate(candidate.hourlyRate)}
        </p>
      </div>
    </div>
  );
}

function CandidateStats({ candidate }: { candidate: SwipeCandidate }) {
  return (
    <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-workon-border bg-workon-bg">
      <StatCell
        icon={ShieldCheck}
        label="Trust"
        value={formatTrustScore(candidate)}
        emphasis
      />
      <StatCell
        icon={CheckCircle}
        label="Profil"
        value={`${Math.round(candidate.completionScore || 0)}%`}
      />
      <StatCell
        icon={Clock3}
        label="Réponse"
        value={candidate.trustTier === "BASIC" ? "Standard" : "Priorité"}
      />
    </div>
  );
}

function WhyMatch({
  candidate,
  isHiring,
}: {
  candidate: SwipeCandidate;
  isHiring: boolean;
}) {
  const reasons = [
    candidate.city
      ? `${candidate.city} dans ton réseau local`
      : "Position locale à confirmer",
    candidate.trustTier === "BASIC"
      ? "Profil admissible WorkOn"
      : "Identité et réputation renforcées",
    isHiring
      ? "Contrat protégé avant de démarrer"
      : "Client compatible avec une mission encadrée",
  ];

  return (
    <div className="rounded-2xl border border-workon-border bg-white p-4 shadow-soft">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-workon-stone">
        Pourquoi ce match
      </p>
      <div className="mt-3 space-y-2">
        {reasons.map((reason) => (
          <div
            key={reason}
            className="flex items-center gap-2 text-sm font-medium text-workon-ink"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-workon-primary-subtle text-workon-primary">
              <CheckCircle className="h-3.5 w-3.5" />
            </span>
            {reason}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewSignal({ candidate }: { candidate: SwipeCandidate }) {
  if (candidate.reviewCount <= 0) {
    return (
      <div className="rounded-2xl border border-dashed border-workon-border bg-workon-bg/70 p-4 text-center">
        <p className="text-sm font-semibold text-workon-ink">
          Nouveau sur WorkOn.
        </p>
        <p className="mt-1 text-xs text-workon-muted">
          La décision repose surtout sur le profil, la catégorie et les preuves
          de confiance disponibles.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-workon-border bg-workon-bg p-4">
      <div className="flex items-start gap-3">
        <Quote className="mt-0.5 h-4 w-4 shrink-0 text-workon-copper" />
        <div>
          <p className="text-sm font-semibold text-workon-ink">
            {candidate.reviewCount} client{candidate.reviewCount > 1 ? "s" : ""} ont déjà
            laissé un signal positif.
          </p>
          <p className="mt-1 text-xs leading-relaxed text-workon-muted">
            Moyenne {safeRating(candidate.avgRating).toFixed(1)} / 5 avec un
            profil complété à {Math.round(candidate.completionScore || 0)}%.
          </p>
        </div>
      </div>
    </div>
  );
}

function ActionDock({
  disabled,
  onPass,
  onLike,
  onSuperLike,
}: {
  disabled: boolean;
  onPass: () => void;
  onLike: () => void;
  onSuperLike: () => void;
}) {
  return (
    <div className="z-20">
      <div className="mx-auto flex max-w-sm items-center justify-center gap-4 rounded-[28px] border border-workon-border bg-white/[0.92] px-4 py-3 shadow-xl shadow-workon-ink/10 backdrop-blur">
        <ActionButton
          label="Passer"
          icon={X}
          tone="neutral"
          disabled={disabled}
          onClick={onPass}
        />
        <ActionButton
          label="Matcher"
          icon={Heart}
          tone="primary"
          disabled={disabled}
          onClick={onLike}
          large
        />
        <ActionButton
          label="Priorite"
          icon={MessageCircle}
          tone="copper"
          disabled={disabled}
          onClick={onSuperLike}
        />
      </div>
    </div>
  );
}

function ActionButton({
  label,
  icon: Icon,
  tone,
  disabled,
  onClick,
  large,
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  tone: "neutral" | "primary" | "copper";
  disabled: boolean;
  onClick: () => void;
  large?: boolean;
}) {
  const classes =
    tone === "primary"
      ? "bg-workon-primary text-white shadow-lg shadow-workon-primary/25"
      : tone === "copper"
        ? "border-workon-copper/35 bg-workon-accent-subtle text-workon-copper"
        : "border-workon-border bg-white text-workon-stone";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-2xl border font-bold transition active:scale-95 disabled:opacity-50",
        large ? "h-16 w-20" : "h-14 w-16",
        classes,
      )}
      aria-label={label}
    >
      <Icon className={large ? "h-6 w-6" : "h-5 w-5"} />
      <span className="text-[10px]">{label}</span>
    </button>
  );
}

function SwipeOverlay({
  tone,
  opacity,
  label,
}: {
  tone: "like" | "pass" | "super";
  opacity: number;
  label: string;
}) {
  const classes =
    tone === "like"
      ? "border-workon-primary bg-workon-primary/[0.18] text-workon-primary"
      : tone === "super"
        ? "border-workon-copper bg-workon-accent-subtle text-workon-copper"
        : "border-red-500 bg-red-500/[0.12] text-red-600";

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-[32px]"
      style={{ opacity }}
    >
      <div
        className={cn(
          "rotate-[-8deg] rounded-3xl border-4 px-7 py-4 text-3xl font-black uppercase shadow-lg backdrop-blur",
          classes,
        )}
      >
        {label}
      </div>
    </div>
  );
}

function StackPreview({ candidate }: { candidate: SwipeCandidate }) {
  return (
    <div className="absolute inset-x-4 top-8 z-0 h-[620px] rounded-[32px] border border-workon-border bg-white/70 shadow-card">
      <div className="absolute inset-x-5 top-5 flex items-center gap-3 opacity-50">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-workon-primary-subtle font-heading font-bold text-workon-primary">
          {getInitials(candidate)}
        </div>
        <div>
          <p className="text-sm font-bold text-workon-ink">
            {candidate.firstName} {candidate.lastName}
          </p>
          <p className="text-xs text-workon-muted">Prochain profil</p>
        </div>
      </div>
    </div>
  );
}

function EmptySwipeState({
  hasAnyMatch,
  matchCount,
}: {
  hasAnyMatch: boolean;
  matchCount: number;
}) {
  return (
    <div className="rounded-[28px] border border-workon-border bg-white p-8 text-center shadow-card">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-workon-primary-subtle text-workon-primary">
        <Heart className="h-8 w-8" />
      </div>
      <h3 className="mt-4 font-heading text-xl font-bold text-workon-ink">
        Tous les profils sont parcourus.
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-workon-muted">
        Reviens plus tard : la pile se met à jour avec les nouvelles missions,
        clients et pros admissibles.
      </p>
      {hasAnyMatch && (
        <Link
          href="/matches"
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-workon-primary px-5 py-3 text-sm font-bold text-white shadow-md shadow-workon-primary/20"
        >
          <Users className="h-4 w-4" />
          {matchCount > 0 ? `Voir ${matchCount} nouveau match` : "Voir mes matchs"}
        </Link>
      )}
    </div>
  );
}

function HeroMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.08] px-3 py-3">
      <Icon className="mb-2 h-4 w-4 text-workon-gold" />
      <p className="font-heading text-lg font-bold leading-none text-white">
        {value}
      </p>
      <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-wide text-white/55">
        {label}
      </p>
    </div>
  );
}

function StatCell({
  label,
  value,
  icon: Icon,
  emphasis,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  emphasis?: boolean;
}) {
  return (
    <div className="border-r border-workon-border px-2 py-3 text-center last:border-r-0">
      <Icon className="mx-auto mb-1 h-4 w-4 text-workon-stone" />
      <p className="text-[9px] font-bold uppercase tracking-wide text-workon-stone">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 truncate font-bold leading-tight",
          emphasis ? "text-base text-workon-primary" : "text-sm text-workon-ink",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function getTrustVariant(candidate: SwipeCandidate) {
  if (candidate.trustTier === "PREMIUM") return "premium";
  if (candidate.trustTier === "TRUSTED") return "trusted";
  if (candidate.trustTier === "VERIFIED") return "verified";
  if (candidate.reviewCount === 0) return "nouveau";
  return "fiable";
}

function getTrustLabel(candidate: SwipeCandidate) {
  if (candidate.trustTier === "PREMIUM") return "Top Performer";
  if (candidate.trustTier === "TRUSTED") return "De confiance";
  if (candidate.trustTier === "VERIFIED") return "Identité vérifiée";
  if (candidate.reviewCount === 0) return "Nouveau profil";
  return "Fiable";
}

function formatTrustScore(candidate: SwipeCandidate) {
  if (candidate.trustScore != null && Number.isFinite(candidate.trustScore)) {
    return `${Math.round(candidate.trustScore)}%`;
  }
  if (candidate.trustTier === "PREMIUM") return "Élite";
  if (candidate.trustTier === "TRUSTED") return "Fort";
  if (candidate.trustTier === "VERIFIED") return "Vérifié";
  return "Base";
}

function formatRate(value: number | null) {
  if (value == null || !Number.isFinite(value) || value <= 0) {
    return "À confirmer";
  }
  return `${Math.round(value)} $/h`;
}

function safeRating(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.min(5, value)) : 0;
}

function getInitials(candidate: SwipeCandidate) {
  return `${candidate.firstName?.[0] ?? ""}${candidate.lastName?.[0] ?? ""}`.toUpperCase();
}

function formatCategory(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
