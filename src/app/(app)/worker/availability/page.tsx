"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type AvailabilitySlot } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Clock, Ban, Trash2 } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export default function AvailabilityPage() {
  const queryClient = useQueryClient();
  const [selectedDay, setSelectedDay] = useState(0);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [blockDate, setBlockDate] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [showBlockForm, setShowBlockForm] = useState(false);

  const { data: slots, isLoading } = useQuery({
    queryKey: ["availability"],
    queryFn: () => api.getAvailability(),
  });

  const addSlotMutation = useMutation({
    mutationFn: () => api.setAvailability({ dayOfWeek: selectedDay, startTime, endTime }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability"] });
      toast.success("Disponibilite ajoutee");
    },
    onError: () => toast.error("Erreur lors de l'ajout"),
  });

  const blockMutation = useMutation({
    mutationFn: () => api.blockTime({ specificDate: blockDate, startTime: "00:00", endTime: "23:59" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability"] });
      toast.success("Date bloquee");
      setBlockDate("");
      setBlockReason("");
      setShowBlockForm(false);
    },
    onError: () => toast.error("Erreur lors du blocage"),
  });

  const slotsByDay = (day: number) => slots?.filter((s) => s.dayOfWeek === day && !s.isBlocked) || [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-workon-ink">Mes disponibilites</h1>

      {/* Day grid */}
      <div className="mb-6 grid grid-cols-7 gap-1">
        {DAYS.map((day, i) => {
          const count = slotsByDay(i).length;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(i)}
              className={`rounded-lg p-2 text-center text-xs font-medium transition ${
                selectedDay === i
                  ? "bg-workon-primary text-white"
                  : "bg-workon-bg text-workon-muted hover:bg-workon-border/50"
              }`}
            >
              <span className="block">{day.slice(0, 3)}</span>
              {count > 0 && (
                <span className="mt-1 block text-[10px] opacity-70">{count} creneau{count > 1 ? "x" : ""}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Current slots for selected day */}
      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-workon-ink">
          {DAYS[selectedDay]}
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-workon-primary" />
          </div>
        ) : slotsByDay(selectedDay).length === 0 ? (
          <p className="rounded-xl border border-workon-border bg-white shadow-sm p-6 text-center text-sm text-workon-muted">
            Aucun creneau pour cette journee
          </p>
        ) : (
          <div className="space-y-2">
            {slotsByDay(selectedDay).map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between rounded-xl border border-workon-border bg-white shadow-sm px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-workon-muted" />
                  <span className="text-workon-ink">
                    {slot.startTime} - {slot.endTime}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add slot form */}
      <div className="mb-6 rounded-xl border border-workon-border bg-white shadow-sm p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-workon-ink">
          <Plus className="h-4 w-4" />
          Ajouter un creneau - {DAYS[selectedDay]}
        </h3>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-workon-muted">Debut</label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="border-workon-border bg-white text-workon-ink"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-workon-muted">Fin</label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="border-workon-border bg-white text-workon-ink"
            />
          </div>
          <Button
            onClick={() => addSlotMutation.mutate()}
            disabled={addSlotMutation.isPending}
            className="bg-workon-primary hover:bg-workon-primary/90"
          >
            {addSlotMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ajouter"}
          </Button>
        </div>
      </div>

      {/* Block date */}
      <div className="rounded-xl border border-workon-border bg-white shadow-sm p-4">
        <button
          onClick={() => setShowBlockForm(!showBlockForm)}
          className="flex items-center gap-2 text-sm font-semibold text-workon-ink"
        >
          <Ban className="h-4 w-4 text-red-400" />
          Bloquer une date specifique
        </button>

        {showBlockForm && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs text-workon-muted">Date</label>
              <Input
                type="date"
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
                className="border-workon-border bg-white text-workon-ink"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-workon-muted">Raison (optionnel)</label>
              <Input
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Ex: Vacances, rendez-vous..."
                className="border-workon-border bg-white text-workon-ink placeholder-workon-muted/50"
              />
            </div>
            <Button
              onClick={() => blockMutation.mutate()}
              disabled={!blockDate || blockMutation.isPending}
              className="bg-workon-primary hover:bg-workon-primary/90"
            >
              {blockMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Bloquer"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
