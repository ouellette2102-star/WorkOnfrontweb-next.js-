"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type OfferResponse, type BoostType, type MissionResponse } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import {
  MapPin,
  DollarSign,
  Clock3,
  Tag,
  Loader2,
  ArrowLeft,
  CheckCircle,
  FileCheck,
  MessageCircle,
  Play,
  XCircle,
  Send,
  User,
  Check,
  X,
  Star,
  AlertTriangle,
  LogIn,
  LogOut,
  Zap,
  Rocket,
  ShieldCheck,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { MissionPhotos } from "@/components/mission/mission-photos";
import { MissionTimeline } from "@/components/mission/mission-timeline";
import { PriceBreakdownCard } from "@/components/mission/price-breakdown-card";
import { BoostCheckoutModal } from "@/components/boosts/boost-checkout-modal";
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
    <PriceBreakdownCard priceDollars={price} testId="mission-pay-breakdown">
      {({ preview, loading: previewLoading }) => {
        const totalLabel = preview
          ? `${preview.total.toFixed(2)} $`
          : price > 0
            ? `${price.toFixed(2)} $`
            : "prix à confirmer";
        return (
          <div className="space-y-3">
            <div className="rounded-2xl border border-workon-primary/15 bg-workon-primary-subtle p-3 text-xs leading-relaxed text-workon-ink">
              <strong>Paiement protege.</strong> Le total est calcule avant Stripe; la trace reste liee au dossier de mission.
            </div>
            <Button
              onClick={handlePay}
              disabled={loading || previewLoading || price <= 0}
              className="h-12 w-full rounded-2xl bg-workon-primary font-black text-white shadow-[0_12px_28px_rgba(19,64,33,0.22)] hover:bg-workon-primary-hover"
              data-testid="mission-pay-button"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <DollarSign className="h-4 w-4 mr-2" />
              )}
              Payer la mission ({totalLabel})
            </Button>
          </div>
        );
      }}
    </PriceBreakdownCard>
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

// ---------- Time Log Buttons ----------

