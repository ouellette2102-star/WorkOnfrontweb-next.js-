"use client";

import { type ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
  Sparkles,
  User,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useMode } from "@/contexts/mode-context";
import { api, type BookingResponse } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FilterTab = "all" | "upcoming" | "completed";

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
    icon: CheckCircle,
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
    icon: CheckCircle,
    tone: "done",
  },
  CANCELLED: {
    label: "Annulee",
    className: "border-red-200 bg-red-50 text-red-700",
    icon: XCircle,
    tone: "danger",
  },
  NO_SHOW: {
    label: "Absence",
    className: "border-neutral-200 bg-neutral-50 text-neutral-700",
    icon: AlertCircle,
    tone: "neutral",
  },
};

const TABS: Array<{ key: FilterTab; label: string; detail: string; icon: LucideIcon }> = [
  { key: "all", label: "Toutes", detail: "Vue complete", icon: Calendar },
  { key: "upcoming", label: "A venir", detail: "A preparer", icon: Clock },
  { key: "completed", label: "Terminees", detail: "Historique", icon: CheckCircle },
];

function getFilters(activeTab: FilterTab) {
  if (activeTab === "upcoming") return { upcoming: true };
  if (activeTab === "completed") return { status: "COMPLETED" };
  return undefined;
}

function parseBookingDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
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
  if (booking.status === "PENDING" && isWorker) return "Confirmer ou annuler";
  if (booking.status === "PENDING") return "En attente de confirmation";
  if (booking.status === "CONFIRMED" && isWorker) return "Terminer apres service";
  if (booking.status === "CONFIRMED") return "Reservation confirmee";
  if (booking.status === "IN_PROGRESS") return "Suivi en cours";
  if (booking.status === "COMPLETED") return "Historique conserve";
  if (booking.status === "CANCELLED") return "Reservation annulee";
  return "Suivi requis";
}

