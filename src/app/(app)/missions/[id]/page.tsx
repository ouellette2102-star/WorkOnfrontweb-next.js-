"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import {
  MapPin,
  DollarSign,
  Calendar,
  Tag,
  Loader2,
  ArrowLeft,
  CheckCircle,
  MessageCircle,
  Play,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Mission detail page.
 *
 * Shows full mission info + action buttons based on user role and mission status:
 * - Worker on open mission: "Accepter la mission"
 * - Assigned worker: "Démarrer" / "Terminer"
 * - Employer: "Annuler"
 * - Anyone: "Contacter" → chat thread
 */
export default function MissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: mission, isLoading } = useQuery({
    queryKey: ["mission", id],
    queryFn: () => api.getMission(id),
    enabled: !!id,
  });

  const accept = useMutation({
    mutationFn: () => api.acceptMission(id),
    onSuccess: () => {
      toast.success("Mission acceptée!");
      queryClient.invalidateQueries({ queryKey: ["mission", id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erreur"),
  });

  const start = useMutation({
    mutationFn: () => api.startMission(id),
    onSuccess: () => {
      toast.success("Mission démarrée!");
      queryClient.invalidateQueries({ queryKey: ["mission", id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erreur"),
  });

  const complete = useMutation({
    mutationFn: () => api.completeMission(id),
    onSuccess: () => {
      toast.success("Mission terminée!");
      queryClient.invalidateQueries({ queryKey: ["mission", id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erreur"),
  });

  const cancel = useMutation({
    mutationFn: () => api.cancelMission(id),
    onSuccess: () => {
      toast.success("Mission annulée");
      router.push("/home");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erreur"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-workon-muted" />
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-workon-gray">Mission introuvable</p>
      </div>
    );
  }

  const isWorker = user?.role === "worker";
  const isOwner = mission.createdByUserId === user?.id;
  const isAssigned = mission.assignedToUserId === user?.id;

  const statusColors: Record<string, string> = {
    open: "bg-green-50 text-green-700",
    assigned: "bg-blue-50 text-blue-700",
    in_progress: "bg-yellow-50 text-yellow-700",
    completed: "bg-emerald-50 text-emerald-700",
    paid: "bg-emerald-50 text-emerald-700",
    cancelled: "bg-red-50 text-red-700",
  };

  const statusLabels: Record<string, string> = {
    open: "Ouverte",
    assigned: "Assignée",
    in_progress: "En cours",
    completed: "Complétée",
    paid: "Payée",
    cancelled: "Annulée",
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Back */}
      <Link href="/map" className="flex items-center gap-1 text-sm text-workon-muted hover:text-workon-ink">
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[mission.status] ?? "bg-gray-50 text-gray-700"}`}>
            {statusLabels[mission.status] ?? mission.status}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-workon-ink font-[family-name:var(--font-cabinet)]">
          {mission.title}
        </h1>
      </div>

      {/* Details card */}
      <div className="p-4 rounded-2xl bg-white border border-workon-border space-y-3">
        <p className="text-sm text-workon-gray">{mission.description}</p>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="flex items-center gap-2 text-sm">
            <Tag className="h-4 w-4 text-workon-primary" />
            <span className="text-workon-ink">{mission.category}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-workon-primary" />
            <span className="text-workon-ink font-semibold">{mission.price} $</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-workon-primary" />
            <span className="text-workon-ink">{mission.city}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-workon-primary" />
            <span className="text-workon-muted">
              {formatDistanceToNow(new Date(mission.createdAt), { addSuffix: true, locale: fr })}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* Worker: accept open mission */}
        {isWorker && mission.status === "open" && !isOwner && (
          <Button
            onClick={() => accept.mutate()}
            disabled={accept.isPending}
            className="w-full bg-workon-primary hover:bg-workon-primary-hover text-white rounded-2xl py-3"
          >
            {accept.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
            Accepter la mission
          </Button>
        )}

        {/* Assigned worker: start */}
        {isAssigned && mission.status === "assigned" && (
          <Button
            onClick={() => start.mutate()}
            disabled={start.isPending}
            className="w-full bg-workon-primary hover:bg-workon-primary-hover text-white rounded-2xl py-3"
          >
            {start.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            Démarrer la mission
          </Button>
        )}

        {/* Assigned worker: complete */}
        {isAssigned && mission.status === "in_progress" && (
          <Button
            onClick={() => complete.mutate()}
            disabled={complete.isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl py-3"
          >
            {complete.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
            Terminer la mission
          </Button>
        )}

        {/* Contact via chat */}
        <Link
          href={`/messages/${mission.id}`}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-workon-border text-workon-ink font-medium text-sm hover:bg-workon-bg-cream transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          Contacter
        </Link>

        {/* Owner or assigned: cancel */}
        {(isOwner || isAssigned) && ["open", "assigned"].includes(mission.status) && (
          <button
            onClick={() => cancel.mutate()}
            disabled={cancel.isPending}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-workon-accent text-sm hover:bg-workon-accent-subtle transition-colors"
          >
            <XCircle className="h-4 w-4" />
            Annuler la mission
          </button>
        )}
      </div>
    </div>
  );
}
