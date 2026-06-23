"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { WorkOnWordmark } from "@/components/brand/workon-wordmark";
import { Button } from "@/components/ui/button";
import {
  MISSION_CATEGORY_OPTIONS,
  MISSION_CATEGORY_VALUES,
} from "@/lib/mission-categories";
import { createPublicMission } from "@/lib/public-api";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MapPin,
  Navigation,
  AlertCircle,
  DollarSign,
  Phone,
  Mail,
  User,
} from "lucide-react";

// ─── Validation ─────────────────────────────────────────────────────────────

const PHONE_RE = /^\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;

const schema = z.object({
  title: z
    .string()
    .min(3, "Au moins 3 caractères")
    .max(120, "Maximum 120 caractères"),
  description: z
    .string()
    .min(10, "Au moins 10 caractères")
    .max(4000, "Maximum 4000 caractères"),
  category: z
    .string()
    .refine(
      (v) => (MISSION_CATEGORY_VALUES as readonly string[]).includes(v),
      "Choisissez une catégorie",
    ),
  city: z.string().min(2, "Ville requise"),
  budget: z
    .number({ invalid_type_error: "Entrez un montant valide" })
    .min(0, "Budget invalide")
    .max(1_000_000, "Maximum 1 000 000 $"),
  clientName: z
    .string()
    .min(2, "Nom requis (2 caractères min)")
    .max(120),
  clientPhone: z
    .string()
    .regex(PHONE_RE, "Numéro québécois invalide (ex: 514-555-0100)"),
  clientEmail: z.string().email("Courriel invalide").optional().or(z.literal("")),
  address: z.string().max(200).optional(),
});

