"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRightLeft,
  BadgeCheck,
  CalendarDays,
  Clock,
  FileText,
  Loader2,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import { useMode } from "@/contexts/mode-context";
import { api, type WorkerProfile } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookingRecapCard } from "@/components/mission/booking-recap-card";
import { cn } from "@/lib/utils";

const DAY_LABELS_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"] as const;

function nextDateForDayOfWeek(dow: number): string {
  const today = new Date();
  const diff = ((dow - today.getDay() + 7) % 7) || 7;
  const next = new Date(today);
  next.setDate(today.getDate() + diff);
  return next.toISOString().slice(0, 10);
}

export default function ReservePage() {
  const { workerId } = useParams<{ workerId: string }>();
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

  const { data: worker, isLoading } = useQuery({
    queryKey: ["worker", workerId],
    queryFn: () => api.getWorker(workerId),
    enabled: !!workerId,
  });

  async function handleDirectRequest() {
    if (!title.trim()) {
      toast.error("Decris ton besoin avant d'envoyer.");
      return;
    }

    setSendingDirect(true);
    toast.info("Matchez d'abord dans Pros pour ouvrir le chat", {
      description: `Swipez sur ${worker?.firstName || "ce pro"} pour demarrer une conversation.`,
    });
    router.push("/swipe");
    setSendingDirect(false);
  }

  async function handleBooking() {
    if (!scheduledDate) {
      toast.error("Veuillez selectionner une date.");
      return;
    }
    if (!title.trim()) {
      toast.error("Veuillez entrer un titre pour la reservation.");
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
        toast.loading("Redirection vers Stripe...");
        const checkout = await api.createBookingCheckout(booking.id);
        window.location.href = checkout.checkoutUrl;
      } else {
        toast.success("Reservation envoyee avec succes.");
        router.push("/bookings");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("not available") || msg.includes("disponible")) {
        toast.error("Ce professionnel n'a pas encore configure ses disponibilites. Envoyez-lui une demande directe.");
      } else if (msg.includes("Consent") || msg.includes("consent")) {
        toast.error("Vous devez accepter les conditions d'utilisation avant de payer.");
        router.push("/onboarding");
      } else {
        toast.error(msg || "Erreur lors de la reservation.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-workon-bg">
        <Loader2 className="h-8 w-8 animate-spin text-workon-primary" />
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="min-h-screen bg-workon-bg px-4 py-12">
        <div className="mx-auto max-w-md rounded-[28px] border border-workon-border bg-white p-8 text-center shadow-sm">
          <p className="font-semibold text-workon-ink">Professionnel non trouve.</p>
          <Button asChild variant="outline" className="mt-5">
            <Link href="/home">Retour a WorkOn</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "pro") {
    return (
      <div className="min-h-screen bg-workon-bg px-4 py-12">
        <div className="mx-auto max-w-md rounded-[28px] border border-workon-border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-workon-primary-subtle text-workon-primary">
            <ArrowRightLeft className="h-7 w-7" />
          </div>
          <h2 className="font-heading text-xl font-bold text-workon-ink">
            Passer en mode Client
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-workon-muted">
            La reservation se fait en mode Client. Tu peux revenir au mode Pro ensuite.
          </p>
          <Button type="button" variant="premium" className="mt-6 w-full" onClick={() => setMode("client")}>
            Passer en Mode Client
          </Button>
        </div>
      </div>
    );
  }

  const fullName = worker.fullName || `${worker.firstName} ${worker.lastName}`;
  const minDate = getTomorrowIsoDate();
  const priceNumber = Number(price) || 0;
  const slots = worker.availability?.recurring?.length
    ? worker.availability.recurring
    : worker.availabilityPreview ?? [];
  const canSubmit = Boolean(scheduledDate && title.trim());

  return (
    <div className="min-h-screen bg-workon-bg pb-32 lg:pb-10">
      <div className="mx-auto max-w-6xl px-4 py-5 lg:py-8">
        <Link
          href={`/worker/${workerId}`}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-workon-border bg-white px-3 py-2 text-xs font-bold text-workon-stone shadow-sm transition hover:bg-workon-bg-cream hover:text-workon-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour au profil
        </Link>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
          <main className="space-y-5">
            <ReservationHero worker={worker} fullName={fullName} />

            <section className="workon-premium-card rounded-[28px] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-workon-stone">
                    Reservation protegee
                  </p>
                  <h1 className="mt-1 font-heading text-2xl font-bold text-workon-ink">
                    Definis la mission avant de payer.
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-workon-muted">
                    WorkOn garde le contexte, les conditions et le paiement ensemble pour eviter les zones grises.
                  </p>
                </div>
                <div className="hidden rounded-2xl bg-workon-primary-subtle p-3 text-workon-primary sm:block">
                  <FileText className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <StepCard number="1" title="Mission" text="Titre, date, duree et details." />
                <StepCard number="2" title="Contrat" text="Conditions visibles avant confirmation." />
                <StepCard number="3" title="Paiement" text="Depot Stripe si montant indique." />
              </div>
            </section>

            <section className="workon-premium-card rounded-[28px] p-5 sm:p-6">
              <SectionTitle
                icon={Clock}
                eyebrow="Disponibilites"
                title="Choisir un creneau"
                text="Les choix rapides pre-remplissent la date et l'heure; tu peux les modifier."
              />

              {slots.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {slots.map((slot, index) => {
                    const date = nextDateForDayOfWeek(slot.dayOfWeek);
                    const active = scheduledDate === date && scheduledTime === slot.startTime;
                    return (
                      <button
                        key={`${slot.dayOfWeek}-${slot.startTime}-${index}`}
                        type="button"
                        onClick={() => {
                          setScheduledDate(date);
                          setScheduledTime(slot.startTime);
                        }}
                        className={cn(
                          "rounded-full border px-3 py-2 text-xs font-bold transition",
                          active
                            ? "border-workon-primary bg-workon-primary text-white shadow-sm"
                            : "border-workon-border bg-workon-bg-cream text-workon-ink hover:border-workon-primary",
                        )}
                      >
                        {formatSlot(slot)}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-workon-border bg-workon-bg-cream p-4">
                  <p className="text-sm font-semibold text-workon-ink">
                    Aucun creneau publie pour le moment.
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-workon-muted">
                    Tu peux proposer une date ou envoyer une demande directe apres avoir decrit ton besoin.
                  </p>
                </div>
              )}
            </section>

            <section className="workon-premium-card rounded-[28px] p-5 sm:p-6">
              <SectionTitle
                icon={CalendarDays}
                eyebrow="Details"
                title="Mission a reserver"
                text="Ces informations deviennent la base de la demande et du recapitulatif."
              />

                <div className="mt-5 grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reservation-title" className="text-workon-ink">
                      Titre de la reservation *
                    </Label>
                    <Input
                      id="reservation-title"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Ex: Nettoyage residentiel"
                    className="h-11 scroll-mb-[180px] rounded-2xl bg-white"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="reservation-date" className="text-workon-ink">
                      Date souhaitee *
                    </Label>
                    <Input
                      id="reservation-date"
                      type="date"
                      min={minDate}
                      value={scheduledDate}
                      onChange={(event) => setScheduledDate(event.target.value)}
                      className="h-11 scroll-mb-[180px] rounded-2xl bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reservation-time" className="text-workon-ink">
                      Heure *
                    </Label>
                    <Input
                      id="reservation-time"
                      type="time"
                      value={scheduledTime}
                      onChange={(event) => setScheduledTime(event.target.value)}
                      className="h-11 scroll-mb-[180px] rounded-2xl bg-white"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="reservation-duration" className="text-workon-ink">
                      Duree (minutes) *
                    </Label>
                    <Input
                      id="reservation-duration"
                      type="number"
                      min={15}
                      step={15}
                      value={duration}
                      onChange={(event) => setDuration(Number(event.target.value))}
                      className="h-11 scroll-mb-[180px] rounded-2xl bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reservation-price" className="text-workon-ink">
                      Prix propose ($CAD) *
                    </Label>
                    <Input
                      id="reservation-price"
                      type="number"
                      min={0}
                      value={price}
                      onChange={(event) => setPrice(event.target.value)}
                      placeholder="150"
                      className="h-11 scroll-mb-[180px] rounded-2xl bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reservation-description" className="text-workon-ink">
                    Description (optionnel)
                  </Label>
                  <Textarea
                    id="reservation-description"
                    placeholder="Adresse, contraintes, materiel, acces, photos disponibles, attentes..."
                    rows={4}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className="scroll-mb-[180px] rounded-2xl border-workon-border bg-white text-workon-ink placeholder:text-workon-muted/60 focus:border-workon-primary focus:ring-workon-primary/30"
                  />
                </div>
              </div>
            </section>
          </main>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <BookingRecapCard
              workerName={fullName}
              workerJobTitle={worker.jobTitle ?? worker.category}
              priceCad={priceNumber}
              durationMinutes={duration}
              scheduledDate={scheduledDate}
            />

            <section className="rounded-[28px] border border-workon-border bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-workon-stone">
                Protections visibles
              </p>
              <div className="mt-4 space-y-3">
                <TrustLine icon={BadgeCheck} text="Identite du profil visible avant action." />
                <TrustLine icon={FileText} text="Termes de contrat lisibles avant confirmation." />
                <TrustLine icon={WalletCards} text="Depot Stripe seulement si un prix est indique." />
                <TrustLine icon={ShieldCheck} text="Historique de reservation conserve dans WorkOn." />
              </div>
            </section>

            <section className="rounded-[28px] border border-workon-border bg-white p-4 shadow-sm">
              <Button
                type="button"
                onClick={handleBooking}
                variant="premium"
                size="hero"
                className="h-12 w-full rounded-2xl px-4"
                disabled={loading || !canSubmit}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <CalendarDays className="h-4 w-4" />
                    {priceNumber > 0 ? "Payer le depot" : "Envoyer la reservation"}
                  </>
                )}
              </Button>

              <div className="my-4 flex items-center gap-3">
                <div className="flex-1 border-t border-workon-border" />
                <span className="text-xs font-semibold text-workon-muted">ou</span>
                <div className="flex-1 border-t border-workon-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleDirectRequest}
                className="h-12 w-full rounded-2xl border-workon-copper text-workon-copper hover:bg-workon-accent-subtle"
                disabled={sendingDirect || !title.trim()}
              >
                {sendingDirect ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4" />
                    Demande directe
                  </>
                )}
              </Button>

              <p className="mt-4 text-center text-xs leading-relaxed text-workon-muted">
                Aucuns frais ne sont factures avant confirmation et redirection Stripe.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ReservationHero({ worker, fullName }: { worker: WorkerProfile; fullName: string }) {
  const rating = safeNumber(worker.averageRating);
  const reviewCount = safeNumber(worker.reviewCount);
  const hourlyRate = safeNumber(worker.hourlyRate);

  return (
    <section className="workon-dark-panel overflow-hidden rounded-[28px] shadow-lg shadow-workon-primary/15">
      <div className="grid sm:grid-cols-[160px_minmax(0,1fr)]">
        <div className="relative min-h-[190px] bg-workon-forest-deep sm:min-h-full">
          {worker.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={worker.photoUrl} alt={fullName} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-workon-primary to-workon-forest-deep">
              <span className="font-heading text-5xl font-bold text-white/35">{getInitials(worker)}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/15 bg-white/[0.10] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white/70">
              Pro selectionne
            </span>
            <span className="rounded-full border border-white/15 bg-white/[0.10] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white/70">
              Contrat WorkOn
            </span>
          </div>
          <h2 className="mt-4 font-heading text-3xl font-bold leading-tight text-white">{fullName}</h2>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-white/72">
            <span>{worker.jobTitle || worker.category || "Professionnel"}</span>
            {worker.city && (
              <>
                <span className="text-white/30">/</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {worker.city}
                </span>
              </>
            )}
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <HeroFact
              icon={Star}
              label="Avis"
              value={reviewCount > 0 ? rating.toFixed(1) : "Nouveau"}
            />
            <HeroFact
              icon={WalletCards}
              label="Tarif"
              value={hourlyRate > 0 ? `${hourlyRate} $/h` : "A fixer"}
            />
            <HeroFact icon={ShieldCheck} label="Protection" value="Stripe" />
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionTitle({
  icon: Icon,
  eyebrow,
  title,
  text,
}: {
  icon: typeof Clock;
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-workon-primary-subtle text-workon-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-workon-stone">
          {eyebrow}
        </p>
        <h2 className="font-heading text-xl font-bold text-workon-ink">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-workon-muted">{text}</p>
      </div>
    </div>
  );
}

function StepCard({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-workon-border bg-workon-bg-cream p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-black text-workon-primary shadow-sm">
        {number}
      </div>
      <p className="mt-3 font-bold text-workon-ink">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-workon-muted">{text}</p>
    </div>
  );
}

function HeroFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Star;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
      <Icon className="mb-2 h-4 w-4 text-workon-gold" />
      <p className="font-heading text-lg font-bold leading-none text-white">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white/55">{label}</p>
    </div>
  );
}

function TrustLine({ icon: Icon, text }: { icon: typeof BadgeCheck; text: string }) {
  return (
    <div className="flex items-start gap-2 text-sm font-semibold text-workon-ink">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-workon-primary" />
      <span>{text}</span>
    </div>
  );
}

function formatSlot(slot: { dayOfWeek: number; startTime: string; endTime: string }) {
  const day = DAY_LABELS_SHORT[slot.dayOfWeek] ?? "Jour";
  return `${day} ${slot.startTime}-${slot.endTime}`;
}

function getTomorrowIsoDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
}

function safeNumber(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function getInitials(worker: WorkerProfile): string {
  return `${worker.firstName?.[0] ?? ""}${worker.lastName?.[0] ?? ""}`.toUpperCase() || "WO";
}
