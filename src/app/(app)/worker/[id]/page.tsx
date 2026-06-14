"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { ComponentType } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileCheck2,
  ImageIcon,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";

import { api, type WorkerProfile } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { TrustPill, type TrustPillVariant } from "@/components/ui/trust-pill";
import { ContactWorkerButton } from "@/components/worker/contact-worker-button";

const DAY_LABELS_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"] as const;

export default function WorkerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: worker, isLoading } = useQuery({
    queryKey: ["worker", id],
    queryFn: () => api.getWorker(id),
    enabled: !!id,
  });

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
          <p className="font-semibold text-workon-ink">Professionnel non trouve</p>
          <p className="mt-2 text-sm text-workon-muted">
            Ce profil est indisponible ou le lien a change.
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link href="/home">Retour a WorkOn</Link>
          </Button>
        </div>
      </div>
    );
  }

  const fullName = worker.fullName || `${worker.firstName} ${worker.lastName}`;
  const rating = safeNumber(worker.averageRating);
  const reviewCount = safeNumber(worker.reviewCount);
  const completedMissions = safeNumber(worker.completedMissions);
  const completion = safeNumber(worker.completionPercentage);
  const hourlyRate = safeNumber(worker.hourlyRate);
  const trustVariant = deriveTrustVariant(worker);
  const availability = worker.availabilityPreview ?? [];
  const portfolio = worker.portfolioPhotos ?? [];

  return (
    <div className="min-h-screen bg-workon-bg pb-32 lg:pb-10">
      <div className="mx-auto max-w-6xl px-4 py-5 lg:py-8">
        <Link
          href="/home"
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-workon-border bg-white px-3 py-2 text-xs font-bold text-workon-stone shadow-sm transition hover:bg-workon-bg-cream hover:text-workon-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour
        </Link>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <main className="space-y-5">
            <section className="workon-dark-panel overflow-hidden rounded-[28px] shadow-lg shadow-workon-primary/15">
              <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="relative z-10 flex min-h-[360px] flex-col justify-between p-5 sm:p-7">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <TrustPill
                        variant={trustVariant}
                        label={deriveTrustLabel(worker)}
                        className="border-white/20 bg-white/[0.92] text-workon-ink"
                      />
                      <span className="rounded-full border border-white/15 bg-white/[0.10] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white/75">
                        Profil travailleur
                      </span>
                    </div>

                    <h1 className="mt-5 font-heading text-4xl font-bold leading-tight text-white sm:text-5xl">
                      {fullName}
                    </h1>
                    <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-white/75">
                      <span>{worker.jobTitle || worker.category || "Professionnel WorkOn"}</span>
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

                    <div className="mt-5 grid grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.08]">
                      <HeroMetric label="Avis" value={reviewCount > 0 ? rating.toFixed(1) : "Nouveau"} />
                      <HeroMetric label="Missions" value={completedMissions > 0 ? String(completedMissions) : "0"} />
                      <HeroMetric label="Profil" value={completion > 0 ? `${Math.round(completion)}%` : "Actif"} />
                    </div>
                  </div>

                  <div className="mt-8 space-y-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button
                        type="button"
                        variant="copper"
                        size="hero"
                        className="h-13 rounded-2xl px-5"
                        onClick={() => router.push(`/reserve/${worker.id}`)}
                      >
                        <CalendarDays className="h-4 w-4" />
                        Reserver
                      </Button>
                      <ContactWorkerButton
                        workerId={worker.id}
                        workerFirstName={worker.firstName}
                        workerCategory={worker.category}
                        workerCity={worker.city}
                      />
                    </div>
                    <p className="text-xs leading-relaxed text-white/58">
                      Paiement securise, contrat protege et historique conserve dans WorkOn.
                    </p>
                  </div>
                </div>

                <div className="relative min-h-[360px] bg-workon-forest-deep">
                  {worker.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={worker.photoUrl}
                      alt={fullName}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-workon-primary to-workon-forest-deep">
                      <span className="font-heading text-8xl font-bold text-white/28">
                        {getInitials(worker)}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                  <div className="absolute bottom-24 left-4 right-4 rounded-2xl border border-white/14 bg-black/30 p-3 text-white backdrop-blur lg:bottom-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-white/55">
                      Tarif indicatif
                    </p>
                    <p className="mt-1 font-heading text-2xl font-bold">
                      {hourlyRate > 0 ? `A partir de ${hourlyRate} $/h` : "Sur demande"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <TrustSignal
                icon={BadgeCheck}
                title="Identite verifiee"
                text="Profil rattache a un compte WorkOn suivi."
              />
              <TrustSignal
                icon={WalletCards}
                title="Paiement securise"
                text="Depot et suivi de paiement via Stripe."
              />
              <TrustSignal
                icon={FileCheck2}
                title="Contrat protege"
                text="Conditions et preuves conservees."
              />
              <TrustSignal
                icon={ShieldCheck}
                title="Historique visible"
                text={`${completedMissions} mission${completedMissions > 1 ? "s" : ""} completee${completedMissions > 1 ? "s" : ""}.`}
              />
            </section>

            <section className="workon-premium-card rounded-[28px] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-workon-stone">
                    Pourquoi ce profil
                  </p>
                  <h2 className="mt-1 font-heading text-2xl font-bold text-workon-ink">
                    Un profil lisible avant de confier une mission.
                  </h2>
                </div>
                <div className="hidden rounded-2xl bg-workon-primary-subtle p-3 text-workon-primary sm:block">
                  <BriefcaseBusiness className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <MiniStat label="Note client" value={reviewCount > 0 ? `${rating.toFixed(1)} / 5` : "Nouveau"} />
                <MiniStat label="Avis" value={reviewCount > 0 ? String(reviewCount) : "A venir"} />
                <MiniStat label="Missions completees" value={completedMissions > 0 ? String(completedMissions) : "0"} />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {(worker.badges ?? []).map((badge) => (
                  <span
                    key={`${badge.type}-${badge.label}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-workon-border bg-workon-bg-cream px-3 py-1.5 text-xs font-bold text-workon-ink"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-workon-primary" />
                    {badge.label}
                  </span>
                ))}
                {(worker.badges ?? []).length === 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-workon-border bg-workon-bg-cream px-3 py-1.5 text-xs font-bold text-workon-stone">
                    <CheckCircle2 className="h-3.5 w-3.5 text-workon-primary" />
                    Profil actif WorkOn
                  </span>
                )}
              </div>
            </section>

            {worker.bio && worker.bio.trim().length > 0 && (
              <InfoCard title="A propos">
                <p className="whitespace-pre-line text-sm leading-relaxed text-workon-ink">
                  {worker.bio}
                </p>
              </InfoCard>
            )}

            {(worker.skills ?? []).length > 0 && (
              <InfoCard
                title="Competences"
                eyebrow="Savoir-faire"
                icon={<Sparkles className="h-5 w-5" />}
              >
                <div className="flex flex-wrap gap-2">
                  {(worker.skills ?? []).map((skill) => (
                    <span
                      key={skill.id}
                      className="rounded-full border border-workon-primary/15 bg-workon-primary-subtle px-3 py-1.5 text-xs font-bold text-workon-primary"
                    >
                      {skill.labelFr}
                    </span>
                  ))}
                </div>
              </InfoCard>
            )}

            <InfoCard
              title="Disponibilites"
              eyebrow="Planification"
              icon={<Clock className="h-5 w-5" />}
            >
              {availability.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availability.map((slot, index) => (
                    <span
                      key={`${slot.dayOfWeek}-${slot.startTime}-${index}`}
                      className="rounded-full border border-workon-border bg-workon-bg-cream px-3 py-1.5 text-xs font-bold text-workon-ink"
                    >
                      {formatSlot(slot)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-workon-muted">
                  Les disponibilites ne sont pas encore publiees. La demande peut quand meme etre envoyee.
                </p>
              )}
            </InfoCard>

            <InfoCard
              title="Realisations"
              eyebrow="Portfolio"
              icon={<ImageIcon className="h-5 w-5" />}
            >
              {portfolio.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {portfolio.slice(0, 6).map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className="aspect-square overflow-hidden rounded-2xl border border-workon-border bg-workon-bg-cream"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Realisation ${index + 1}`}
                        className="h-full w-full object-cover transition duration-300 hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-workon-border bg-workon-bg-cream p-5 text-center">
                  <p className="text-sm font-semibold text-workon-ink">Portfolio a venir</p>
                  <p className="mt-1 text-xs text-workon-muted">
                    Les prochaines realisations pourront renforcer la preuve sociale.
                  </p>
                </div>
              )}
            </InfoCard>
          </main>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <section className="workon-premium-card rounded-[28px] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-workon-stone">
                    Action recommandee
                  </p>
                  <h2 className="mt-1 font-heading text-xl font-bold text-workon-ink">
                    Reserver avec un cadre clair.
                  </h2>
                </div>
                <span className="rounded-2xl bg-workon-primary-subtle p-2 text-workon-primary">
                  <CalendarDays className="h-5 w-5" />
                </span>
              </div>

              <div className="mt-5 space-y-3">
                <Button
                  type="button"
                  variant="premium"
                  size="hero"
                  className="h-12 w-full rounded-2xl px-4"
                  onClick={() => router.push(`/reserve/${worker.id}`)}
                >
                  Reserver ce pro
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <ContactWorkerButton
                  workerId={worker.id}
                  workerFirstName={worker.firstName}
                  workerCategory={worker.category}
                  workerCity={worker.city}
                />
              </div>

              <div className="mt-5 rounded-2xl border border-workon-border bg-workon-bg-cream p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-wide text-workon-stone">
                    Tarif
                  </span>
                  <span className="font-heading text-xl font-bold text-workon-copper">
                    {hourlyRate > 0 ? `${hourlyRate} $/h` : "Sur demande"}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-workon-muted">
                  Le montant final peut etre fixe dans la reservation selon la portee de la mission.
                </p>
              </div>
            </section>

            <section className="rounded-[28px] border border-workon-border bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-workon-stone">
                Resume confiance
              </p>
              <div className="mt-4 space-y-3">
                {[
                  "Identite et profil suivis",
                  "Contrat de service encadre",
                  "Depot Stripe si paiement requis",
                  "Historique mission conserve",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm font-semibold text-workon-ink">
                    <CheckCircle2 className="h-4 w-4 text-workon-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-workon-muted">
                WorkOn fournit une infrastructure de mise en relation, paiement et suivi. Le professionnel demeure responsable de son service.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-white/10 px-3 py-3 last:border-r-0">
      <p className="truncate font-heading text-xl font-bold leading-none text-white">{value}</p>
      <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-wide text-white/55">
        {label}
      </p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-workon-border bg-workon-bg-cream p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-workon-stone">{label}</p>
      <p className="mt-1 font-heading text-xl font-bold text-workon-ink">{value}</p>
    </div>
  );
}

function TrustSignal({
  icon: Icon,
  title,
  text,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[22px] border border-workon-border bg-white p-4 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-workon-primary-subtle text-workon-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 font-bold text-workon-ink">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-workon-muted">{text}</p>
    </div>
  );
}

function InfoCard({
  title,
  eyebrow,
  icon,
  children,
}: {
  title: string;
  eyebrow?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="workon-premium-card rounded-[28px] p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          {eyebrow && (
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-workon-stone">
              {eyebrow}
            </p>
          )}
          <h2 className="font-heading text-xl font-bold text-workon-ink">{title}</h2>
        </div>
        {icon && (
          <div className="rounded-2xl bg-workon-bg-cream p-2 text-workon-primary">
            {icon}
          </div>
        )}
      </div>
      {children}
    </section>
  );
}

function deriveTrustVariant(worker: WorkerProfile): TrustPillVariant {
  if (worker.trustTier === "PREMIUM") return "premium";
  if (worker.trustTier === "TRUSTED") return "trusted";
  if (worker.trustTier === "VERIFIED") return "verified";
  if ((worker.reviewCount ?? 0) === 0) return "nouveau";
  return "fiable";
}

function deriveTrustLabel(worker: WorkerProfile): string {
  if (worker.trustTier === "PREMIUM") return "Top Performer";
  if (worker.trustTier === "TRUSTED") return "De confiance";
  if (worker.trustTier === "VERIFIED") return "Identite verifiee";
  if ((worker.reviewCount ?? 0) === 0) return "Nouveau profil";
  return "Fiable";
}

function formatSlot(slot: { dayOfWeek: number; startTime: string; endTime: string }) {
  const day = DAY_LABELS_SHORT[slot.dayOfWeek] ?? "Jour";
  return `${day} ${slot.startTime}-${slot.endTime}`;
}

function safeNumber(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function getInitials(worker: WorkerProfile): string {
  return `${worker.firstName?.[0] ?? ""}${worker.lastName?.[0] ?? ""}`.toUpperCase() || "WO";
}
