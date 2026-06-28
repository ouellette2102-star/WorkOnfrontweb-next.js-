"use client";

import { type ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  Ban,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Pencil,
  RefreshCw,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";
import {
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  formatDistanceToNow,
  getDay,
  isSameDay,
  isToday,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { fr } from "date-fns/locale";
import { useMode } from "@/contexts/mode-context";
import { api, type AvailabilitySlot, type BookingResponse } from "@/lib/api-client";
import { parseDateOnlyFromApi } from "@/lib/date-only";
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

const STATUS_CONFIG: Record<
  BookingResponse["status"],
  { label: string; className: string; icon: LucideIcon; tone: "warn" | "info" | "live" | "done" | "danger" | "neutral" }
> = {
  PENDING: {
    label: "En attente",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    icon: Clock,
    tone: "warn",
  },
  CONFIRMED: {
    label: "Confirmee",
    className: "border-blue-200 bg-blue-50 text-blue-700",
    icon: CheckCircle2,
    tone: "info",
  },
  IN_PROGRESS: {
    label: "En cours",
    className: "border-purple-200 bg-purple-50 text-purple-700",
    icon: Loader2,
    tone: "live",
  },
  COMPLETED: {
    label: "Terminee",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
    tone: "done",
  },
  CANCELLED: {
    label: "Annulee",
    className: "border-red-200 bg-red-50 text-red-700",
    icon: AlertCircle,
    tone: "danger",
  },
  NO_SHOW: {
    label: "Absence",
    className: "border-neutral-200 bg-neutral-50 text-neutral-700",
    icon: AlertCircle,
    tone: "neutral",
  },
};

function jsDayToSlotDay(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1;
}

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

function normalizeAvailability(payload: AvailabilityPayload) {
  if (Array.isArray(payload)) {
    return splitSlots(payload);
  }

  const recurring = Array.isArray(payload?.recurring) ? payload.recurring : [];
  const specific = Array.isArray(payload?.specific) ? payload.specific : [];
  const blocked = Array.isArray(payload?.blocked) ? payload.blocked : [];
  const allOpen = [...recurring, ...specific].filter((slot) => !slot.isBlocked);
  const allBlocked = [...blocked, ...recurring, ...specific].filter((slot) => slot.isBlocked);

  return {
    available: allOpen as CalendarSlot[],
    blocked: allBlocked as CalendarSlot[],
  };
}

function splitSlots(slots: AvailabilitySlot[]) {
  return {
    available: slots.filter((slot) => !slot.isBlocked) as CalendarSlot[],
    blocked: slots.filter((slot) => slot.isBlocked) as CalendarSlot[],
  };
}

function slotMatchesDay(slot: CalendarSlot, date: Date) {
  if (slot.specificDate) {
    const slotDate = parseDateOnlyFromApi(slot.specificDate);
    return slotDate ? isSameDay(slotDate, date) : false;
  }

  return slot.dayOfWeek === jsDayToSlotDay(getDay(date));
}

function getPersonName(booking: BookingResponse, isWorker: boolean) {
  if (isWorker) {
    if (!booking.client) return booking.clientId;
    return (
      `${booking.client.firstName ?? ""} ${booking.client.lastName ?? ""}`.trim() ||
      booking.client.email ||
      booking.clientId
    );
  }

  if (!booking.worker?.user) return booking.workerId;
  return (
    `${booking.worker.user.firstName ?? ""} ${booking.worker.user.lastName ?? ""}`.trim() ||
    booking.workerId
  );
}

function getRoleLabel(isWorker: boolean) {
  return isWorker ? "Client" : "Travailleur";
}

function getNextStep(booking: BookingResponse, isWorker: boolean) {
  if (booking.status === "PENDING" && isWorker) return "A confirmer";
  if (booking.status === "PENDING") return "En attente pro";
  if (booking.status === "CONFIRMED" && isWorker) return "A executer";
  if (booking.status === "CONFIRMED") return "Confirmee";
  if (booking.status === "IN_PROGRESS") return "En cours";
  if (booking.status === "COMPLETED") return "Historique";
  if (booking.status === "CANCELLED") return "Annulee";
  return "A verifier";
}

export default function CalendarPage() {
  const { mode } = useMode();
  const isWorker = mode === "pro";
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const baseDate = useMemo(() => addWeeks(new Date(), weekOffset), [weekOffset]);
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const {
    data: availabilityPayload,
    isLoading: slotsLoading,
    isFetching: slotsFetching,
    isError: slotsError,
    refetch: refetchAvailability,
  } = useQuery({
    queryKey: ["availability"],
    queryFn: () => api.getAvailability(),
  });

  const {
    data: bookings,
    isLoading: bookingsLoading,
    isFetching: bookingsFetching,
    isError: bookingsError,
    refetch: refetchBookings,
  } = useQuery({
    queryKey: ["bookings-calendar", isWorker],
    queryFn: () => (isWorker ? api.getWorkerBookings() : api.getMyBookings()),
  });

  const normalizedAvailability = useMemo(
    () => normalizeAvailability(availabilityPayload),
    [availabilityPayload],
  );

  const sortedBookings = useMemo(
    () => {
      const safeBookings = Array.isArray(bookings) ? bookings : [];
      return safeBookings
        .slice()
        .sort((a, b) => parseDate(a.scheduledDate).getTime() - parseDate(b.scheduledDate).getTime());
    },
    [bookings],
  );

  const getSlotsForDay = (date: Date): CalendarSlot[] =>
    normalizedAvailability.available.filter((slot) => slotMatchesDay(slot, date));

  const getBlockedForDay = (date: Date): CalendarSlot[] =>
    normalizedAvailability.blocked.filter((slot) => slotMatchesDay(slot, date));

  const getBookingsForDay = (date: Date): BookingResponse[] =>
    sortedBookings.filter((booking) => isSameDay(parseDate(booking.scheduledDate), date));

  const selectedSlots = getSlotsForDay(selectedDate);
  const selectedBlocked = getBlockedForDay(selectedDate);
  const selectedBookings = getBookingsForDay(selectedDate);
  const isLoading = slotsLoading || bookingsLoading;
  const isFetching = slotsFetching || bookingsFetching;
  const isError = slotsError || bookingsError;
  const weekLabel = `${format(weekStart, "d MMM", { locale: fr })} - ${format(weekEnd, "d MMM yyyy", { locale: fr })}`;
  const weekBookings = days.flatMap((day) => getBookingsForDay(day));
  const weekOpenSlots = days.reduce((count, day) => count + getSlotsForDay(day).length, 0);
  const weekBlockedSlots = days.reduce((count, day) => count + getBlockedForDay(day).length, 0);
  const nextBooking = weekBookings.find((booking) => !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(booking.status));

  const refreshAll = () => {
    void refetchAvailability();
    void refetchBookings();
  };

  const goToPreviousWeek = () => {
    setWeekOffset((offset) => offset - 1);
    setSelectedDate((date) => subWeeks(date, 1));
  };

  const goToNextWeek = () => {
    setWeekOffset((offset) => offset + 1);
    setSelectedDate((date) => addWeeks(date, 1));
  };

  const goToCurrentWeek = () => {
    setWeekOffset(0);
    setSelectedDate(new Date());
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 pb-36 sm:px-6 lg:px-8">
      <header className="workon-dark-panel overflow-hidden rounded-[28px] p-5 shadow-lg shadow-workon-primary/15 sm:p-6">
        <div className="relative z-10 space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                <CalendarDays className="h-3.5 w-3.5 text-workon-gold" />
                Calendrier
              </div>
              <h1 className="font-[family-name:var(--font-cabinet)] text-3xl font-black tracking-tight text-white md:text-4xl">
                Agenda de la semaine
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/72">
                Disponibilites, blocages et reservations restent visibles dans
                une vue de semaine lisible, avec les raccourcis essentiels.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row md:justify-end">
              <button
                type="button"
                onClick={refreshAll}
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
                href="/worker/availability"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-workon-primary shadow-sm transition hover:bg-workon-bg-cream"
              >
                Disponibilites
                <Pencil className="h-4 w-4" />
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
            <CalendarMetric icon={CalendarDays} label="Semaine" value="7" detail="Jours suivis" />
            <CalendarMetric icon={Clock} label="Disponibles" value={String(weekOpenSlots)} detail="Creneaux ouverts" />
            <CalendarMetric icon={Ban} label="Blocages" value={String(weekBlockedSlots)} detail="Indisponibilites" />
            <CalendarMetric icon={User} label="Reservations" value={String(weekBookings.length)} detail="Dans la semaine" />
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/10 p-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-white/70">
              <Sparkles className="h-4 w-4 text-workon-gold" />
              Mode {isWorker ? "pro: agenda clients et disponibilites" : "client: rendez-vous reserves"}
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-white/62">
              <Clock className="h-4 w-4" />
              {nextBooking
                ? `Prochain rendez-vous ${formatDistanceToNow(parseDate(nextBooking.scheduledDate), { addSuffix: true, locale: fr })}`
                : "Aucun rendez-vous actif dans cette semaine"}
            </div>
          </div>
        </div>
      </header>

      <section className="mt-5 rounded-[24px] border border-workon-border bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-workon-stone">
              Semaine active
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-cabinet)] text-xl font-black capitalize text-workon-ink">
              {weekLabel}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToPreviousWeek}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-workon-border bg-white text-workon-muted transition hover:border-workon-primary/30 hover:text-workon-primary"
              aria-label="Semaine precedente"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goToCurrentWeek}
              className="h-10 rounded-full border border-workon-border bg-workon-bg-cream px-4 text-sm font-black text-workon-ink transition hover:border-workon-primary/30 hover:text-workon-primary"
            >
              Aujourd&apos;hui
            </button>
            <button
              type="button"
              onClick={goToNextWeek}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-workon-border bg-white text-workon-muted transition hover:border-workon-primary/30 hover:text-workon-primary"
              aria-label="Semaine suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {days.map((day) => {
            const active = isSameDay(day, selectedDate);
            const today = isToday(day);
            const daySlots = getSlotsForDay(day);
            const dayBlocked = getBlockedForDay(day);
            const dayBookings = getBookingsForDay(day);
            const hasActivity = daySlots.length > 0 || dayBlocked.length > 0 || dayBookings.length > 0;

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setSelectedDate(day)}
                aria-pressed={active}
                className={cn(
                  "min-h-[126px] rounded-[22px] border p-3 text-left transition",
                  active
                    ? "border-workon-primary bg-workon-primary text-white shadow-sm"
                    : "border-workon-border bg-workon-bg-cream text-workon-ink hover:border-workon-primary/30 hover:bg-white",
                )}
              >
                <span className="flex items-start justify-between gap-2">
                  <span>
                    <span className={cn("block text-[10px] font-black uppercase tracking-[0.14em]", active ? "text-white/65" : "text-workon-stone")}>
                      {format(day, "EEE", { locale: fr })}
                    </span>
                    <span className="mt-1 block text-2xl font-black tracking-tight">
                      {format(day, "d")}
                    </span>
                  </span>
                  {today && (
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-black", active ? "bg-white/15 text-white" : "bg-workon-primary/10 text-workon-primary")}>
                      Today
                    </span>
                  )}
                </span>

                <span className={cn("mt-4 grid gap-1 text-[11px] font-bold", active ? "text-white/75" : "text-workon-muted")}>
                  <span>{dayBookings.length} res.</span>
                  <span>{daySlots.length} dispo.</span>
                  <span>{dayBlocked.length} bloque.</span>
                </span>

                {hasActivity && (
                  <span className={cn("mt-3 flex gap-1", active ? "text-white" : "text-workon-primary")}>
                    {dayBookings.length > 0 && <span className="h-1.5 w-5 rounded-full bg-current" />}
                    {daySlots.length > 0 && <span className="h-1.5 w-3 rounded-full bg-emerald-500" />}
                    {dayBlocked.length > 0 && <span className="h-1.5 w-3 rounded-full bg-neutral-400" />}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {isLoading ? (
        <StatePanel
          icon={Loader2}
          title="Chargement du calendrier"
          text="On recupere les disponibilites et les reservations de cette vue."
          spinning
        />
      ) : isError ? (
        <StatePanel
          icon={AlertCircle}
          title="Impossible de charger le calendrier"
          text="Relance l'actualisation ou reviens dans quelques instants."
          tone="danger"
          action={
            <button
              type="button"
              onClick={refreshAll}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-workon-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-workon-primary-hover"
            >
              Reessayer
              <RefreshCw className="h-4 w-4" />
            </button>
          }
        />
      ) : (
        <DayDetail
          date={selectedDate}
          slots={selectedSlots}
          blocked={selectedBlocked}
          bookings={selectedBookings}
          isWorker={isWorker}
        />
      )}
    </div>
  );
}

