"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  Ban,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { api, type AvailabilitySlot } from "@/lib/api-client";
import { parseDateOnlyFromApi } from "@/lib/date-only";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CalendarSlot = AvailabilitySlot & { specificDate?: string | null };

type AvailabilityPayload =
  | {
      recurring?: AvailabilitySlot[];
      blocked?: AvailabilitySlot[];
      specific?: AvailabilitySlot[];
    }
  | AvailabilitySlot[]
  | undefined;

type SlotInput = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

const DAYS = [
  { label: "Lundi", short: "Lun." },
  { label: "Mardi", short: "Mar." },
  { label: "Mercredi", short: "Mer." },
  { label: "Jeudi", short: "Jeu." },
  { label: "Vendredi", short: "Ven." },
  { label: "Samedi", short: "Sam." },
  { label: "Dimanche", short: "Dim." },
] as const;

const QUICK_SLOTS = [
  { label: "Matin", startTime: "08:00", endTime: "12:00" },
  { label: "Journee", startTime: "09:00", endTime: "17:00" },
  { label: "Soir", startTime: "17:00", endTime: "21:00" },
] as const;

function normalizeAvailability(payload: AvailabilityPayload) {
  if (Array.isArray(payload)) {
    return {
      recurring: payload.filter((slot) => !slot.isBlocked) as CalendarSlot[],
      blocked: payload.filter((slot) => slot.isBlocked) as CalendarSlot[],
      specific: [] as CalendarSlot[],
    };
  }

  const recurring = Array.isArray(payload?.recurring) ? payload.recurring : [];
  const blocked = Array.isArray(payload?.blocked) ? payload.blocked : [];
  const specific = Array.isArray(payload?.specific) ? payload.specific : [];

  return {
    recurring: recurring.filter((slot) => !slot.isBlocked) as CalendarSlot[],
    blocked: [...blocked, ...specific.filter((slot) => slot.isBlocked)] as CalendarSlot[],
    specific: specific.filter((slot) => !slot.isBlocked) as CalendarSlot[],
  };
}

function toSlotInput(slot: AvailabilitySlot): SlotInput {
  return {
    dayOfWeek: slot.dayOfWeek,
    startTime: slot.startTime,
    endTime: slot.endTime,
  };
}

