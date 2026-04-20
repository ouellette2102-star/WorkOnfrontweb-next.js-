"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { api, type AvailabilitySlot, type BookingResponse } from "@/lib/api-client";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Ban,
  Pencil,
  CalendarDays,
  User,
} from "lucide-react";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  format,
  isToday,
  isSameDay,
  getDay,
} from "date-fns";
import { fr } from "date-fns/locale";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: "En attente", color: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30" },
  CONFIRMED: { label: "Confirmee", color: "bg-blue-500/20 text-blue-600 border-blue-500/30" },
  IN_PROGRESS: { label: "En cours", color: "bg-purple-500/20 text-purple-600 border-purple-500/30" },
  COMPLETED: { label: "Terminee", color: "bg-green-500/20 text-green-600 border-green-500/30" },
  CANCELLED: { label: "Annulee", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  NO_SHOW: { label: "Absence", color: "bg-neutral-500/20 text-neutral-500 border-neutral-500/30" },
};

/** Convert JS getDay() (0=Sun) to our dayOfWeek (0=Mon..6=Sun) */
function jsDayToSlotDay(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const isWorker = user?.role === "worker";
  const [weekOffset, setWeekOffset] = useState(0);

  const baseDate = useMemo(() => {
    const now = new Date();
    return weekOffset === 0 ? now : weekOffset > 0 ? addWeeks(now, weekOffset) : subWeeks(now, Math.abs(weekOffset));
  }, [weekOffset]);

  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch availability slots
  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ["availability"],
    queryFn: () => api.getAvailability(),
  });

  // Fetch bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["bookings-calendar", isWorker],
    queryFn: () => (isWorker ? api.getWorkerBookings() : api.getMyBookings()),
  });

  const isLoading = slotsLoading || bookingsLoading;

  // API responses occasionally arrive as a non-array error envelope
  // ({error,message,...}) — guard before any .filter to avoid crashing
  // the whole page error-boundary (Sentry WORKON-FRONTEND-4).
  const safeSlots: AvailabilitySlot[] = Array.isArray(slots) ? slots : [];
  const safeBookings: BookingResponse[] = Array.isArray(bookings) ? bookings : [];

  // Group data by day
  const getSlotsForDay = (date: Date): AvailabilitySlot[] => {
    const dayIndex = jsDayToSlotDay(getDay(date));
    return safeSlots.filter((s) => s.dayOfWeek === dayIndex && !s.isBlocked);
  };

  const getBlockedForDay = (date: Date): AvailabilitySlot[] => {
    const dayIndex = jsDayToSlotDay(getDay(date));
    return safeSlots.filter((s) => s.dayOfWeek === dayIndex && s.isBlocked);
  };

  const getBookingsForDay = (date: Date): BookingResponse[] => {
    return safeBookings.filter((b) => {
      try {
        return isSameDay(new Date(b.scheduledDate), date);
      } catch {
        return false;
      }
    });
  };

  const weekLabel = `${format(weekStart, "d MMM", { locale: fr })} - ${format(weekEnd, "d MMM yyyy", { locale: fr })}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 bg-workon-bg min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-workon-ink">Calendrier</h1>
        <div className="flex gap-2">
          <Link
            href="/worker/availability"
            className="flex items-center gap-1.5 rounded-full bg-workon-primary/10 px-3 py-1.5 text-xs font-medium text-workon-primary transition hover:bg-workon-primary/20"
          >
            <Pencil className="h-3.5 w-3.5" />
            Disponibilites
          </Link>
          <Link
            href="/bookings"
            className="flex items-center gap-1.5 rounded-full bg-workon-primary/10 px-3 py-1.5 text-xs font-medium text-workon-primary transition hover:bg-workon-primary/20"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Reservations
          </Link>
        </div>
      </div>

      {/* Week navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-workon-border text-workon-muted hover:text-workon-ink transition"
          aria-label="Semaine precedente"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-workon-ink capitalize">{weekLabel}</span>
        <button
          onClick={() => setWeekOffset((o) => o + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-workon-border text-workon-muted hover:text-workon-ink transition"
          aria-label="Semaine suivante"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day pills */}
      <div className="mb-6 flex gap-1.5">
        {days.map((day) => {
          const active = isSameDay(day, selectedDate);
          const today = isToday(day);
          const daySlots = getSlotsForDay(day);
          const dayBookings = getBookingsForDay(day);
          const hasActivity = daySlots.length > 0 || dayBookings.length > 0;

          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-xs font-medium transition ${
                active
                  ? "bg-workon-primary text-white shadow-sm"
                  : today
                    ? "bg-workon-primary/10 text-workon-primary"
                    : "bg-white text-workon-muted hover:bg-workon-bg"
              }`}
            >
              <span className="text-[10px] uppercase">{format(day, "EEE", { locale: fr })}</span>
              <span className="text-sm font-semibold">{format(day, "d")}</span>
              {hasActivity && !active && (
                <span className="h-1 w-1 rounded-full bg-workon-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-workon-primary" />
        </div>
      ) : (
        <DayDetail
          date={selectedDate}
          slots={getSlotsForDay(selectedDate)}
          blocked={getBlockedForDay(selectedDate)}
          bookings={getBookingsForDay(selectedDate)}
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
  slots: AvailabilitySlot[];
  blocked: AvailabilitySlot[];
  bookings: BookingResponse[];
  isWorker: boolean;
}) {
  const dayLabel = format(date, "EEEE d MMMM", { locale: fr });
  const isEmpty = slots.length === 0 && blocked.length === 0 && bookings.length === 0;

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-workon-ink capitalize">{dayLabel}</h2>

      {isEmpty ? (
        <div className="rounded-2xl border border-workon-border bg-white p-8 text-center shadow-sm">
          <CalendarDays className="mx-auto mb-3 h-10 w-10 text-workon-muted/30" />
          <p className="text-sm text-workon-muted">Aucune activite</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Availability slots */}
          {slots.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center gap-3 rounded-2xl border-l-4 border-l-green-500 bg-workon-primary/10 px-4 py-3"
            >
              <Clock className="h-4 w-4 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-workon-ink">Disponible</p>
                <p className="text-xs text-workon-muted">
                  {slot.startTime} - {slot.endTime}
                </p>
              </div>
            </div>
          ))}

          {/* Blocked slots */}
          {blocked.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center gap-3 rounded-2xl border-l-4 border-l-neutral-400 px-4 py-3"
              style={{
                background:
                  "repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(0,0,0,0.03) 4px, rgba(0,0,0,0.03) 8px)",
                backgroundColor: "rgba(0,0,0,0.04)",
              }}
            >
              <Ban className="h-4 w-4 text-neutral-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-workon-ink">Bloque</p>
                <p className="text-xs text-workon-muted">
                  {slot.startTime} - {slot.endTime}
                </p>
              </div>
            </div>
          ))}

          {/* Bookings */}
          {bookings.map((booking) => {
            const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
            return (
              <div
                key={booking.id}
                className="rounded-2xl border border-workon-border bg-white p-4 shadow-sm"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-workon-bg">
                      <User className="h-4 w-4 text-workon-muted" />
                    </div>
                    <div>
                      <p className="text-xs text-workon-muted">
                        {isWorker ? "Client" : "Travailleur"}
                      </p>
                      <p className="text-sm font-medium text-workon-ink">
                        {isWorker ? booking.clientId : booking.workerId}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${statusCfg.color}`}
                  >
                    {statusCfg.label}
                  </span>
                </div>
                {booking.notes && (
                  <p className="text-xs text-workon-muted">{booking.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