function DayDetail({
  date,
  slots,
  blocked,
  bookings,
  isWorker,
}: {
  date: Date;
  slots: CalendarSlot[];
  blocked: CalendarSlot[];
  bookings: BookingResponse[];
  isWorker: boolean;
}) {
  const dayLabel = format(date, "EEEE d MMMM", { locale: fr });
  const isEmpty = slots.length === 0 && blocked.length === 0 && bookings.length === 0;

  return (
    <section className="mt-6">
      <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-workon-stone">
            Jour selectionne
          </p>
          <h2 className="font-[family-name:var(--font-cabinet)] text-2xl font-black capitalize text-workon-ink">
            {dayLabel}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <SummaryPill icon={User} label={`${bookings.length} reservation${bookings.length > 1 ? "s" : ""}`} />
          <SummaryPill icon={Clock} label={`${slots.length} dispo.`} />
          <SummaryPill icon={Ban} label={`${blocked.length} bloque.`} />
        </div>
      </div>

      {isEmpty ? (
        <EmptyDay isWorker={isWorker} />
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-3">
            <SectionHeader
              icon={User}
              title="Reservations"
              detail={bookings.length > 0 ? "Rendez-vous fixes sur cette date" : "Aucune reservation ce jour"}
            />
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} isWorker={isWorker} />
              ))
            ) : (
              <QuietPanel text="Aucune reservation sur cette date. Les disponibilites restent visibles a droite." />
            )}
          </div>

          <aside className="space-y-4">
            <div className="space-y-3">
              <SectionHeader
                icon={Clock}
                title="Disponibilites"
                detail={slots.length > 0 ? "Creneaux ouverts" : "Aucun creneau ouvert"}
              />
              {slots.length > 0 ? (
                <div className="space-y-2">
                  {slots.map((slot) => (
                    <SlotRow key={slot.id} slot={slot} type="open" />
                  ))}
                </div>
              ) : (
                <QuietPanel text="Ajoute des plages dans tes disponibilites pour recevoir des demandes." />
              )}
            </div>

            <div className="space-y-3">
              <SectionHeader
                icon={Ban}
                title="Blocages"
                detail={blocked.length > 0 ? "Temps non disponible" : "Aucun blocage"}
              />
              {blocked.length > 0 ? (
                <div className="space-y-2">
                  {blocked.map((slot) => (
                    <SlotRow key={slot.id} slot={slot} type="blocked" />
                  ))}
                </div>
              ) : (
                <QuietPanel text="Rien de bloque sur cette journee." />
              )}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

