"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type OfferResponse } from "@/lib/api-client";
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
  Send,
  User,
  Check,
  X,
  Star,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { MissionPhotos } from "@/components/mission/mission-photos";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// ---------- Offer Modal (light theme) ----------

function CreateOfferModalLight({
  missionId,
  isOpen,
  onClose,
  onSuccess,
}: {
  missionId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      api.createOffer({
        missionId,
        price: parseFloat(price),
        message: message.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Offre envoyée !");
      queryClient.invalidateQueries({ queryKey: ["offers", missionId] });
      onSuccess();
      onClose();
      setPrice("");
      setMessage("");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi"),
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-workon-border bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-workon-ink">Faire une offre</h2>
          <button onClick={onClose} className="text-workon-muted hover:text-workon-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (price) mutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-workon-ink">
              Votre prix ($) *
            </label>
            <Input
              type="number"
              step="0.01"
              min="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="50.00"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-workon-ink">
              Message (optionnel)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Décrivez votre expérience ou posez des questions..."
              className="w-full rounded-xl border border-workon-border bg-white px-4 py-2.5 text-sm text-workon-ink placeholder-workon-muted focus:border-workon-primary focus:outline-none focus:ring-2 focus:ring-workon-primary/40"
              rows={3}
              maxLength={500}
            />
            <p className="mt-1 text-right text-xs text-workon-muted">
              {message.length}/500
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-workon-border text-workon-ink hover:bg-workon-bg"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!price || mutation.isPending}
              className="flex-1 bg-workon-primary hover:bg-workon-primary-hover text-white"
            >
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Send className="mr-1 h-4 w-4" />
              Envoyer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- Offer List (light theme) ----------

const offerStatusLabels: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: "En attente",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  ACCEPTED: {
    label: "Acceptée",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  DECLINED: {
    label: "Refusée",
    className: "bg-red-50 text-red-600 border-red-200",
  },
};

function OfferListLight({
  missionId,
  isEmployer,
}: {
  missionId: string;
  isEmployer: boolean;
}) {
  const queryClient = useQueryClient();

  const { data: offers, isLoading } = useQuery({
    queryKey: ["offers", missionId],
    queryFn: () => api.getOffersForMission(missionId),
  });

  const acceptMut = useMutation({
    mutationFn: (offerId: string) => api.acceptOffer(offerId),
    onSuccess: () => {
      toast.success("Offre acceptée !");
      queryClient.invalidateQueries({ queryKey: ["offers", missionId] });
      queryClient.invalidateQueries({ queryKey: ["mission", missionId] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erreur"),
  });

  const rejectMut = useMutation({
    mutationFn: (offerId: string) => api.rejectOffer(offerId),
    onSuccess: () => {
      toast.success("Offre refusée");
      queryClient.invalidateQueries({ queryKey: ["offers", missionId] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erreur"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-workon-muted" />
      </div>
    );
  }

  if (!offers || offers.length === 0) {
    return (
      <div className="rounded-xl border border-workon-border bg-workon-bg p-4 text-center text-sm text-workon-muted">
        Aucune offre pour le moment
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-workon-muted">
        {offers.length} offre{offers.length > 1 ? "s" : ""} reçue
        {offers.length > 1 ? "s" : ""}
      </h3>
      {offers.map((offer: OfferResponse) => {
        const status =
          offerStatusLabels[offer.status] || offerStatusLabels.PENDING;
        const isActionable = isEmployer && offer.status === "PENDING";
        const loading =
          (acceptMut.isPending && acceptMut.variables === offer.id) ||
          (rejectMut.isPending && rejectMut.variables === offer.id);

        return (
          <div
            key={offer.id}
            className="rounded-xl border border-workon-border bg-white p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-workon-primary/10">
                  <User className="h-4 w-4 text-workon-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-workon-ink">
                    {offer.worker?.firstName} {offer.worker?.lastName}
                  </p>
                  {offer.worker?.city && (
                    <p className="text-xs text-workon-muted">
                      {offer.worker.city}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-600">
                  {offer.price.toFixed(2)} $
                </p>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${status.className}`}
                >
                  {status.label}
                </span>
              </div>
            </div>

            {offer.message && (
              <p className="mt-2 text-sm text-workon-gray">{offer.message}</p>
            )}

            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-workon-muted">
                {formatDistanceToNow(new Date(offer.createdAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>

              {isActionable && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectMut.mutate(offer.id)}
                    disabled={loading}
                    className="h-8 border-red-200 text-red-600 hover:bg-red-50"
                  >
                    {loading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="mr-1 h-3 w-3" />
                    )}
                    Refuser
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => acceptMut.mutate(offer.id)}
                    disabled={loading}
                    className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {loading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="mr-1 h-3 w-3" />
                    )}
                    Accepter
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Inline Review Form (light theme) ----------

function InlineReviewForm({
  missionId,
  targetUserId,
  onSuccess,
}: {
  missionId: string;
  targetUserId: string;
  onSuccess: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const ratingLabels = ["", "Très insatisfait", "Insatisfait", "Correct", "Satisfait", "Excellent"];

  const mutation = useMutation({
    mutationFn: () =>
      api.createReview({
        missionId: missionId,
        toUserId: targetUserId,
        rating,
        comment: comment.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Merci pour votre avis !");
      onSuccess();
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erreur"),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (rating > 0) mutation.mutate();
      }}
      className="space-y-4"
    >
      <div>
        <label className="mb-2 block text-sm font-medium text-workon-ink">
          Note *
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`h-7 w-7 ${
                  value <= (hoverRating || rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-workon-border"
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="mt-1 text-xs text-workon-muted">{ratingLabels[rating]}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-workon-ink">
          Commentaire (optionnel)
        </label>
        <textarea
          value={comment}
          onChange={(e) => {
            if (e.target.value.length <= 500) setComment(e.target.value);
          }}
          placeholder="Partagez votre expérience..."
          maxLength={500}
          rows={3}
          className="w-full rounded-xl border border-workon-border bg-white p-3 text-sm text-workon-ink placeholder-workon-muted focus:border-workon-primary focus:outline-none focus:ring-2 focus:ring-workon-primary/40"
        />
        <p className="mt-1 text-right text-xs text-workon-muted">
          {comment.length}/500
        </p>
      </div>

      <Button
        type="submit"
        disabled={mutation.isPending || rating === 0}
        className="w-full bg-workon-primary hover:bg-workon-primary-hover text-white rounded-xl"
      >
        {mutation.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Star className="mr-2 h-4 w-4" />
        )}
        Envoyer l&apos;avis
      </Button>
    </form>
  );
}

// ---------- Pay Mission Button ----------

function PayMissionButton({ missionId, price }: { missionId: string; price: number }) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const result = await api.createCheckoutSession(missionId);
      window.location.href = result.checkoutUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors du paiement");
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePay}
      disabled={loading}
      className="w-full bg-workon-primary hover:bg-workon-primary-hover text-white rounded-2xl py-3"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <DollarSign className="h-4 w-4 mr-2" />
      )}
      Payer la mission ({price > 0 ? `${price.toFixed(2)} $` : "prix à confirmer"})
    </Button>
  );
}

// ---------- Dispute Modal (light theme) ----------

function DisputeModalLight({
  localMissionId,
  isOpen,
  onClose,
}: {
  localMissionId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      api.createDispute({ localMissionId, reason, description }),
    onSuccess: () => {
      toast.success("Litige ouvert avec succès");
      setReason("");
      setDescription("");
      onClose();
    },
    onError: () => toast.error("Erreur lors de l'ouverture du litige"),
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-2xl border border-workon-border bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-bold text-workon-ink">
              Signaler un problème
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-workon-muted hover:text-workon-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-workon-ink">
              Raison *
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Travail non effectué, qualité insuffisante..."
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-workon-ink">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le problème en détail..."
              rows={4}
              className="w-full rounded-xl border border-workon-border bg-white p-3 text-sm text-workon-ink placeholder-workon-muted focus:border-workon-primary focus:outline-none focus:ring-2 focus:ring-workon-primary/40"
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => mutation.mutate()}
              disabled={
                !reason.trim() || !description.trim() || mutation.isPending
              }
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {mutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <AlertTriangle className="mr-2 h-4 w-4" />
              )}
              Ouvrir le litige
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={mutation.isPending}
              className="border-workon-border text-workon-ink hover:bg-workon-bg"
            >
              Annuler
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Main Page ----------

/**
 * Mission detail page.
 *
 * Shows full mission info + action buttons based on user role and mission status:
 * - Worker on open mission: "Accepter la mission" or "Faire une offre"
 * - Assigned worker: "Démarrer" / "Terminer"
 * - Employer: "Annuler", offers section, accept/reject offers
 * - Completed missions: review form
 * - In-progress missions: dispute button
 */
export default function MissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);

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
      router.push("/missions/mine");
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
  const isCompleted = ["completed", "paid"].includes(mission.status);
  const isInProgress = ["assigned", "in_progress"].includes(mission.status);

  // Determine the review target user
  const reviewTargetUserId = isOwner
    ? mission.assignedToUserId
    : mission.createdByUserId;

  const statusColors: Record<string, string> = {
    open: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    assigned: "bg-amber-50 text-amber-700 border border-amber-200",
    in_progress: "bg-blue-50 text-blue-700 border border-blue-200",
    completed: "bg-purple-50 text-purple-700 border border-purple-200",
    paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    cancelled: "bg-gray-50 text-gray-400 border border-gray-200",
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
      <Link
        href="/missions/mine"
        className="flex items-center gap-1 text-sm text-workon-muted hover:text-workon-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              statusColors[mission.status] ?? "bg-gray-50 text-gray-700"
            }`}
          >
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
            <span className="text-workon-ink font-semibold">
              {mission.price} $
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-workon-primary" />
            <span className="text-workon-ink">{mission.city}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-workon-primary" />
            <span className="text-workon-muted">
              {formatDistanceToNow(new Date(mission.createdAt), {
                addSuffix: true,
                locale: fr,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Photos */}
      <div className="p-4 rounded-2xl bg-white border border-workon-border">
        <MissionPhotos missionId={id} canEdit={isOwner || isAssigned} />
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* Worker: make offer on open mission */}
        {isWorker && mission.status === "open" && !isOwner && (
          <>
            <Button
              onClick={() => setOfferModalOpen(true)}
              className="w-full bg-workon-primary hover:bg-workon-primary-hover text-white rounded-2xl py-3"
            >
              <Send className="h-4 w-4 mr-2" />
              Faire une offre
            </Button>
            <Button
              onClick={() => accept.mutate()}
              disabled={accept.isPending}
              variant="outline"
              className="w-full rounded-2xl py-3 border-workon-border text-workon-ink hover:bg-workon-bg"
            >
              {accept.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Accepter au prix affiché
            </Button>
          </>
        )}

        {/* Assigned worker: start */}
        {isAssigned && mission.status === "assigned" && (
          <Button
            onClick={() => start.mutate()}
            disabled={start.isPending}
            className="w-full bg-workon-primary hover:bg-workon-primary-hover text-white rounded-2xl py-3"
          >
            {start.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
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
            {complete.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Terminer la mission
          </Button>
        )}

        {/* Employer: pay completed mission */}
        {isOwner && mission.status === "completed" && (
          <PayMissionButton missionId={id} price={mission.price} />
        )}

        {/* Contact via chat */}
        <Link
          href={`/messages/${mission.id}`}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-workon-border text-workon-ink font-medium text-sm hover:bg-workon-bg transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          Contacter
        </Link>

        {/* In-progress: dispute button */}
        {isInProgress && (isOwner || isAssigned) && (
          <button
            onClick={() => setDisputeModalOpen(true)}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
          >
            <AlertTriangle className="h-4 w-4" />
            Signaler un problème
          </button>
        )}

        {/* Owner or assigned: cancel */}
        {(isOwner || isAssigned) &&
          ["open", "assigned"].includes(mission.status) && (
            <button
              onClick={() => cancel.mutate()}
              disabled={cancel.isPending}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-workon-muted text-sm hover:bg-workon-bg transition-colors"
            >
              <XCircle className="h-4 w-4" />
              Annuler la mission
            </button>
          )}
      </div>

      {/* Employer: received offers */}
      {isOwner && (
        <div className="space-y-2">
          <h2 className="text-base font-bold text-workon-ink">
            Offres reçues
          </h2>
          <OfferListLight missionId={id} isEmployer />
        </div>
      )}

      {/* Review section (completed missions) */}
      {isCompleted && reviewTargetUserId && (
        <div className="p-4 rounded-2xl bg-white border border-workon-border space-y-3">
          {showReviewForm ? (
            <>
              <h2 className="text-base font-bold text-workon-ink">
                Laisser un avis
              </h2>
              <InlineReviewForm
                missionId={id}
                targetUserId={reviewTargetUserId}
                onSuccess={() => setShowReviewForm(false)}
              />
            </>
          ) : (
            <Button
              onClick={() => setShowReviewForm(true)}
              variant="outline"
              className="w-full border-workon-border text-workon-ink hover:bg-workon-bg rounded-xl"
            >
              <Star className="h-4 w-4 mr-2 text-amber-400" />
              Laisser un avis
            </Button>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateOfferModalLight
        missionId={id}
        isOpen={offerModalOpen}
        onClose={() => setOfferModalOpen(false)}
        onSuccess={() =>
          queryClient.invalidateQueries({ queryKey: ["mission", id] })
        }
      />
      <DisputeModalLight
        localMissionId={id}
        isOpen={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
      />
    </div>
  );
}
