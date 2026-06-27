"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle,
  Clock,
  Heart,
  Inbox,
  Loader2,
  MapPin,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { api, type SwipeMatch } from "@/lib/api-client";
import {
  getMissionCategoryLabel,
  MISSION_CATEGORY_OPTIONS,
  type MissionCategory,
} from "@/lib/mission-categories";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActiveMatch = SwipeMatch & {
  otherUser: NonNullable<SwipeMatch["otherUser"]>;
};

type MissionFormState = {
  title: string;
  description: string;
  price: string;
  category: MissionCategory;
};

const EMPTY_FORM: MissionFormState = {
  title: "",
  description: "",
  price: "",
  category: "other",
};

function formatMatchDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date a confirmer";

  return date.toLocaleDateString("fr-CA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.trim().toUpperCase() || "WO";
}

/**
 * /matches - List all swipe matches. Each active match can start a mission.
 */
export default function MatchesPage() {
  const queryClient = useQueryClient();
  const [missionModal, setMissionModal] = useState<string | null>(null);
  const [missionForm, setMissionForm] = useState<MissionFormState>(EMPTY_FORM);

  const {
    data: matches,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["swipe-matches"],
    queryFn: () => api.getMatches(),
  });

  useEffect(() => {
    api.markAllNotificationsRead("swipe_match").catch((err) => {
      console.warn("[matches] failed to clear swipe_match badge:", err);
    });
    queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    queryClient.invalidateQueries({ queryKey: ["swipe-matches-unread-count"] });
  }, [queryClient]);

  const activeMatches = useMemo(
    () =>
      (matches ?? []).filter(
        (match): match is ActiveMatch =>
          match.status === "active" && Boolean(match.otherUser),
      ),
    [matches],
  );

  const matchStats = useMemo(() => {
    const allMatches = matches ?? [];
    return {
      active: activeMatches.length,
      converted: allMatches.filter((match) => match.status === "converted").length,
      expired: allMatches.filter((match) => match.status === "expired").length,
      hidden: allMatches.filter((match) => match.status === "active" && !match.otherUser)
        .length,
    };
  }, [activeMatches.length, matches]);

  const selectedMatch = useMemo(
    () => activeMatches.find((match) => match.matchId === missionModal) ?? null,
    [activeMatches, missionModal],
  );

  const createMission = useMutation({
    mutationFn: ({
      matchId,
      data,
    }: {
      matchId: string;
      data: { title: string; description?: string; price?: number; category: MissionCategory };
    }) => api.createMissionFromMatch(matchId, data),
    onSuccess: () => {
      toast.success("Mission creee avec succes!");
      closeMissionModal();
      queryClient.invalidateQueries({ queryKey: ["swipe-matches"] });
    },
    onError: () => {
      toast.error("Erreur lors de la creation de la mission");
    },
  });

  const openMissionModal = (matchId: string) => {
    setMissionModal(matchId);
    setMissionForm(EMPTY_FORM);
  };

  const closeMissionModal = () => {
    setMissionModal(null);
    setMissionForm(EMPTY_FORM);
  };

  const handleCreateMission = () => {
    if (!missionModal) return;

    const title = missionForm.title.trim();
    if (!title) {
      toast.error("Le titre est requis");
      return;
    }

    const parsedPrice = missionForm.price.trim()
      ? Number.parseFloat(missionForm.price)
      : 0;
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error("Le budget doit etre un montant valide");
      return;
    }

    createMission.mutate({
      matchId: missionModal,
      data: {
        title,
        description: missionForm.description.trim() || undefined,
        category: missionForm.category,
        price: parsedPrice,
      },
    });
  };

  const refreshMatches = () => {
    void refetch();
  };

  if (error) {
    return (
      <main className="min-h-screen bg-workon-bg px-4 py-5 pb-36 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center py-20 text-center">
          <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-red-600">
              <X className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black text-workon-ink">
              Matchs indisponibles
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-red-700">
              Impossible de charger tes matchs pour le moment. Tu peux reessayer
              sans quitter la page.
            </p>
            <Button onClick={refreshMatches} className="mt-6 rounded-full">
              <RefreshCw className="h-4 w-4" />
              Reessayer
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-workon-bg px-4 py-5 pb-36 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="workon-dark-panel overflow-hidden rounded-[28px] p-5 shadow-lg shadow-workon-primary/15 sm:p-6">
          <div className="relative z-10 space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                  <Heart className="h-3.5 w-3.5 text-workon-gold" />
                  Matchs swipe
                </div>
                <h1 className="font-[family-name:var(--font-cabinet)] text-3xl font-black text-white md:text-4xl">
                  Mes matchs
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/72">
                  Transforme les connexions reciproques en conversations,
                  devis et missions concretes sans perdre le fil du swipe.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                <button
                  type="button"
                  onClick={refreshMatches}
                  disabled={isFetching}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15 disabled:opacity-60"
                >
                  {isFetching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Actualiser
                </button>
                <Link
                  href="/swipe"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-workon-primary shadow-sm transition hover:bg-workon-bg-cream"
                >
                  Decouvrir
                  <Sparkles className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <MatchMetric
                icon={Users}
                label="Actifs"
                value={isLoading ? "--" : String(matchStats.active)}
                detail="Prets a convertir"
              />
              <MatchMetric
                icon={Briefcase}
                label="Convertis"
                value={isLoading ? "--" : String(matchStats.converted)}
                detail="Mission deja creee"
              />
              <MatchMetric
                icon={Clock}
                label="Expires"
                value={isLoading ? "--" : String(matchStats.expired)}
                detail="A reactiver via swipe"
              />
              <MatchMetric
                icon={ShieldCheck}
                label="Dossier"
                value={matchStats.hidden ? "A verifier" : "OK"}
                detail={
                  matchStats.hidden
                    ? `${matchStats.hidden} profil(s) masque(s)`
                    : "Profils synchronises"
                }
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-white/70">
                  <MessageCircle className="h-4 w-4 text-workon-gold" />
                  Les nouveaux matchs restent ici tant qu&apos;une mission
                  n&apos;est pas creee ou que le match n&apos;expire pas.
                </div>
                <div className="flex flex-wrap gap-2">
                  <SignalPill label="Badge lu" ok />
                  <SignalPill label="Mission" ok={matchStats.active > 0} />
                  <SignalPill label="Swipe" ok />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-workon-stone">
                  Connexions
                </p>
                <h2 className="font-[family-name:var(--font-cabinet)] text-2xl font-black text-workon-ink">
                  Matchs actifs
                </h2>
              </div>
              <p className="text-sm font-semibold text-workon-muted">
                {matchStats.active} profil{matchStats.active > 1 ? "s" : ""} a
                contacter
              </p>
            </div>

            {isLoading ? (
              <MatchesSkeleton />
            ) : activeMatches.length === 0 ? (
              <EmptyMatches />
            ) : (
              <div className="grid gap-3">
                {activeMatches.map((match, index) => (
                  <MatchCard
                    key={match.matchId}
                    match={match}
                    index={index}
                    onCreateMission={() => openMissionModal(match.matchId)}
                  />
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-[28px] border border-workon-border bg-white p-5 shadow-sm sm:p-6">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-workon-stone">
                Conversion
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-cabinet)] text-2xl font-black text-workon-ink">
                Prochaine action
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-workon-gray">
                Ouvre une mission quand le besoin est clair. Garde le titre
                court, ajoute le budget, puis detaille le contexte dans la
                description.
              </p>
              <div className="mt-5 space-y-3">
                <ActionStep
                  icon={MessageCircle}
                  title="Confirmer le besoin"
                  text="Le match ouvre la porte; la mission formalise le travail."
                />
                <ActionStep
                  icon={Briefcase}
                  title="Creer la mission"
                  text="Categorie, budget et description alimentent le flux mission."
                />
                <ActionStep
                  icon={ShieldCheck}
                  title="Garder la trace"
                  text="Une mission creee depuis un match conserve le lien de depart."
                />
              </div>
            </div>

            <div className="rounded-[28px] border border-workon-border bg-white p-5 shadow-sm sm:p-6">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-workon-stone">
                Raccourcis
              </p>
              <div className="mt-4 grid gap-2">
                <Button asChild className="rounded-full bg-workon-primary font-bold text-white hover:bg-workon-primary-hover">
                  <Link href="/swipe">
                    <Heart className="h-4 w-4" />
                    Retour au swipe
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-workon-border font-bold text-workon-ink">
                  <Link href="/missions/mine">
                    <Briefcase className="h-4 w-4" />
                    Voir mes missions
                  </Link>
                </Button>
              </div>
            </div>
          </aside>
        </section>
      </div>

      <AnimatePresence>
        {missionModal && selectedMatch && (
          <MissionModal
            match={selectedMatch}
            form={missionForm}
            isPending={createMission.isPending}
            onChange={setMissionForm}
            onCancel={closeMissionModal}
            onSubmit={handleCreateMission}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function MatchMetric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-white">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55">
            {label}
          </p>
          <p className="mt-1 truncate text-xl font-black">{value}</p>
          <p className="mt-1 truncate text-[11px] leading-relaxed text-white/65">
            {detail}
          </p>
        </div>
        <span className="rounded-xl bg-white/10 p-2 text-workon-gold">
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function SignalPill({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide",
        ok
          ? "border-emerald-300/35 bg-emerald-400/12 text-emerald-100"
          : "border-white/15 bg-white/10 text-white/65",
      )}
    >
      {ok ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
      {label}
    </span>
  );
}

function MatchCard({
  match,
  index,
  onCreateMission,
}: {
  match: ActiveMatch;
  index: number;
  onCreateMission: () => void;
}) {
  const user = match.otherUser;
  const fullName = `${user.firstName} ${user.lastName}`.trim();

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-[28px] border border-workon-border bg-white p-4 shadow-sm transition hover:border-workon-primary/30 hover:shadow-md sm:p-5"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar
            name={fullName}
            firstName={user.firstName}
            lastName={user.lastName}
            pictureUrl={user.pictureUrl}
          />

          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h3 className="truncate text-lg font-black text-workon-ink">
                {fullName || "Profil WorkOn"}
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
                <Heart className="h-3 w-3" />
                Match actif
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-workon-muted">
              {user.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {user.city}
                </span>
              )}
              {user.category && (
                <span>{getMissionCategoryLabel(user.category)}</span>
              )}
              <span>Match le {formatMatchDate(match.matchedAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row md:justify-end">
          <Button
            type="button"
            onClick={onCreateMission}
            className="rounded-full bg-workon-accent font-bold text-white hover:bg-workon-accent-hover"
          >
            <Briefcase className="h-4 w-4" />
            Creer une mission
          </Button>
          <Button asChild variant="outline" className="rounded-full border-workon-border font-bold text-workon-ink">
            <Link href="/swipe">
              Continuer
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

function Avatar({
  name,
  firstName,
  lastName,
  pictureUrl,
}: {
  name: string;
  firstName: string;
  lastName: string;
  pictureUrl: string | null;
}) {
  if (pictureUrl) {
    return (
      <div
        className="h-16 w-16 shrink-0 rounded-2xl border-2 border-workon-primary/20 bg-cover bg-center shadow-sm"
        style={{ backgroundImage: `url(${pictureUrl})` }}
        role="img"
        aria-label={name}
      />
    );
  }

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-workon-primary/20 bg-workon-primary/5 text-lg font-black text-workon-primary shadow-sm">
      {getInitials(firstName, lastName) || <User className="h-7 w-7" />}
    </div>
  );
}

function MatchesSkeleton() {
  return (
    <div className="grid gap-3">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-28 animate-pulse rounded-[28px] border border-workon-border bg-white shadow-sm"
        />
      ))}
    </div>
  );
}

function EmptyMatches() {
  return (
    <div className="rounded-[28px] border border-dashed border-workon-border bg-white p-10 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-workon-primary/10 text-workon-primary">
        <Inbox className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-black text-workon-ink">
        Aucun match actif pour le moment
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-workon-muted">
        Continue a swiper pour trouver des profils compatibles. Les matchs
        reciproques apparaitront ici avec l&apos;option de creer une mission.
      </p>
      <Button asChild className="mt-6 rounded-full bg-workon-primary font-bold text-white hover:bg-workon-primary-hover">
        <Link href="/swipe">
          <Heart className="h-4 w-4" />
          Decouvrir des profils
        </Link>
      </Button>
    </div>
  );
}

function ActionStep({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-workon-border bg-workon-bg-cream p-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-workon-primary shadow-sm">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-black text-workon-ink">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-workon-muted">{text}</p>
      </div>
    </div>
  );
}

function MissionModal({
  match,
  form,
  isPending,
  onChange,
  onCancel,
  onSubmit,
}: {
  match: ActiveMatch;
  form: MissionFormState;
  isPending: boolean;
  onChange: (next: MissionFormState) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const userName = `${match.otherUser.firstName} ${match.otherUser.lastName}`.trim();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-3 sm:items-center"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <motion.form
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 300 }}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="w-full max-w-2xl rounded-t-[28px] bg-white p-5 shadow-2xl sm:rounded-[28px] sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-workon-stone">
              Nouveau depart
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-cabinet)] text-2xl font-black text-workon-ink">
              Creer une mission
            </h2>
            <p className="mt-1 text-sm text-workon-muted">
              Match avec {userName || "ce profil"}.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-workon-bg text-workon-muted transition hover:text-workon-ink"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Titre" required>
            <input
              type="text"
              value={form.title}
              onChange={(event) => onChange({ ...form, title: event.target.value })}
              placeholder="Ex: Renovation cuisine"
              className="w-full rounded-xl border border-workon-border bg-workon-bg px-4 py-2.5 text-sm text-workon-ink placeholder:text-workon-muted/50 focus:border-workon-primary focus:outline-none focus:ring-1 focus:ring-workon-primary"
            />
          </Field>

          <Field label="Budget CAD">
            <input
              type="number"
              value={form.price}
              onChange={(event) => onChange({ ...form, price: event.target.value })}
              placeholder="500"
              min="0"
              step="1"
              className="w-full rounded-xl border border-workon-border bg-workon-bg px-4 py-2.5 text-sm text-workon-ink placeholder:text-workon-muted/50 focus:border-workon-primary focus:outline-none focus:ring-1 focus:ring-workon-primary"
            />
          </Field>

          <Field label="Categorie">
            <select
              value={form.category}
              onChange={(event) =>
                onChange({ ...form, category: event.target.value as MissionCategory })
              }
              className="w-full rounded-xl border border-workon-border bg-workon-bg px-4 py-2.5 text-sm text-workon-ink focus:border-workon-primary focus:outline-none focus:ring-1 focus:ring-workon-primary"
            >
              {MISSION_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="rounded-2xl border border-workon-border bg-workon-bg-cream p-3">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-workon-stone">
              Statut
            </p>
            <p className="mt-1 text-sm font-black text-workon-ink">Match actif</p>
            <p className="mt-1 text-xs leading-relaxed text-workon-muted">
              Cree le {formatMatchDate(match.matchedAt)}
            </p>
          </div>

          <div className="md:col-span-2">
            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(event) =>
                  onChange({ ...form, description: event.target.value })
                }
                placeholder="Decris la mission en quelques mots..."
                rows={4}
                className="w-full resize-none rounded-xl border border-workon-border bg-workon-bg px-4 py-2.5 text-sm text-workon-ink placeholder:text-workon-muted/50 focus:border-workon-primary focus:outline-none focus:ring-1 focus:ring-workon-primary"
              />
            </Field>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-full border-workon-border font-bold text-workon-ink"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isPending || !form.title.trim()}
            className="rounded-full bg-workon-primary font-bold text-white hover:bg-workon-primary-hover"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Confirmer la mission
          </Button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-workon-ink">
        {label}
        {required && <span className="text-workon-accent"> *</span>}
      </span>
      {children}
    </label>
  );
}