type FormData = z.infer<typeof schema>;

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PublierBesoinPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedTitle, setSubmittedTitle] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      city: "",
      budget: 0,
      clientName: "",
      clientPhone: "",
      clientEmail: "",
      address: "",
    },
  });

  const selectedCategory = watch("category");

  // GPS auto-detect
  const detectGPS = useCallback(() => {
    if (!navigator.geolocation) { setGpsStatus("error"); return; }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setGpsStatus("success");
      },
      () => {
        setGpsStatus("error");
        setLatitude(45.5017);
        setLongitude(-73.5673);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }, []);

  useEffect(() => { detectGPS(); }, [detectGPS]);

  // Reverse geocode → auto-fill city
  useEffect(() => {
    if (gpsStatus !== "success" || !latitude || !longitude) return;
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=fr`,
    )
      .then((r) => r.json())
      .then((data) => {
        const city =
          data?.address?.city ||
          data?.address?.town ||
          data?.address?.village ||
          "";
        if (city) setValue("city", city, { shouldValidate: true });
      })
      .catch(() => {});
  }, [gpsStatus, latitude, longitude, setValue]);

  const onSubmit = async (data: FormData) => {
    await createPublicMission({
      title: data.title,
      description: data.description,
      category: data.category,
      city: data.city,
      budget: data.budget,
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      clientEmail: data.clientEmail || undefined,
      address: data.address || undefined,
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
    });
    setSubmittedTitle(data.title);
    setSubmitted(true);
  };

  // ─── Success screen ──────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="min-h-screen bg-workon-bg flex flex-col">
        <header className="px-4 py-4 border-b border-workon-border bg-white">
          <div className="max-w-lg mx-auto">
            <WorkOnWordmark className="h-7" />
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-sm w-full text-center space-y-6">
            <div className="mx-auto h-20 w-20 rounded-full bg-workon-trust-green/10 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-workon-trust-green" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-workon-ink font-[family-name:var(--font-cabinet)]">
                Demande reçue !
              </h1>
              <p className="mt-2 text-sm text-workon-muted">
                Votre besoin{" "}
                <strong className="text-workon-ink">«&nbsp;{submittedTitle}&nbsp;»</strong>{" "}
                est maintenant visible par les professionnels de WorkOn. Un pro
                vous contactera bientôt.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-workon-border p-5 text-left space-y-3">
              <p className="text-sm font-semibold text-workon-ink">Prochaines étapes</p>
              <ul className="space-y-2 text-sm text-workon-muted">
                <li className="flex gap-2">
                  <span className="text-workon-primary font-bold">1.</span>
                  Les pros disponibles voient votre demande instantanément.
                </li>
                <li className="flex gap-2">
                  <span className="text-workon-primary font-bold">2.</span>
                  Vous recevrez leurs offres par téléphone ou courriel.
                </li>
                <li className="flex gap-2">
                  <span className="text-workon-primary font-bold">3.</span>
                  Vous choisissez le pro qui vous convient, sans obligation.
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button
                asChild
                className="w-full h-12 rounded-2xl bg-workon-primary hover:bg-workon-primary/90 text-white font-semibold"
              >
                <Link href="/pros">Voir les professionnels</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full h-12 rounded-2xl"
              >
                <Link href="/">Retour à l&apos;accueil</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Form ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-workon-bg">
      {/* Header */}
      <header className="px-4 py-4 border-b border-workon-border bg-white sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center justify-center h-9 w-9 rounded-xl border border-workon-border bg-workon-bg text-workon-ink hover:bg-workon-cream transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <WorkOnWordmark className="h-6" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Heading */}
        <div>
          <h1 className="text-2xl font-bold text-workon-ink font-[family-name:var(--font-cabinet)]">
            Publiez votre besoin
          </h1>
          <p className="mt-1 text-sm text-workon-muted">
            Gratuit et sans inscription. Les professionnels qualifiés vous
            contactent directement.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* Contact info */}
          <section className="bg-white rounded-2xl border border-workon-border shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-semibold text-workon-ink uppercase tracking-wide">
              Vos coordonnées
            </h2>

            <div>
              <label className="text-sm font-medium text-workon-ink mb-1.5 block">
                Votre nom *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-workon-muted" />
                <input
                  type="text"
                  {...register("clientName")}
                  placeholder="Jean Tremblay"
                  autoComplete="name"
                  className="w-full rounded-2xl border border-workon-border bg-white pl-9 pr-4 py-3 text-sm text-workon-ink placeholder:text-workon-muted focus:border-workon-primary focus:ring-2 focus:ring-workon-primary/40 outline-none transition-colors"
                />
              </div>
              {errors.clientName && (
                <p className="text-xs text-workon-accent mt-1">{errors.clientName.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-workon-ink mb-1.5 block">
                Téléphone *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-workon-muted" />
                <input
                  type="tel"
                  {...register("clientPhone")}
                  placeholder="514-555-0100"
                  autoComplete="tel"
                  className="w-full rounded-2xl border border-workon-border bg-white pl-9 pr-4 py-3 text-sm text-workon-ink placeholder:text-workon-muted focus:border-workon-primary focus:ring-2 focus:ring-workon-primary/40 outline-none transition-colors"
                />
              </div>
              {errors.clientPhone && (
                <p className="text-xs text-workon-accent mt-1">{errors.clientPhone.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-workon-ink mb-1.5 block">
                Courriel{" "}
                <span className="text-workon-muted font-normal">(optionnel)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-workon-muted" />
                <input
                  type="email"
                  {...register("clientEmail")}
                  placeholder="jean@exemple.com"
                  autoComplete="email"
                  className="w-full rounded-2xl border border-workon-border bg-white pl-9 pr-4 py-3 text-sm text-workon-ink placeholder:text-workon-muted focus:border-workon-primary focus:ring-2 focus:ring-workon-primary/40 outline-none transition-colors"
                />
              </div>
              {errors.clientEmail && (
                <p className="text-xs text-workon-accent mt-1">{errors.clientEmail.message}</p>
              )}
            </div>
          </section>

          {/* Mission description */}
          <section className="bg-white rounded-2xl border border-workon-border shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-semibold text-workon-ink uppercase tracking-wide">
              Votre besoin
            </h2>

            <div>
              <label className="text-sm font-medium text-workon-ink mb-1.5 block">
                Titre *
              </label>
              <input
                type="text"
                {...register("title")}
                placeholder="Ex: Peinture intérieure 3 pièces"
                className="w-full rounded-2xl border border-workon-border bg-white px-4 py-3 text-sm text-workon-ink placeholder:text-workon-muted focus:border-workon-primary focus:ring-2 focus:ring-workon-primary/40 outline-none transition-colors"
              />
              {errors.title && (
                <p className="text-xs text-workon-accent mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-workon-ink mb-1.5 block">
                Description *
              </label>
              <textarea
                {...register("description")}
                placeholder="Décrivez le travail, la superficie, les contraintes, les matériaux fournis..."
                rows={4}
                className="w-full rounded-2xl border border-workon-border bg-white px-4 py-3 text-sm text-workon-ink placeholder:text-workon-muted focus:border-workon-primary focus:ring-2 focus:ring-workon-primary/40 outline-none resize-none transition-colors"
              />
              {errors.description && (
                <p className="text-xs text-workon-accent mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-medium text-workon-ink mb-2 block">
                Catégorie *
              </label>
              <input type="hidden" {...register("category")} />
              <div className="flex flex-wrap gap-2">
                {MISSION_CATEGORY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={selectedCategory === opt.value}
                    onClick={() =>
                      setValue("category", opt.value, { shouldValidate: true })
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors border ${
                      selectedCategory === opt.value
                        ? "bg-workon-primary text-white border-workon-primary"
                        : "bg-white text-workon-ink border-workon-border hover:border-workon-primary"
                    }`}
                  >
                    <span aria-hidden="true">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
              {errors.category && (
                <p className="text-xs text-workon-accent mt-1.5">{errors.category.message}</p>
              )}
            </div>
          </section>

          {/* Budget + location */}
          <section className="bg-white rounded-2xl border border-workon-border shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-semibold text-workon-ink uppercase tracking-wide">
              Budget &amp; localisation
            </h2>

            <div>
              <label className="text-sm font-medium text-workon-ink mb-1.5 block">
                Budget estimé ($CAD){" "}
                <span className="text-workon-muted font-normal">— entrez 0 si à discuter</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-workon-muted" />
                <input
                  type="number"
                  {...register("budget", { valueAsNumber: true })}
                  placeholder="500"
                  min={0}
                  step={1}
                  className="w-full rounded-2xl border border-workon-border bg-white pl-9 pr-4 py-3 text-sm text-workon-ink placeholder:text-workon-muted focus:border-workon-primary focus:ring-2 focus:ring-workon-primary/40 outline-none transition-colors"
                />
              </div>
              {errors.budget && (
                <p className="text-xs text-workon-accent mt-1">{errors.budget.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-workon-ink mb-1.5 block">
                Ville *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-workon-muted" />
                <input
                  type="text"
                  {...register("city")}
                  placeholder="Montréal"
                  autoComplete="address-level2"
                  className="w-full rounded-2xl border border-workon-border bg-white pl-9 pr-4 py-3 text-sm text-workon-ink placeholder:text-workon-muted focus:border-workon-primary focus:ring-2 focus:ring-workon-primary/40 outline-none transition-colors"
                />
              </div>
              {errors.city && (
                <p className="text-xs text-workon-accent mt-1">{errors.city.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-workon-ink mb-1.5 block">
                Adresse{" "}
                <span className="text-workon-muted font-normal">(optionnel)</span>
              </label>
              <input
                type="text"
                {...register("address")}
                placeholder="123 rue Principale"
                autoComplete="street-address"
                className="w-full rounded-2xl border border-workon-border bg-white px-4 py-3 text-sm text-workon-ink placeholder:text-workon-muted focus:border-workon-primary focus:ring-2 focus:ring-workon-primary/40 outline-none transition-colors"
              />
            </div>

            {/* GPS status */}
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-workon-bg text-sm">
              {gpsStatus === "loading" && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-workon-primary" />
                  <span className="text-workon-muted">Localisation en cours…</span>
                </>
              )}
              {gpsStatus === "success" && (
                <>
                  <Navigation className="h-4 w-4 text-workon-trust-green" />
                  <span className="text-workon-trust-green font-medium">
                    Position GPS détectée
                  </span>
                </>
              )}
              {gpsStatus === "error" && (
                <>
                  <AlertCircle className="h-4 w-4 text-workon-muted" />
                  <span className="text-workon-muted">GPS indisponible — entrez votre ville manuellement</span>
                  <button
                    type="button"
                    onClick={detectGPS}
                    className="ml-auto text-workon-primary hover:underline text-xs"
                  >
                    Réessayer
                  </button>
                </>
              )}
              {gpsStatus === "idle" && (
                <>
                  <MapPin className="h-4 w-4 text-workon-muted" />
                  <span className="text-workon-muted">En attente…</span>
                </>
              )}
            </div>
          </section>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 rounded-2xl bg-workon-primary hover:bg-workon-primary/90 text-white font-semibold text-base shadow-[0_4px_16px_rgba(19,64,33,0.25)] disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Envoi en cours…
              </>
            ) : (
              <>{"Envoyer ma demande — c’est gratuit"}</>
            )}
          </Button>

          <p className="text-center text-xs text-workon-muted">
            En soumettant ce formulaire, vous acceptez nos{" "}
            <Link href="/legal/terms" className="underline hover:text-workon-ink">
              conditions d&apos;utilisation
            </Link>
            . Vos données ne sont jamais revendues.
          </p>
        </form>
      </div>
    </div>
  );
}
