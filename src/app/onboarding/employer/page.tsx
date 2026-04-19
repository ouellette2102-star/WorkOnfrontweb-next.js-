"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Briefcase,
  Globe,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api-client";
import type { AuthUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const BUSINESS_CATEGORIES: Array<{ value: string; label: string }> = [
  { value: "nettoyage-residentiel", label: "Nettoyage résidentiel" },
  { value: "nettoyage-commercial", label: "Nettoyage commercial" },
  { value: "paysagement", label: "Paysagement / entretien" },
  { value: "deneigement", label: "Déneigement" },
  { value: "demenagement", label: "Déménagement / manutention" },
  { value: "evenementiel", label: "Événementiel / service" },
  { value: "restauration", label: "Restauration" },
  { value: "autre", label: "Autre" },
];

const schema = z.object({
  businessName: z
    .string()
    .min(2, "Au moins 2 caractères")
    .max(120, "Maximum 120 caractères"),
  businessCategory: z.string().min(1, "Choisissez une catégorie"),
  businessDescription: z
    .string()
    .max(1000, "Maximum 1000 caractères")
    .optional()
    .or(z.literal("")),
  businessWebsite: z
    .string()
    .url("URL invalide (incluez https://)")
    .max(200)
    .optional()
    .or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

export default function EmployerOnboardingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } =
    useAuth();

  const [submitting, setSubmitting] = useState(false);

  // Guard: only authenticated employers belong here, and only while
  // onboarding is still pending.
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/login?redirect=/onboarding/employer");
      return;
    }
    if (user && user.role !== "employer") {
      router.replace("/home");
      return;
    }
    if (user && user.onboardingCompletedAt) {
      router.replace("/home");
    }
  }, [authLoading, isAuthenticated, user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessName: user?.businessName ?? "",
      businessCategory: user?.businessCategory ?? "",
      businessDescription: user?.businessDescription ?? "",
      businessWebsite: user?.businessWebsite ?? "",
    },
  });

  const category = watch("businessCategory");

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      const updated = await apiFetch<AuthUser>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          businessName: data.businessName.trim(),
          businessCategory: data.businessCategory,
          businessDescription: data.businessDescription?.trim() || undefined,
          businessWebsite: data.businessWebsite?.trim() || undefined,
        }),
      });

      if (!updated.onboardingCompletedAt) {
        // Backend stamps only when businessName + phone + city are all present.
        // If phone or city is missing, guide the user.
        toast.info(
          "Pensez à ajouter votre téléphone et ville depuis les paramètres pour activer la publication.",
        );
      } else {
        toast.success("Profil entreprise enregistré");
      }

      // Refresh the auth context so onboardingCompletedAt propagates
      // immediately to guards on /missions/new etc.
      try {
        await refreshUser();
      } catch {
        // Non-fatal: next /users/me call will catch up.
      }
      router.replace("/home");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de l'enregistrement",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-workon-bg">
        <Loader2 className="h-6 w-6 animate-spin text-workon-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-workon-bg px-4 py-8">
      <div className="mx-auto max-w-xl">
        <Link
          href="/home"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-workon-muted hover:text-workon-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Plus tard
        </Link>

        <div className="rounded-3xl border border-workon-border bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-workon-accent/10 text-workon-accent">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold text-workon-ink">
                Profil de votre entreprise
              </h1>
              <p className="mt-1 text-sm text-workon-muted">
                Les travailleurs voient ces informations avant d&apos;accepter
                une mission. Complétez pour publier votre première mission.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            data-testid="employer-onboarding-form"
          >
            <div className="space-y-2">
              <Label htmlFor="businessName">
                Nom de l&apos;entreprise <span className="text-workon-accent">*</span>
              </Label>
              <Input
                id="businessName"
                placeholder="Ex: Nettoyage Pro Montréal Inc."
                {...register("businessName")}
              />
              {errors.businessName && (
                <p className="text-xs text-workon-accent">
                  {errors.businessName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessCategory">
                Catégorie principale <span className="text-workon-accent">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {BUSINESS_CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() =>
                      setValue("businessCategory", c.value, {
                        shouldValidate: true,
                      })
                    }
                    className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                      category === c.value
                        ? "border-workon-primary bg-workon-primary/5 text-workon-primary"
                        : "border-workon-border bg-white text-workon-ink hover:border-workon-primary/40"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              {errors.businessCategory && (
                <p className="text-xs text-workon-accent">
                  {errors.businessCategory.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessDescription">
                Description{" "}
                <span className="text-workon-muted font-normal">(optionnel)</span>
              </Label>
              <textarea
                id="businessDescription"
                rows={4}
                placeholder="Secteur desservi, clientèle type, années d'activité…"
                className="w-full rounded-xl border border-workon-border bg-white px-3 py-2.5 text-sm text-workon-ink placeholder:text-workon-muted focus:border-workon-primary focus:outline-none focus:ring-2 focus:ring-workon-primary/20"
                {...register("businessDescription")}
              />
              {errors.businessDescription && (
                <p className="text-xs text-workon-accent">
                  {errors.businessDescription.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessWebsite">
                <span className="inline-flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  Site web{" "}
                  <span className="text-workon-muted font-normal">
                    (optionnel)
                  </span>
                </span>
              </Label>
              <Input
                id="businessWebsite"
                type="url"
                placeholder="https://exemple.ca"
                {...register("businessWebsite")}
              />
              {errors.businessWebsite && (
                <p className="text-xs text-workon-accent">
                  {errors.businessWebsite.message}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-workon-border bg-workon-bg p-3 text-xs text-workon-muted">
              <div className="flex items-center gap-1.5 text-workon-ink font-medium mb-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Vérifications automatiques
              </div>
              Votre téléphone ({user.phone || "manquant"}) et votre ville (
              {user.city || "manquante"}) sont aussi vérifiés à partir de
              votre profil principal.
            </div>

            <Button
              type="submit"
              disabled={submitting}
              data-testid="employer-onboarding-submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-workon-primary px-4 py-3 text-sm font-semibold text-white hover:bg-workon-primary/90 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Terminer et publier une mission
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
