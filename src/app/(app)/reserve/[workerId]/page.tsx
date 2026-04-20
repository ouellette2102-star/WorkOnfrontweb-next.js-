"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useMode } from "@/contexts/mode-context";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, Shield, MapPin, Loader2, CalendarDays, ArrowLeft, MessageCircle, ArrowRightLeft } from "lucide-react";
import { BookingRecapCard } from "@/components/mission/booking-recap-card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default function ReservePage() {
  const { workerId } = useParams<{ workerId: string }>();
  const { user } = useAuth();
  const { mode, setMode } = useMode();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(60);
  const [price, setPrice] = useState("");
  const [sendingDirect, setSendingDirect] = useState(false);

  async function handleDirectRequest() {
    if (!title.trim()) {
      toast.error("Décris ton besoin avant d'envoyer.");
      return;
    }
    // Direct message endpoint removed 2026-04-18 (Phase 2 chat refactor).
    // The contact flow is now swipe-first — user must match before chatting.
    // On mutual LIKE the backend auto-creates a Conversation.
    setSendingDirect(false);
    toast.info("Matchez d'abord dans Pros pour ouvrir le chat", {
      description: `Swipez sur ${worker?.firstName || 'ce pro'} pour démarrer une conversation.`,
    });
    router.push("/swipe");
  }

  const { data: worker, isLoading } = useQuery({
    queryKey: ["worker", workerId],
    queryFn: () => api.getWorker(workerId),
    enabled: !!workerId,
  });

  async function handleBooking() {
    if (!scheduledDate) {
      toast.error("Veuillez sélectionner une date.");
      return;
    }
    if (!title.trim()) {
      toast.error("Veuillez entrer un titre pour la réservation.");
      return;
    }
    const numPrice = Number(price) || 0;
    setLoading(true);
    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();
      const booking = await api.createBooking({
        workerId,
        title: title.trim(),
        description: description || undefined,
        scheduledAt,
        duration,
        price: numPrice,
        priceType: "fixed",
      });

      if (numPrice > 0) {
        // Redirect to Stripe checkout for 50% deposit
        toast.loading("Redirection vers Stripe...");
        const checkout = await api.createBookingCheckout(booking.id);
        window.location.href = checkout.checkoutUrl;
      } else {
        toast.success("Réservation envoyée avec succès !");
        router.push("/bookings");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("not available") || msg.includes("disponible")) {
        toast.error("Ce professionnel n'a pas encore configuré ses disponibilités. Envoyez-lui un message direct à la place.");
      } else if (msg.includes("Consent") || msg.includes("consent")) {
        toast.error("Vous devez accepter les conditions d'utilisation avant de payer.");
        router.push("/onboarding");
      } else {
        toast.error(msg || "Erreur lors de la réservation.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-workon-primary" />
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="text-center py-12 text-workon-muted">
        Professionnel non trouvé.
      </div>
    );
  }

  const fullName = worker.fullName || `${worker.firstName} ${worker.lastName}`;
  const hasReviews = (worker.reviewCount ?? 0) > 0;

  // Pro mode users see a prompt to switch to client mode
  if (mode === "pro") {
    return (
      <div className="min-h-screen bg-workon-bg px-4 py-12">
        <div className="mx-auto max-w-md rounded-3xl border border-workon-border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-workon-accent/10">
            <ArrowRightLeft className="h-7 w-7 text-workon-accent" />
          </div>
          <h2 className="mb-2 text-lg font-bold text-workon-ink">Fonctionnalité Mode Client</h2>
          <p className="mb-6 text-sm text-workon-muted">
            La réservation de professionnels est disponible en Mode Client.
            Passe en mode Client pour réserver ce pro.
          </p>
          <button
            onClick={() => setMode("client")}
            className="inline-flex items-center gap-2 rounded-2xl bg-workon-primary px-5 py-2.5 text-sm font-medium text-white"
          >
            Passer en Mode Client
          </button>
        </div>
      </div>
    );
  }

  // Minimum date = tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-workon-bg">
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Back link */}
        <Link
          href={`/worker/${workerId}`}
          className="inline-flex items-center gap-1 text-sm text-workon-muted hover:text-workon-ink transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au profil
        </Link>

        <div>
          <h1 className="text-xl font-bold text-workon-ink">Réserver un professionnel</h1>
          <p className="text-workon-muted text-sm mt-1">
            Choisissez une date et envoyez votre demande. Paiement sécurisé par Stripe.
          </p>
        </div>

        {/* Worker summary card */}
        <div className="rounded-xl border border-workon-border bg-white p-4 space-y-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-workon-bg flex items-center justify-center text-sm font-bold text-workon-ink overflow-hidden">
              {worker.photoUrl ? (
                <img src={worker.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                `${worker.firstName[0]}${worker.lastName[0]}`
              )}
            </div>
            <div>
              <p className="font-semibold text-workon-ink">{fullName}</p>
              {worker.jobTitle && (
                <p className="text-xs text-workon-muted">{worker.jobTitle}</p>
              )}
              {hasReviews && (
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3 w-3",
                          i < Math.round(worker.averageRating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-200",
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-workon-muted">
                    {worker.averageRating.toFixed(1)} ({worker.reviewCount} avis)
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-workon-muted">
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-green-500" />
              Identité vérifiée
            </span>
            {worker.city && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {worker.city}
              </span>
            )}
            {worker.completedMissions > 0 && (
              <span>{worker.completedMissions} missions</span>
            )}
          </div>
        </div>

        {/* Booking form */}
        <div className="rounded-xl border border-workon-border bg-white p-5 space-y-5 shadow-sm">
          <h2 className="font-semibold text-workon-ink flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-workon-primary" />
            Détails de la réservation
          </h2>

          <div className="space-y-2">
            <Label className="text-workon-ink">Titre de la réservation *</Label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Nettoyage résidentiel"
              className="w-full h-10 rounded-lg border border-workon-border bg-workon-bg px-3 text-sm text-workon-ink focus:outline-none focus:ring-2 focus:ring-workon-primary/30 focus:border-workon-primary"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-workon-ink">Date souhaitée *</Label>
            <input
              type="date"
              min={minDate}
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full h-10 rounded-lg border border-workon-border bg-workon-bg px-3 text-sm text-workon-ink focus:outline-none focus:ring-2 focus:ring-workon-primary/30 focus:border-workon-primary"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-workon-ink">Heure *</Label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full h-10 rounded-lg border border-workon-border bg-workon-bg px-3 text-sm text-workon-ink focus:outline-none focus:ring-2 focus:ring-workon-primary/30 focus:border-workon-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-workon-ink">Durée (minutes) *</Label>
              <input
                type="number"
                min={15}
                step={15}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full h-10 rounded-lg border border-workon-border bg-workon-bg px-3 text-sm text-workon-ink focus:outline-none focus:ring-2 focus:ring-workon-primary/30 focus:border-workon-primary"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-workon-ink">Prix ($CAD) *</Label>
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="150"
                className="w-full h-10 rounded-lg border border-workon-border bg-workon-bg px-3 text-sm text-workon-ink focus:outline-none focus:ring-2 focus:ring-workon-primary/30 focus:border-workon-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-workon-ink">Description (optionnel)</Label>
            <Textarea
              placeholder="Décrivez votre besoin, l'adresse, les détails importants..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-workon-border bg-workon-bg text-workon-ink placeholder:text-workon-muted/60 focus:ring-workon-primary/30 focus:border-workon-primary"
            />
          </div>
        </div>

        {/* Availability warning */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <p className="font-medium">Note</p>
          <p className="text-xs mt-1">
            Si ce professionnel n&apos;a pas configuré ses disponibilités, la réservation sera refusée.
            Utilisez &quot;Envoyer un message direct&quot; ci-dessous pour le contacter sans réservation.
          </p>
        </div>

        {/* Booking recap — price breakdown + contract + escrow notice */}
        {worker && (
          <BookingRecapCard
            workerName={`${worker.firstName} ${worker.lastName}`}
            workerJobTitle={worker.jobTitle ?? worker.category}
            priceCad={Number(price) || 0}
            durationMinutes={duration}
            scheduledDate={scheduledDate}
          />
        )}

        {/* CTA */}
        <Button
          onClick={handleBooking}
          className="w-full h-12 text-base"
          disabled={loading || !scheduledDate || !title.trim()}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <CalendarDays className="h-4 w-4 mr-2" />
              {Number(price) > 0 ? "Payer le dépôt (50%) →" : "Confirmer la réservation"}
            </>
          )}
        </Button>

        <div className="relative flex items-center gap-3 py-2">
          <div className="flex-1 border-t border-workon-border" />
          <span className="text-xs text-workon-muted">ou</span>
          <div className="flex-1 border-t border-workon-border" />
        </div>

        {/* Direct message — creates mission + opens chat */}
        <Button
          variant="outline"
          onClick={handleDirectRequest}
          className="w-full h-12 text-base border-workon-accent text-workon-accent hover:bg-workon-accent/5"
          disabled={sendingDirect || !title.trim()}
        >
          {sendingDirect ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Envoi...
            </>
          ) : (
            <>
              <MessageCircle className="h-4 w-4 mr-2" />
              Envoyer une demande directe
            </>
          )}
        </Button>

        <div className="text-center text-xs text-workon-muted space-y-1">
          <p>Paiement sécurisé par Stripe. Aucun frais avant confirmation.</p>
          <p>WorkOn fournit l&apos;infrastructure de mise en relation et paiement.</p>
        </div>
      </div>
    </div>
  );
}