function CalendarMetric({
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

function BookingCard({ booking, isWorker }: { booking: BookingResponse; isWorker: boolean }) {
  const statusConfig = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.PENDING;
  const StatusIcon = statusConfig.icon;
  const bookingDate = parseDate(booking.scheduledDate);

  return (
    <article className="overflow-hidden rounded-[24px] border border-workon-border bg-white p-4 shadow-sm transition hover:border-workon-primary/30 hover:shadow-[0_18px_48px_rgba(27,26,24,0.10)] sm:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-workon-primary text-white shadow-sm">
            <User className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-workon-stone">
                {getRoleLabel(isWorker)}
              </p>
              <StatusBadge config={statusConfig} />
            </div>
            <h3 className="mt-1 truncate text-lg font-black text-workon-ink">
              {getPersonName(booking, isWorker)}
            </h3>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-workon-stone">
              <CalendarDays className="h-4 w-4 text-workon-primary" />
              {format(bookingDate, "EEEE d MMMM yyyy", { locale: fr })}
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 md:w-[420px]">
          <BookingFact icon={Clock} label="Heure" value={format(bookingDate, "HH:mm", { locale: fr })} />
          <BookingFact icon={StatusIcon} label="Statut" value={statusConfig.label} />
          <BookingFact icon={Sparkles} label="Suite" value={getNextStep(booking, isWorker)} />
        </div>
      </div>

      {booking.notes && (
        <div className="mt-4 rounded-2xl border border-workon-border bg-workon-bg-cream p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-workon-stone">
            Notes
          </p>
          <p className="mt-1 text-sm leading-relaxed text-workon-gray">{booking.notes}</p>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 border-t border-workon-border pt-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs font-bold text-workon-muted">
          Creee le {format(parseDate(booking.createdAt), "d MMM yyyy", { locale: fr })}
        </span>
        <Link
          href="/bookings"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-workon-border bg-white px-4 py-2 text-sm font-black text-workon-ink transition hover:border-workon-primary/30 hover:text-workon-primary"
        >
          Gerer
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function SlotRow({ slot, type }: { slot: CalendarSlot; type: "open" | "blocked" }) {
  const isBlocked = type === "blocked";
  const Icon = isBlocked ? Ban : Clock;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-3 shadow-sm",
        isBlocked
          ? "border-neutral-200 bg-neutral-50 text-neutral-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          isBlocked ? "bg-neutral-200/70" : "bg-emerald-100",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black">
          {isBlocked ? "Indisponible" : "Disponible"}
        </span>
        <span className="block text-xs font-semibold">
          {slot.startTime} - {slot.endTime}
        </span>
      </span>
    </div>
  );
}

function StatusBadge({
  config,
}: {
  config: (typeof STATUS_CONFIG)[BookingResponse["status"]];
}) {
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide",
        config.className,
      )}
    >
      <Icon className={cn("h-3 w-3", config.tone === "live" && "animate-spin")} />
      {config.label}
    </span>
  );
}

function BookingFact({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-workon-border bg-workon-bg-cream p-3">
      <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-workon-stone">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="truncate text-sm font-black text-workon-ink">{value}</p>
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
    <div className="flex items-end justify-between gap-3 px-1">
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

function SummaryPill({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-workon-border bg-white px-3 py-1.5 text-xs font-black text-workon-ink shadow-sm">
      <Icon className="h-3.5 w-3.5 text-workon-primary" />
      {label}
    </span>
  );
}

function QuietPanel({ text }: { text: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-workon-border bg-white p-4 text-sm font-semibold leading-relaxed text-workon-muted">
      {text}
    </div>
  );
}

function EmptyDay({ isWorker }: { isWorker: boolean }) {
  return (
    <div className="mt-4 overflow-hidden rounded-[24px] border border-workon-border bg-white p-6 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-workon-primary/10 text-workon-primary">
        <CalendarDays className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-[family-name:var(--font-cabinet)] text-xl font-black text-workon-ink">
        Rien de planifie ce jour
      </h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-workon-muted">
        {isWorker
          ? "Ajoute ou ajuste tes disponibilites pour ouvrir ce jour a de nouvelles demandes."
          : "Tes prochaines reservations apparaitront ici des qu'elles seront confirmees."}
      </p>
      <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
        <Link
          href="/worker/availability"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-workon-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-workon-primary-hover"
        >
          Disponibilites
          <Pencil className="h-4 w-4" />
        </Link>
        <Link
          href="/bookings"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-workon-border bg-white px-4 py-2.5 text-sm font-bold text-workon-ink transition hover:border-workon-primary/30 hover:text-workon-primary"
        >
          Voir les reservations
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
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
  action?: ReactNode;
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
