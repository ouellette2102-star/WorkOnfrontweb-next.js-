"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const DAY_NAMES = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"] as const;

// Map display index (0=Lundi..6=Dimanche) to backend dayOfWeek (Monday=1..Sunday=0)
const DISPLAY_TO_DOW = [1, 2, 3, 4, 5, 6, 0] as const;
const DOW_TO_DISPLAY: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };

// Generate time options from 06:00 to 22:00 in 30-min increments
function buildTimeOptions(): string[] {
  const options: string[] = [];
  for (let h = 6; h <= 22; h++) {
    options.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 22) {
      options.push(`${String(h).padStart(2, "0")}:30`);
    }
  }
  return options;
}

const TIME_OPTIONS = buildTimeOptions();

interface DayState {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

const DEFAULT_DAY: DayState = { enabled: false, startTime: "09:00", endTime: "17:00" };

export function AvailabilityEditor() {
  const queryClient = useQueryClient();
  const [days, setDays] = useState<DayState[]>(
    Array.from({ length: 7 }, () => ({ ...DEFAULT_DAY })),
  );
  const [dirty, setDirty] = useState(false);

  // Fetch existing availability
  const { data: slots, isLoading } = useQuery({
    queryKey: ["my-availability"],
    queryFn: () => api.getMyAvailability(),
  });

  // Populate state from fetched slots
  useEffect(() => {
    if (!slots) return;
    const next: DayState[] = Array.from({ length: 7 }, () => ({ ...DEFAULT_DAY }));
    for (const slot of slots) {
      const displayIdx = DOW_TO_DISPLAY[slot.dayOfWeek];
      if (displayIdx !== undefined) {
        next[displayIdx] = {
          enabled: true,
          startTime: slot.startTime,
          endTime: slot.endTime,
        };
      }
    }
    setDays(next);
    setDirty(false);
  }, [slots]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (enabledSlots: { dayOfWeek: number; startTime: string; endTime: string }[]) =>
      api.setMyAvailability(enabledSlots),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-availability"] });
      setDirty(false);
      toast.success("Disponibilites sauvegardees");
    },
    onError: () => {
      toast.error("Erreur lors de la sauvegarde des disponibilites");
    },
  });

  const updateDay = (index: number, patch: Partial<DayState>) => {
    setDays((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
    setDirty(true);
  };

  const handleSave = () => {
    // Validate: endTime must be after startTime
    for (let i = 0; i < 7; i++) {
      const day = days[i];
      if (day.enabled && day.endTime <= day.startTime) {
        toast.error(`${DAY_NAMES[i]} : l'heure de fin doit etre apres l'heure de debut`);
        return;
      }
    }

    const enabledSlots = days
      .map((day, i) =>
        day.enabled
          ? { dayOfWeek: DISPLAY_TO_DOW[i], startTime: day.startTime, endTime: day.endTime }
          : null,
      )
      .filter(Boolean) as { dayOfWeek: number; startTime: string; endTime: string }[];

    saveMutation.mutate(enabledSlots);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-workon-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {DAY_NAMES.map((name, i) => {
        const day = days[i];
        return (
          <div
            key={name}
            className={`flex flex-col gap-3 rounded-xl border px-4 py-3 transition sm:flex-row sm:items-center sm:gap-4 ${
              day.enabled
                ? "border-[#134021]/30 bg-[#134021]/5"
                : "border-workon-border bg-white"
            }`}
          >
            {/* Toggle + day name */}
            <label className="flex min-w-[140px] cursor-pointer items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={day.enabled}
                onClick={() => updateDay(i, { enabled: !day.enabled })}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  day.enabled ? "bg-[#134021]" : "bg-workon-border"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    day.enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span
                className={`text-sm font-medium ${
                  day.enabled ? "text-[#134021]" : "text-workon-muted"
                }`}
              >
                {name}
              </span>
            </label>

            {/* Time pickers */}
            {day.enabled ? (
              <div className="flex items-center gap-2">
                <select
                  value={day.startTime}
                  onChange={(e) => updateDay(i, { startTime: e.target.value })}
                  className="rounded-xl border border-workon-border bg-workon-bg px-3 py-2 text-sm text-[#1B1A18] focus:border-[#134021] focus:outline-none"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-workon-muted">a</span>
                <select
                  value={day.endTime}
                  onChange={(e) => updateDay(i, { endTime: e.target.value })}
                  className="rounded-xl border border-workon-border bg-workon-bg px-3 py-2 text-sm text-[#1B1A18] focus:border-[#134021] focus:outline-none"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="text-sm text-workon-muted">Jour de conge</span>
            )}
          </div>
        );
      })}

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={!dirty || saveMutation.isPending}
        className="w-full rounded-2xl bg-[#134021] px-6 py-4 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-[#0F3319] disabled:opacity-70 shadow-md shadow-[#134021]/25"
      >
        {saveMutation.isPending ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Enregistrement...
          </span>
        ) : (
          "Sauvegarder les disponibilites"
        )}
      </button>
    </div>
  );
}