function formatBlockedDate(slot: CalendarSlot) {
  if (!slot.specificDate) return "Date bloquee";
  const rawDate = slot.specificDate;

  try {
    const date = parseDateOnlyFromApi(rawDate);
    if (!date) return rawDate.slice(0, 10);

    return new Intl.DateTimeFormat("fr-CA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return rawDate.slice(0, 10);
  }
}

export default function AvailabilityPage() {
  const queryClient = useQueryClient();
  const [selectedDay, setSelectedDay] = useState(0);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [blockDate, setBlockDate] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [showBlockForm, setShowBlockForm] = useState(false);

  const {
    data: availability,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["availability"],
    queryFn: () => api.getAvailability(),
  });

  const normalized = useMemo(() => normalizeAvailability(availability), [availability]);
  const recurringSlots = normalized.recurring;
  const blockedSlots = normalized.blocked;
  const specificSlots = normalized.specific;
  const selectedSlots = recurringSlots.filter((slot) => slot.dayOfWeek === selectedDay);
  const activeDays = DAYS.filter((_, index) =>
    recurringSlots.some((slot) => slot.dayOfWeek === index),
  ).length;
  const nextBlockedDate = blockedSlots.find((slot) => slot.specificDate);

  const invalidateAvailability = () => {
    queryClient.invalidateQueries({ queryKey: ["availability"] });
    queryClient.invalidateQueries({ queryKey: ["my-availability"] });
    queryClient.invalidateQueries({ queryKey: ["featured-workers-public"] });
  };

  const addSlotMutation = useMutation({
    mutationFn: (slot: SlotInput) =>
      api.setMyAvailability([...recurringSlots.map(toSlotInput), slot]),
    onSuccess: () => {
      invalidateAvailability();
      toast.success("Creneau ajoute");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      toast.error(`Echec de l'ajout : ${message}`);
    },
  });

  const removeSlotMutation = useMutation({
    mutationFn: (slotId: string) =>
      api.setMyAvailability(
        recurringSlots
          .filter((slot) => slot.id !== slotId)
          .map(toSlotInput),
      ),
    onSuccess: () => {
      invalidateAvailability();
      toast.success("Creneau retire");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      toast.error(`Echec de la suppression : ${message}`);
    },
  });

  const blockMutation = useMutation({
    mutationFn: () =>
      api.blockTime({
        specificDate: blockDate,
        startTime: "00:00",
        endTime: "23:59",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    onSuccess: () => {
      invalidateAvailability();
      toast.success(blockReason.trim() ? `Date bloquee : ${blockReason.trim()}` : "Date bloquee");
      setBlockDate("");
      setBlockReason("");
      setShowBlockForm(false);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      toast.error(`Echec du blocage : ${message}`);
    },
  });

  const handleAddSlot = () => {
    if (endTime <= startTime) {
      toast.error("L'heure de fin doit etre apres l'heure de debut");
      return;
    }

    const duplicate = selectedSlots.some(
      (slot) => slot.startTime === startTime && slot.endTime === endTime,
    );
    if (duplicate) {
      toast.error("Ce creneau existe deja pour cette journee");
      return;
    }

    addSlotMutation.mutate({ dayOfWeek: selectedDay, startTime, endTime });
  };

  const isMutating =
    addSlotMutation.isPending || removeSlotMutation.isPending || blockMutation.isPending;

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 pb-36 sm:px-6 lg:px-8">
      <header className="workon-dark-panel overflow-hidden rounded-[28px] p-5 shadow-lg shadow-workon-primary/15 sm:p-6">
        <div className="relative z-10 space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                <Clock className="h-3.5 w-3.5 text-workon-gold" />
                Disponibilites
              </div>
              <h1 className="font-[family-name:var(--font-cabinet)] text-3xl font-black tracking-tight text-white md:text-4xl">
                Gerer mes creneaux
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/72">
                Ajuste tes plages ouvertes, bloque les dates sensibles et garde
                ton agenda pret pour les demandes clients.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row md:justify-end">
              <button
                type="button"
                onClick={() => refetch()}
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
                href="/calendar"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-workon-primary shadow-sm transition hover:bg-workon-bg-cream"
              >
                Calendrier
                <CalendarDays className="h-4 w-4" />
              </Link>
              <Link
                href="/bookings"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15"
              >
                Reservations
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <AvailabilityMetric icon={CalendarDays} label="Jours actifs" value={activeDays} detail="Sur 7 jours" />
            <AvailabilityMetric icon={Clock} label="Creneaux" value={recurringSlots.length} detail="Recurrents" />
            <AvailabilityMetric icon={Ban} label="Blocages" value={blockedSlots.length} detail="Dates fermees" />
            <AvailabilityMetric icon={Sparkles} label="Jour choisi" value={selectedSlots.length} detail={DAYS[selectedDay].label} />
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/10 p-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-white/70">
              <CheckCircle2 className="h-4 w-4 text-workon-gold" />
              {recurringSlots.length > 0
                ? "Profil pret a recevoir des reservations"
                : "Aucun creneau recurrent pour l'instant"}
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-white/62">
              <Ban className="h-4 w-4" />
              {nextBlockedDate
                ? `Prochain blocage: ${formatBlockedDate(nextBlockedDate)}`
                : "Aucun blocage date"}
            </div>
          </div>
        </div>
      </header>

      <section className="mt-5 rounded-[24px] border border-workon-border bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-1 px-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-workon-stone">
              Semaine type
            </p>
            <h2 className="font-[family-name:var(--font-cabinet)] text-xl font-black text-workon-ink">
              Choisir une journee
            </h2>
          </div>
          <p className="text-xs font-semibold text-workon-muted">
            {recurringSlots.length} creneau{recurringSlots.length > 1 ? "x" : ""} publie{recurringSlots.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {DAYS.map((day, index) => {
            const count = recurringSlots.filter((slot) => slot.dayOfWeek === index).length;
            const selected = selectedDay === index;
            return (
              <button
                key={day.label}
                type="button"
                onClick={() => setSelectedDay(index)}
                aria-pressed={selected}
                className={cn(
                  "min-h-[118px] rounded-[22px] border p-3 text-left transition",
                  selected
                    ? "border-workon-primary bg-workon-primary text-white shadow-sm"
                    : count > 0
                      ? "border-workon-primary/25 bg-workon-primary/5 text-workon-ink hover:bg-white"
                      : "border-workon-border bg-workon-bg-cream text-workon-ink hover:border-workon-primary/30 hover:bg-white",
                )}
              >
                <span className={cn("block text-[10px] font-black uppercase tracking-[0.14em]", selected ? "text-white/65" : "text-workon-stone")}>
                  {day.short}
                </span>
                <span className="mt-2 block font-[family-name:var(--font-cabinet)] text-2xl font-black">
                  {count}
                </span>
                <span className={cn("mt-2 block text-xs font-bold", selected ? "text-white/75" : "text-workon-muted")}>
                  {count > 0 ? "Creneau actif" : "Jour ferme"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {isLoading ? (
        <StatePanel
          icon={Loader2}
          title="Chargement des disponibilites"
          text="On recupere tes creneaux et blocages."
          spinning
        />
      ) : isError ? (
        <StatePanel
          icon={AlertCircle}
          title="Disponibilites indisponibles"
          text="Relance l'actualisation ou reviens dans quelques instants."
          tone="danger"
          action={
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-workon-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-workon-primary-hover"
            >
              Reessayer
              <RefreshCw className="h-4 w-4" />
            </button>
          }
        />
      ) : (
        <main className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-4">
            <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-workon-stone">
                  Jour selectionne
                </p>
                <h2 className="font-[family-name:var(--font-cabinet)] text-2xl font-black text-workon-ink">
                  {DAYS[selectedDay].label}
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-workon-border bg-white px-3 py-1.5 text-xs font-black text-workon-ink shadow-sm">
                <Clock className="h-3.5 w-3.5 text-workon-primary" />
                {selectedSlots.length} creneau{selectedSlots.length > 1 ? "x" : ""}
              </span>
            </div>

            <div className="rounded-[24px] border border-workon-border bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-workon-stone">
                    Plages ouvertes
                  </p>
                  <h3 className="mt-1 font-[family-name:var(--font-cabinet)] text-xl font-black text-workon-ink">
                    {selectedSlots.length > 0 ? "Creneaux publies" : "Aucun creneau"}
                  </h3>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-workon-primary/10 text-workon-primary">
                  <Clock className="h-4 w-4" />
                </span>
              </div>

              {selectedSlots.length === 0 ? (
                <div className="mt-4 rounded-[22px] border border-dashed border-workon-border bg-workon-bg-cream p-6 text-center">
                  <p className="text-sm font-semibold text-workon-muted">
                    Ce jour est ferme dans ta semaine type.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {selectedSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex flex-col gap-3 rounded-2xl border border-workon-border bg-workon-bg-cream p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                          <Clock className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-black text-workon-ink">
                            {slot.startTime} - {slot.endTime}
                          </p>
                          <p className="text-xs font-semibold text-workon-muted">
                            Disponible
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSlotMutation.mutate(slot.id)}
                        disabled={isMutating}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-3 py-2 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                      >
                        {removeSlotMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Retirer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[24px] border border-workon-border bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-workon-stone">
                    Nouveau creneau
                  </p>
                  <h3 className="mt-1 font-[family-name:var(--font-cabinet)] text-xl font-black text-workon-ink">
                    Ajouter sur {DAYS[selectedDay].label}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_SLOTS.map((slot) => (
                    <button
                      key={slot.label}
                      type="button"
                      onClick={() => {
                        setStartTime(slot.startTime);
                        setEndTime(slot.endTime);
                      }}
                      className="rounded-full border border-workon-border bg-workon-bg-cream px-3 py-1.5 text-xs font-black text-workon-ink transition hover:border-workon-primary/30 hover:text-workon-primary"
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <div>
                  <label htmlFor="availability-start" className="mb-1 block text-xs font-bold text-workon-muted">
                    Debut
                  </label>
                  <Input
                    id="availability-start"
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    className="h-11 rounded-2xl border-workon-border bg-white text-workon-ink"
                  />
                </div>
                <div>
                  <label htmlFor="availability-end" className="mb-1 block text-xs font-bold text-workon-muted">
                    Fin
                  </label>
                  <Input
                    id="availability-end"
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    className="h-11 rounded-2xl border-workon-border bg-white text-workon-ink"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleAddSlot}
                  disabled={isMutating}
                  className="h-11 rounded-full bg-workon-primary px-5 font-black text-white hover:bg-workon-primary-hover"
                >
                  {addSlotMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Ajouter
                      <Plus className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-[24px] border border-workon-border bg-white p-4 shadow-sm sm:p-5">
              <button
                type="button"
                onClick={() => setShowBlockForm((value) => !value)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <span>
                  <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-workon-stone">
                    Date specifique
                  </span>
                  <span className="mt-1 block font-[family-name:var(--font-cabinet)] text-xl font-black text-workon-ink">
                    Bloquer une date
                  </span>
                </span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <Ban className="h-4 w-4" />
                </span>
              </button>

              {showBlockForm && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label htmlFor="block-date" className="mb-1 block text-xs font-bold text-workon-muted">
                      Date
                    </label>
                    <Input
                      id="block-date"
                      type="date"
                      value={blockDate}
                      onChange={(event) => setBlockDate(event.target.value)}
                      className="h-11 rounded-2xl border-workon-border bg-white text-workon-ink"
                    />
                  </div>
                  <div>
                    <label htmlFor="block-reason" className="mb-1 block text-xs font-bold text-workon-muted">
                      Raison
                    </label>
                    <Input
                      id="block-reason"
                      value={blockReason}
                      onChange={(event) => setBlockReason(event.target.value)}
                      placeholder="Vacances, rendez-vous..."
                      className="h-11 rounded-2xl border-workon-border bg-white text-workon-ink placeholder-workon-muted/50"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => blockMutation.mutate()}
                    disabled={!blockDate || isMutating}
                    className="h-11 w-full rounded-full bg-workon-primary font-black text-white hover:bg-workon-primary-hover"
                  >
                    {blockMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Bloquer
                        <Ban className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div className="rounded-[24px] border border-workon-border bg-white p-4 shadow-sm sm:p-5">
              <SectionHeader
                icon={Ban}
                title="Blocages"
                detail={`${blockedSlots.length} date${blockedSlots.length > 1 ? "s" : ""}`}
              />
              {blockedSlots.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {blockedSlots.slice(0, 5).map((slot) => (
                    <div
                      key={slot.id}
                      className="rounded-2xl border border-red-100 bg-red-50 p-3 text-red-700"
                    >
                      <p className="text-sm font-black capitalize">{formatBlockedDate(slot)}</p>
                      <p className="mt-1 text-xs font-semibold">
                        {slot.startTime} - {slot.endTime}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <QuietPanel text="Aucune date bloquee." />
              )}
            </div>

            <div className="rounded-[24px] border border-workon-border bg-white p-4 shadow-sm sm:p-5">
              <SectionHeader
                icon={Sparkles}
                title="Exceptions"
                detail={`${specificSlots.length} creneau${specificSlots.length > 1 ? "x" : ""}`}
              />
              {specificSlots.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {specificSlots.slice(0, 4).map((slot) => (
                    <div
                      key={slot.id}
                      className="rounded-2xl border border-workon-border bg-workon-bg-cream p-3"
                    >
                      <p className="text-sm font-black text-workon-ink">
                        {formatBlockedDate(slot)}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-workon-muted">
                        {slot.startTime} - {slot.endTime}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <QuietPanel text="Aucune exception ouverte." />
              )}
            </div>
          </aside>
        </main>
      )}
    </div>
  );
}

function AvailabilityMetric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-white">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55">
            {label}
          </p>
          <p className="mt-1 text-2xl font-black tracking-tight">{value}</p>
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

function SectionHeader({
  icon: Icon,
  title,
  detail,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-workon-stone">
          {title}
        </p>
        <p className="mt-1 text-sm font-semibold text-workon-muted">{detail}</p>
      </div>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-workon-primary/10 text-workon-primary">
        <Icon className="h-4 w-4" />
      </span>
    </div>
  );
}

function QuietPanel({ text }: { text: string }) {
  return (
    <div className="mt-4 rounded-[22px] border border-dashed border-workon-border bg-workon-bg-cream p-4 text-sm font-semibold leading-relaxed text-workon-muted">
      {text}
    </div>
  );
}

function StatePanel({
  icon: Icon,
  title,
  text,
  action,
  spinning,
  tone = "neutral",
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  action?: React.ReactNode;
  spinning?: boolean;
  tone?: "neutral" | "danger";
}) {
  return (
    <section className="mt-5 rounded-[24px] border border-workon-border bg-white p-8 text-center shadow-sm">
      <div
        className={cn(
          "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl",
          tone === "danger" ? "bg-red-50 text-red-600" : "bg-workon-primary/10 text-workon-primary",
        )}
      >
        <Icon className={cn("h-6 w-6", spinning && "animate-spin")} />
      </div>
      <h2 className="mt-4 font-[family-name:var(--font-cabinet)] text-xl font-black text-workon-ink">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-workon-muted">{text}</p>
      {action}
    </section>
  );
}