export default function BookingsPage() {
  const { mode } = useMode();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const isWorker = mode === "pro";

  const {
    data: bookings,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["bookings", isWorker, activeTab],
    queryFn: () =>
      isWorker
        ? api.getWorkerBookings(getFilters(activeTab))
        : api.getMyBookings(getFilters(activeTab)),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => api.confirmBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Reservation confirmee");
    },
    onError: () => toast.error("Erreur lors de la confirmation"),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.cancelBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Reservation annulee");
    },
    onError: () => toast.error("Erreur lors de l'annulation"),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.completeBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Reservation terminee");
    },
    onError: () => toast.error("Erreur lors de la completion"),
  });

  const visibleBookings = useMemo(
    () =>
      (bookings ?? [])
        .slice()
        .sort(
          (a, b) =>
            parseBookingDate(a.scheduledDate).getTime() -
            parseBookingDate(b.scheduledDate).getTime(),
        ),
    [bookings],
  );

  const pendingCount = visibleBookings.filter((booking) => booking.status === "PENDING").length;
  const confirmedCount = visibleBookings.filter(
    (booking) => booking.status === "CONFIRMED" || booking.status === "IN_PROGRESS",
  ).length;
  const completedCount = visibleBookings.filter((booking) => booking.status === "COMPLETED").length;
  const actionableCount = visibleBookings.filter(
    (booking) => isWorker && booking.status === "PENDING",
  ).length;
  const nextBooking = visibleBookings.find(
    (booking) => !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(booking.status),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 pb-36 sm:px-6 lg:px-8">
      <header className="workon-dark-panel overflow-hidden rounded-[28px] p-5 shadow-lg shadow-workon-primary/15 sm:p-6">
        <div className="relative z-10 space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                <Calendar className="h-3.5 w-3.5 text-workon-gold" />
                Reservations
              </div>
              <h1 className="font-[family-name:var(--font-cabinet)] text-3xl font-black tracking-tight text-white md:text-4xl">
                Mes reservations
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/72">
                Garde les demandes, confirmations et suivis de rendez-vous dans
                une vue claire, sans perdre les actions rapides deja en place.
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
                href={isWorker ? "/worker/availability" : "/pros"}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-workon-primary shadow-sm transition hover:bg-workon-bg-cream"
              >
                {isWorker ? "Gerer mes dispos" : "Trouver un pro"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <BookingMetric icon={Calendar} label="Vue active" value={visibleBookings.length} detail="Reservations" />
            <BookingMetric icon={Clock} label="En attente" value={pendingCount} detail="A confirmer" />
            <BookingMetric icon={CheckCircle} label="Confirmees" value={confirmedCount} detail="A suivre" />
            <BookingMetric icon={Sparkles} label="Actions" value={actionableCount} detail="Priorite pro" />
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/10 p-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-white/70">
              <User className="h-4 w-4 text-workon-gold" />
              Mode {isWorker ? "pro: reservations clients" : "client: pros reserves"}
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-white/62">
              <Clock className="h-4 w-4" />
              {nextBooking
                ? `Prochain rendez-vous ${formatDistanceToNow(parseBookingDate(nextBooking.scheduledDate), { addSuffix: true, locale: fr })}`
                : "Aucun rendez-vous actif pour cette vue"}
            </div>
          </div>
        </div>
      </header>

      <section className="mt-32 grid gap-2 rounded-[24px] border border-workon-border bg-white p-2 shadow-sm sm:mt-4 md:grid-cols-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              aria-pressed={selected}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition",
                selected
                  ? "border-workon-primary bg-workon-primary text-white shadow-sm"
                  : "border-transparent bg-white text-workon-stone hover:border-workon-primary/20 hover:bg-workon-bg-cream hover:text-workon-ink",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  selected ? "bg-white/12 text-white" : "bg-workon-bg text-workon-primary",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black">{tab.label}</span>
                <span className={cn("block text-xs", selected ? "text-white/68" : "text-workon-muted")}>
                  {tab.detail}
                </span>
              </span>
            </button>
          );
        })}
      </section>

      {isLoading ? (
        <StatePanel
          icon={Loader2}
          title="Chargement des reservations"
          text="On recupere les rendez-vous et leur statut."
          spinning
        />
      ) : isError ? (
        <StatePanel
          icon={AlertCircle}
          title="Impossible de charger les reservations"
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
      ) : visibleBookings.length === 0 ? (
        <EmptyBookings isWorker={isWorker} />
      ) : (
        <section className="mt-5 space-y-3">
          <div className="flex flex-col gap-1 px-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-workon-stone">
                {visibleBookings.length} reservation{visibleBookings.length > 1 ? "s" : ""}
              </p>
              <h2 className="font-[family-name:var(--font-cabinet)] text-xl font-black text-workon-ink">
                {activeTab === "all"
                  ? "Toutes les reservations"
                  : activeTab === "upcoming"
                    ? "Reservations a venir"
                    : "Reservations terminees"}
              </h2>
            </div>
            <p className="text-xs font-semibold text-workon-muted">
              {completedCount} terminee{completedCount > 1 ? "s" : ""} dans cette vue
            </p>
          </div>

          <div className="space-y-3">
            {visibleBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                isWorker={isWorker}
                onConfirm={() => confirmMutation.mutate(booking.id)}
                onCancel={() => cancelMutation.mutate(booking.id)}
                onComplete={() => completeMutation.mutate(booking.id)}
                isConfirming={confirmMutation.isPending}
                isCancelling={cancelMutation.isPending}
                isCompleting={completeMutation.isPending}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BookingMetric({
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

function BookingCard({
  booking,
  isWorker,
  onConfirm,
  onCancel,
  onComplete,
  isConfirming,
  isCancelling,
  isCompleting,
}: {
  booking: BookingResponse;
  isWorker: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onComplete: () => void;
  isConfirming: boolean;
  isCancelling: boolean;
  isCompleting: boolean;
}) {
  const statusConfig = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.PENDING;
  const StatusIcon = statusConfig.icon;
  const bookingDate = parseBookingDate(booking.scheduledDate);
  const canConfirm = booking.status === "PENDING" && isWorker;
  const canComplete = booking.status === "CONFIRMED" && isWorker;
  const canCancel = booking.status === "PENDING" || booking.status === "CONFIRMED";
  const hasActions = canConfirm || canComplete || canCancel;

  return (
    <article className="overflow-hidden rounded-[24px] border border-workon-border bg-white p-4 shadow-sm transition hover:border-workon-primary/30 hover:shadow-[0_18px_48px_rgba(27,26,24,0.10)] sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
              <Calendar className="h-4 w-4 text-workon-primary" />
              {format(bookingDate, "EEEE d MMMM yyyy", { locale: fr })}
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:w-[420px]">
          <BookingFact icon={Clock} label="Quand" value={formatDistanceToNow(bookingDate, { addSuffix: true, locale: fr })} />
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
          Creee le {format(parseBookingDate(booking.createdAt), "d MMM yyyy", { locale: fr })}
        </span>

        {hasActions ? (
          <div className="flex flex-wrap gap-2">
            {canConfirm && (
              <Button
                size="sm"
                onClick={onConfirm}
                disabled={isConfirming}
                className="rounded-full bg-blue-600 px-4 font-bold text-white hover:bg-blue-500"
              >
                {isConfirming ? "..." : "Confirmer"}
              </Button>
            )}
            {canComplete && (
              <Button
                size="sm"
                onClick={onComplete}
                disabled={isCompleting}
                className="rounded-full bg-emerald-600 px-4 font-bold text-white hover:bg-emerald-500"
              >
                {isCompleting ? "..." : "Terminer"}
              </Button>
            )}
            {canCancel && (
              <Button
                size="sm"
                variant="outline"
                onClick={onCancel}
                disabled={isCancelling}
                className="rounded-full border-red-200 px-4 font-bold text-red-600 hover:bg-red-50"
              >
                {isCancelling ? "..." : "Annuler"}
              </Button>
            )}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-black text-workon-muted">
            Suivi conserve
            <CheckCircle className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </article>
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
      <p className="line-clamp-2 text-xs font-bold leading-relaxed text-workon-ink">
        {value}
      </p>
    </div>
  );
}

function EmptyBookings({ isWorker }: { isWorker: boolean }) {
  return (
    <section className="mt-5 rounded-[28px] border border-workon-border bg-white p-6 text-center shadow-sm sm:p-8">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-workon-primary/10 text-workon-primary">
        <Calendar className="h-7 w-7" />
      </div>
      <h2 className="mt-4 font-[family-name:var(--font-cabinet)] text-2xl font-black text-workon-ink">
        Aucune reservation
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-workon-gray">
        {isWorker
          ? "Les demandes de clients apparaitront ici avec les actions de confirmation, annulation et cloture."
          : "Tes reservations de pros apparaitront ici avec le statut et les prochaines etapes."}
      </p>

      <div className="mt-6 grid gap-3 text-left md:grid-cols-3">
        <EmptyAction
          icon={isWorker ? Clock : User}
          title={isWorker ? "Ouvrir tes dispos" : "Explorer les pros"}
          text={isWorker ? "Ajuste tes plages pour recevoir de bonnes demandes." : "Trouve un pro et reserve une disponibilite."}
          href={isWorker ? "/worker/availability" : "/pros"}
        />
        <EmptyAction
          icon={Calendar}
          title="Voir le calendrier"
          text="Garde une vue temporelle de ce qui s'en vient."
          href="/calendar"
        />
        <EmptyAction
          icon={AlertCircle}
          title="Besoin d'aide"
          text="Le support peut clarifier une reservation bloquee."
          href="/support"
        />
      </div>

      <Link
        href={isWorker ? "/worker/availability" : "/pros"}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-workon-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-workon-primary-hover md:hidden"
      >
        {isWorker ? "Gerer mes disponibilites" : "Trouver un pro"}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

function EmptyAction({
  icon: Icon,
  title,
  text,
  href,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-workon-border bg-workon-bg-cream p-4 transition hover:border-workon-primary/30 hover:bg-white md:flex md:items-start md:gap-3 md:p-3"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-workon-primary shadow-sm md:h-9 md:w-9">
        <Icon className="h-5 w-5 md:h-4 md:w-4" />
      </span>
      <span className="block min-w-0">
        <span className="mt-3 block text-sm font-black text-workon-ink md:mt-0">
          {title}
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-workon-muted md:line-clamp-1">
          {text}
        </span>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-black text-workon-primary md:mt-1">
          Ouvrir
          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
        </span>
      </span>
    </Link>
  );
}

function StatePanel({
  icon: Icon,
  title,
  text,
  tone = "neutral",
  spinning = false,
  action,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  tone?: "neutral" | "danger";
  spinning?: boolean;
  action?: ReactNode;
}) {
  return (
    <section className="mt-5 rounded-[28px] border border-workon-border bg-white p-8 text-center shadow-sm">
      <div
        className={cn(
          "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl",
          tone === "danger" ? "bg-red-50 text-red-500" : "bg-workon-primary/10 text-workon-primary",
        )}
      >
        <Icon className={cn("h-6 w-6", spinning && "animate-spin")} />
      </div>
      <p className="mt-3 text-sm font-black text-workon-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-workon-muted">
        {text}
      </p>
      {action}
    </section>
  );
}