function TimeLogButtons({ missionId }: { missionId: string }) {
  const queryClient = useQueryClient();

  const checkInMut = useMutation({
    mutationFn: () => api.checkIn(missionId),
    onSuccess: () => {
      toast.success("Check-in enregistré !");
      queryClient.invalidateQueries({ queryKey: ["mission", missionId] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erreur lors du check-in"),
  });

  const checkOutMut = useMutation({
    mutationFn: () => api.checkOut(missionId),
    onSuccess: () => {
      toast.success("Check-out enregistré !");
      queryClient.invalidateQueries({ queryKey: ["mission", missionId] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erreur lors du check-out"),
  });

  return (
    <div className="flex gap-3">
      <Button
        onClick={() => checkInMut.mutate()}
        disabled={checkInMut.isPending}
        className="flex-1 bg-workon-primary hover:bg-workon-primary-hover text-white rounded-2xl py-3"
      >
        {checkInMut.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <LogIn className="h-4 w-4 mr-2" />
        )}
        Arrivé
      </Button>
      <Button
        onClick={() => checkOutMut.mutate()}
        disabled={checkOutMut.isPending}
        className="flex-1 bg-workon-accent hover:bg-workon-accent-hover text-white rounded-2xl py-3"
      >
        {checkOutMut.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <LogOut className="h-4 w-4 mr-2" />
        )}
        Terminé
      </Button>
    </div>
  );
}

function DetailMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-workon-line bg-white/75 p-3">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-workon-stone">
        <Icon className="h-3.5 w-3.5 text-workon-copper" />
        {label}
      </div>
      <p className="mt-1 truncate text-sm font-black text-workon-ink">{value}</p>
    </div>
  );
}

function TrustSignal({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-workon-line bg-white/70 p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-workon-primary/10">
        <Icon className="h-5 w-5 text-workon-primary" />
      </div>
      <div>
        <p className="text-sm font-black text-workon-ink">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-workon-muted">{text}</p>
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text?: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-workon-stone">
        {eyebrow}
      </p>
      <h2 className="mt-1 font-[family-name:var(--font-cabinet)] text-lg font-black text-workon-ink">
        {title}
      </h2>
      {text && <p className="mt-1 text-xs leading-relaxed text-workon-muted">{text}</p>}
    </div>
  );
}

function formatMissionMoney(price: number) {
  if (price <= 0) return "A confirmer";
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(price);
}

function getDecisionCopy({
  mission,
  isWorker,
  isOwner,
  isAssigned,
  idVerified,
  connectOnboarded,
}: {
  mission: MissionResponse;
  isWorker: boolean;
  isOwner: boolean;
  isAssigned: boolean;
  idVerified: boolean;
  connectOnboarded: boolean;
}) {
  if (isOwner && mission.status === "completed") {
    return {
      title: "Paiement a liberer",
      text: "Le travail est marque termine. Verifie le dossier, puis paie pour fermer proprement la mission.",
      label: "Action client",
    };
  }

  if (isWorker && mission.status === "open" && !isOwner && !idVerified) {
    return {
      title: "Verifier ton identite avant de postuler",
      text: "La verification protege les clients et augmente la confiance avant toute offre ou acceptation.",
      label: "Pre-requis",
    };
  }

  if (isWorker && mission.status === "open" && !isOwner && idVerified && !connectOnboarded) {
    return {
      title: "Configurer Stripe avant de t'engager",
      text: "Le paiement doit pouvoir etre verse sans friction quand la mission sera terminee.",
      label: "Pre-requis",
    };
  }

  if (isWorker && mission.status === "open" && !isOwner) {
    return {
      title: "Accepter ou envoyer une offre",
      text: "Le prix, la ville, les preuves et la protection sont visibles avant de prendre une decision.",
      label: "Decision pro",
    };
  }

  if (isAssigned && mission.status === "assigned") {
    return {
      title: "Demarrer quand tu es pret",
      text: "Le passage en cours cree une trace claire pour le client, le paiement et les preuves.",
      label: "Execution",
    };
  }

  if (isAssigned && mission.status === "in_progress") {
    return {
      title: "Terminer avec des preuves",
      text: "Photos, messages et suivi reduisent les litiges avant la liberation du paiement.",
      label: "Qualite",
    };
  }

  if (isOwner && ["open", "assigned", "in_progress"].includes(mission.status)) {
    return {
      title: "Garder la mission sous controle",
      text: "Offres, messages, statut, boosts et preuves restent connectes au meme dossier.",
      label: "Pilotage client",
    };
  }

  return {
    title: "Dossier mission actif",
    text: "Le contexte, les decisions, les paiements et les preuves restent accessibles au meme endroit.",
    label: "Suivi",
  };
}

function MissionDecisionPanel({
  mission,
  statusLabel,
  isWorker,
  isOwner,
  isAssigned,
  idVerified,
  connectOnboarded,
}: {
  mission: MissionResponse;
  statusLabel: string;
  isWorker: boolean;
  isOwner: boolean;
  isAssigned: boolean;
  idVerified: boolean;
  connectOnboarded: boolean;
}) {
  const decision = getDecisionCopy({
    mission,
    isWorker,
    isOwner,
    isAssigned,
    idVerified,
    connectOnboarded,
  });

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="workon-premium-card rounded-[28px] p-5 sm:p-6">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-workon-copper">
          {decision.label}
        </p>
        <h2 className="mt-2 font-heading text-2xl font-black leading-tight text-workon-ink">
          {decision.title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-workon-muted">
          {decision.text}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <DecisionSignal
            icon={ShieldCheck}
            label="Identite"
            value={isWorker ? (idVerified ? "verifiee" : "a verifier") : "client suivi"}
          />
          <DecisionSignal
            icon={FileCheck}
            label="Contrat"
            value={mission.status === "open" ? "pret" : "en trace"}
          />
          <DecisionSignal
            icon={WalletCards}
            label="Paiement"
            value={mission.price > 0 ? "montant visible" : "a cadrer"}
          />
        </div>
      </div>

      <div className="workon-dark-panel rounded-[28px] p-5 text-white shadow-[0_20px_52px_rgba(19,64,33,0.20)]">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/50">
          Valeur et statut
        </p>
        <p className="mt-2 font-heading text-3xl font-black">
          {formatMissionMoney(mission.price)}
        </p>
        <div className="mt-4 grid gap-2">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/50">
              Statut
            </p>
            <p className="mt-1 text-sm font-black">{statusLabel}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/50">
              Protection
            </p>
            <p className="mt-1 text-sm font-black">Contrat + paiement WorkOn</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function DecisionSignal({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-workon-line bg-white/75 p-2.5">
      <Icon className="mb-2 h-4 w-4 text-workon-copper" />
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-workon-stone">
        {label}
      </p>
      <p className="mt-1 truncate text-[11px] font-black text-workon-ink">{value}</p>
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

  // QA report C8 / Sprint 2: show a celebration banner when arriving
  // from /missions/new (?created=1).
  //
  // HOTFIX: previously read via `useSearchParams()`, but in Next 16
  // production builds that hook requires a Suspense boundary or it
  // throws on rehydration after back-navigation — surfacing as the
  // global error boundary ("Quelque chose s'est mal passé") roughly
  // 5–20% of the time the user uses the browser Back button.
  // Reading window.location.search inside useEffect is suspense-safe
  // and works the same for our use case (single, dismissible flag).
  const [showCreatedBanner, setShowCreatedBanner] = useState(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return params.get("created") === "1";
  });

  const dismissCreatedBanner = () => {
    setShowCreatedBanner(false);
    // Strip the query param without a full reload
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.delete("created");
    window.history.replaceState({}, "", url.toString());
  };

  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [boostType, setBoostType] = useState<BoostType | null>(null);

  const { data: mission, isLoading } = useQuery({
    queryKey: ["mission", id],
    queryFn: () => api.getMission(id),
    enabled: !!id,
  });

  // Workers must complete Stripe Identity before the API will let them
  // create offers (backend `IdentityVerificationGuard`). Fetch the
  // status alongside the mission so the action area can show a
  // gating banner instead of letting them hit the 403 mid-form.
  const { data: identity } = useQuery({
    queryKey: ["identity-status"],
    queryFn: () => api.getVerificationStatus(),
    enabled: !!user && user.role === "worker",
    staleTime: 30_000,
  });
  const idVerified = identity?.identity.status === "VERIFIED";

  // Worker Stripe Connect onboarding — required so the platform can
  // transfer the worker's share when the employer pays at completion.
  // Without it the funds sit on the platform balance until the worker
  // onboards retroactively. Surface the missing step BEFORE the worker
  // commits to a mission (rather than after they finish the work).
  const { data: connectStatus } = useQuery({
    queryKey: ["stripe-connect-status"],
    queryFn: () => api.getStripeOnboardingStatus(),
    enabled: !!user && user.role === "worker" && idVerified,
    staleTime: 30_000,
  });
  const connectOnboarded = connectStatus?.onboarded === true;

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

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/missions/${id}`
      : `/missions/${id}`;
  const statusLabel = statusLabels[mission.status] ?? mission.status;

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 pb-10 space-y-5">
      {/* Back */}
      <Link
        href="/missions/mine"
        className="inline-flex items-center gap-2 rounded-full border border-workon-border bg-white px-3 py-2 text-sm font-bold text-workon-stone shadow-sm transition hover:border-workon-primary/30 hover:text-workon-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      {/* Mission-just-created celebration banner */}
      {showCreatedBanner && isOwner && (
        <div
          className="rounded-2xl border border-workon-trust-green/30 bg-workon-trust-green/5 p-5 flex flex-col gap-3"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-workon-trust-green/15 flex items-center justify-center text-xl">
                🎉
              </div>
              <div>
                <h2 className="font-semibold text-workon-ink">
                  Mission publiée !
                </h2>
                <p className="text-sm text-workon-gray mt-0.5">
                  Les pros à proximité reçoivent une notification. Partage le
                  lien pour accélérer.
                </p>
              </div>
            </div>
            <button
              onClick={dismissCreatedBanner}
              className="flex-shrink-0 h-8 w-8 rounded-full hover:bg-workon-bg-cream flex items-center justify-center text-workon-muted hover:text-workon-ink transition-colors"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                navigator.clipboard
                  .writeText(shareUrl)
                  .then(() => toast.success("Lien copié"))
                  .catch(() => toast.error("Impossible de copier le lien"));
              }}
            >
              📋 Copier le lien
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl"
              asChild
            >
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Partager sur Facebook
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <section className="workon-dark-panel overflow-hidden rounded-[30px] p-5 shadow-lg shadow-workon-primary/15">
        <div className="relative z-10 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-black ${
                statusColors[mission.status] ?? "border border-white/10 bg-white/10 text-white"
              }`}
            >
              {statusLabel}
            </span>
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-white/70">
              Contrat WorkOn
            </span>
          </div>

          <div>
            <h1 className="font-[family-name:var(--font-cabinet)] text-3xl font-black tracking-tight text-white sm:text-4xl">
              {mission.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/72">
              {mission.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
                Budget
              </p>
              <p className="mt-1 text-xl font-black text-white">
                {mission.price > 0 ? `${mission.price} $` : "À confirmer"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
                Ville
              </p>
              <p className="mt-1 truncate text-xl font-black text-white">
                {mission.city}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
                Offres
              </p>
              <p className="mt-1 text-xl font-black text-white">
                {mission.offersCount ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
                Publiée
              </p>
              <p className="mt-1 truncate text-sm font-black text-white">
                {formatDistanceToNow(new Date(mission.createdAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </p>
            </div>
          </div>
        </div>
      </section>

      <MissionDecisionPanel
        mission={mission}
        statusLabel={statusLabel}
        isWorker={isWorker}
        isOwner={isOwner}
        isAssigned={isAssigned}
        idVerified={idVerified}
        connectOnboarded={connectOnboarded}
      />

      {/* Details card */}
      <section className="workon-premium-card rounded-[28px] p-5 sm:p-6">
        <SectionHeading
          eyebrow="Mission"
          title="Détails opérationnels"
          text="Les informations essentielles pour évaluer, accepter ou suivre la mission."
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DetailMetric icon={Tag} label="Catégorie" value={mission.category} />
          <DetailMetric
            icon={DollarSign}
            label="Budget"
            value={mission.price > 0 ? `${mission.price} $ CAD` : "Prix à confirmer"}
          />
          <DetailMetric icon={MapPin} label="Lieu" value={mission.city} />
          <DetailMetric
            icon={Clock3}
            label="Mise à jour"
            value={formatDistanceToNow(new Date(mission.updatedAt), {
              addSuffix: true,
              locale: fr,
            })}
          />
        </div>
        {mission.address && (
          <div className="mt-4 rounded-2xl border border-workon-line bg-white/70 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-workon-stone">
              Adresse
            </p>
            <p className="mt-1 text-sm font-semibold text-workon-ink">
              {mission.address}
            </p>
          </div>
        )}
      </section>

      {/* Timeline */}
      <section className="workon-premium-card rounded-[28px] p-5 sm:p-6">
        <SectionHeading
          eyebrow="Progression"
          title="Statut de la mission"
          text="Suivi clair du cycle publication, assignation, exécution, paiement."
        />
        <div className="mt-5">
          <MissionTimeline
            status={mission.status}
            createdAt={mission.createdAt}
            updatedAt={mission.updatedAt}
            assignedToUserId={mission.assignedToUserId}
          />
        </div>
      </section>

      {/* Photos */}
      <section className="workon-premium-card rounded-[28px] p-5 sm:p-6">
        <SectionHeading
          eyebrow="Preuves"
          title="Photos et contexte"
          text="Les visuels réduisent les malentendus avant, pendant et après la mission."
        />
        <div className="mt-5">
          <MissionPhotos missionId={id} canEdit={isOwner || isAssigned} />
        </div>
      </section>

      {/* Actions */}
      <section className="workon-premium-card rounded-[28px] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <SectionHeading
            eyebrow="Action"
            title="Prochaine décision"
            text="Les gestes critiques restent visibles avec le contexte de confiance."
          />
          <span
            className={`rounded-full px-3 py-1 text-xs font-black ${
              statusColors[mission.status] ?? "bg-gray-50 text-gray-700"
            }`}
          >
            {statusLabel}
          </span>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
        {/* Worker: make offer on open mission.
            Two pre-flight gates mirror what the backend will enforce:
              1. IdentityVerificationGuard — blocks POST /offers if
                 idVerificationStatus !== 'VERIFIED'.
              2. Stripe Connect onboarding — without it, the platform
                 can't transfer the worker's share when the mission
                 completes; funds queue on the platform balance.
            Both gates point the worker to the page that resolves
            them so they don't hit a 403 (or a silent payout failure)
            after committing. */}
        {isWorker && mission.status === "open" && !isOwner && !idVerified && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-semibold">Vérifie ton identité pour postuler</p>
                <p className="mt-0.5 text-xs text-amber-800">
                  WorkOn exige une pièce d&apos;identité Stripe avant qu&apos;un
                  travailleur puisse faire une offre. Ça prend ~3 minutes.
                </p>
              </div>
            </div>
            <Link
              href="/profile/verify"
              className="block w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-center py-2.5 font-semibold text-sm"
            >
              Vérifier mon identité
            </Link>
          </div>
        )}

        {isWorker &&
          mission.status === "open" &&
          !isOwner &&
          idVerified &&
          !connectOnboarded && (
            <div
              className="rounded-2xl border border-amber-300 bg-amber-50 p-4 space-y-3"
              data-testid="stripe-connect-gate-mission"
            >
              <div className="flex items-start gap-2">
                <DollarSign className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <p className="font-semibold">
                    Configure ton paiement Stripe pour recevoir les fonds
                  </p>
                  <p className="mt-0.5 text-xs text-amber-800">
                    Stripe Connect est nécessaire pour qu&apos;on puisse te
                    virer ta part quand la mission est payée. Ça prend
                    2 minutes.
                  </p>
                </div>
              </div>
              <Link
                href="/worker/payments"
                className="block w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-center py-2.5 font-semibold text-sm"
              >
                Configurer Stripe
              </Link>
            </div>
          )}

        {isWorker &&
          mission.status === "open" &&
          !isOwner &&
          idVerified &&
          connectOnboarded && (
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

        {/* Time-log check-in / check-out (assigned worker, in_progress only) */}
        {isAssigned && mission.status === "in_progress" && (
          <TimeLogButtons missionId={id} />
        )}

        {/* Employer: pay completed mission.
            Prefix with a contextual banner so the owner understands the
            mission is waiting on *them* (the worker already delivered) —
            aligns with the matching "awaiting payment" card the worker
            sees on the other side of the transaction. */}
        {isOwner && mission.status === "completed" && (
          <>
            <div
              className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800"
              data-testid="employer-pay-banner"
            >
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                Le travailleur a terminé la mission. Paie pour libérer les fonds
                et lui permettre de recevoir son versement.
              </span>
            </div>
            <PayMissionButton missionId={id} price={mission.price} />
          </>
        )}

        {/* Worker: mission completed, waiting on the employer.
            Before this, a worker who hit "Terminer" saw the Pay button vanish
            and nothing replace it — no trace of the pending payment. This
            card explains the state and points to /earnings where the pending
            amount is tracked. */}
        {isAssigned && mission.status === "completed" && (
          <div
            className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
            data-testid="worker-awaiting-payment"
          >
            <div className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-emerald-900">
                  Mission complétée — en attente du paiement client
                </p>
                <p className="mt-1 text-xs text-emerald-800">
                  Tu recevras{" "}
                  <strong className="font-semibold">
                    {(mission.price * 0.85).toFixed(2)} $
                  </strong>{" "}
                  (après commission WorkOn 15 %) dès que le client paie la
                  facture.
                </p>
                <Link
                  href="/earnings"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
                  data-testid="link-earnings-from-mission"
                >
                  Voir mes revenus →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Worker: mission PAID — celebratory confirmation and nudge to
            /earnings so they see the transaction landed. */}
        {isAssigned && mission.status === "paid" && (
          <div
            className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
            data-testid="worker-payment-received"
          >
            <div className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-emerald-900">
                  Paiement reçu ✓
                </p>
                <p className="mt-1 text-xs text-emerald-800">
                  Le client a réglé cette mission. Ton versement apparaît dans
                  tes revenus.
                </p>
                <Link
                  href="/earnings"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
                >
                  Voir mes revenus →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Owner: boost CTAs (only while mission is open or assigned) */}
        {isOwner && ["open", "assigned"].includes(mission.status) && (
          <div className="space-y-1 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBoostType("URGENT_9")}
                className="rounded-2xl border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <Zap className="h-4 w-4 mr-1.5" />
                Urgent 9 $
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setBoostType("TOP_48H_14")}
                className="rounded-2xl border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Rocket className="h-4 w-4 mr-1.5" />
                Top 48h 14 $
              </Button>
            </div>
            <div className="text-right">
              <Link
                href="/boosts"
                className="text-[11px] font-medium text-workon-primary hover:underline"
                data-testid="link-my-boosts-from-mission"
              >
                Voir mes boosts →
              </Link>
            </div>
          </div>
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

          <div className="space-y-3">
            <TrustSignal
              icon={ShieldCheck}
              title="Contrat protégé"
              text="Statut, preuves et conditions restent rattachés à la mission."
            />
            <TrustSignal
              icon={WalletCards}
              title="Paiement sécurisé"
              text="Paiement, revenus et commission restent lisibles dans le dossier."
            />
            <TrustSignal
              icon={FileCheck}
              title="Historique utile"
              text="Messages, offres, photos et litiges restent retrouvables."
            />
          </div>
        </div>
      </section>

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
      {boostType && (boostType === "URGENT_9" || boostType === "TOP_48H_14") && (
        <BoostCheckoutModal
          type={boostType}
          missionId={id}
          isOpen={boostType !== null}
          onClose={() => setBoostType(null)}
          onSuccess={() =>
            queryClient.invalidateQueries({ queryKey: ["mission", id] })
          }
        />
      )}
    </div>
  );
}
