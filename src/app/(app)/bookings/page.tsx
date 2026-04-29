"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { api, type BookingResponse } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Clock, CheckCircle, XCircle, AlertCircle, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type FilterTab = "all" | "upcoming" | "completed";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: "En attente", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: <Clock className="h-4 w-4" /> },
  CONFIRMED: { label: "Confirmee", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: <CheckCircle className="h-4 w-4" /> },
  IN_PROGRESS: { label: "En cours", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: <Loader2 className="h-4 w-4 animate-spin" /> },
  COMPLETED: { label: "Terminee", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: <CheckCircle className="h-4 w-4" /> },
  CANCELLED: { label: "Annulee", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <XCircle className="h-4 w-4" /> },
  NO_SHOW: { label: "Absence", color: "bg-neutral-500/20 text-neutral-400 border-neutral-500/30", icon: <AlertCircle className="h-4 w-4" /> },
};

export default function BookingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const isWorker = user?.role === "worker";

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["bookings", isWorker, activeTab],
    queryFn: () => {
      const filters = activeTab === "upcoming" ? { upcoming: true } : activeTab === "completed" ? { status: "COMPLETED" } : undefined;
      return isWorker ? api.getWorkerBookings(filters) : api.getMyBookings(filters);
    },
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
      toast.success("Réservation annulée");
    },
    onError: () => toast.error("Erreur lors de l'annulation"),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.completeBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Réservation terminée");
    },
    onError: () => toast.error("Erreur lors de la complétion"),
  });

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "Toutes" },
    { key: "upcoming", label: "À venir" },
    { key: "completed", label: "Terminées" },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-workon-ink">Mes reservations</h1>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-2 rounded-xl bg-workon-bg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.key
                ? "bg-workon-primary text-white"
                : "text-workon-muted hover:text-workon-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-workon-primary" />
        </div>
      ) : !bookings || bookings.length === 0 ? (
        <div className="rounded-xl border border-workon-border bg-white p-12 text-center shadow-sm">
          <Calendar className="mx-auto mb-4 h-12 w-12 text-workon-muted/40" />
          <h3 className="mb-2 text-lg font-semibold text-workon-ink">Aucune reservation</h3>
          <p className="text-workon-muted">
            {isWorker
              ? "Vous n'avez pas encore de reservations de clients."
              : "Vous n'avez pas encore effectue de reservations."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
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
      )}
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
  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;

  return (
    <div className="rounded-xl border border-workon-border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-workon-bg">
            <User className="h-5 w-5 text-workon-muted" />
          </div>
          <div>
            <p className="text-sm text-workon-muted">
              {isWorker ? "Client" : "Travailleur"}
            </p>
            <p className="font-medium text-workon-ink">
              {isWorker
                ? booking.client
                  ? `${booking.client.firstName ?? ""} ${booking.client.lastName ?? ""}`.trim() || booking.clientId
                  : booking.clientId
                : booking.worker?.user
                  ? `${booking.worker.user.firstName ?? ""} ${booking.worker.user.lastName ?? ""}`.trim() || booking.workerId
                  : booking.workerId}
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${statusConfig.color}`}>
          {statusConfig.icon}
          {statusConfig.label}
        </span>
      </div>

      <div className="mb-3 flex items-center gap-2 text-sm text-workon-muted">
        <Calendar className="h-4 w-4" />
        <span>
          {format(new Date(booking.scheduledDate), "EEEE d MMMM yyyy", { locale: fr })}
        </span>
      </div>

      {booking.notes && (
        <p className="mb-3 text-sm text-workon-muted">{booking.notes}</p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {booking.status === "PENDING" && isWorker && (
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={isConfirming}
            className="bg-blue-600 hover:bg-blue-500"
          >
            {isConfirming ? "..." : "Confirmer"}
          </Button>
        )}
        {booking.status === "CONFIRMED" && isWorker && (
          <Button
            size="sm"
            onClick={onComplete}
            disabled={isCompleting}
            className="bg-green-600 hover:bg-green-500"
          >
            {isCompleting ? "..." : "Terminer"}
          </Button>
        )}
        {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
            disabled={isCancelling}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            {isCancelling ? "..." : "Annuler"}
          </Button>
        )}
      </div>
    </div>
  );
}
